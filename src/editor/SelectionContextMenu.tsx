import { useRef, type RefObject } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useGraphStore } from '../state/graphStore';
import { useDismissMenu } from './useDismissMenu';
import { useClampMenuPosition } from './useClampMenuPosition';

export interface SelectionContextMenuState {
  x: number;
  y: number;
  /** エッジを右クリックして開いたときは削除だけを出す。 */
  edgeOnly?: boolean;
}

interface SelectionContextMenuProps {
  state: SelectionContextMenuState | null;
  onClose: () => void;
  boundsRef: RefObject<HTMLElement | null>;
}

/** ノード/エッジ/範囲選択を右クリックした位置に表示し、現在選択中のノードとエッジに対して
 * 複製/コピー/削除を行うメニュー。どれを対象にするか(右クリックした要素単体か、既存の選択全体か)は
 * NodeEditor 側で選択状態に反映済みなので、ここでは常に「今選択されているもの」に作用すればよい。
 * 複製/コピーはノード単位(内部エッジはノードに付いてくる)のため、ノードが無ければ無効にし、
 * エッジの右クリックでは出さない。 */
export function SelectionContextMenu({ state, onClose, boundsRef }: SelectionContextMenuProps) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const duplicateSelected = useGraphStore((s) => s.duplicateSelected);
  const copySelected = useGraphStore((s) => s.copySelected);
  const { deleteElements } = useReactFlow();
  const menuRef = useRef<HTMLDivElement>(null);

  useDismissMenu(!!state, menuRef, onClose);
  const pos = useClampMenuPosition(menuRef, boundsRef, state);

  if (!state || !pos) return null;

  const selectedNodeIds = nodes.filter((n) => n.selected).map((n) => n.id);
  // 範囲選択は選択ノードにつながる(片側だけの)エッジも選択状態にするが、それらはノードの削除で
  // どのみち消えるため、件数表示と削除対象には選択ノードに触れないエッジだけを数える。
  const nodeIdSet = new Set(selectedNodeIds);
  const selectedEdgeIds = edges
    .filter((e) => e.selected && !nodeIdSet.has(e.source) && !nodeIdSet.has(e.target))
    .map((e) => e.id);
  const nodeSuffix = selectedNodeIds.length > 1 ? ` (${selectedNodeIds.length}個)` : '';
  const counts = [
    selectedNodeIds.length > 0 && `ノード${selectedNodeIds.length}個`,
    selectedEdgeIds.length > 0 && `エッジ${selectedEdgeIds.length}本`,
  ].filter(Boolean);
  const deleteSuffix =
    selectedNodeIds.length + selectedEdgeIds.length > 1 ? ` (${counts.join('・')})` : '';
  const hasNodes = selectedNodeIds.length > 0;

  const handleDuplicate = () => {
    duplicateSelected();
    onClose();
  };

  const handleCopy = () => {
    copySelected();
    onClose();
  };

  const handleDelete = () => {
    deleteElements({
      nodes: selectedNodeIds.map((id) => ({ id })),
      edges: selectedEdgeIds.map((id) => ({ id })),
    });
    onClose();
  };

  return (
    <div ref={menuRef} className="context-menu nodrag nopan" style={{ left: pos.x, top: pos.y }}>
      {!state.edgeOnly && (
        <>
          <button type="button" className="context-menu__item" onClick={handleDuplicate} disabled={!hasNodes}>
            複製{nodeSuffix}
          </button>
          <button type="button" className="context-menu__item" onClick={handleCopy} disabled={!hasNodes}>
            コピー{nodeSuffix}
          </button>
        </>
      )}
      <button type="button" className="context-menu__item context-menu__item--danger" onClick={handleDelete}>
        削除{deleteSuffix}
      </button>
    </div>
  );
}
