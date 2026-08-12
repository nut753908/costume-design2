import { useReactFlow } from '@xyflow/react';

/** すべてのノードカードの先頭に表示するタイトル行。ラベルと、そのノード単体を削除する
 * ×ボタンを持つ。ボタンには nodrag を付け、React Flow のノードドラッグ判定に
 * 巻き込まれないようにしている。 */
export function NodeTitleBar({ id, label }: { id: string; label: string }) {
  const { deleteElements } = useReactFlow();

  return (
    <div className="rf-node__title">
      <span id={`${id}-label`}>{label}</span>
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
