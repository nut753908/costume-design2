import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import type { EvaluatedGraph } from '../nodes/evaluateGraph';
import { getNodeType } from '../nodes/registry';
import { resolveNodeSockets } from '../nodes/resolveNodeSockets';
import { computeAutoLayout } from '../nodes/autoLayout';
import { initialNodes, initialEdges } from './initialGraph';
import { composeRootGraph, type ScopeFrame } from './composeRootGraph';
import { validateGraph } from './validateGraph';
import { migrateGroupToTemplate } from '../nodes/groupTemplate';

/** localStorage の永続化キー。persist の name とErrorBoundaryのリセット処理(main.tsx)の
 * 両方から参照するため、値のドリフトを避けて1箇所にまとめる。 */
export const GRAPH_STORAGE_KEY = 'costume-design-graph';

/** 復元時の検証に失敗した保存データの退避先(`persist` の `merge` 参照)。 */
export const GRAPH_BACKUP_STORAGE_KEY = 'costume-design-graph-invalid-backup';

/** `scopeStack` も含めるのは、`removeGroupIOSocket`(親階層の外部エッジ)が
 * 今開いている階層の外側にも書き込むため。
 * 履歴は階層の移動でクリアされるので、復元しても今いる階層は変わらない。 */
interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
  scopeStack: ScopeFrame[];
}

const HISTORY_LIMIT = 100;
/** スライダー/カラーピッカーのドラッグ中に連続発火する updateNodeData 呼び出しを
 * 1回のUndo単位にまとめるための猶予時間。この時間内に同じキーで再度呼ばれた場合は
 * 新しい履歴エントリを積まず、直前のジェスチャーの続きとみなす。 */
const COALESCE_MS = 500;
/** 配線付きノードの削除では、React Flow が接続エッジの削除(`onEdgesChange`)とノード自身の削除
 * (`onNodesChange`)を続けて呼ぶ。この2回を1件の履歴にまとめるための統合時間。 */
const REMOVE_COALESCE_MS = 50;

interface Clipboard {
  nodes: Node[];
  edges: Edge[];
}

/** グループノードの `data` に想定する最小限の形。`nodes/definitions/groupNodeFactory.ts`
 * の `GroupNodeData` のスーパーセットだが、`state/` レイヤーは `nodes/definitions/` の
 * 特定ファイルには依存しないよう、ここでは構造的な形だけを見る。 */
interface GroupNodeDataShape extends Record<string, unknown> {
  nodes?: Node[];
  edges?: Edge[];
}

