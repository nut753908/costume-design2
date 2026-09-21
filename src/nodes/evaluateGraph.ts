import * as THREE from 'three';
import type { GraphEdge, GraphNode, SocketValue } from './types';
import { getNodeType } from './registry';
import { resolveNodeSockets } from './resolveNodeSockets';

export class GraphCycleError extends Error {
  constructor(remainingNodeIds: string[]) {
    super(`Node graph has a cycle involving: ${remainingNodeIds.join(', ')}`);
    this.name = 'GraphCycleError';
  }
}

export type EvaluatedGraph = Map<string, Record<string, SocketValue>>;

/** ノード単位の評価結果メモ化キャッシュ。キーは `node.data` オブジェクトそのものの参照 ——
 * `state/graphStore.ts` の全アクション(`updateNodeData`/`composeRootGraph()` 含む)は
 * イミュータブルな更新しか行わず、変化していないノードは常に同じ `data` 参照を保つ
 * (`src/state/CLAUDE.md` のリアクティビティ節参照)ため、「このノードは前回と同じデータ
 * オブジェクトか」が「このノードは編集されていないか」の安価な判定として機能する。
 * `WeakMap` にしているのは、ノードが削除されて `data` オブジェクトがどこからも参照されなく
 * なれば、対応するキャッシュエントリも GC に任せて自動的に回収されるようにするため(手動の
 * 無効化・エントリ削除ロジックが不要)。
 *
 * `data` 参照が同じでも、上流ノードの値が変わっていれば解決後の `inputs` は変わりうるため、
 * ヒット判定は `data` 参照の一致だけでなく解決済み `inputs` の値も見る(`sameInputs()`)。
 * これにより、`bodyGroup`(グループノード)のように内部サブグラフをまるごと再評価する
 * `evaluate()` も、外部から見た inputs/data がどちらも前回と同じであれば丸ごとスキップ
 * できる —— この関数は最上位の呼び出しからグループノードの埋め込みサブグラフの中まで
 * 再帰的に同じ実装を共有しているため、キャッシュも各階層に一様に効く(トップレベルで
 * 1つのスライダーを動かしても、それに依存しない他のグループは内部サブグラフの評価自体が
 * 走らない)。 */
interface NodeEvalCacheEntry {
  type: string;
  /** キャッシュ登録時点の `node.data` のトップレベルの浅いコピー。`data` の参照が同じでも、
   * 誰かが直接ミューテートして中身が変わっていれば(このアプリの更新経路では起きないが、
   * 起きると古い結果を静かに返し続けてしまう)ヒットさせない。 */
  dataSnapshot: Record<string, unknown>;
  inputs: Record<string, SocketValue>;
  result: Record<string, SocketValue>;
}
let nodeEvalCache = new WeakMap<Record<string, unknown>, NodeEvalCacheEntry>();

/** キャッシュのヒット/ミスの累計(グループノードの内部サブグラフ評価の分も含む)。
 * `App.tsx` の右下の `evaluations` カウンターの隣に表示し、メモ化が実際に効いているかを
 * 開発中に目視できるようにするための計測用で、評価そのものには影響しない。 */
const nodeEvalCacheStats = { hits: 0, misses: 0 };

export function getNodeEvalCacheStats(): Readonly<{ hits: number; misses: number }> {
  return nodeEvalCacheStats;
}

/** テスト専用: キャッシュを空にする。`nodeEvalCache` はモジュールレベルで永続する
 * (プロダクションではそれ自体が目的 — 別々の `evaluateGraph()` 呼び出しをまたいで
 * 効かせるため)が、同じ `data` オブジェクト参照(多くはノード型定義ファイル内の
 * モジュール定数の `internalNodes`)を複数の `it()` ブロックにまたがって使い回す
 * テストでは、前のテストの評価結果がキャッシュヒットとして紛れ込み、
 * spy の呼び出し回数などを検証するテストが壊れる。テストランナー側の `beforeEach` から
 * 呼んでテストを互いに独立させる(`src/testSetup.ts` 参照)。 */
