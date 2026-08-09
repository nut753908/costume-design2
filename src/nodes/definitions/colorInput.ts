import * as THREE from 'three';
import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';

export interface ColorInputData extends Record<string, unknown> {
  hex: string;
  label?: string;
}

registerNodeType<ColorInputData>({
  type: 'colorInput',
  label: 'Color',
  category: 'input',
  inputs: [],
  outputs: [{ id: 'color', label: 'Color', type: 'color' }],
  createDefaultData: () => ({ hex: '#cccccc', label: 'Color' }),
  evaluate: (_inputs, data): Record<string, SocketValue> => ({
    color: { type: 'color', value: new THREE.Color(data.hex) },
  }),
});
