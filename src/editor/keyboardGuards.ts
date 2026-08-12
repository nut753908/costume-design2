/** テキスト編集中のグローバルショートカット(Ctrl+Z/C/V/D など)は、ブラウザ/入力欄
 * ネイティブの挙動に譲るべきかどうかを判定する。HistoryControls と NodeClipboard で共有。 */
export function isEditableTextTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.tagName === 'TEXTAREA') return true;
  if (target.tagName === 'INPUT') {
    const type = (target as HTMLInputElement).type;
    return type === 'text' || type === 'search';
  }
  return false;
}
