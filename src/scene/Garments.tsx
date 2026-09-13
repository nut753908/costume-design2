import { useGraphStore } from '../state/graphStore';
import { ToonMesh } from '../rendering/ToonMesh';

/** ガーメントの取り付け位置(anchor/offsetY)は `nodes/definitions/garmentPlacement.ts` が
 * 評価時にジオメトリの頂点座標へ焼き込み済み(Blender の Geometry Nodes で位置をジオメトリに
 * 焼き込む考え方と同じ、`src/nodes/CLAUDE.md` の「グループノード」節参照)。そのため
 * ここでは常に原点にメッシュを置くだけでよく、`useBodyScale()`/`computeBodyAnchors()` を
 * 呼ぶ必要は無い(以前はここでアンカー座標を計算していたが、責務がガーメント側の
 * ノードグラフへ移った)。 */
export function Garments() {
  // s.nodes ではなく s.rootEvaluatedResults(トップレベル視点で合成した完全なグラフの
  // 評価結果、state/useRootEvaluatedGraph.ts が書き込む)を見る。グループの中に入って
  // いる間も s.nodes は「今開いている階層」の内部ノードだけになるため、s.nodes を
  // 走査する実装だと他の全ガーメントが3Dビューから消えてしまう。
  const evaluated = useGraphStore((s) => s.rootEvaluatedResults);

  if (!evaluated) return null;

  return (
    <>
      {Array.from(evaluated.entries()).map(([nodeId, result]) => {
        const geometry = result.geometry;
        const material = result.material;
        if (!geometry || geometry.type !== 'geometry' || !material || material.type !== 'material') {
          return null;
        }

        return <ToonMesh key={nodeId} geometry={geometry.value} material={material.value} />;
      })}
    </>
  );
}
