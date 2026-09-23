import { useRef, type ChangeEvent } from 'react';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';
import { useGraphStore } from '../state/graphStore';
import { validateGraph, GRAPH_VALIDATION_MESSAGES } from '../state/validateGraph';
import { fitViewPadding } from './paletteShared';

interface GraphFile {
  nodes: Node[];
  edges: Edge[];
}

function hasGraphShape(value: unknown): value is GraphFile {
  if (typeof value !== 'object' || value === null) return false;
  const { nodes, edges } = value as Record<string, unknown>;
  return Array.isArray(nodes) && Array.isArray(edges);
}

/** グラフ全体を JSON ファイルとして書き出し/読み込みする。読み込んだ内容は
 * validateGraph()(未知のノードタイプ・循環の有無)を通してから loadGraph() に渡す —
 * さもないと次の描画で evaluateGraph() が例外を投げてグラフが評価不能になるため。 */
export function GraphIO() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const loadGraph = useGraphStore((s) => s.loadGraph);
  const autoLayout = useGraphStore((s) => s.autoLayout);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fitView } = useReactFlow();

  const handleAutoLayout = () => {
    autoLayout();
    // ノードの新しい位置が React Flow 内部ストアに反映されてから fitView するため1フレーム待つ。
    requestAnimationFrame(() => fitView({ padding: fitViewPadding(), duration: 300 }));
  };

  const handleExport = () => {
    const file: GraphFile = { nodes, edges };
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'costume-design.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!hasGraphShape(parsed)) {
        alert('無効なグラフファイルです(nodes/edges の形式が不正です)。');
        return;
      }
      const error = validateGraph(parsed.nodes, parsed.edges);
      if (error) {
        alert(`無効なグラフファイルです(${GRAPH_VALIDATION_MESSAGES[error]})。`);
        return;
      }
      loadGraph(parsed.nodes, parsed.edges);
    } catch {
      alert('JSON の読み込みに失敗しました。');
    }
  };

  return (
    <div className="graph-io">
      <button type="button" className="graph-io__button" onClick={handleExport}>
        Export JSON
      </button>
      <button type="button" className="graph-io__button" onClick={handleImportClick}>
        Import JSON
      </button>
      <button type="button" className="graph-io__button" onClick={handleAutoLayout}>
        Arrange
      </button>
      <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileChange} />
    </div>
  );
}
