import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';

/** geometry+material のペアをそのまま転送するだけの、描画専用ノード。`Garments.tsx` は
 * `rootEvaluatedResults` の全エントリを走査し、geometry+material を持つ評価結果を直接
 * レンダリングする(宣言された `outputs` とは無関係に、評価結果の生のキーとして読む)。
 * `outputs` を宣言しているのは、グループの内部でこの2つの値を `groupOutput` ノードへ
 * 実際にワイヤーで配線できるようにするため(`nodes/definitions/groupNodeFactory.ts` 参照)。
 *
 * このノードは描画対象を示すこと以外の責務を一切持たない — 配置(取り付け位置への平行移動)は
 * `garmentPlacement.ts` が geometry の頂点座標に焼き込んだ上でここへ渡す(このノード自身は
 * anchor/offsetY を一切知らない)。material が未配線の場合のフォールバック生成のような
 * 「組み立て」寄りの処理も持たない(以前の `garmentOutput` にはあったが、責務が混在する
 * ため廃止した — 未配線なら単にそのガーメントは描画されない)。 */
registerNodeType({
  type: 'garmentMesh',
  label: 'Garment Mesh',
  category: 'output',
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'material', label: 'Material', type: 'material' },
  ],
  outputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'material', label: 'Material', type: 'material' },
  ],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    const result: Record<string, SocketValue> = {};
    if (inputs.geometry) result.geometry = inputs.geometry;
    if (inputs.material) result.material = inputs.material;
    return result;
  },
});
