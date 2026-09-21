import * as THREE from 'three';
import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

export interface LatheGeneratorData extends Record<string, unknown> {
  segments?: number;
  steps?: number;
}

/** `profile`(`easedLatheCurve` 等が出力する、`(半径, 高さ)` の曲線)を `steps` 分割した点列から、生の `THREE.LatheGeometry` を
 * 返すだけの汎用プリミティブノード — `capsuleGenerator`/`sphereGenerator`/`cylinderGenerator`
 * と同じ「THREE.js 標準プリミティブをそのまま返すだけ」の形だが、`fields` が数値だけの
 * `defineGeneratorNode()` では `curve` 型の入力を表現できないため、こちらは直接
 * `registerNodeType()` で定義している。`segments` は未接続なら 3 未満に丸まらないよう
 * クランプする(`generatorNodeFactory.ts` の `round: true` フィールドと同じ丸め)。 */
registerNodeType<LatheGeneratorData>({
  type: 'latheGenerator',
  label: 'Lathe',
  category: 'primitive',
  inputs: [
    { id: 'profile', label: 'Profile', type: 'curve' },
    { id: 'steps', label: 'Profile Steps', type: 'number', default: 10 },
    { id: 'segments', label: 'Segments', type: 'number', default: 16 },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ segments: 16, steps: 10 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    if (!inputs.profile || inputs.profile.type !== 'curve') return {};
    const segments = Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? 16)));
    const steps = Math.max(1, Math.round(asNumber(inputs.steps, data.steps ?? 10)));
    return { geometry: { type: 'geometry', value: new THREE.LatheGeometry(inputs.profile.value.getPoints(steps), segments) } };
  },
});
