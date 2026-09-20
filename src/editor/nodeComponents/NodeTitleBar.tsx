import type { ReactNode } from 'react';

/** すべてのノードカードの先頭に表示するタイトル行(ラベルは編集できない固定テキスト)。
 * `action` を渡すと右端に表示する(グループノードの「中に入る」ボタン)。 */
export function NodeTitleBar({ id, label, action }: { id: string; label: string; action?: ReactNode }) {
  return (
    <div className="rf-node__title">
      <span id={`${id}-label`}>{label}</span>
      {action}
    </div>
  );
}
