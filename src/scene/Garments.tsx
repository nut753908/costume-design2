import { useMemo } from 'react';
import { useGraphStore } from '../state/graphStore';
import { useBodyScale } from '../state/useBodyScale';
import { computeBodyAnchors, computeBodyDimensions, computeBodyLayout } from '../geometry/body';
import { ToonMesh } from '../rendering/ToonMesh';

export function Garments() {
  // s.nodes ではなく s.rootEvaluatedResults(トップレベル視点で合成した完全なグラフの
  // 評価結果、state/useRootEvaluatedGraph.ts が書き込む)を見る。グループの中に入って
  // いる間も s.nodes は「今開いている階層」の内部ノードだけになるため、s.nodes を
  // 走査する実装だと他の全ガーメントが3Dビューから消えてしまう。
  const evaluated = useGraphStore((s) => s.rootEvaluatedResults);
  const bodyScale = useBodyScale();

  const anchors = useMemo(
    () => computeBodyAnchors(computeBodyLayout(computeBodyDimensions(bodyScale))),
    [bodyScale],
  );

  if (!evaluated) return null;

  return (
    <>
      {Array.from(evaluated.entries()).map(([nodeId, result]) => {
        const geometry = result.geometry;
        const material = result.material;
        if (!geometry || geometry.type !== 'geometry' || !material || material.type !== 'material') {
          return null;
        }

        const anchorValue = result.anchor;
        const anchorKey =
          anchorValue?.type === 'enum' && anchorValue.value in anchors
            ? (anchorValue.value as keyof typeof anchors)
            : 'waist';
        const anchor = anchors[anchorKey];

        const offsetValue = result.offsetY;
        const extraY = offsetValue?.type === 'number' ? offsetValue.value : 0;

        return (
          <ToonMesh
            key={nodeId}
            geometry={geometry.value}
            material={material.value}
            position={[anchor.x, anchor.y + extraY, anchor.z]}
          />
        );
      })}
    </>
  );
}
