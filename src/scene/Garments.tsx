import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useGraphStore } from '../state/graphStore';
import { isMeshVisible, sceneMeshKey, useViewStore } from '../state/viewStore';
import { ToonMesh } from '../rendering/ToonMesh';
import { matchSceneOutputGeometryIndex, sceneOutputGeometryKey, sceneOutputMaterialKey } from '../nodes/definitions/generic/sceneOutput';

/** `bodyGroup`(Body、3Dモデル本体)も他14種のガーメントと同じ `<name>Group` パターンで
 * 実装されており、内部の `sceneOutput` を通じてこのコンポーネントが走査する
 * `rootEvaluatedResults` に現れる — Body 専用の描画コード・専用コンポーネントは無い
 * (ノードの型を一切問わないこの走査ロジックのおかげ)。
 *
 * ガーメントの取り付け位置は、各ガーメントの `placement`(汎用 `translate`)が評価時に
 * ジオメトリの頂点座標へ焼き込み済み(Blender の Geometry Nodes で位置をジオメトリに
 * 焼き込む考え方と同じ、`src/nodes/CLAUDE.md` の「グループノード」節参照)。そのため
 * ここでは常に原点にメッシュを置くだけでよく、位置を計算するコードは一切無い。 */
export function Garments() {
  // s.nodes ではなく s.rootEvaluatedResults(トップレベル視点で合成した完全なグラフの
  // 評価結果、state/useRootEvaluatedGraph.ts が書き込む)を見る。グループの中に入って
  // いる間も s.nodes は「今開いている階層」の内部ノードだけになるため、s.nodes を
  // 走査する実装だと他の全ガーメントが3Dビューから消えてしまう。
  const evaluated = useGraphStore((s) => s.rootEvaluatedResults);
  const hidden = useViewStore((s) => s.hidden);
  const solo = useViewStore((s) => s.solo);
  // Canvas は frameloop="demand" のため、表示/非表示の切り替えで描画対象が変わったときに
  // 明示的に再描画を要求する(要求しないと次にカメラ操作などが起きるまで画面が更新されない)。
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [hidden, solo, invalidate]);

  if (!evaluated) return null;

  return (
    <>
      {Array.from(evaluated.entries()).flatMap(([nodeId, result]) =>
        // `sceneOutputGeometry<N>`/`sceneOutputMaterial<N>` は、そのノード(通常は
        // `<name>Group`)の内部に `sceneOutput`(nodes/definitions/generic/sceneOutput.ts)が実際に
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

          // 表示/非表示・単独表示は確認用の UI 状態(`state/viewStore.ts`)で、グラフの評価結果や
          // 内容には影響しない。
          const meshKey = sceneMeshKey(nodeId, index);
          if (!isMeshVisible({ hidden, solo }, meshKey)) return [];

          return [<ToonMesh key={meshKey} geometry={geometry.value} material={material.value} />];
        }),
      )}
    </>
  );
}
