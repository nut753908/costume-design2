import { useEffect, useMemo } from 'react';
import { useGraphStore } from './graphStore';
import { useRootGraphLite } from './selectors';
import { evaluateGraph } from '../nodes/evaluateGraph';

/** `useEvaluatedGraph.ts` と並行して常時マウントする、トップレベル視点の評価パイプライン。
 * `useEvaluatedGraph.ts` は「今開いている階層」を評価し続け(ノードカード上のリアルタイム値
 * 表示を駆動する)、こちらは `useRootGraphLite()`(state/selectors.ts)で合成した
 * 完全なグラフを評価し、結果を `rootEvaluatedResults` に書き込む。`Garments.tsx` の3D描画は
 * こちらだけを見るため、グループの中に入っている間も他の全ガーメントが描画され続ける。 */
export function useRootEvaluatedGraph(): void {
  const { nodes, edges } = useRootGraphLite();
  const setRootEvaluatedResults = useGraphStore((s) => s.setRootEvaluatedResults);

  const evaluated = useMemo(() => evaluateGraph(nodes, edges), [nodes, edges]);

  useEffect(() => {
    setRootEvaluatedResults(evaluated);
  }, [evaluated, setRootEvaluatedResults]);
}