export function resetNodeEvalCacheForTests(): void {
  nodeEvalCache = new WeakMap();
  nodeEvalCacheStats.hits = 0;
  nodeEvalCacheStats.misses = 0;
}

/** `geometry`/`material`/`points` は値比較のコストが構造そのものの再計算と大差ないため、
 * 参照が同じ場合のみ「同じ」とみなす —— 生成元のノードもキャッシュヒットして同じ参照を
 * 返している限り、この参照比較で連鎖的に成立する。`number`/`color` は安価に値
 * 比較できるため、素の値ではなく都度生成される SocketValue のラッパーオブジェクトの
 * 参照が変わっただけで無駄にキャッシュミスしないよう、値そのものを比較する。 */
function sameSocketValue(a: SocketValue | undefined, b: SocketValue | undefined): boolean {
  if (a === b) return true;
  if (!a || !b || a.type !== b.type) return false;
  if (a.type === 'number' && b.type === 'number') return a.value === b.value;
  if (a.type === 'color' && b.type === 'color') return a.value.equals(b.value);
  if (a.type === 'geometries' && b.type === 'geometries') {
    return a.value.length === b.value.length && a.value.every((g, i) => g === b.value[i]);
  }
  return false;
}

function sameShallow(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every((key) => Object.hasOwn(b, key) && Object.is(a[key], b[key]));
}

function sameInputs(a: Record<string, SocketValue>, b: Record<string, SocketValue>): boolean {
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every((key) => sameSocketValue(a[key], b[key]));
}

export function evaluateGraph(nodes: GraphNode[], edges: GraphEdge[]): EvaluatedGraph {
  const order = topologicalSort(nodes, edges);
  const results: EvaluatedGraph = new Map();
  const nodesById = new Map(nodes.map((n) => [n.id, n]));

  const edgesByTarget = new Map<string, GraphEdge[]>();
  for (const edge of edges) {
    const list = edgesByTarget.get(edge.target) ?? [];
    list.push(edge);
    edgesByTarget.set(edge.target, list);
  }

  for (const nodeId of order) {
    const node = nodesById.get(nodeId)!;
    const def = getNodeType(node.type);
    const incomingEdges = edgesByTarget.get(node.id) ?? [];
    const inputs: Record<string, SocketValue> = {};

    // グループノードインスタンスは内部の groupInput/groupOutput ノードの data.sockets で
    // ソケット構成を動的に上書きできる(nodes/resolveNodeSockets.ts 参照)ため、型の静的な
    // def.inputs ではなくこちら経由で未接続ソケットのフォールバック解決を行う。
    for (const socket of resolveNodeSockets(node.type, node.data).inputs) {
      // 複数接続できるソケットは、接続されたすべての値をエッジの並び順で配列に集める。
      if (socket.multiple) {
        const values = incomingEdges
          .filter((e) => (e.targetHandle ?? undefined) === socket.id)
          .map((e) => results.get(e.source)?.[e.sourceHandle ?? ''])
          .filter((v): v is Extract<SocketValue, { type: 'geometry' }> => v?.type === 'geometry');
        if (values.length > 0) inputs[socket.id] = { type: 'geometries', value: values.map((v) => v.value) };
        continue;
      }
      const incoming = incomingEdges.find((e) => (e.targetHandle ?? undefined) === socket.id);
      const upstreamValue = incoming
        ? results.get(incoming.source)?.[incoming.sourceHandle ?? '']
        : undefined;

      if (upstreamValue !== undefined) {
        inputs[socket.id] = upstreamValue;
        continue;
      }

      // 未接続のソケットはノード自身のリテラルな data 値にフォールバックする —
      // これは未接続の Geometry Nodes ソケットがウィジェットのデフォルト値を使うのと同じ挙動。
      const literal = literalSocketValue(socket.type, node.data[socket.id] ?? socket.default);
      if (literal !== undefined) {
        inputs[socket.id] = literal;
      }
    }

    const cached = nodeEvalCache.get(node.data);
    if (cached && cached.type === node.type && sameShallow(cached.dataSnapshot, node.data) && sameInputs(cached.inputs, inputs)) {
      nodeEvalCacheStats.hits += 1;
      results.set(nodeId, cached.result);
      continue;
    }

    nodeEvalCacheStats.misses += 1;
    const result = def.evaluate(inputs, node.data);
    nodeEvalCache.set(node.data, { type: node.type, dataSnapshot: { ...node.data }, inputs, result });
    results.set(nodeId, result);
  }

  return results;
}

