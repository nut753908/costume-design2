import { useMemo, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { groupNodeTypesByCategory } from '../nodes/registry';
import { useGraphStore } from '../state/graphStore';
import { CATEGORY_LABELS } from './paletteShared';
import { useDismissMenu } from './useDismissMenu';

export interface ContextMenuState {
  x: number;
  y: number;
}

interface ContextMenuProps {
  state: ContextMenuState | null;
  onClose: () => void;
}

/** キャンバスを右クリックした位置に表示し、選んだノードタイプをその位置に追加するメニュー。 */
export function ContextMenu({ state, onClose }: ContextMenuProps) {
  const addNode = useGraphStore((s) => s.addNode);
  const insideGroup = useGraphStore((s) => s.scopeStack.length > 0);
  const { screenToFlowPosition } = useReactFlow();
  const menuRef = useRef<HTMLDivElement>(null);
  // Group Input/Output(category: 'group-io')はグループの中に入っている間だけ意味を持つ
  // ため、トップレベルでは隠す(editor/NodePalette.tsx と同じ理由)。
  const groups = useMemo(
    () => groupNodeTypesByCategory().filter((g) => insideGroup || g.category !== 'group-io'),
    [insideGroup],
  );

  useDismissMenu(!!state, menuRef, onClose);

  if (!state) return null;

  const handleAdd = (type: string) => {
    const position = screenToFlowPosition({ x: state.x, y: state.y });
    addNode(type, position);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="context-menu nodrag nopan"
      style={{ left: state.x, top: state.y }}
    >
      {groups.map(({ category, items }) => (
        <div key={category} className="context-menu__group">
          <div className="context-menu__group-title">{CATEGORY_LABELS[category]}</div>
          {items.map((item) => (
            <button
              key={item.type}
              type="button"
              className="context-menu__item"
              onClick={() => handleAdd(item.type)}
            >
              + {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
