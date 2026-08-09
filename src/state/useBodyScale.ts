import { useMemo } from 'react';
import { useGraphStore } from './graphStore';
import { DEFAULT_BODY_SCALE, type BodyScaleParams } from '../geometry/body';

/** Reads the two conventionally-ID'd "Body Height"/"Body Build" number nodes directly by id,
 * bypassing the generic evaluateGraph socket flow — body scale isn't a garment's geometry/material
 * output, it's a scene-wide parameter multiple things (Body, Garments' anchors) need to agree on.
 * Falls back to DEFAULT_BODY_SCALE if the nodes are missing (e.g. the user deleted them). */
export function useBodyScale(): BodyScaleParams {
  const heightScale = useGraphStore((s) => {
    const node = s.nodes.find((n) => n.id === 'bodyHeight');
    return typeof node?.data.value === 'number' ? node.data.value : DEFAULT_BODY_SCALE.heightScale;
  });
  const buildScale = useGraphStore((s) => {
    const node = s.nodes.find((n) => n.id === 'bodyBuild');
    return typeof node?.data.value === 'number' ? node.data.value : DEFAULT_BODY_SCALE.buildScale;
  });

  return useMemo(() => ({ heightScale, buildScale }), [heightScale, buildScale]);
}
