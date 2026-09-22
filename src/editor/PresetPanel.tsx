import { useState } from 'react';
import { Panel, type Node, type Edge } from '@xyflow/react';
import { useGraphStore } from '../state/graphStore';
import { usePresetStore } from '../state/presetStore';
import { validateGraph, GRAPH_VALIDATION_MESSAGES } from '../state/validateGraph';
import { initialNodes, initialEdges } from '../state/initialGraph';
import { getNodeType } from '../nodes/registry';
import type { GroupNodeData } from '../nodes/definitions/groupNodeFactory';
import {
  fingerprintGroupStructure,
  getGroupTemplateFingerprint,
  isGroupInstanceStale,
  migrateGroupToTemplate,
} from '../nodes/groupTemplate';

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
  const loadGroupGraph = useGraphStore((s) => s.loadGroupGraph);
  const migrateCurrentGroupToTemplate = useGraphStore((s) => s.migrateCurrentGroupToTemplate);
  // 今開いているグループを実体化した時点のテンプレートの指紋(親ノードの data に記録されている)。
  const storedFingerprint = useGraphStore((s) => {
    const frame = s.scopeStack[s.scopeStack.length - 1];
    return (frame?.nodes.find((n) => n.id === frame.parentId)?.data as { templateFingerprint?: string } | undefined)
      ?.templateFingerprint;
  });
  // グループの中に入っている間は、直近のフレームの親ノード(=今開いているグループ)の型が scope。
  const scope = useGraphStore((s) => {
    const frame = s.scopeStack[s.scopeStack.length - 1];
    if (!frame) return undefined;
    return frame.nodes.find((n) => n.id === frame.parentId)?.type ?? '';
  });
  const groupStale =
    scope !== undefined &&
    isGroupInstanceStale(scope, {
      nodes: nodes.map((n) => ({ id: n.id, type: n.type ?? '', data: n.data })),
      edges: edges.map((e) => ({ source: e.source, sourceHandle: e.sourceHandle, target: e.target, targetHandle: e.targetHandle })),
      templateFingerprint: storedFingerprint,
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
    const fingerprint =
      scope === undefined
        ? undefined
        : (storedFingerprint ??
          fingerprintGroupStructure(
            nodes.map((n) => ({ id: n.id, type: n.type ?? '', data: n.data })),
            edges.map((e) => ({ source: e.source, sourceHandle: e.sourceHandle, target: e.target, targetHandle: e.targetHandle })),
          ));
    savePreset(trimmed, nodes, edges, scope, fingerprint);
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
        loadGroupGraph((template.nodes ?? []) as Node[], (template.edges ?? []) as Edge[], template.templateFingerprint);
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
    if (scope === undefined) {
      loadGraph(preset.nodes, preset.edges);
      return;
    }
    // グループの内部プリセット: 保存時のテンプレートが現在のテンプレートと構造が違えば、
    // 値を引き継いで最新のテンプレートへ更新して読み込むかを選べる。
    const savedFingerprint =
      preset.templateFingerprint ??
      fingerprintGroupStructure(
        preset.nodes.map((n) => ({ id: n.id, type: n.type ?? '', data: n.data })),
        preset.edges.map((e) => ({ source: e.source, sourceHandle: e.sourceHandle, target: e.target, targetHandle: e.targetHandle })),
      );
    const currentFingerprint = getGroupTemplateFingerprint(scope);
    if (currentFingerprint !== undefined && savedFingerprint !== currentFingerprint) {
      if (
        confirm(
          'このプリセットは古いバージョンのテンプレートから作られています。\nOK: 値(数値・色)を引き継いで最新のテンプレートへ更新して読み込む\nキャンセル: 保存されたままの内部構造で読み込む',
        )
      ) {
        const migrated = migrateGroupToTemplate(
          scope,
          preset.nodes.map((n) => ({ id: n.id, type: n.type ?? '', data: n.data })),
        );
        loadGroupGraph(migrated.nodes as unknown as Node[], migrated.edges as unknown as Edge[], migrated.templateFingerprint);
        return;
      }
    }
    loadGroupGraph(preset.nodes, preset.edges, savedFingerprint);
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
    <Panel position="bottom-center" className="preset-panel">
      {groupStale && (
        <div className="preset-panel__stale">
          このグループのテンプレートが更新されています。
          <button
            type="button"
            className="graph-io__button"
            onClick={() => {
              if (confirm('内部構造を最新のテンプレートへ更新します(数値・色の値は引き継ぎます)。配線の編集は失われます。よろしいですか?')) {
                migrateCurrentGroupToTemplate();
              }
            }}
          >
            テンプレートへ更新
          </button>
        </div>
      )}
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