interface GraphState {
  nodes: Node[];
  edges: Edge[];
  evaluatedResults: EvaluatedGraph | null;
  /** トップレベル視点で合成した完全なグラフの評価結果(`state/useRootEvaluatedGraph.ts` が
   * 書き込む)。`Garments.tsx` の3D描画はこちらを見るため、グループの中に入っている間も
   * 他の全ガーメントが描画され続ける。`evaluatedResults` は今開いている階層の評価結果の
   * ままで(ノードカード上のリアルタイム値表示用)、無改修で残す。 */
  rootEvaluatedResults: EvaluatedGraph | null;
  /** グループの中に入るたびに積まれる、上位階層のスナップショット。空ならトップレベル。 */
  scopeStack: ScopeFrame[];
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  /** 直近の履歴プッシュを識別するキーとタイムスタンプ(コアレッシング用の内部状態)。 */
  _historyKey: string | null;
  _historyAt: number;
  /** ノードのドラッグ中かどうか(ドラッグ開始時にのみ履歴を1件積むため)。 */
  _dragging: boolean;
  /** コピーしたノード/エッジ(選択範囲の内部エッジのみ)。 */
  clipboard: Clipboard | null;
  /** 同じクリップボードから連続でペーストした回数。ペースト位置をカスケード
   * オフセットするために使い、コピーのたびに 0 にリセットされる。 */
  _pasteCount: number;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  setEvaluatedResults: (results: EvaluatedGraph) => void;
  setRootEvaluatedResults: (results: EvaluatedGraph) => void;
  addNode: (type: string, position: { x: number; y: number }) => void;
  loadGraph: (nodes: Node[], edges: Edge[]) => void;
  /** グループの中に入っている間、今開いているグループの内部グラフを差し替える(プリセット/
   * テンプレートの読み込み用)。`templateFingerprint` は差し替えた内容の元になったテンプレートの
   * 指紋で、親ノードの `data` に記録して「テンプレートが古い」判定(`isGroupInstanceStale`)に使う。 */
  loadGroupGraph: (nodes: Node[], edges: Edge[], templateFingerprint: string | undefined) => void;
  /** 今開いているグループの内部を最新のテンプレートへ更新する。同じ id・同じ型の
   * ノードの値は引き継ぐ(`migrateGroupToTemplate`)。 */
  migrateCurrentGroupToTemplate: () => void;
  undo: () => void;
  redo: () => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  duplicateSelected: () => void;
  autoLayout: () => void;
  /** グループノードの「中に入る」ボタンを押した際に呼ぶ。そのノードが `category: 'group'` でなければ
   * 何もしない。`data.nodes`/`edges` が未実体化(旧データモデルの `data: {}`)なら
   * `createDefaultData()` でこのインスタンス自身に実体化してから中に入る。 */
  enterGroup: (nodeId: string) => void;
  /** 直近の階層から1つ上へ戻る。編集結果を親ノードの `data` へ書き戻す。 */
  exitGroup: () => void;
  /** パンくずから任意の階層へジャンプする。`-1` でトップレベル。 */
  exitToLevel: (index: number) => void;
  /** `groupInput`/`groupOutput` ノード(`nodes/definitions/groupInput.ts`/`groupOutput.ts`)の
   * ソケットを1つ削除する。単なる `updateNodeData` と違い、同じ handle id を参照する
   * 現在の階層の内部エッジ、および(グループの中に入っている場合)1つ上の階層にある
   * このグループノード自身の外部エッジも一緒に削除する必要がある — 外部エッジが残ったまま
   * ソケットだけ消すと、`GenericNodeView` 側のハンドルが消えて繋がって見えない孤立エッジに
   * なる(`editor/nodeComponents/GroupInputNode.tsx`/`GroupOutputNode.tsx` が使う)。
   * 外部エッジが残っている場合は確認ダイアログを出す。 */
  removeGroupIOSocket: (nodeId: string, socketId: string) => void;
}

