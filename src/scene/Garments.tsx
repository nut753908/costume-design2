import { useGraphStore } from '../state/graphStore';
import { useRootGraphLite } from '../state/selectors';
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
  // どのノードが `sceneOutput`(ルートスコープの描画用終端ノード)かは rootEvaluatedResults
  // 自体には現れない(nodeId→評価結果の Map でしかなく型情報を持たない)ため、
  // useRootGraphLite() でトップレベル視点のノード一覧を別途引く。
  const { nodes } = useRootGraphLite();

  if (!evaluated) return null;

  const outputNodeIds = new Set(nodes.filter((n) => n.type === 'sceneOutput').map((n) => n.id));

  return (
    <>
      {Array.from(evaluated.entries()).map(([nodeId, result]) => {
        // `sceneOutput` へ実際に配線されているガーメントだけを描画する — 各 `<name>Group`
        // 自身の評価結果にも geometry+material は含まれるが(グループ内部の `groupOutput`
        // から転送されるため)、それだけでは描画対象にしない。「配線されているか」が
        // 仕様そのものになる(`nodes/definitions/sceneOutput.ts`/`scene/CLAUDE.md` 参照)。
        if (!outputNodeIds.has(nodeId)) return null;

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
