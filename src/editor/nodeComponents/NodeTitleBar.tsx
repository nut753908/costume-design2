/** すべてのノードカードの先頭に表示するタイトル行(ラベルは編集できない固定テキスト)。 */
export function NodeTitleBar({ id, label }: { id: string; label: string }) {
  return (
    <div className="rf-node__title">
      <span id={`${id}-label`}>{label}</span>
    </div>
  );
}
