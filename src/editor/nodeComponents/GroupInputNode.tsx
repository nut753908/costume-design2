import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import type { GroupInputData } from '../../nodes/definitions/groupInput';
import type { GroupIOSocket } from '../../nodes/definitions/groupIOSocket';
import type { SocketType, SocketValue } from '../../nodes/types';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';
import { resolveIncomingValue } from '../../nodes/evaluateGraph';

const SOCKET_TYPES: SocketType[] = ['number', 'color', 'enum', 'geometry', 'material'];

function SocketValueDisplay({ value }: { value: SocketValue | undefined }) {
  if (!value) return null;
  if (value.type === 'number') return <span className="rf-node__io-value">{value.value.toFixed(2)}</span>;
  if (value.type === 'enum') return <span className="rf-node__io-value">{value.value}</span>;
  if (value.type === 'color') {
    const hex = `#${value.value.getHexString()}`;
    return <span className="rf-node__io-value-swatch" style={{ background: hex }} title={hex} />;
  }
  return null;
}

function uniqueSocketId(sockets: GroupIOSocket[]): string {
  const taken = new Set(sockets.map((s) => s.id));
  let n = sockets.length + 1;
  while (taken.has(`socket-${n}`)) n++;
  return `socket-${n}`;
}

function defaultForType(type: SocketType): GroupIOSocket['default'] {
  if (type === 'number') return 0;
  if (type === 'color') return '#cccccc';
  if (type === 'enum') return 'a';
  return undefined;
}

/** Blender の Geometry Nodes における「Group Input」ノード相当のカスタム描画。
 * グループの中に入っている間、このノードにソケットを増減・配線するだけでグループ本体の
 * 外部から見える入力ハンドルが増減する(`nodes/definitions/groupInput.ts`/
 * `nodes/resolveNodeSockets.ts` 参照)。未接続時のデフォルト値(`socket.default`、enum の
 * 選択肢一覧 `socket.options` を含む)は `defineGroupNode()` の登録時テンプレート、または
 * `addSocket()` 時の `defaultForType()` 由来の値が使われるのみで、この場での編集は一切
 * できない(型を問わず値そのものを UI から直接いじる手段は無い — 変えたい場合はソケットへ
 * 配線して値を供給する)。各ソケット行には現在値を表示する — 親スコープ側でそのソケットに実際に
 * 値が配線されていれば `parentScopeEvaluatedResults`(`state/useParentScopeEvaluatedGraph.ts`、
 * 親スコープ視点の評価)から引いた実際の注入値を、配線が無ければ `evaluatedResults`
 * (`GenericNode.tsx` の値表示と同じ現在スコープの評価結果)から引いた未接続時のデフォルト値を
 * 表示する。 */
function GroupInputNodeViewImpl({ id, data }: NodeProps) {
  const nodeData = data as GroupInputData;
  const sockets = nodeData.sockets ?? [];
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const removeGroupIOSocket = useGraphStore((s) => s.removeGroupIOSocket);
  const evaluated = useGraphStore((s) => s.evaluatedResults);
  const outputValues = evaluated?.get(id);
  const scopeStack = useGraphStore((s) => s.scopeStack);
  const parentScopeResults = useGraphStore((s) => s.parentScopeEvaluatedResults);
  const parentFrame = scopeStack.at(-1);
  const [newType, setNewType] = useState<SocketType>('number');

  const valueFor = (socketId: string): SocketValue | undefined => {
    const injected =
      parentFrame && parentScopeResults
        ? resolveIncomingValue(parentFrame.edges, parentScopeResults, parentFrame.parentId, socketId)
        : undefined;
    return injected ?? outputValues?.[socketId];
  };

  const patchSocket = (socketId: string, patch: Partial<GroupIOSocket>) => {
    updateNodeData(id, { sockets: sockets.map((s) => (s.id === socketId ? { ...s, ...patch } : s)) });
  };

  const addSocket = () => {
    const newId = uniqueSocketId(sockets);
    const socket: GroupIOSocket = { id: newId, label: newId, type: newType, default: defaultForType(newType) };
    if (newType === 'enum') socket.options = ['a', 'b'];
    updateNodeData(id, { sockets: [...sockets, socket] });
  };

  return (
    <div className="rf-node rf-node--io">
      <NodeTitleBar id={id} label="Group Input" />
      {sockets.map((socket) => (
        <div key={socket.id} className="rf-node__io-row rf-node__io-row--out">
          <button
            type="button"
            className="rf-node__io-remove nodrag"
            title="ソケットを削除"
            aria-label="ソケットを削除"
            onClick={() => removeGroupIOSocket(id, socket.id)}
          >
            ×
          </button>
          <input
            className="rf-node__io-label nodrag"
            type="text"
            value={socket.label}
            onChange={(e) => patchSocket(socket.id, { label: e.target.value })}
          />
          <SocketValueDisplay value={valueFor(socket.id)} />
          <Handle type="source" position={Position.Right} id={socket.id} style={{ background: SOCKET_COLORS[socket.type] }} />
        </div>
      ))}
      <div className="rf-node__io-add">
        <select className="nodrag" value={newType} onChange={(e) => setNewType(e.target.value as SocketType)}>
          {SOCKET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button type="button" className="nodrag" onClick={addSocket}>
          + Add
        </button>
      </div>
    </div>
  );
}

export const GroupInputNodeView = memo(GroupInputNodeViewImpl);
