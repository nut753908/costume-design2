import { useGraphStore } from '../state/graphStore';
import { BODY_ANCHORS } from '../geometry/body';
import { ToonMesh } from '../rendering/ToonMesh';

export function Garments() {
  const nodes = useGraphStore((s) => s.nodes);
  const evaluated = useGraphStore((s) => s.evaluatedResults);

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
          anchorValue?.type === 'enum' && anchorValue.value in BODY_ANCHORS
            ? (anchorValue.value as keyof typeof BODY_ANCHORS)
            : 'waist';
        const anchor = BODY_ANCHORS[anchorKey];

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
