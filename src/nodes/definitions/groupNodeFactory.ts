import { registerNodeType } from '../registry';
import { evaluateGraph } from '../evaluateGraph';
import { computeAutoLayout } from '../autoLayout';
import type { GraphEdge, GraphNode, GroupInternalEdge, GroupInternalNode, SocketType, SocketValue } from '../types';

/** 外部に公開する入力ソケット。埋め込みサブグラフ内の `internalNodeId` の
 * `data[internalDataKey]` を、接続された値で上書きするためのプレースホルダーを指す。
 * 未接続なら上書きされず、埋め込みサブグラフ自身のデフォルト値が使われる。 */
export interface GroupInputSpec {
  id: string;
  label: string;
  /** 注入できるのは data のリテラル値として保持できる型のみ(geometry/material は不可)。 */
  type: 'number' | 'color' | 'enum';
  internalNodeId: string;
  internalDataKey: string;
}

/** 外部に公開する追加の出力ソケット。埋め込みサブグラフ内の `internalNodeId` の
 * `internalSocketId` 出力をそのまま外部出力として転送する。 */
export interface GroupOutputSpec {
  id: string;
  label: string;
  type: SocketType;
  internalNodeId: string;
  internalSocketId: string;
}

export interface GroupNodeConfig {
  type: string;
  label: string;
  inputs: GroupInputSpec[];
  outputs: GroupOutputSpec[];
  /** 埋め込みサブグラフの評価結果のうち、この内部ノードの全キー(SocketDef で
   *  宣言されていない anchor/offsetY のようなキーも含む)を最終出力のベースとして
   *  まるごと転送する「終端」ノードのID。通常は内部の garmentOutput 型ノード。 */
  terminalNodeId: string;
  internalNodes: GraphNode[];
  internalEdges: GraphEdge[];
}

/** グループノードインスタンスの `data` の形。`nodes`/`edges`/`exposedInputs`/
 * `exposedOutputs` はすべてインスタンスごとに独立したコピーで、`createDefaultData()`
 * が `config.internalNodes`/`internalEdges`/`inputs`/`outputs` の structuredClone として
 * 生成する。パレットから同じ型を複数回追加しても各インスタンスは互いに影響しない。
 *
 * `initialGraph.json` に含まれる既存インスタンス(このデータモデル導入前に作られた
 * `data: {}`)はこれらのキーを持たないため、`evaluate()` は各キーごとに
 * `config.internalNodes`/`internalEdges`/`inputs`/`outputs` へフォールバックする —
 * つまり `initialGraph.json` 側の移行は不要。 */
export interface GroupNodeData extends Record<string, unknown> {
  nodes?: GroupInternalNode[];
  edges?: GroupInternalEdge[];
  exposedInputs?: GroupInputSpec[];
  exposedOutputs?: GroupOutputSpec[];
}

function rawValueFromSocket(value: SocketValue): number | string {
  if (value.type === 'color') return `#${value.value.getHexString()}`;
  if (value.type === 'number' || value.type === 'enum') return value.value;
  throw new Error(`defineGroupNode: cannot inject a "${value.type}" socket value as literal data`);
}

/** テンプレート(`config.internalNodes`)を、キャンバス上で描画・編集できる独立した
 * コピーへ実体化する。位置は `nodes/autoLayout.ts` の `computeAutoLayout()`(Arrange
 * ボタンが使うのと同じ関数)で自動算出するため、`GroupNodeConfig.internalNodes` に
 * position を持たせる必要がない。 */
function materializeInternalNodes(config: GroupNodeConfig): GroupInternalNode[] {
  const positions = computeAutoLayout(config.internalNodes, config.internalEdges);
  return config.internalNodes.map((node) => ({
    ...structuredClone(node),
    position: positions.get(node.id) ?? { x: 0, y: 0 },
  }));
}

function materializeInternalEdges(config: GroupNodeConfig): GroupInternalEdge[] {
  return config.internalEdges.map((edge) => ({
    ...structuredClone(edge),
    // 1つの入力ソケットには常に最大1本(state/CLAUDE.md 参照)というこのアプリの規約により、
    // target+targetHandle の組は埋め込みサブグラフ内で一意になる。
    id: `${edge.target}.${edge.targetHandle}`,
  }));
}

