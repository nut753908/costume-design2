import { useMemo, useState } from 'react';
import { useGraphStore } from '../state/graphStore';
import { useRootGraphLite } from '../state/selectors';
import { isMeshVisible, listSceneOutputs, useViewStore } from '../state/viewStore';

/** 3Dビューに描画されているメッシュ(`sceneOutput`)の一覧。各行の S(単独表示)/H(非表示)で
 * 表示を切り替える(グループカードの同名ボタンと同じ `state/viewStore.ts` の状態)。
 * どのメッシュが描画されているかを、ノードグラフを探し回らずに確認できる。 */
export function SceneOutputPanel() {
  const [open, setOpen] = useState(true);
  const { nodes } = useRootGraphLite();
  const results = useGraphStore((s) => s.rootEvaluatedResults);
  const rows = useMemo(() => listSceneOutputs(nodes, results), [nodes, results]);
  const hidden = useViewStore((s) => s.hidden);
  const solo = useViewStore((s) => s.solo);
  const toggleSolo = useViewStore((s) => s.toggleSolo);
  const toggleHidden = useViewStore((s) => s.toggleHidden);
  const reset = useViewStore((s) => s.reset);
  const filtered = solo.size > 0 || hidden.size > 0;

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        right: 12,
        minWidth: 160,
        maxHeight: 'calc(100% - 48px)',
        overflowY: 'auto',
        fontSize: 12,
        padding: '4px 8px',
        borderRadius: 4,
        background: 'rgba(253, 250, 244, 0.95)',
        border: '1px solid #999',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontWeight: 600 }}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          style={{ all: 'unset', cursor: 'pointer' }}
        >
          {open ? '▾' : '▸'} Scene Outputs ({rows.length})
        </button>
        {filtered && (
          <button type="button" onClick={reset}>
            すべて表示
          </button>
        )}
      </div>
      {open && (
        <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: 0 }}>
          {rows.map((row) => {
            const visible = isMeshVisible({ hidden, solo }, row.key);
            return (
              <li key={row.key} data-key={row.key} style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: visible ? 1 : 0.45 }}>
                <button
                  type="button"
                  className={`rf-node__view-toggle${solo.has(row.key) ? ' rf-node__view-toggle--on' : ''}`}
                  title="このメッシュだけを表示(もう一度で解除)"
                  aria-label={`${row.label} を単独表示`}
                  aria-pressed={solo.has(row.key)}
                  onClick={() => toggleSolo([row.key])}
                >
                  S
                </button>
                <button
                  type="button"
                  className={`rf-node__view-toggle${hidden.has(row.key) ? ' rf-node__view-toggle--on' : ''}`}
                  title="このメッシュを非表示(もう一度で再表示)"
                  aria-label={`${row.label} を非表示`}
                  aria-pressed={hidden.has(row.key)}
                  onClick={() => toggleHidden([row.key])}
                >
                  H
                </button>
                <span>{row.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
