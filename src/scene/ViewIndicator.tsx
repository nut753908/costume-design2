import { useViewStore } from '../state/viewStore';

/** 単独表示・非表示が有効な間、3Dビューの隅に常時出す表示。保存されない設定のため、
 * 「隠したまま忘れる」ことを防ぐ。 */
export function ViewIndicator() {
  const solo = useViewStore((s) => s.solo);
  const hidden = useViewStore((s) => s.hidden);
  const reset = useViewStore((s) => s.reset);
  if (solo.size === 0 && hidden.size === 0) return null;

  const parts = [
    solo.size > 0 ? `単独表示: ${Array.from(solo).join(', ')}` : null,
    hidden.size > 0 && solo.size === 0 ? `非表示: ${Array.from(hidden).join(', ')}` : null,
  ].filter(Boolean);

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: 12,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        fontSize: 12,
        padding: '2px 8px',
        borderRadius: 4,
        background: 'rgba(255, 244, 214, 0.95)',
        border: '1px solid #d9b95b',
      }}
    >
      <span>{parts.join(' / ')}</span>
      <button type="button" onClick={reset}>
        解除
      </button>
    </div>
  );
}
