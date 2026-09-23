import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react';
import { useReactFlow, useStoreApi } from '@xyflow/react';
import { groupNodeTypesBySection } from '../nodes/registry';
import { useGraphStore } from '../state/graphStore';
import type { PaletteSection } from '../nodes/types';
import { SECTION_LABELS, NODE_TYPE_DND_MIME, loadCollapsedSections, saveCollapsedSections } from './paletteShared';

export function NodePalette() {
  const addNode = useGraphStore((s) => s.addNode);
  const insideGroup = useGraphStore((s) => s.scopeStack.length > 0);
  const { screenToFlowPosition } = useReactFlow();
  const flowStore = useStoreApi();
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
  const groups = useMemo(() => groupNodeTypesBySection({ includeGroupIO: insideGroup }), [insideGroup]);

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
      const step = cascadeRef.current % 4;
      cascadeRef.current += 1;
      // パネル類(四隅と上下端)に重ならないよう、左のパレット列の右端から右端までの中央を起点にする
      // (ペインが狭いと、パレットが左側の大半を占めてペイン全体の中央にかかるため)。ノードの左上が
      // この位置に来るため、カードのおおよそ半分(フロー座標で 90x40)だけ左上へずらしておく。
      // ペインは幅600px前後と狭いため、拡大表示でもカード(幅約180)が右端を越えないよう x を抑える。
      const { domNode: paneEl, transform } = flowStore.getState();
      const zoom = transform[2];
      const rect = paneEl?.getBoundingClientRect();
      if (!rect) return;
      const left = paneEl?.querySelector('.panel-stack--left')?.getBoundingClientRect().right ?? rect.left;
      const x = Math.max(left + 8, Math.min((left + rect.right) / 2 - 90 * zoom + step * 24, rect.right - 8 - 180 * zoom));
      const position = screenToFlowPosition({
        x,
        y: rect.top + rect.height / 2 - 40 * zoom + step * 24,
      });
      addNode(type, position);
    },
    [addNode, screenToFlowPosition, flowStore],
  );

  const handleDragStart = useCallback((event: DragEvent, type: string) => {
    event.dataTransfer.setData(NODE_TYPE_DND_MIME, type);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <div className="node-palette">
      <input
        className="node-palette__search"
        type="text"
        placeholder="ノードを検索..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="node-palette__list">
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
      </div>
    </div>
  );
}
