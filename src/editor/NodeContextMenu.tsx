import { useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useGraphStore } from '../state/graphStore';
import { useDismissMenu } from './useDismissMenu';

export interface NodeContextMenuState {
  x: number;
  y: number;
}

interface NodeContextMenuProps {
  state: NodeContextMenuState | null;
  onClose: () => void;
}

/** ノードを右クリックした位置に表示し、現在選択中のノード(複数選択中ならその全体)に対して
 * 複製/コピー/削除を行うメニュー。どのノードを対象にするか(右クリックしたノード単体か、
 * 既存の複数選択かの判定)は NodeEditor 側の onNodeContextMenu で選択状態に反映済みなので、
 * ここでは常に「今選択されているノード」に対して作用すればよい。 */
export function NodeContextMenu({ state, onClose }: NodeContextMenuProps) {
  const nodes = useGraphStore((s) => s.nodes);
  const duplicateSelected = useGraphStore((s) => s.duplicateSelected);
  const copySelected = useGraphStore((s) => s.copySelected);
  const { deleteElements } = useReactFlow();
  const menuRef = useRef<HTMLDivElement>(null);

  useDismissMenu(!!state, menuRef, onClose);

  if (!state) return null;

  const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id);
  const suffix = selectedIds.length > 1 ? ` (${selectedIds.length}個)` : '';

  const handleDuplicate = () => {
    duplicateSelected();
    onClose();
  };

  const handleCopy = () => {
    copySelected();
    onClose();
  };

  const handleDelete = () => {
    deleteElements({ nodes: selectedIds.map((id) => ({ id })) });
    onClose();
  };

  return (
    <div ref={menuRef} className="context-menu nodrag nopan" style={{ left: state.x, top: state.y }}>
      <button type="button" className="context-menu__item" onClick={handleDuplicate}>
        複製{suffix}
      </button>
      <button type="button" className="context-menu__item" onClick={handleCopy}>
        コピー{suffix}
      </button>
      <button type="button" className="context-menu__item context-menu__item--danger" onClick={handleDelete}>
        削除{suffix}
      </button>
    </div>
  );
}
