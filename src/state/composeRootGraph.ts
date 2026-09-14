import type { Node, Edge } from '@xyflow/react';

/** グループの中に入る(`enterGroup`)たびに退避される、1階層分のスナップショット。
 * `parentId` はそのグループノード自身のID(退出時にここへ編集結果を書き戻す)。 */
export interface ScopeFrame {
  parentId: string;
  nodes: Node[];
  edges: Edge[];
}

/** `scopeStack`(グループの中に入るたびに積まれる、上位階層のスナップショット)と、
 * 現在キャンバスが表示している最下層の `nodes`/`edges` から、トップレベル視点で見た
 * 「完全なグラフ」を合成する純関数。`scopeStack` が空(トップレベルにいる)なら
 * `leafNodes`/`leafEdges` をそのまま返す恒等関数になる。
 *
 * `Garments.tsx`(3Dシーン全体の描画 — `bodyGroup` を含む全 `<name>Group` の `sceneOutput`
 * を走査する)・`persist` の `partialize`(localStorage永続化)は、
 * グループの中に入っている間も「今開いている階層」ではなく常にこの合成結果を見る必要がある
 * — さもないとグループの中に入った瞬間に他の全ガーメントが3Dビューから消え、ボディスケールが
 * デフォルトにリセットされ、リロードで他の設計が失われる(実際に設計時に見つかった欠陥)。 */
export function composeRootGraph(
  scopeStack: ScopeFrame[],
  leafNodes: Node[],
  leafEdges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  if (scopeStack.length === 0) return { nodes: leafNodes, edges: leafEdges };

  let nodes = leafNodes;
  let edges = leafEdges;
  for (let i = scopeStack.length - 1; i >= 0; i--) {
    const frame = scopeStack[i];
    nodes = frame.nodes.map((n) => (n.id === frame.parentId ? { ...n, data: { ...n.data, nodes, edges } } : n));
    edges = frame.edges;
  }
  return { nodes, edges };
}
