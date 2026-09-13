import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { createToonMaterial } from '../../rendering/ToonMaterialFactory';

export interface GarmentOutputData extends Record<string, unknown> {
  anchor: 'waist' | 'shoulder' | 'feet' | 'wrist' | 'head';
  offsetY?: number;
  label?: string;
  fallbackColor?: string;
}

/** 終端ノード: geometry+material のペアに、ボディのどこに取り付けるかをタグ付けする。
 * `Garments.tsx` は `rootEvaluatedResults` のすべてのエントリの評価結果を読み取り、
 * geometry+material を持つものをレンダリングする(宣言された `outputs` とは無関係に、
 * 評価結果の生のキーとして読む)。`outputs` を宣言しているのは、グループの内部で
 * この4つの値を `groupOutput` ノードへ実際にワイヤーで配線できるようにするため
 * (`nodes/definitions/groupNodeFactory.ts` 参照 — グループ本体の出力は、この
 * ノードの評価結果を暗黙に丸ごと転送するのではなく、`groupOutput` に配線された
 * 値だけを転送する)。 */
registerNodeType<GarmentOutputData>({
  type: 'garmentOutput',
  label: 'Garment Output',
  category: 'output',
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'material', label: 'Material', type: 'material' },
  ],
  outputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'material', label: 'Material', type: 'material' },
    { id: 'anchor', label: 'Anchor', type: 'enum' },
    { id: 'offsetY', label: 'Offset Y', type: 'number' },
  ],
  createDefaultData: () => ({ anchor: 'waist', offsetY: 0, fallbackColor: '#cccccc' }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const result: Record<string, SocketValue> = {
      anchor: { type: 'enum', value: data.anchor },
      offsetY: { type: 'number', value: data.offsetY ?? 0 },
      material: inputs.material ?? {
        type: 'material',
        value: createToonMaterial(data.fallbackColor ?? '#cccccc'),
      },
    };
    if (inputs.geometry) result.geometry = inputs.geometry;
    return result;
  },
});