function literalSocketValue(type: SocketValue['type'], raw: unknown): SocketValue | undefined {
  if (raw === undefined) return undefined;
  // 'color' のリテラル値は node.data に単純な hex 文字列として保持される(UIで編集可能、
  // JSONシリアライズ可能)。ここで THREE.Color に変換し、'color' 型の SocketValue が
  // 常に一貫した実行時の形になるようにする。
  if (type === 'color') {
    return { type, value: new THREE.Color(raw as THREE.ColorRepresentation) };
  }
  return { type, value: raw } as SocketValue;
}

/** Kahn のアルゴリズム本体。循環に含まれるノードは結果に現れないため、
 * `order.length !== nodeIds.length` で循環の有無を判定できる。 topologicalSort()
 * (例外を投げて呼び出し元に知らせる)と hasCycle()(真偽値で知らせる)の両方が
 * この同一実装を共有することで、「何が循環とみなされるか」の定義がずれないようにしている。 */
function topologicalOrder(nodeIds: string[], edges: { source: string; target: string }[]): string[] {
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const id of nodeIds) {
    inDegree.set(id, 0);
    dependents.set(id, []);
  }
  for (const edge of edges) {
    if (!inDegree.has(edge.source) || !inDegree.has(edge.target)) continue;
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    dependents.get(edge.source)!.push(edge.target);
  }

  // 配列+読み取り位置ポインタによるキュー。Array.shift() は毎回残り要素を前方へ詰め直す
  // ため O(n) で、ノード数が多いグラフではキュー処理全体が O(n²) に近づく。末尾への
  // push と head のインクリメントだけで済む O(1) の dequeue に置き換えている
  // (処理順序は shift() を使った場合と変わらない FIFO のまま)。
  const queue = nodeIds.filter((id) => inDegree.get(id) === 0);
  let head = 0;
  const order: string[] = [];

  while (head < queue.length) {
    const id = queue[head++];
    order.push(id);
    for (const dependent of dependents.get(id) ?? []) {
      const remaining = (inDegree.get(dependent) ?? 0) - 1;
      inDegree.set(dependent, remaining);
      if (remaining === 0) queue.push(dependent);
    }
  }

  return order;
}

function topologicalSort(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  const order = topologicalOrder(
    nodes.map((n) => n.id),
    edges,
  );
  if (order.length !== nodes.length) {
    // Array.includes() を毎回の filter 呼び出しの中で使うと O(n²) になるため、
    // Set の O(1) 判定に置き換える(循環検知時のみ通る経路だが、コストは同じくらい
    // 小さく書けるため揃えている)。
    const ordered = new Set(order);
    const remaining = nodes.map((n) => n.id).filter((id) => !ordered.has(id));
    throw new GraphCycleError(remaining);
  }
  return order;
}

/** 与えられたノード/エッジの組が循環を含むかどうかを判定する。
 * ノード接続時の事前チェック(NodeEditor.tsx の isValidConnection)や、Import JSON・
 * プリセット読み込みの事前検証(state/validateGraph.ts)から使う — どちらも
 * evaluateGraph() を実際に呼んで GraphCycleError を踏んでからでは手遅れ(例外が
 * 未捕捉のままレンダー中に投げられる)なため、投げる前に判定できる形で公開する。 */
export function hasCycle(
  nodes: { id: string }[],
  edges: { source: string; target: string }[],
): boolean {
  const order = topologicalOrder(
    nodes.map((n) => n.id),
    edges,
  );
  return order.length !== nodes.length;
}
