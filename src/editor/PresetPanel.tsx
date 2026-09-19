import { useState } from 'react';
import { Panel, type Node, type Edge } from '@xyflow/react';
import { useGraphStore } from '../state/graphStore';
import { usePresetStore } from '../state/presetStore';
import { validateGraph, GRAPH_VALIDATION_MESSAGES } from '../state/validateGraph';
import { initialNodes, initialEdges } from '../state/initialGraph';
import { getNodeType } from '../nodes/registry';
import type { GroupNodeData } from '../nodes/definitions/groupNodeFactory';

/** ユーザーが保存したプリセットとは別に、常にドロップダウンの先頭に固定表示する
 * 「初期状態(デフォルト)」の擬似プリセットID。usePresetStore には保存せず、
 * initialGraph.ts の initialNodes/initialEdges をその場で参照する。 */
const INITIAL_PRESET_ID = '__initial__';

/** 現在開いている階層のグラフをブラウザ内に名前付きで保存し、あとで読み込み/削除できるパネル。
 * トップレベルではグラフ全体、グループの中に入っている間はそのグループの内部グラフだけを
 * 対象にし、同じ型のグループ(例: `skirtGroup`)のプリセットだけが一覧に出る(`Preset.scope`)。
 * 同名で保存すると同じ階層のプリセットを上書きする。グループの中では「初期状態(デフォルト)」が
 * そのグループ型のテンプレートになる(内部編集を捨ててテンプレートへ戻す用途を兼ねる)。 */
export function PresetPanel() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const loadGraph = useGraphStore((s) => s.loadGraph);
  // グループの中に入っている間は、直近のフレームの親ノード(=今開いているグループ)の型が scope。
  const scope = useGraphStore((s) => {
    const frame = s.scopeStack[s.scopeStack.length - 1];
    if (!frame) return undefined;
    return frame.nodes.find((n) => n.id === frame.parentId)?.type ?? '';
  });
  const allPresets = usePresetStore((s) => s.presets);
  const presets = allPresets.filter((p) => p.scope === scope);
  const savePreset = usePresetStore((s) => s.savePreset);
  const deletePreset = usePresetStore((s) => s.deletePreset);

  const [name, setName] = useState('');
  const [selectedId, setSelectedId] = useState('');
  // 階層を移動して一覧から消えたプリセットを選択したままにしない。
  const validSelectedId = selectedId === INITIAL_PRESET_ID || presets.some((p) => p.id === selectedId) ? selectedId : '';

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    savePreset(trimmed, nodes, edges, scope);
    setName('');
  };

  const handleLoad = () => {
    if (validSelectedId === INITIAL_PRESET_ID) {
      // initialNodes/initialEdges は initialGraph.test.ts で常に検証済みのため、
      // ここで改めて validateGraph は通さない。グループの中ではそのグループ型のテンプレート。
      const label = scope === undefined ? '初期状態' : 'このグループのテンプレート';
      if (!confirm(`現在のグラフを破棄して${label}を読み込みます。この操作は元に戻せません。よろしいですか?`)) {
        return;
      }
      if (scope === undefined) {
        loadGraph(initialNodes, initialEdges);
      } else {
        const template = getNodeType(scope).createDefaultData() as GroupNodeData;
        loadGraph((template.nodes ?? []) as Node[], (template.edges ?? []) as Edge[]);
      }
      return;
    }

    const preset = presets.find((p) => p.id === validSelectedId);
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
    if (!validSelectedId || validSelectedId === INITIAL_PRESET_ID) return;
    const preset = presets.find((p) => p.id === validSelectedId);
    if (!confirm(`プリセット「${preset?.name ?? ''}」を削除します。この操作は元に戻せません。よろしいですか?`)) {
      return;
    }
    deletePreset(validSelectedId);
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
        value={validSelectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        <option value="">プリセットを選択...</option>
        <option value={INITIAL_PRESET_ID}>{scope === undefined ? '初期状態(デフォルト)' : 'テンプレート(デフォルト)'}</option>
        {presets.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button type="button" className="graph-io__button" onClick={handleLoad} disabled={!validSelectedId}>
        Load
      </button>
      <button type="button" className="graph-io__button" onClick={handleDelete} disabled={!validSelectedId}>
        Delete
      </button>
    </Panel>
  );
}
