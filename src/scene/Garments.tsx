import { useGraphStore } from '../state/graphStore';
import { ToonMesh } from '../rendering/ToonMesh';
import { matchSceneOutputGeometryIndex, sceneOutputGeometryKey, sceneOutputMaterialKey } from '../nodes/definitions/sceneOutput';

/** `bodyGroup`(Body、3Dモデル本体)も他15種のガーメントと同じ `<name>Group` パターンで
 * 実装されており、内部の `sceneOutput` を通じてこのコンポーネントが走査する
 * `rootEvaluatedResults` に現れる — Body 専用の描画コード・専用コンポーネントは無い
 * (ノードの型を一切問わないこの走査ロジックのおかげ)。
 *
 * ガーメントの取り付け位置(anchor/offsetY)は `nodes/definitions/garmentPlacement.ts` が
 * 評価時にジオメトリの頂点座標へ焼き込み済み(Blender の Geometry Nodes で位置をジオメトリに
 * 焼き込む考え方と同じ、`src/nodes/CLAUDE.md` の「グループノード」節参照)。そのため
 * ここでは常に原点にメッシュを置くだけでよく、アンカー座標を計算するコードは一切無い
 * (以前はここでアンカー座標を計算していたが、責務がガーメント側の
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
      {Array.from(evaluated.entries()).flatMap(([nodeId, result]) =>
        // `sceneOutputGeometry<N>`/`sceneOutputMaterial<N>` は、そのノード(通常は
        // `<name>Group`)の内部に `sceneOutput`(nodes/definitions/sceneOutput.ts)が実際に
        // 配線されている場合にだけ `groupNodeFactory.ts` の `evaluate()` が転送する予約キー。
        // ノードの型を問わずこのキーの有無だけを見る — `groupOutput` 経由の通常の
        // `geometry`/`material`(グループ間で値を再利用するための汎用ソケット)を直接見て
        // 自動描画する、という暗黙の検出はしない(`nodes/CLAUDE.md`/`scene/CLAUDE.md` 参照)。
        // 1つのグループの中に `sceneOutput` は何個でも置けるため、インデックスをすべて
        // 走査してそれぞれ独立した `ToonMesh` としてマウントする。
        Object.keys(result).flatMap((key) => {
          const index = matchSceneOutputGeometryIndex(key);
          if (index === null) return [];

          const geometry = result[sceneOutputGeometryKey(index)];
          const material = result[sceneOutputMaterialKey(index)];
          if (!geometry || geometry.type !== 'geometry' || !material || material.type !== 'material') return [];

          return [<ToonMesh key={`${nodeId}:${index}`} geometry={geometry.value} material={material.value} />];
        }),
      )}
    </>
  );
}
