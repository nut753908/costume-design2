import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

const smoothstep = (u: number) => u * u * (3 - 2 * u);

/** geometry の下側を Y 軸へ向けて絞る汎用ノード(頭の球をあごのすぼまった卵形にする、など)。
 * Y 軸(X=Z=0)まわりに置かれた geometry を前提に、下端から `startRatio`(高さに対する割合、
 * 0〜1)の高さまでの頂点の X/Z を、下端で `bottomScale` 倍、`startRatio` の高さで 1 倍になる
 * ように smoothstep で補間して縮める。`startRatio` より上は変えない。法線は絞った形から
 * 計算し直す。 */
registerNodeType({
  type: 'taperY',
  label: 'Taper Y',
  category: 'geometry-op',
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'bottomScale', label: 'Bottom Scale', type: 'number', default: 1 },
    { id: 'startRatio', label: 'Start Ratio', type: 'number', default: 0.5 },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.geometry || inputs.geometry.type !== 'geometry') return {};
    const bottomScale = asNumber(inputs.bottomScale, 1);
    const startRatio = asNumber(inputs.startRatio, 0.5);
    const geometry = inputs.geometry.value.clone();
    const position = geometry.getAttribute('position');
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < position.count; i++) {
      minY = Math.min(minY, position.getY(i));
      maxY = Math.max(maxY, position.getY(i));
    }
    const height = maxY - minY;
    if (height > 0 && startRatio > 0) {
      for (let i = 0; i < position.count; i++) {
        const t = (position.getY(i) - minY) / height;
        if (t >= startRatio) continue;
        const factor = bottomScale + (1 - bottomScale) * smoothstep(t / startRatio);
        position.setX(i, position.getX(i) * factor);
        position.setZ(i, position.getZ(i) * factor);
      }
      position.needsUpdate = true;
      if (geometry.getAttribute('normal')) geometry.computeVertexNormals();
    }
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
