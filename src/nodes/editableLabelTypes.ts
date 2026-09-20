/** カード上でラベルを直接編集できる(タイトルが `<input>` で描かれる)`GenericNode.tsx` 系ノードの
 * type 名。出力が number 型で統一されておりソケット色だけでは互いに判別できないため、意味的な名前を
 * 付けて見分けられるようにしている(元の type 名は編集後もサブタイトルとして残る)。タイトルが
 * `<input>` の分だけカードが高くなるため、`autoLayout.ts` の高さ見積もりも参照する。 */
export const EDITABLE_LABEL_TYPES: ReadonlySet<string> = new Set([
  'numberAdd',
  'numberSubtract',
  'numberMultiply',
  'numberMax',
  'numberNegate',
  'numberHalf',
]);
