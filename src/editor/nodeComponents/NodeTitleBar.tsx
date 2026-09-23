import { useRef, useState, type ReactNode } from 'react';

/** すべてのノードカードの先頭に表示するタイトル行。
 * `action` を渡すと右端に表示する(グループノードの「中に入る」ボタン)。
 * `onRename` を渡すとダブルクリックで名前を編集でき、Enter/フォーカス外しで確定、Esc で取り消す
 * (空で確定すると型のラベルに戻る — `nodeDisplayLabel()` 参照)。 */
export function NodeTitleBar({
  id,
  label,
  action,
  onRename,
}: {
  id: string;
  label: string;
  action?: ReactNode;
  onRename?: (label: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  // Esc で編集欄を外したときに blur が続けて届いても確定しないようにする。
  const cancelled = useRef(false);

  const commit = () => {
    if (draft === null || cancelled.current) return;
    if (draft !== label) onRename?.(draft.trim());
    setDraft(null);
  };

  return (
    <div className="rf-node__title">
      {draft !== null ? (
        // input は既定で約20文字分の幅を持ちカードを押し広げるため、size=1 で既定幅を外し、
        // 同じ文字列を見えない形で同じグリッドセルに重ねてその幅に合わせる。
        <span className="rf-node__title-edit">
          <span className="rf-node__title-sizer" aria-hidden="true">
            {draft || ' '}
          </span>
          <input
            className="rf-node__title-input nodrag"
            type="text"
            size={1}
            aria-label="ノード名"
            value={draft}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              else if (e.key === 'Escape') {
                cancelled.current = true;
                setDraft(null);
              }
            }}
          />
        </span>
      ) : (
        <span
          id={`${id}-label`}
          title={onRename ? 'ダブルクリックで名前を変更' : undefined}
          onDoubleClick={
            onRename
              ? () => {
                  cancelled.current = false;
                  setDraft(label);
                }
              : undefined
          }
        >
          {label}
        </span>
      )}
      {action}
    </div>
  );
}
