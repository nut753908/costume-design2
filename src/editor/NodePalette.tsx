import { useCallback, useMemo, useRef } from 'react';
import { Panel, useReactFlow } from '@xyflow/react';
import { nodeTypeRegistry } from '../nodes/registry';
import { useGraphStore } from '../state/graphStore';
import type { NodeCategory } from '../nodes/types';

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  input: 'Inputs',
  generator: 'Generators',
  material: 'Materials',
  output: 'Outputs',
};

const CATEGORY_ORDER: NodeCategory[] = ['input', 'generator', 'material', 'output'];

export function NodePalette() {
  const addNode = useGraphStore((s) => s.addNode);
  const { screenToFlowPosition } = useReactFlow();
  const cascadeRef = useRef(0);

  const groups = useMemo(() => {
    const byCategory = new Map<NodeCategory, { type: string; label: string }[]>();
    for (const def of nodeTypeRegistry.values()) {
      const list = byCategory.get(def.category) ?? [];
      list.push({ type: def.type, label: def.label });
      byCategory.set(def.category, list);
    }
    return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((c) => ({
      category: c,
      items: byCategory.get(c)!,
    }));
  }, []);

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
