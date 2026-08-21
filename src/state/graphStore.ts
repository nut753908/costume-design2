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
import { computeAutoLayout } from '../nodes/autoLayout';
import { initialNodes, initialEdges } from './initialGraph';

/** localStorage の永続化キー。persist の name とErrorBoundaryのリセット処理(main.tsx)の
 * 両方から参照するため、値のドリフトを避けて1箇所にまとめる。 */
export const GRAPH_STORAGE_KEY = 'costume-design-graph';

interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
}

const HISTORY_LIMIT = 100;
/** スライダー/カラーピッカーのドラッグ中に連続発火する updateNodeData 呼び出しを
 * 1回のUndo単位にまとめるための猶予時間。この時間内に同じキーで再度呼ばれた場合は
 * 新しい履歴エントリを積まず、直前のジェスチャーの続きとみなす。 */
const COALESCE_MS = 500;

interface Clipboard {
  nodes: Node[];
  edges: Edge[];
}

interface GraphState {
  nodes: Node[];
  edges: Edge[];
  evaluatedResults: EvaluatedGraph | null;
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
  addNode: (type: string, position: { x: number; y: number }) => void;
  loadGraph: (nodes: Node[], edges: Edge[]) => void;
  undo: () => void;
  redo: () => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  duplicateSelected: () => void;
  autoLayout: () => void;
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
          past: [...state.past, { nodes: state.nodes, edges: state.edges }].slice(-HISTORY_LIMIT),
          future: [],
          _historyKey: key ?? null,
          _historyAt: now,
        });
      };

      return {
        nodes: initialNodes,
        edges: initialEdges,
        evaluatedResults: null,
        past: [],
        future: [],
        _historyKey: null,
        _historyAt: 0,
        _dragging: false,
        clipboard: null,
        _pasteCount: 0,
        onNodesChange: (changes) => {
          if (changes.some((c) => c.type === 'remove')) {
            pushHistory();
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
          if (changes.some((c) => c.type === 'remove')) pushHistory();
          set({ edges: applyEdgeChanges(changes, get().edges) });
        },
        onConnect: (connection) => {
          pushHistory();
          // 1つの入力ソケットに複数の接続が同時に生きていると、evaluateGraph() は
          // 配列中で最初に見つかったエッジしか採用しない(他の接続は静かに無視され、
          // 後でそのエッジが消えた瞬間に見た目の値が突然変わる)。それを避けるため、
          // 新しい接続を追加する前に、同じ target/targetHandle への既存の接続を
          // 置き換える(繋ぎ直す一般的なノードエディタの挙動)。
          const edges = get().edges.filter(
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
        addNode: (type, position) => {
          pushHistory();
          const def = getNodeType(type);
          const id = `${type}-${Math.random().toString(36).slice(2, 9)}`;
          const newNode: Node = { id, type, position, data: def.createDefaultData() };
          set({ nodes: [...get().nodes, newNode] });
        },
        loadGraph: (nodes, edges) => set({ nodes, edges, past: [], future: [], _historyKey: null }),
        undo: () => {
          const { past, nodes, edges, future } = get();
          if (past.length === 0) return;
          const previous = past[past.length - 1];
          set({
            nodes: previous.nodes,
            edges: previous.edges,
            past: past.slice(0, -1),
            future: [{ nodes, edges }, ...future],
            _historyKey: null,
            _dragging: false,
          });
        },
        redo: () => {
          const { future, nodes, edges, past } = get();
          if (future.length === 0) return;
          const next = future[0];
          set({
            nodes: next.nodes,
            edges: next.edges,
            future: future.slice(1),
            past: [...past, { nodes, edges }],
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
      };
    },
    {
      name: GRAPH_STORAGE_KEY,
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
    },
  ),
);
