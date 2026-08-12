import { useCallback, useMemo, useRef, type DragEvent } from 'react';
import { Panel, useReactFlow } from '@xyflow/react';
import { groupNodeTypesByCategory } from '../nodes/registry';
import { useGraphStore } from '../state/graphStore';
import { CATEGORY_LABELS, NODE_TYPE_DND_MIME } from './paletteShared';

export function NodePalette() {
  const addNode = useGraphStore((s) => s.addNode);
  const { screenToFlowPosition } = useReactFlow();
  const cascadeRef = useRef(0);

  const groups = useMemo(() => groupNodeTypesByCategory(), []);

  const handleAdd = useCallback(
    (type: string) => {
      const step = cascadeRef.current % 8;
      cascadeRef.current += 1;
      const position = screenToFlowPosition({ x: 360 + step * 24, y: 40 + step * 24 });
      addNode(type, position);
    },
    [addNode, screenToFlowPosition],
  );

  const handleDragStart = useCallback((event: DragEvent, type: string) => {
    event.dataTransfer.setData(NODE_TYPE_DND_MIME, type);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <Panel position="top-left" className="node-palette">
      {groups.map(({ category, items }) => (
        <div key={category} className="node-palette__group">
          <div className="node-palette__group-title">{CATEGORY_LABELS[category]}</div>
          {items.map((item) => (
            <button
              key={item.type}
              type="button"
              className="node-palette__item"
              draggable
              onDragStart={(event) => handleDragStart(event, item.type)}
              onClick={() => handleAdd(item.type)}
            >
              + {item.label}
            </button>
          ))}
        </div>
      ))}
    </Panel>
  );
}