/**
 * 複数の既存ノード(numberMultiply/generator/toonMaterial/garmentOutput 等)を1つの
 * 埋め込みサブグラフとして内包し、外部には限られた入出力ソケットだけを見せる「グループ
 * ノード」を定義する。内部配線・外部ソケット構成はノードインスタンスごとに独立して
 * キャンバス上で編集できる(`editor/GenericNode.tsx` のダブルクリックで中に入るUI、
 * `editor/GroupIOPanel.tsx` のソケット公開UI、詳細は nodes/CLAUDE.md 参照)。
 *
 * evaluate() は外部から渡された入力値を埋め込みサブグラフ内のプレースホルダーノードの
 * data へ上書きしてから evaluateGraph() を再帰的に呼ぶだけで、nodes/evaluateGraph.ts
 * 自体はほぼ無改修(未接続ソケットの解決だけ resolveNodeSockets() 経由に変更済み)。
 */
export function defineGroupNode(config: GroupNodeConfig): void {
  const internalIds = new Set(config.internalNodes.map((n) => n.id));
  for (const spec of config.inputs) {
    if (!internalIds.has(spec.internalNodeId)) {
      throw new Error(
        `defineGroupNode("${config.type}"): input "${spec.id}" references unknown internal node "${spec.internalNodeId}"`,
      );
    }
  }
  for (const spec of config.outputs) {
    if (!internalIds.has(spec.internalNodeId)) {
      throw new Error(
        `defineGroupNode("${config.type}"): output "${spec.id}" references unknown internal node "${spec.internalNodeId}"`,
      );
    }
  }
  if (!internalIds.has(config.terminalNodeId)) {
    throw new Error(`defineGroupNode("${config.type}"): terminalNodeId "${config.terminalNodeId}" is not an internal node`);
  }

  registerNodeType<GroupNodeData>({
    type: config.type,
    label: config.label,
    category: 'group',
    // インスタンスが exposedInputs/exposedOutputs を持たない場合(まだ中に入って
    // 編集されていない、または initialGraph.json 由来)のベースライン/フォールバック。
    // 実効的なソケット一覧は常に resolveNodeSockets() 経由で解決すること。
    inputs: config.inputs.map((s) => ({ id: s.id, label: s.label, type: s.type })),
    outputs: config.outputs.map((s) => ({ id: s.id, label: s.label, type: s.type })),
    createDefaultData: () => ({
      nodes: materializeInternalNodes(config),
      edges: materializeInternalEdges(config),
      exposedInputs: structuredClone(config.inputs),
      exposedOutputs: structuredClone(config.outputs),
    }),
    evaluate: (inputs, data): Record<string, SocketValue> => {
      const internalNodes = data.nodes ?? config.internalNodes;
      const internalEdges = data.edges ?? config.internalEdges;
      const exposedInputs = data.exposedInputs ?? config.inputs;
      const exposedOutputs = data.exposedOutputs ?? config.outputs;

      const overrides = new Map<string, { key: string; raw: number | string }>();
      for (const spec of exposedInputs) {
        const value = inputs[spec.id];
        if (value === undefined) continue;
        overrides.set(spec.internalNodeId, { key: spec.internalDataKey, raw: rawValueFromSocket(value) });
      }

      const patchedNodes = internalNodes.map((node) => {
        const override = overrides.get(node.id);
        if (!override) return node;
        return { ...node, data: { ...node.data, [override.key]: override.raw } };
      });

      const internalResults = evaluateGraph(patchedNodes, internalEdges);
      // terminalNodeId(内部の garmentOutput 相当ノード)はインスタンスごとに変更でき
      // ない構造的な決定のまま(config.terminalNodeId 固定)。中で削除されていれば
      // このフォールバックにより単に描画されなくなるだけで、他ノード削除時と同じ挙動。
      const terminal = internalResults.get(config.terminalNodeId) ?? {};

      const result: Record<string, SocketValue> = { ...terminal };
      for (const spec of exposedOutputs) {
        const value = internalResults.get(spec.internalNodeId)?.[spec.internalSocketId];
        if (value !== undefined) result[spec.id] = value;
      }
      return result;
    },
  });
}
