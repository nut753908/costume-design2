import * as THREE from 'three';
import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { createToonMaterial } from '../../../rendering/ToonMaterialFactory';

export interface ToonMaterialData extends Record<string, unknown> {
  color?: string;
}

registerNodeType<ToonMaterialData>({
  type: 'toonMaterial',
  label: 'Toon Material',
  category: 'material',
  inputs: [{ id: 'color', label: 'Color', type: 'color' }],
  outputs: [{ id: 'material', label: 'Material', type: 'material' }],
  createDefaultData: () => ({ color: '#cccccc' }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const color = inputs.color?.type === 'color' ? inputs.color.value : new THREE.Color(data.color ?? '#cccccc');
    return { material: { type: 'material', value: createToonMaterial(color) } };
  },
});
