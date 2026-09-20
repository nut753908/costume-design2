/** すべてのノードカードの先頭に表示するタイトル行(ラベルは編集できない固定テキスト)。
 *
 * `typeName` は `data.label` で独自の名前が付けられているノード(`GenericNode.tsx` 参照、
 * 今のところ numberAdd/numberMultiply/numberSubtract のみ)に対して、その元のノード種別
 * (`type`、例: "numberAdd")をそのまま併記する小さなサブタイトル。numberInput/enumInput/
 * colorInput は出力ソケットの色(`SOCKET_COLORS`、型ごとに固定)で種類を判別できるが、
 * numberAdd/numberMultiply/numberSubtract はどれも出力が number 型でソケット色が同じため
 * 区別できない。ラベルを "Shoulder Y" のように付け替えても、この文字列は `data.label` を
 * 経由せず `type` から直接取っているので、記述の書き忘れに関わらず必ず正しく表示される。
 * タイトル行の右側に横並びで足すと、長いラベル+長い type 名の
 * 組み合わせでカードが不必要に横長になる(実際に発生した問題)ため、あえて別行として
 * ラベルの下に積む — 幅ではなく高さでコストを払う形にしている(`autoLayout.ts` の
 * `estimateNodeHeight()` が `TYPE_NAME_SUBTITLE_HEIGHT` として計算に織り込む)。 */
export function NodeTitleBar({
  id,
  label,
  typeName,
}: {
  id: string;
  label: string;
  typeName?: string;
}) {
  return (
    <>
      <div className="rf-node__title">
        <span id={`${id}-label`}>{label}</span>
      </div>
      {typeName && <div className="rf-node__type-subtitle">{typeName}</div>}
    </>
  );
}
