/** 専用のカード UI(`GenericNode.tsx` ではない描画)を持つノードの type。`editor/NodeEditor.tsx` の
 * `NODE_VIEW_OVERRIDES` のキーはこの一覧と完全に一致する必要があり(型で強制)、`nodes/autoLayout.ts`
 * の `estimateNodeHeight()` が個別に高さを求める type とも一致する(`autoLayout.test.ts` で確認)。
 * 専用のカード UI を持つノードを増やすときは、ここへ追加して、高さの見積もりも対応させること。 */
export const CUSTOM_CARD_TYPES = ['numberInput', 'colorInput', 'numberDisplay', 'colorDisplay', 'groupInput', 'groupOutput'] as const;

export type CustomCardType = (typeof CUSTOM_CARD_TYPES)[number];
