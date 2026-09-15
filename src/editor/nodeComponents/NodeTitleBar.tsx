import { useReactFlow } from '@xyflow/react';

/** すべてのノードカードの先頭に表示するタイトル行。ラベルと、そのノード単体を削除する
 * ×ボタンを持つ。ボタンには nodrag を付け、React Flow のノードドラッグ判定に
 * 巻き込まれないようにしている。`onLabelChange` を渡すと、ラベルを固定テキストではなく
 * 編集可能なテキスト入力(同じく nodrag)として描画する(numberInput/enumInput/colorInput
 * のようなラベル名を自由に変更できる入力ノードで使用)。
 *
 * `typeName` は `data.label` で独自の名前が付けられているノード(`GenericNode.tsx` 参照、
 * 今のところ numberAdd/numberMultiply/numberSubtract のみ)に対して、その元のノード種別
 * (`type`、例: "numberAdd")をそのまま併記する小さなサブタイトル。numberInput/enumInput/
 * colorInput は出力ソケットの色(`SOCKET_COLORS`、型ごとに固定)で種類を判別できるが、
 * numberAdd/numberMultiply/numberSubtract はどれも出力が number 型でソケット色が同じため
 * 区別できない。ラベルを "Shoulder Y" のように付け替えても、この文字列は `data.label` を
 * 経由せず `type` から直接取っているので、記述の書き忘れに関わらず必ず正しく表示される。
 * タイトル行(ラベル+削除ボタン)の右側に横並びで足すと、長いラベル+長い type 名の
 * 組み合わせでカードが不必要に横長になる(実際に発生した問題)ため、あえて別行として
 * ラベルの下に積む — 幅ではなく高さでコストを払う形にしている(`autoLayout.ts` の
 * `estimateNodeHeight()` が `TYPE_NAME_SUBTITLE_HEIGHT` として計算に織り込む)。 */
export function NodeTitleBar({
  id,
  label,
  onLabelChange,
  typeName,
}: {
  id: string;
  label: string;
  onLabelChange?: (label: string) => void;
  typeName?: string;
}) {
  const { deleteElements } = useReactFlow();

  return (
    <>
      <div className="rf-node__title">
        {onLabelChange ? (
          <input
            id={`${id}-label`}
            className="rf-node__title-input nodrag"
            type="text"
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
          />
        ) : (
          <span id={`${id}-label`}>{label}</span>
        )}
        <button
          type="button"
          className="rf-node__delete nodrag"
          title="ノードを削除"
          aria-label="ノードを削除"
          onClick={() => deleteElements({ nodes: [{ id }] })}
        >
          ×
        </button>
      </div>
      {typeName && <div className="rf-node__type-subtitle">{typeName}</div>}
    </>
  );
}
