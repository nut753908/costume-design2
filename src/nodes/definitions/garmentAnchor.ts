import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';

export interface GarmentAnchorData extends Record<string, unknown> {
  anchor: 'waist' | 'shoulder' | 'feet' | 'wrist' | 'head';
  offsetY?: number;
  label?: string;
}

/** ガーメントをボディのどこに取り付けるかという配置情報だけを生成するノード。
 * geometry+material のペア(`garmentMesh.ts` が担う「描画」の責務)とは分離しており、
 * このノード自身は入力を一切持たず、`data.anchor`/`data.offsetY` を SocketValue に変換して
 * 返すだけ(以前は `garmentOutput` という1つのノードがこの配置情報と描画情報の両方を
 * 担っていたが、責務が混在していたため分割した — `nodes/CLAUDE.md` の「グループノード」節
 * 参照)。この出力は `groupOutput` へは配線せず、`garmentPlacement` ノードへ配線する —
 * 実際にジオメトリを平行移動するのは `garmentPlacement.ts` の役目で、このノードは
 * 「どこに」を決めるだけ。
 *
 * `anchor` は `'waist' | 'shoulder' | 'feet' | 'wrist' | 'head'` の固定列挙で、`body.ts` の
 * `computeBodyAnchors()` が返す座標に対応する。新しいアンカー種を増やす場合はこの型と
 * `body.ts`/`Body.tsx`/`garmentPlacement.ts` 側の対応を同時に変更する必要がある(通常の
 * 追加では既存アンカーのどれかを再利用すれば足りる)。 */
registerNodeType<GarmentAnchorData>({
  type: 'garmentAnchor',
  label: 'Garment Anchor',
  category: 'output',
  inputs: [],
  outputs: [
    { id: 'anchor', label: 'Anchor', type: 'enum' },
    { id: 'offsetY', label: 'Offset Y', type: 'number' },
  ],
  createDefaultData: () => ({ anchor: 'waist', offsetY: 0 }),
  evaluate: (_inputs, data): Record<string, SocketValue> => ({
    anchor: { type: 'enum', value: data.anchor },
    offsetY: { type: 'number', value: data.offsetY ?? 0 },
  }),
});