export const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => {
      /** 現在の nodes/edges を過去スタックに積み、redo スタックをクリアする。
       * key を指定すると、同じ key で `coalesceMs` 以内に再度呼ばれた場合は
       * 新しいエントリを積まず直前の呼び出しの続きとして扱う(1ジェスチャー=1エントリ)。 */
      const pushHistory = (key?: string, coalesceMs = 0) => {
        const state = get();
        const now = Date.now();
        if (key && state._historyKey === key && now - state._historyAt < coalesceMs) {
          set({ _historyAt: now });
          return;
        }
        set({
          past: [...state.past, { nodes: state.nodes, edges: state.edges, scopeStack: state.scopeStack }].slice(-HISTORY_LIMIT),
          future: [],
          _historyKey: key ?? null,
          _historyAt: now,
        });
      };

      return {
        nodes: initialNodes,
        edges: initialEdges,
        evaluatedResults: null,
        rootEvaluatedResults: null,
        scopeStack: [],
        past: [],
        future: [],
        _historyKey: null,
        _historyAt: 0,
        _dragging: false,
        clipboard: null,
        _pasteCount: 0,
        onNodesChange: (changes) => {
          if (changes.some((c) => c.type === 'remove')) {
            pushHistory('remove', REMOVE_COALESCE_MS);
          } else if (changes.some((c) => c.type === 'position' && c.dragging) && !get()._dragging) {
            pushHistory();
            set({ _dragging: true });
          }
          if (changes.some((c) => c.type === 'position' && c.dragging === false)) {
            set({ _dragging: false });
          }
          set({ nodes: applyNodeChanges(changes, get().nodes) });
        },
        onEdgesChange: (changes) => {
          if (changes.some((c) => c.type === 'remove')) pushHistory('remove', REMOVE_COALESCE_MS);
          set({ edges: applyEdgeChanges(changes, get().edges) });
        },
        onConnect: (connection) => {
          pushHistory();
          // 1つの入力ソケットに複数の接続が同時に生きていると、evaluateGraph() は
          // 配列中で最初に見つかったエッジしか採用しない(他の接続は静かに無視され、
          // 後でそのエッジが消えた瞬間に見た目の値が突然変わる)。それを避けるため、
          // 新しい接続を追加する前に、同じ target/targetHandle への既存の接続を
          // 置き換える(繋ぎ直す一般的なノードエディタの挙動)。
          // ただし複数接続できるソケット(`SocketDef.multiple`)は置き換えず、そのまま追加する。
          const targetNode = get().nodes.find((n) => n.id === connection.target);
          const targetSocket = targetNode
            ? resolveNodeSockets(targetNode.type ?? '', targetNode.data).inputs.find((s) => s.id === connection.targetHandle)
            : undefined;
          const edges = targetSocket?.multiple
            ? get().edges
            : get().edges.filter(
                (e) => !(e.target === connection.target && (e.targetHandle ?? null) === (connection.targetHandle ?? null)),
              );
          set({ edges: addEdge(connection, edges) });
        },
        updateNodeData: (id, data) => {
          pushHistory(`data:${id}`, COALESCE_MS);
          set({
            nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
          });
        },
        setEvaluatedResults: (results) => set({ evaluatedResults: results }),
        setRootEvaluatedResults: (results) => set({ rootEvaluatedResults: results }),
        addNode: (type, position) => {
          pushHistory();
          const def = getNodeType(type);
          const id = `${type}-${Math.random().toString(36).slice(2, 9)}`;
          const newNode: Node = { id, type, position, data: def.createDefaultData() };
          set({ nodes: [...get().nodes, newNode] });
        },
        loadGraph: (nodes, edges) => set({ nodes, edges, past: [], future: [], _historyKey: null }),
        loadGroupGraph: (nodes, edges, templateFingerprint) => {
          const state = get();
          const frame = state.scopeStack.at(-1);
          if (!frame) return;
          const scopeStack = state.scopeStack.map((f, i) =>
            i === state.scopeStack.length - 1
              ? {
                  ...f,
                  nodes: f.nodes.map((n) => (n.id === f.parentId ? { ...n, data: { ...n.data, templateFingerprint } } : n)),
                }
              : f,
          );
          set({ nodes, edges, scopeStack, past: [], future: [], _historyKey: null });
        },
        migrateCurrentGroupToTemplate: () => {
          const state = get();
          const frame = state.scopeStack.at(-1);
          const parentType = frame?.nodes.find((n) => n.id === frame.parentId)?.type;
          if (!frame || !parentType) return;
          const migrated = migrateGroupToTemplate(
            parentType,
            state.nodes.map((n) => ({ id: n.id, type: n.type ?? '', data: n.data })),
          );
          get().loadGroupGraph(migrated.nodes as unknown as Node[], migrated.edges as unknown as Edge[], migrated.templateFingerprint);
        },
        undo: () => {
          const { past, nodes, edges, scopeStack, future } = get();
          if (past.length === 0) return;
          const previous = past[past.length - 1];
          set({
            nodes: previous.nodes,
            edges: previous.edges,
            scopeStack: previous.scopeStack,
            past: past.slice(0, -1),
            future: [{ nodes, edges, scopeStack }, ...future],
            _historyKey: null,
            _dragging: false,
          });
        },
        redo: () => {
          const { future, nodes, edges, scopeStack, past } = get();
          if (future.length === 0) return;
          const next = future[0];
          set({
            nodes: next.nodes,
            edges: next.edges,
            scopeStack: next.scopeStack,
            future: future.slice(1),
            past: [...past, { nodes, edges, scopeStack }],
            _historyKey: null,
            _dragging: false,
          });
        },
        copySelected: () => {
          const state = get();
          const selectedNodes = state.nodes.filter((n) => n.selected);
          if (selectedNodes.length === 0) return;
          const selectedIds = new Set(selectedNodes.map((n) => n.id));
          const internalEdges = state.edges.filter(
            (e) => selectedIds.has(e.source) && selectedIds.has(e.target),
          );
          set({
            clipboard: { nodes: structuredClone(selectedNodes), edges: structuredClone(internalEdges) },
            _pasteCount: 0,
          });
        },
        pasteClipboard: () => {
          const state = get();
          const clip = state.clipboard;
          if (!clip || clip.nodes.length === 0) return;

          pushHistory();

          const offset = (state._pasteCount + 1) * 32;
          const idMap = new Map<string, string>();
          const newNodes: Node[] = clip.nodes.map((n) => {
            const newId = `${n.type ?? 'node'}-${Math.random().toString(36).slice(2, 9)}`;
            idMap.set(n.id, newId);
            return {
              ...structuredClone(n),
              id: newId,
              selected: true,
              position: { x: n.position.x + offset, y: n.position.y + offset },
            };
          });
          const newEdges: Edge[] = clip.edges.map((e) => ({
            ...structuredClone(e),
            id: `e-${Math.random().toString(36).slice(2, 9)}`,
            source: idMap.get(e.source)!,
            target: idMap.get(e.target)!,
          }));

          set({
            nodes: [...state.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)), ...newNodes],
            edges: [...state.edges, ...newEdges],
            _pasteCount: state._pasteCount + 1,
          });
        },
        duplicateSelected: () => {
          get().copySelected();
          get().pasteClipboard();
        },
        autoLayout: () => {
          const state = get();
          if (state.nodes.length === 0) return;
          pushHistory();
          const graphNodes = state.nodes.map((n) => ({ id: n.id, type: n.type ?? '', data: n.data }));
          const graphEdges = state.edges.map((e) => ({
            source: e.source,
            sourceHandle: e.sourceHandle,
            target: e.target,
            targetHandle: e.targetHandle,
          }));
          const positions = computeAutoLayout(graphNodes, graphEdges);
          set({
            nodes: state.nodes.map((n) => {
              const position = positions.get(n.id);
              return position ? { ...n, position } : n;
            }),
          });
        },
        enterGroup: (nodeId) => {
          const state = get();
          const node = state.nodes.find((n) => n.id === nodeId);
          if (!node || !node.type) return;
          let def;
          try {
            def = getNodeType(node.type);
          } catch {
            return;
          }
          if (def.category !== 'group') return;

          const existing = node.data as GroupNodeDataShape;
          const materialized: GroupNodeDataShape = existing.nodes
            ? existing
            : ({ ...existing, ...(def.createDefaultData() as GroupNodeDataShape) } as GroupNodeDataShape);

          const nodesAtThisLevel = state.nodes.map((n) => (n.id === nodeId ? { ...n, data: materialized } : n));

          set({
            scopeStack: [...state.scopeStack, { parentId: nodeId, nodes: nodesAtThisLevel, edges: state.edges }],
            nodes: materialized.nodes ?? [],
            edges: materialized.edges ?? [],
            past: [],
            future: [],
            _historyKey: null,
            _dragging: false,
          });
        },
        exitGroup: () => {
          const state = get();
          const frame = state.scopeStack.at(-1);
          if (!frame) return;

          const restoredNodes = frame.nodes.map((n) =>
            n.id === frame.parentId ? { ...n, data: { ...n.data, nodes: state.nodes, edges: state.edges } } : n,
          );

          set({
            nodes: restoredNodes,
            edges: frame.edges,
            scopeStack: state.scopeStack.slice(0, -1),
            past: [],
            future: [],
            _historyKey: null,
            _dragging: false,
          });
        },
        exitToLevel: (index) => {
          const steps = get().scopeStack.length - (index + 1);
          for (let i = 0; i < steps; i++) get().exitGroup();
        },
        removeGroupIOSocket: (nodeId, socketId) => {
          const state = get();
          const node = state.nodes.find((n) => n.id === nodeId);
          if (!node) return;
          const isInput = node.type === 'groupInput';
          const isOutput = node.type === 'groupOutput';
          if (!isInput && !isOutput) return;

          // 現在の階層(埋め込みサブグラフ)の中で、このソケットに繋がっている内部エッジ。
          const internalOrphans = state.edges.filter((e) =>
            isInput ? e.source === nodeId && e.sourceHandle === socketId : e.target === nodeId && e.targetHandle === socketId,
          );

          // このグループノード自身は現在の nodes ではなく直近の scopeStack フレームに
          // 退避されている(グループの中に入っている場合)。そのフレームの edges の中で、
          // 親ノードの同名ハンドルに繋がっている外部エッジ。
          const frame = state.scopeStack.at(-1);
          const externalOrphans = frame
            ? frame.edges.filter((e) =>
                isInput
                  ? e.target === frame.parentId && e.targetHandle === socketId
                  : e.source === frame.parentId && e.sourceHandle === socketId,
              )
            : [];

          if (externalOrphans.length > 0) {
            const ok = confirm(
              `このソケットは外部から${externalOrphans.length}本接続されています。削除すると接続も切れます。よろしいですか?`,
            );
            if (!ok) return;
          }

          pushHistory();

          const sockets = ((node.data as { sockets?: { id: string }[] }).sockets ?? []).filter((s) => s.id !== socketId);
          const internalOrphanIds = new Set(internalOrphans.map((e) => e.id));
          const externalOrphanIds = new Set(externalOrphans.map((e) => e.id));

          set({
            nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, sockets } } : n)),
            edges: state.edges.filter((e) => !internalOrphanIds.has(e.id)),
            scopeStack:
              frame && externalOrphanIds.size > 0
                ? [...state.scopeStack.slice(0, -1), { ...frame, edges: frame.edges.filter((e) => !externalOrphanIds.has(e.id)) }]
                : state.scopeStack,
          });
        },
      };
    },
    {
      name: GRAPH_STORAGE_KEY,
      // グループの中に入って編集している最中にリロードしても、トップレベル視点で合成した
      // 完全なグラフを保存する(state.nodes/edges をそのまま保存すると「今開いている階層」
      // だけが残り、他の全ガーメントの設計が失われる)。scopeStack 自体(ナビゲーション位置)は
      // 永続化しない — リロードするとトップレベル表示に戻る、という割り切り。
      partialize: (state) => composeRootGraph(state.scopeStack, state.nodes, state.edges),
      // 復元した保存データが現在のノードタイプ/循環の基準を満たさない場合(過去のバージョンで
      // 削除されたノードタイプを含むなど)は、そのまま評価すると例外になるため復元せず初期状態を
      // 使う。壊れたデータは `GRAPH_BACKUP_STORAGE_KEY` に退避して消えないようにする。
      merge: (persisted, current) => {
        const saved = persisted as { nodes?: Node[]; edges?: Edge[] } | undefined;
        if (!saved?.nodes || !saved.edges) return current;
        if (validateGraph(saved.nodes, saved.edges) === null) return { ...current, nodes: saved.nodes, edges: saved.edges };
        try {
          localStorage.setItem(GRAPH_BACKUP_STORAGE_KEY, JSON.stringify(saved));
        } catch {
          // 退避に失敗しても初期状態への復帰は続ける。
        }
        return current;
      },
    },
  ),
);
