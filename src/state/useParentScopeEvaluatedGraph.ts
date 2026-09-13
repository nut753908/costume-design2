import { useEffect, useMemo } from 'react';
import { useGraphStore } from './graphStore';
import { toGraphEdge, toGraphNode } from './selectors';
import type { ScopeFrame } from './composeRootGraph';
import { evaluateGraph, resolveIncomingValue, type EvaluatedGraph } from '../nodes/evaluateGraph';
import type { GraphNode, SocketValue } from '../nodes/types';

/** `groupInput` ノードの `data.sockets` を、`nodes/definitions/groupInput.ts` には依存せず
 * 構造的な形だけで見る — `graphStore.ts` の `GroupNodeDataShape` と同じ方針(state/ レイヤーは
 * nodes/definitions/ の特定ファイルに依存しない)。 */
interface GroupInputDataShape extends Record<string, unknown> {
  sockets?: { id: string }[];
}

/** `scopeStack` をトップレベル(0番目、常に外部からの未解決入力を持たない)から currently
 * open な階層まで順に評価し、各階層の `groupInput` ノードには「実際にその階層の親から注入
 * される値」を1階層ずつ反映させていく。これにより、グループの中に別グループがネストしていても
 * (`composeRootGraph.test.ts` の「多段ネスト」が示す通りネスト自体は既に成立している)、
 * 各階層の `groupInput` は常に外部からの実際の配線値を正しく反映する — 直上の親だけを見る
 * 実装だと、親スコープ自身がさらに外側のグループの中にネストされている場合に、親スコープの
 * `groupInput` が未接続時のデフォルトのまま評価されてしまい、そこから伝播する値が不正確になる
 * (実際に踏んだ落とし穴、詳細は `src/state/CLAUDE.md` の「3つ目の評価パイプライン」節参照)。
 * 戻り値は各階層(`scopeStack` と同じ長さ)の評価結果。 */
function evaluateScopeChain(frames: ScopeFrame[]): EvaluatedGraph[] {
  const resultsByLevel: EvaluatedGraph[] = [];
  let prevFrame: ScopeFrame | null = null;
  let prevResults: EvaluatedGraph | null = null;

  for (const frame of frames) {
    const edges = frame.edges.map(toGraphEdge);
    let nodes: GraphNode[] = frame.nodes.map(toGraphNode);

    if (prevFrame && prevResults) {
      const priorFrame = prevFrame;
      const priorResults = prevResults;
      nodes = nodes.map((n) => {
        if (n.type !== 'groupInput') return n;
        const sockets = (n.data as GroupInputDataShape).sockets ?? [];
        const injected: Record<string, SocketValue> = {};
        for (const socket of sockets) {
          const value = resolveIncomingValue(priorFrame.edges, priorResults, priorFrame.parentId, socket.id);
          if (value !== undefined) injected[socket.id] = value;
        }
        return { ...n, data: { ...n.data, injected } };
      });
    }

    const results = evaluateGraph(nodes, edges);
    resultsByLevel.push(results);
    prevFrame = frame;
    prevResults = results;
  }

  return resultsByLevel;
}

/** `useEvaluatedGraph.ts`/`useRootEvaluatedGraph.ts` と並行して常時マウントする、3つ目の
 * 小さな評価パイプライン。グループの中に入っている間だけ、`scopeStack`(0番目のトップレベルから
 * 直上の親スコープまで)を `evaluateScopeChain()` で再帰的に評価し、直上の親スコープの結果を
 * `parentScopeEvaluatedResults` に書き込む。トップレベルにいる間は `null`。
 *
 * `useEvaluatedGraph.ts` が評価する「今開いている階層」には、外部から接続された値を注入する
 * `groupNodeFactory.ts` の仕組みが経由しない(中に入る操作自体がその注入の入口を素通りする)
 * ため、`groupInput` ノードの各ソケットは常に未接続時のデフォルト値として評価される。
 * `GroupInputNode.tsx` が実際に配線されている値を表示するには、代わりにこの親スコープ視点の
 * 評価結果から `resolveIncomingValue()` で該当ソケットへの接続を直接引く必要がある。 */
export function useParentScopeEvaluatedGraph(): void {
  const scopeStack = useGraphStore((s) => s.scopeStack);
  const setParentScopeEvaluatedResults = useGraphStore((s) => s.setParentScopeEvaluatedResults);

  const evaluated = useMemo<EvaluatedGraph | null>(() => {
    if (scopeStack.length === 0) return null;
    return evaluateScopeChain(scopeStack).at(-1) ?? null;
  }, [scopeStack]);

  useEffect(() => {
    setParentScopeEvaluatedResults(evaluated);
  }, [evaluated, setParentScopeEvaluatedResults]);
}

// テスト用に export している(pure function を React フックの外から直接検証するため)。
export { evaluateScopeChain };
