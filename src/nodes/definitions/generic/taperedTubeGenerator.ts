import * as THREE from 'three';
import { registerNodeType } from '../../registry';
import type { SocketDef, SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { buildTaperedTube, type TubeShape } from '../../../geometry/taperedTube';

export interface TaperedEllipseTubeGeneratorData extends Record<string, unknown> {
  segments?: number;
}

/** 始点・終点を X/Y/Z の3ソケットに分解した入力(`alignedBoxGenerator` と同じく、座標を求める
 * 四則演算チェーンを可視の配線として展開するため)と、両端の幅・厚みの入力。 */
const TUBE_INPUTS: SocketDef[] = [
  { id: 'startX', label: 'Start X', type: 'number', default: 0 },
  { id: 'startY', label: 'Start Y', type: 'number', default: 0 },
  { id: 'startZ', label: 'Start Z', type: 'number', default: 0 },
  { id: 'endX', label: 'End X', type: 'number', default: 0 },
  { id: 'endY', label: 'End Y', type: 'number', default: 0 },
  { id: 'endZ', label: 'End Z', type: 'number', default: 0 },
  { id: 'startWidth', label: 'Start Width', type: 'number', default: 0 },
  { id: 'startThickness', label: 'Start Thickness', type: 'number', default: 0 },
  { id: 'endWidth', label: 'End Width', type: 'number', default: 0 },
  { id: 'endThickness', label: 'End Thickness', type: 'number', default: 0 },
];

function buildTube(inputs: Record<string, SocketValue>, shape: TubeShape, segments: number): SocketValue {
  const geometry = buildTaperedTube({
    start: new THREE.Vector3(asNumber(inputs.startX, 0), asNumber(inputs.startY, 0), asNumber(inputs.startZ, 0)),
    end: new THREE.Vector3(asNumber(inputs.endX, 0), asNumber(inputs.endY, 0), asNumber(inputs.endZ, 0)),
    startWidth: asNumber(inputs.startWidth, 0),
    startThickness: asNumber(inputs.startThickness, 0),
    endWidth: asNumber(inputs.endWidth, 0),
    endThickness: asNumber(inputs.endThickness, 0),
    shape,
    segments,
  });
  return { type: 'geometry', value: geometry };
}

/** `geometry/taperedTube.ts` の `buildTaperedTube()`(始点・終点を結ぶ、両端の断面が異なる
 * 2リングのチューブ、キャップ無し)を薄くラップする汎用プリミティブノード。断面は幅
 * (`tangent` 方向、軸が Y と平行でなければ水平)×厚み(`binormal` 方向)で、断面の形ごとに
 * 別のノードタイプになっている(ソケットで形を選ぶのではなく、使うノードで形が決まる)。
 * こちらは `segments` 分割の楕円断面(袖)。 */
registerNodeType<TaperedEllipseTubeGeneratorData>({
  type: 'taperedEllipseTubeGenerator',
  label: 'Tapered Ellipse Tube',
  category: 'primitive',
  inputs: [...TUBE_INPUTS, { id: 'segments', label: 'Segments', type: 'number', default: 12 }],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ segments: 12 }),
  evaluate: (inputs, data): Record<string, SocketValue> => ({
    geometry: buildTube(inputs, 'ellipse', Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? 12)))),
  }),
});

/** 4隅の矩形断面(width×thickness にちょうど収まる、ネクタイのブレード)のチューブ。
 * 分割数の概念が無いので `segments` は持たない。 */
registerNodeType({
  type: 'taperedRectTubeGenerator',
  label: 'Tapered Rect Tube',
  category: 'primitive',
  inputs: TUBE_INPUTS,
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => ({ geometry: buildTube(inputs, 'rectangle', 0) }),
});
