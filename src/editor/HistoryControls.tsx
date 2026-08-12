import { useEffect } from 'react';
import { Panel } from '@xyflow/react';
import { useGraphStore } from '../state/graphStore';
import { isEditableTextTarget } from './keyboardGuards';

/** グラフ編集の Undo/Redo。Ctrl+Z / Ctrl+Shift+Z(または Ctrl+Y)のショートカットも提供する。 */
export function HistoryControls() {
  const undo = useGraphStore((s) => s.undo);
  const redo = useGraphStore((s) => s.redo);
  const canUndo = useGraphStore((s) => s.past.length > 0);
  const canRedo = useGraphStore((s) => s.future.length > 0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || isEditableTextTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === 'z' && event.shiftKey) {
        event.preventDefault();
        redo();
      } else if (key === 'z') {
        event.preventDefault();
        undo();
      } else if (key === 'y') {
        event.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <Panel position="top-center" className="history-controls">
      <button type="button" className="graph-io__button" onClick={undo} disabled={!canUndo}>
        Undo
      </button>
      <button type="button" className="graph-io__button" onClick={redo} disabled={!canRedo}>
        Redo
      </button>
    </Panel>
  );
}
