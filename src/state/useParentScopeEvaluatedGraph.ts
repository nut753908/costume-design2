import { useEffect, useMemo } from 'react';
import { useGraphStore } from './graphStore';
import { toGraphEdge, toGraphNode } from './selectors';
import { evaluateGraph, type EvaluatedGraph } from '../nodes/evaluateGraph';

/** `useEvaluatedGraph.ts`/`useRootEvaluatedGraph.ts` と並行して常時マウントする、3つ目の
 * 小さな評価パイプライン。グループの中に入っている間だけ、その直上の親スコープ
 * (`scopeStack` の最後のフレーム — enterGroup 時点でのそのグループより1階層上の nodes/edges
 * のスナップショット)を評価し、結果を `parentScopeEvaluatedResults` に書き込む。トップレベル
 * にいる間は `null`。
 *
 * `useEvaluatedGraph.ts` が評価する「今開いている階層」には、外部から接続された値を注入する
 * `groupNodeFactory.ts` の仕組みが経由しない(中に入る操作自体がその注入の入口を素通りする)
 * ため、`groupInput` ノードの各ソケットは常に未接続時のデフォルト値として評価される。
 * `GroupInputNode.tsx` が実際に配線されている値を表示するには、代わりにこの親スコープ視点の
 * 評価結果から `resolveIncomingValue()` で該当ソケットへの接続を直接引く必要がある。 */
export function useParentScopeEvaluatedGraph(): void {
  const scopeStack = useGraphStore((s) => s.scopeStack);
  const setParentScopeEvaluatedResults = useGraphStore((s) => s.setParentScopeEvaluatedResults);
  const frame = scopeStack.at(-1) ?? null;

  const evaluated = useMemo<EvaluatedGraph | null>(() => {
    if (!frame) return null;
    return evaluateGraph(frame.nodes.map(toGraphNode), frame.edges.map(toGraphEdge));
  }, [frame]);

  useEffect(() => {
    setParentScopeEvaluatedResults(evaluated);
  }, [evaluated, setParentScopeEvaluatedResults]);
}
