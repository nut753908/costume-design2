import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { createToonMaterial } from '../../rendering/ToonMaterialFactory';

export interface GarmentOutputData extends Record<string, unknown> {
  anchor: 'waist' | 'shoulder' | 'feet';
  offsetY?: number;
  label?: string;
  fallbackColor?: string;
}

/** 終端ノード: geometry+material のペアに、ボディのどこに取り付けるかをタグ付けする。
 * Scene.tsx はすべてのノードの評価結果を読み取り、geometry を持つものをレンダリングする。 */
registerNodeType<GarmentOutputData>({
  type: 'garmentOutput',
  label: 'Garment Output',
  category: 'output',
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'material', label: 'Material', type: 'material' },
  ],
  outputs: [],
  createDefaultData: () => ({ anchor: 'waist', offsetY: 0, fallbackColor: '#cccccc' }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const result: Record<string, SocketValue> = {
      anchor: { type: 'enum', value: data.anchor },
      offsetY: { type: 'number', value: data.offsetY ?? 0 },
      material: inputs.material ?? {
        type: 'material',
        value: createToonMaterial(data.fallbackColor ?? '#d98c8c'),
      },
    };
    if (inputs.geometry) result.geometry = inputs.geometry;
    return result;
  },
});
