import { useState } from 'react';
import { Panel } from '@xyflow/react';
import { useGraphStore } from '../state/graphStore';
import { usePresetStore } from '../state/presetStore';
import { validateGraph, GRAPH_VALIDATION_MESSAGES } from '../state/validateGraph';
import { initialNodes, initialEdges } from '../state/initialGraph';

/** ユーザーが保存したプリセットとは別に、常にドロップダウンの先頭に固定表示する
 * 「初期状態(デフォルト)」の擬似プリセットID。usePresetStore には保存せず、
 * initialGraph.ts の initialNodes/initialEdges をその場で参照する。 */
const INITIAL_PRESET_ID = '__initial__';

/** 現在のグラフをブラウザ内に名前付きで保存し、あとで読み込み/削除できるパネル。
 * 同名で保存すると上書きになる。 */
export function PresetPanel() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const loadGraph = useGraphStore((s) => s.loadGraph);
  const presets = usePresetStore((s) => s.presets);
  const savePreset = usePresetStore((s) => s.savePreset);
  const deletePreset = usePresetStore((s) => s.deletePreset);

  const [name, setName] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    savePreset(trimmed, nodes, edges);
    setName('');
  };

  const handleLoad = () => {
    if (selectedId === INITIAL_PRESET_ID) {
      // initialNodes/initialEdges は initialGraph.test.ts で常に検証済みのため、
      // ここで改めて validateGraph は通さない。
      if (!confirm('現在のグラフを破棄して初期状態を読み込みます。この操作は元に戻せません。よろしいですか?')) {
        return;
      }
      loadGraph(initialNodes, initialEdges);
      return;
    }

    const preset = presets.find((p) => p.id === selectedId);
    if (!preset) return;
    // 保存時点では有効だったグラフでも、その後のアプリ更新でノードタイプが削除された場合
    // などにここで無効化されうる。GraphIO の Import JSON と同じ検証ゲートを通す。
    const error = validateGraph(preset.nodes, preset.edges);
    if (error) {
      alert(`このプリセットは読み込めません(${GRAPH_VALIDATION_MESSAGES[error]})。`);
      return;
    }
    // loadGraph() は履歴(past/future)も一緒にクリアするため、読み込み後は
    // Undo で現在のグラフに戻せない。取り返しがつかない操作である旨を確認する。
    if (!confirm(`現在のグラフを破棄して「${preset.name}」を読み込みます。この操作は元に戻せません。よろしいですか?`)) {
      return;
    }
    loadGraph(preset.nodes, preset.edges);
  };

  const handleDelete = () => {
    if (!selectedId || selectedId === INITIAL_PRESET_ID) return;
    const preset = presets.find((p) => p.id === selectedId);
    if (!confirm(`プリセット「${preset?.name ?? ''}」を削除します。この操作は元に戻せません。よろしいですか?`)) {
      return;
    }
    deletePreset(selectedId);
    setSelectedId('');
  };

  return (
    <Panel position="bottom-right" className="preset-panel">
      <input
        className="preset-panel__input"
        type="text"
        placeholder="プリセット名"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="button" className="graph-io__button" onClick={handleSave} disabled={!name.trim()}>
        Save Preset
      </button>
      <select
        className="preset-panel__select"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        <option value="">プリセットを選択...</option>
        <option value={INITIAL_PRESET_ID}>初期状態(デフォルト)</option>
        {presets.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button type="button" className="graph-io__button" onClick={handleLoad} disabled={!selectedId}>
        Load
      </button>
      <button type="button" className="graph-io__button" onClick={handleDelete} disabled={!selectedId}>
        Delete
      </button>
    </Panel>
  );
}
