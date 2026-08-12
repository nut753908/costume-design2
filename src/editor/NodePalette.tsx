import { useCallback, useMemo, useRef } from 'react';
import { Panel, useReactFlow } from '@xyflow/react';
import { groupNodeTypesByCategory } from '../nodes/registry';
import { useGraphStore } from '../state/graphStore';
import { CATEGORY_LABELS } from './nodeCategoryLabels';

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
