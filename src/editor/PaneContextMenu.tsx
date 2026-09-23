import { useRef, type RefObject } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useGraphStore } from '../state/graphStore';
import { useDismissMenu } from './useDismissMenu';
import { useClampMenuPosition } from './useClampMenuPosition';

export interface PaneContextMenuState {
  x: number;
  y: number;
}

interface PaneContextMenuProps {
  state: PaneContextMenuState | null;
  onClose: () => void;
  boundsRef: RefObject<HTMLElement | null>;
}

/** キャンバスの背景を右クリックした位置に表示し、コピーしたノードをその位置に貼り付けるメニュー。 */
export function PaneContextMenu({ state, onClose, boundsRef }: PaneContextMenuProps) {
  const pasteClipboard = useGraphStore((s) => s.pasteClipboard);
  const clipboardCount = useGraphStore((s) => s.clipboard?.nodes.length ?? 0);
  const { screenToFlowPosition } = useReactFlow();
  const menuRef = useRef<HTMLDivElement>(null);

  useDismissMenu(!!state, menuRef, onClose);
  const pos = useClampMenuPosition(menuRef, boundsRef, state);

  if (!state || !pos) return null;

  const handlePaste = () => {
    pasteClipboard(screenToFlowPosition({ x: state.x, y: state.y }));
    onClose();
  };

  return (
    <div ref={menuRef} className="context-menu nodrag nopan" style={{ left: pos.x, top: pos.y }}>
      <button type="button" className="context-menu__item" onClick={handlePaste} disabled={clipboardCount === 0}>
        貼り付け{clipboardCount > 1 ? ` (${clipboardCount}個)` : ''}
      </button>
    </div>
  );
}
