import * as THREE from 'three';
import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { createToonMaterial } from '../../../rendering/ToonMaterialFactory';
import { asNumber } from '../../socketHelpers';

/** 影の色を指定できるトゥーンマテリアル。明るい面は `color` そのままの色、影の面は明るさに応じて `shadowColor` へ
 * 寄る(`rendering/ToonMaterialFactory.ts`)。`toonMaterial` は影が灰色の係数で暗くなるだけなのに対し、こちらは
 * 影の色味まで決められる。`doubleSided` が 1 なら裏面も描く(裾の開いたスカートの内側など、裏が見える形に使う)。 */
registerNodeType({
  type: 'toonShadowMaterial',
  label: 'Toon Material (Shadow)',
  category: 'material',
  inputs: [
    { id: 'color', label: 'Color', type: 'color', default: '#cccccc' },
    { id: 'shadowColor', label: 'Shadow Color', type: 'color', default: '#999999' },
    { id: 'doubleSided', label: 'Double Sided (0/1)', type: 'number', default: 0 },
  ],
  outputs: [{ id: 'material', label: 'Material', type: 'material' }],
  createDefaultData: () => ({ color: '#cccccc', shadowColor: '#999999', doubleSided: 0 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const color = inputs.color?.type === 'color' ? inputs.color.value : new THREE.Color((data.color as string) ?? '#cccccc');
    const shadow =
      inputs.shadowColor?.type === 'color' ? inputs.shadowColor.value : new THREE.Color((data.shadowColor as string) ?? '#999999');
    const material = createToonMaterial(color, shadow);
    if (asNumber(inputs.doubleSided, (data.doubleSided as number | undefined) ?? 0) >= 0.5) material.side = THREE.DoubleSide;
    return { material: { type: 'material', value: material } };
  },
});
