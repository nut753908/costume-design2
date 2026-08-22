import type { Node } from '@xyflow/react';
import { Panel } from '@xyflow/react';
import { useGraphStore } from '../state/graphStore';
import { resolveNodeSockets } from '../nodes/resolveNodeSockets';
import type { SocketType } from '../nodes/types';

/** グループの内部で「生パラメータのプレースホルダー」として使われる3タイプと、
 * それぞれの data キー(`nodes/definitions/groupNodeFactory.ts` の `GroupInputSpec` が
 * 上書きする対象)。既存14種のガーメントグループがすべてこの慣例に統一されているため、
 * これだけで「注入できる number/color/enum」の入力候補を機械的に判定できる。 */
const EXPOSABLE_INPUT_TYPES: Record<string, { socketType: 'number' | 'color' | 'enum'; dataKey: string }> = {
  numberInput: { socketType: 'number', dataKey: 'value' },
  colorInput: { socketType: 'color', dataKey: 'hex' },
  enumInput: { socketType: 'enum', dataKey: 'value' },
};

interface ExposedInputSpec {
  id: string;
  label: string;
  type: 'number' | 'color' | 'enum';
  internalNodeId: string;
  internalDataKey: string;
}

interface ExposedOutputSpec {
  id: string;
  label: string;
  type: SocketType;
  internalNodeId: string;
  internalSocketId: string;
}

interface ParentGroupData {
  exposedInputs?: ExposedInputSpec[];
  exposedOutputs?: ExposedOutputSpec[];
}

function uniqueId(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

/** グループの中に入っている間だけ表示される、「ソケットとして公開」パネル。内部の
 * 未接続の(あるいは接続済みでも構わない)ソケットを、その場でグループの外部入出力
 * ソケットとして増減できる。`GenericNodeView` 側のソケット行描画は `resolveNodeSockets()`
 * 経由に既になっているため、ここで `exposedInputs`/`exposedOutputs` を更新するだけで
 * キャンバス上のハンドルの増減に自動的に反映される。 */
export function GroupIOPanel() {
  const scopeStack = useGraphStore((s) => s.scopeStack);
  const nodes = useGraphStore((s) => s.nodes);
  const patchParentGroupNode = useGraphStore((s) => s.patchParentGroupNode);

  if (scopeStack.length === 0) return null;
  const frame = scopeStack[scopeStack.length - 1];
  const parentNode = frame.nodes.find((n) => n.id === frame.parentId);
  if (!parentNode) return null;

  const parentData = parentNode.data as ParentGroupData;
  const exposedInputs = parentData.exposedInputs ?? [];
  const exposedOutputs = parentData.exposedOutputs ?? [];
  const exposedInputByNodeId = new Map(exposedInputs.map((s) => [s.internalNodeId, s]));
  const exposedOutputByKey = new Map(exposedOutputs.map((s) => [`${s.internalNodeId}:${s.internalSocketId}`, s]));

  const inputCandidates = nodes.filter((n): n is Node & { type: string } => !!n.type && n.type in EXPOSABLE_INPUT_TYPES);
  const outputCandidates = nodes.flatMap((n) => {
    if (!n.type) return [];
    return resolveNodeSockets(n.type, n.data as Record<string, unknown>).outputs.map((socket) => ({ node: n, socket }));
  });

  function orphanEdgeIds(direction: 'input' | 'output', socketId: string): string[] {
    return frame.edges
      .filter((e) =>
        direction === 'input'
          ? e.target === frame.parentId && e.targetHandle === socketId
          : e.source === frame.parentId && e.sourceHandle === socketId,
      )
      .map((e) => e.id);
  }

  function confirmOrphans(count: number): boolean {
    if (count === 0) return true;
    return confirm(`このソケットは外部から${count}本接続されています。非公開にすると接続も削除されます。よろしいですか?`);
  }

  function toggleInput(node: Node & { type: string }) {
    const existing = exposedInputByNodeId.get(node.id);
    if (existing) {
      const orphans = orphanEdgeIds('input', existing.id);
      if (!confirmOrphans(orphans.length)) return;
      patchParentGroupNode(
        { exposedInputs: exposedInputs.filter((s) => s.internalNodeId !== node.id) },
        orphans,
      );
      return;
    }
    const cfg = EXPOSABLE_INPUT_TYPES[node.type];
    const id = uniqueId(node.id, new Set(exposedInputs.map((s) => s.id)));
    const label = (node.data as { label?: string }).label ?? node.id;
    const newSpec: ExposedInputSpec = { id, label, type: cfg.socketType, internalNodeId: node.id, internalDataKey: cfg.dataKey };
    patchParentGroupNode({ exposedInputs: [...exposedInputs, newSpec] });
  }

  function toggleOutput(node: Node, socket: { id: string; label: string; type: SocketType }) {
    const key = `${node.id}:${socket.id}`;
    const existing = exposedOutputByKey.get(key);
    if (existing) {
      const orphans = orphanEdgeIds('output', existing.id);
      if (!confirmOrphans(orphans.length)) return;
      patchParentGroupNode(
        { exposedOutputs: exposedOutputs.filter((s) => !(s.internalNodeId === node.id && s.internalSocketId === socket.id)) },
        orphans,
      );
      return;
    }
    const id = uniqueId(`${node.id}-${socket.id}`, new Set(exposedOutputs.map((s) => s.id)));
    const newSpec: ExposedOutputSpec = {
      id,
      label: socket.label,
      type: socket.type,
      internalNodeId: node.id,
      internalSocketId: socket.id,
    };
    patchParentGroupNode({ exposedOutputs: [...exposedOutputs, newSpec] });
  }

  function renameInput(specId: string, label: string) {
    patchParentGroupNode({ exposedInputs: exposedInputs.map((s) => (s.id === specId ? { ...s, label } : s)) });
  }

  function renameOutput(specId: string, label: string) {
    patchParentGroupNode({ exposedOutputs: exposedOutputs.map((s) => (s.id === specId ? { ...s, label } : s)) });
  }

  return (
    <Panel position="bottom-center" className="group-io-panel">
      <div className="group-io-panel__title">ソケットとして公開</div>
      <div className="group-io-panel__section-title">Inputs</div>
      {inputCandidates.map((node) => {
        const spec = exposedInputByNodeId.get(node.id);
        return (
          <label key={node.id} className="group-io-panel__row">
            <input type="checkbox" checked={!!spec} onChange={() => toggleInput(node)} />
            {spec ? (
              <input
                type="text"
                className="group-io-panel__label-input"
                value={spec.label}
                onChange={(e) => renameInput(spec.id, e.target.value)}
              />
            ) : (
              <span>{(node.data as { label?: string }).label ?? node.id}</span>
            )}
          </label>
        );
      })}
      <div className="group-io-panel__section-title">Outputs</div>
      {outputCandidates.map(({ node, socket }) => {
        const spec = exposedOutputByKey.get(`${node.id}:${socket.id}`);
        return (
          <label key={`${node.id}:${socket.id}`} className="group-io-panel__row">
            <input type="checkbox" checked={!!spec} onChange={() => toggleOutput(node, socket)} />
            {spec ? (
              <input
                type="text"
                className="group-io-panel__label-input"
                value={spec.label}
                onChange={(e) => renameOutput(spec.id, e.target.value)}
              />
            ) : (
              <span>
                {node.id} / {socket.label}
              </span>
            )}
          </label>
        );
      })}
    </Panel>
  );
}
