import { useReactFlow } from '@xyflow/react';

/** すべてのノードカードの先頭に表示するタイトル行。ラベルと、そのノード単体を削除する
 * ×ボタンを持つ。ボタンには nodrag を付け、React Flow のノードドラッグ判定に
 * 巻き込まれないようにしている。`onLabelChange` を渡すと、ラベルを固定テキストではなく
 * 編集可能なテキスト入力(同じく nodrag)として描画する(numberInput/enumInput/colorInput
 * のようなラベル名を自由に変更できる入力ノードで使用)。 */
export function NodeTitleBar({
  id,
  label,
  onLabelChange,
}: {
  id: string;
  label: string;
  onLabelChange?: (label: string) => void;
}) {
  const { deleteElements } = useReactFlow();

  return (
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
  );
}
