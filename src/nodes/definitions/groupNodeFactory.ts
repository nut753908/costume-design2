import { registerNodeType } from '../registry';
import { evaluateGraph } from '../evaluateGraph';
import type { GraphEdge, GraphNode, SocketType, SocketValue } from '../types';

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

function rawValueFromSocket(value: SocketValue): number | string {
  if (value.type === 'color') return `#${value.value.getHexString()}`;
  if (value.type === 'number' || value.type === 'enum') return value.value;
  throw new Error(`defineGroupNode: cannot inject a "${value.type}" socket value as literal data`);
}

/**
 * 複数の既存ノード(numberMultiply/generator/toonMaterial/garmentOutput 等)を1つの
 * 埋め込みサブグラフとして内包し、外部には限られた入出力ソケットだけを見せる「グループ
 * ノード」を定義する。React Flow 標準のサブフロー(ダブルクリックで中に入るUI)は実装せず、
 * 内部配線はこの登録時点で固定される(グラフ上で編集することはできない) — これは
 * defineGeneratorNode() ベースのノードが「内部のジオメトリ構築ロジックはJS関数であり、
 * グラフ上で編集できない」のと同じ思想。
 *
 * evaluate() は外部から渡された入力値を埋め込みサブグラフ内のプレースホルダーノードの
 * data へ上書きしてから evaluateGraph() を再帰的に呼ぶだけで、nodes/evaluateGraph.ts
 * 自体は無改修。
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

  registerNodeType({
    type: config.type,
    label: config.label,
    category: 'group',
    inputs: config.inputs.map((s) => ({ id: s.id, label: s.label, type: s.type })),
    outputs: config.outputs.map((s) => ({ id: s.id, label: s.label, type: s.type })),
    createDefaultData: () => ({}),
    evaluate: (inputs): Record<string, SocketValue> => {
      const overrides = new Map<string, { key: string; raw: number | string }>();
      for (const spec of config.inputs) {
        const value = inputs[spec.id];
        if (value === undefined) continue;
        overrides.set(spec.internalNodeId, { key: spec.internalDataKey, raw: rawValueFromSocket(value) });
      }

      const patchedNodes = config.internalNodes.map((node) => {
        const override = overrides.get(node.id);
        if (!override) return node;
        return { ...node, data: { ...node.data, [override.key]: override.raw } };
      });

      const internalResults = evaluateGraph(patchedNodes, config.internalEdges);
      const terminal = internalResults.get(config.terminalNodeId) ?? {};

      const result: Record<string, SocketValue> = { ...terminal };
      for (const spec of config.outputs) {
        const value = internalResults.get(spec.internalNodeId)?.[spec.internalSocketId];
        if (value !== undefined) result[spec.id] = value;
      }
      return result;
    },
  });
}
