import { useEffect } from 'react';
import { useGraphStore } from '../state/graphStore';
import { isEditableTextTarget } from './keyboardGuards';

/** 選択中ノードのコピー&ペースト(Ctrl+C / Ctrl+V)と即時複製(Ctrl+D)。
 * 画面に見えるUIは持たず、キーボードショートカットのみを提供する。 */
export function NodeClipboard() {
  const copySelected = useGraphStore((s) => s.copySelected);
  const pasteClipboard = useGraphStore((s) => s.pasteClipboard);
  const duplicateSelected = useGraphStore((s) => s.duplicateSelected);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || isEditableTextTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === 'd') {
        event.preventDefault();
        duplicateSelected();
      } else if (key === 'c') {
        if (window.getSelection()?.toString()) return; // 通常のテキスト選択コピーを優先
        event.preventDefault();
        copySelected();
      } else if (key === 'v') {
        event.preventDefault();
        pasteClipboard();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [copySelected, pasteClipboard, duplicateSelected]);

  return null;
}
