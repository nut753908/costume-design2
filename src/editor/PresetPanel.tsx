import { useState } from 'react';
import { Panel } from '@xyflow/react';
import { useGraphStore } from '../state/graphStore';
import { usePresetStore } from '../state/presetStore';

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
    const preset = presets.find((p) => p.id === selectedId);
    if (preset) loadGraph(preset.nodes, preset.edges);
  };

  const handleDelete = () => {
    if (!selectedId) return;
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
