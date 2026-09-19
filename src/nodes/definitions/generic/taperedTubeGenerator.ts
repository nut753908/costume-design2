import * as THREE from 'three';
import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asEnum, asNumber } from '../../socketHelpers';
import { buildTaperedTube, type TubeShape } from '../../../geometry/taperedTube';

export interface TaperedTubeGeneratorData extends Record<string, unknown> {
  shape?: TubeShape;
  segments?: number;
}

/** `geometry/taperedTube.ts` の `buildTaperedTube()`(始点・終点を結ぶ、両端の断面が
 * 異なる2リングのチューブ、キャップ無し)を薄くラップする汎用プリミティブノード。
 * `alignedBoxGenerator` と同じく始点・終点を X/Y/Z の3ソケットに分解している(座標を求める
 * 四則演算チェーンを可視の配線として展開するため)。断面は幅(`tangent` 方向、軸が Y と平行
 * でなければ水平)×厚み(`binormal` 方向)で、`shape` が `'ellipse'`(袖)なら `segments` 分割の
 * 楕円、`'rectangle'`(ネクタイのブレード)なら矩形。`shape` は形状そのものを決める値の
 * ため、ソケットへ配線しなければ `data` の値を使う(`easedLatheProfile` の `direction` と
 * 同じ扱い)。 */
registerNodeType<TaperedTubeGeneratorData>({
  type: 'taperedTubeGenerator',
  label: 'Tapered Tube',
  category: 'generator',
  inputs: [
    { id: 'startX', label: 'Start X', type: 'number' },
    { id: 'startY', label: 'Start Y', type: 'number' },
    { id: 'startZ', label: 'Start Z', type: 'number' },
    { id: 'endX', label: 'End X', type: 'number' },
    { id: 'endY', label: 'End Y', type: 'number' },
    { id: 'endZ', label: 'End Z', type: 'number' },
    { id: 'startWidth', label: 'Start Width', type: 'number' },
    { id: 'startThickness', label: 'Start Thickness', type: 'number' },
    { id: 'endWidth', label: 'End Width', type: 'number' },
    { id: 'endThickness', label: 'End Thickness', type: 'number' },
    { id: 'segments', label: 'Segments', type: 'number' },
    { id: 'shape', label: 'Shape', type: 'enum' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ shape: 'ellipse', segments: 12 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const geometry = buildTaperedTube({
      start: new THREE.Vector3(asNumber(inputs.startX, 0), asNumber(inputs.startY, 0), asNumber(inputs.startZ, 0)),
      end: new THREE.Vector3(asNumber(inputs.endX, 0), asNumber(inputs.endY, 0), asNumber(inputs.endZ, 0)),
      startWidth: asNumber(inputs.startWidth, 0),
      startThickness: asNumber(inputs.startThickness, 0),
      endWidth: asNumber(inputs.endWidth, 0),
      endThickness: asNumber(inputs.endThickness, 0),
      shape: asEnum<TubeShape>(inputs.shape, data.shape ?? 'ellipse'),
      segments: Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? 12))),
    });
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
