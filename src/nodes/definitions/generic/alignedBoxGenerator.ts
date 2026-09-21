import * as THREE from 'three';
import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { buildAlignedBox } from '../../../geometry/alignedBox';

/** `geometry/alignedBox.ts` の `buildAlignedBox()`(2点間を結ぶよう回転+平行移動した
 * `THREE.BoxGeometry` を作る、剛体変換のみなので標準プリミティブの正しい巻き順がそのまま
 * 保たれる)を薄くラップする汎用プリミティブノード。`capsuleGenerator`/`sphereGenerator`
 * 等と同じ「THREE.js 標準プリミティブをそのまま返すだけ」の形だが、`start`/`end` が
 * `THREE.Vector3` のため `fields` が数値だけの `defineGeneratorNode()` では表現できず
 * (`latheGenerator.ts` の `points` と同じ理由)、こちらは直接 `registerNodeType()` で
 * 定義している。始点・終点をそれぞれ X/Y/Z の3ソケットに分解しているのは、座標を
 * 求める四則演算チェーン(`numberAdd`/`numberSubtract`)をノードグラフ上に可視の配線として
 * 展開できるようにするため(`nodes/CLAUDE.md` の「グループノード」節参照)。 */
registerNodeType({
  type: 'alignedBoxGenerator',
  label: 'Aligned Box',
  category: 'generator',
  inputs: [
    { id: 'width', label: 'Width', type: 'number', default: 0 },
    { id: 'thickness', label: 'Thickness', type: 'number', default: 0 },
    { id: 'startX', label: 'Start X', type: 'number', default: 0 },
    { id: 'startY', label: 'Start Y', type: 'number', default: 0 },
    { id: 'startZ', label: 'Start Z', type: 'number', default: 0 },
    { id: 'endX', label: 'End X', type: 'number', default: 0 },
    { id: 'endY', label: 'End Y', type: 'number', default: 0 },
    { id: 'endZ', label: 'End Z', type: 'number', default: 0 },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    const width = asNumber(inputs.width, 0);
    const thickness = asNumber(inputs.thickness, 0);
    const start = new THREE.Vector3(asNumber(inputs.startX, 0), asNumber(inputs.startY, 0), asNumber(inputs.startZ, 0));
    const end = new THREE.Vector3(asNumber(inputs.endX, 0), asNumber(inputs.endY, 0), asNumber(inputs.endZ, 0));
    return { geometry: { type: 'geometry', value: buildAlignedBox(width, thickness, start, end) } };
  },
});
