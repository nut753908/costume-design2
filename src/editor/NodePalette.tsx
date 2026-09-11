import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react';
import { Panel, useReactFlow } from '@xyflow/react';
import { groupNodeTypesByCategory } from '../nodes/registry';
import { useGraphStore } from '../state/graphStore';
import { CATEGORY_LABELS, NODE_TYPE_DND_MIME } from './paletteShared';

export function NodePalette() {
  const addNode = useGraphStore((s) => s.addNode);
  const insideGroup = useGraphStore((s) => s.scopeStack.length > 0);
  const { screenToFlowPosition } = useReactFlow();
  const cascadeRef = useRef(0);
  const [filter, setFilter] = useState('');

  // Group Input/Output(category: 'group-io')はグループの中に入っている間だけ意味を持つ
  // (グループ本体の外部ソケット構成を定義するノードのため)。トップレベルでは隠す。
  const groups = useMemo(
    () => groupNodeTypesByCategory().filter((g) => insideGroup || g.category !== 'group-io'),
    [insideGroup],
  );

  const normalizedFilter = filter.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    if (!normalizedFilter) return groups;
    return groups
      .map(({ category, items }) => ({
        category,
        items: items.filter((item) => item.label.toLowerCase().includes(normalizedFilter)),
      }))
      .filter(({ items }) => items.length > 0);
  }, [groups, normalizedFilter]);

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
      <input
        className="node-palette__search"
        type="text"
        placeholder="ノードを検索..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {filteredGroups.length === 0 && <div className="node-palette__empty">見つかりません</div>}
      {filteredGroups.map(({ category, items }) => (
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
