import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { voxelRemesh } from '../../../geometry/voxelRemesh';

// 長さはすべてワールド単位(身長 約1.9 のボディに合わせた値)。
const DEFAULTS = {
  below: 0.164,
  above: 0.145,
  halfWidth: 0.203,
  voxelSize: 0.0077,
  sigma: 2,
  iso: 0.45,
  overlap: 0.019,
};

/** geometry のうち、`centerY` から下へ `below`・上へ `above`、X は ±`halfWidth` の箱の中だけを
 * ボクセル化→ガウスぼかし→マーチングキューブで1枚の面に作り直す(箱の外は元の面のまま、境目は
 * `overlap` だけ両方を重ねる)。重ね合わせたプリミティブの継ぎ目・とがりをなくすためのもの
 * (`geometry/voxelRemesh.ts`)。 */
registerNodeType({
  type: 'voxelRemesh',
  label: 'Voxel Remesh',
  category: 'geometry-op',
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'centerY', label: 'Center Y', type: 'number', default: 0 },
    { id: 'below', label: 'Below', type: 'number', default: DEFAULTS.below },
    { id: 'above', label: 'Above', type: 'number', default: DEFAULTS.above },
    { id: 'halfWidth', label: 'Half Width', type: 'number', default: DEFAULTS.halfWidth },
    { id: 'voxelSize', label: 'Voxel Size', type: 'number', default: DEFAULTS.voxelSize },
    { id: 'sigma', label: 'Blur (voxels)', type: 'number', default: DEFAULTS.sigma },
    { id: 'iso', label: 'Iso', type: 'number', default: DEFAULTS.iso },
    { id: 'overlap', label: 'Overlap', type: 'number', default: DEFAULTS.overlap },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.geometry || inputs.geometry.type !== 'geometry') return {};
    const centerY = asNumber(inputs.centerY, 0);
    const voxelSize = asNumber(inputs.voxelSize, DEFAULTS.voxelSize);
    if (voxelSize <= 0) return {};
    const geometry = voxelRemesh(inputs.geometry.value, {
      yMin: centerY - asNumber(inputs.below, DEFAULTS.below),
      yMax: centerY + asNumber(inputs.above, DEFAULTS.above),
      xMax: asNumber(inputs.halfWidth, DEFAULTS.halfWidth),
      voxelSize,
      sigma: asNumber(inputs.sigma, DEFAULTS.sigma),
      iso: asNumber(inputs.iso, DEFAULTS.iso),
      overlap: asNumber(inputs.overlap, DEFAULTS.overlap),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
