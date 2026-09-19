import type { Node, Edge } from '@xyflow/react';
import { nodeTypeRegistry } from '../nodes/registry';
import { hasCycle } from '../nodes/evaluateGraph';

export type GraphValidationError = 'unknown-node-type' | 'cycle';

export const GRAPH_VALIDATION_MESSAGES: Record<GraphValidationError, string> = {
  'unknown-node-type': '未知のノードタイプが含まれています。',
  cycle: 'ノード同士が循環して接続されています。',
};

/** Import JSON・プリセット読み込みなど、外部/永続化データ由来の nodes/edges を
 * loadGraph() に渡す前に検証する共通ゲート。ここを通さずに loadGraph() すると、
 * 次の描画で useEvaluatedGraph 内の evaluateGraph() が(未知のノードタイプなら
 * getNodeType() が、循環なら GraphCycleError が)例外を投げ、どこにも
 * try/catch が無いため白画面クラッシュになる — それをロード前に防ぐ。 */
export function validateGraph(nodes: Node[], edges: Edge[]): GraphValidationError | null {
  const hasUnknownType = nodes.some(
    (n) => typeof n.type !== 'string' || !nodeTypeRegistry.has(n.type),
  );
  if (hasUnknownType) return 'unknown-node-type';
  if (hasCycle(nodes, edges)) return 'cycle';

  // グループノードは編集済みのインスタンスごとに埋め込みサブグラフ(`data.nodes`/`data.edges`)
  // を独立したコピーとして持ち、保存済みのグラフには過去のテンプレートの内部構造がそのまま
  // 残る(削除されたノードタイプを含みうる)ため、内部も同じ基準で再帰的に検証する。
  for (const n of nodes) {
    const inner = n.data as { nodes?: unknown; edges?: unknown };
    if (Array.isArray(inner.nodes) && Array.isArray(inner.edges)) {
      const error = validateGraph(inner.nodes as Node[], inner.edges as Edge[]);
      if (error) return error;
    }
  }
  return null;
}
