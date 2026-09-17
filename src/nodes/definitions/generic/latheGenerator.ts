import * as THREE from 'three';
import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

export interface LatheGeneratorData extends Record<string, unknown> {
  segments?: number;
}

/** `points`(`easedLatheProfile` 等が出力する点列)を受け取り、生の `THREE.LatheGeometry` を
 * 返すだけの汎用プリミティブノード — `capsuleGenerator`/`sphereGenerator`/`cylinderGenerator`
 * と同じ「THREE.js 標準プリミティブをそのまま返すだけ」の形だが、`fields` が数値だけの
 * `defineGeneratorNode()` では `points` 型の入力を表現できないため、こちらは直接
 * `registerNodeType()` で定義している。`segments` は未接続なら 3 未満に丸まらないよう
 * クランプする(`generatorNodeFactory.ts` の `round: true` フィールドと同じ丸め)。 */
registerNodeType<LatheGeneratorData>({
  type: 'latheGenerator',
  label: 'Lathe',
  category: 'generator',
  inputs: [
    { id: 'points', label: 'Points', type: 'points' },
    { id: 'segments', label: 'Segments', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ segments: 16 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    if (!inputs.points || inputs.points.type !== 'points') return {};
    const segments = Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? 16)));
    return { geometry: { type: 'geometry', value: new THREE.LatheGeometry(inputs.points.value, segments) } };
  },
});
