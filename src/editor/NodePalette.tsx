import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react';
import { Panel, useReactFlow } from '@xyflow/react';
import { groupNodeTypesBySection } from '../nodes/registry';
import { useGraphStore } from '../state/graphStore';
import type { PaletteSection } from '../nodes/types';
import { SECTION_LABELS, NODE_TYPE_DND_MIME, loadCollapsedSections, saveCollapsedSections } from './paletteShared';

export function NodePalette() {
  const addNode = useGraphStore((s) => s.addNode);
  const insideGroup = useGraphStore((s) => s.scopeStack.length > 0);
  const { screenToFlowPosition } = useReactFlow();
  const cascadeRef = useRef(0);
  const [filter, setFilter] = useState('');
  const [collapsed, setCollapsed] = useState<Set<PaletteSection>>(loadCollapsedSections);

  const toggleSection = useCallback((section: PaletteSection) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(section)) next.add(section);
      saveCollapsedSections(next);
      return next;
    });
  }, []);

  // Group Input/Output(category: 'group-io')はグループの中に入っている間だけ意味を持つ
  // (グループ本体の外部ソケット構成を定義するノードのため)。トップレベルでは隠す。
  const groups = useMemo(
    () => groupNodeTypesBySection().filter((g) => insideGroup || g.section !== 'group-io'),
    [insideGroup],
  );

  const normalizedFilter = filter.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    if (!normalizedFilter) return groups;
    return groups
      .map(({ section, items }) => ({
        section,
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
      {filteredGroups.map(({ section, items }) => {
        // 検索中は一致した項目を見つけやすいよう、折りたたみに関わらず全て開く
        const open = normalizedFilter !== '' || !collapsed.has(section);
        return (
          <div key={section} className="node-palette__group">
            <button
              type="button"
              className="node-palette__group-title"
              aria-expanded={open}
              onClick={() => toggleSection(section)}
            >
              {open ? '▾' : '▸'} {SECTION_LABELS[section]} ({items.length})
            </button>
            {open &&
              items.map((item) => (
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
        );
      })}
    </Panel>
  );
}
