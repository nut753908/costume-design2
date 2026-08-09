import { useMemo } from 'react';
import { useGraphStore } from '../state/graphStore';
import { useBodyScale } from '../state/useBodyScale';
import { computeBodyAnchors, computeBodyDimensions, computeBodyLayout } from '../geometry/body';
import { ToonMesh } from '../rendering/ToonMesh';

export function Garments() {
  const nodes = useGraphStore((s) => s.nodes);
  const evaluated = useGraphStore((s) => s.evaluatedResults);
  const bodyScale = useBodyScale();

  const anchors = useMemo(
    () => computeBodyAnchors(computeBodyLayout(computeBodyDimensions(bodyScale))),
    [bodyScale],
  );

  if (!evaluated) return null;

  return (
    <>
      {nodes.map((node) => {
        const result = evaluated.get(node.id);
        const geometry = result?.geometry;
        const material = result?.material;
        if (!geometry || geometry.type !== 'geometry' || !material || material.type !== 'material') {
          return null;
        }

        const anchorValue = result?.anchor;
        const anchorKey =
          anchorValue?.type === 'enum' && anchorValue.value in anchors
            ? (anchorValue.value as keyof typeof anchors)
            : 'waist';
        const anchor = anchors[anchorKey];

        const offsetValue = result?.offsetY;
        const extraY = offsetValue?.type === 'number' ? offsetValue.value : 0;

        return (
          <ToonMesh
            key={node.id}
            geometry={geometry.value}
            material={material.value}
            position={[anchor.x, anchor.y + extraY, anchor.z]}
          />
        );
      })}
    </>
  );
}
