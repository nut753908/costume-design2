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

    // グループノードインスタンスは data.exposedInputs でソケット構成を上書きできる
    // (nodes/resolveNodeSockets.ts 参照)ため、型の静的な def.inputs ではなくこちら経由で
    // 未接続ソケットのフォールバック解決を行う。
    for (const socket of resolveNodeSockets(node.type, node.data).inputs) {
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
      const literal = literalSocketValue(socket.type, node.data[socket.id]);
      if (literal !== undefined) {
        inputs[socket.id] = literal;
      }
    }

    results.set(nodeId, def.evaluate(inputs, node.data));
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

  const queue = nodeIds.filter((id) => inDegree.get(id) === 0);
  const order: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
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
    const remaining = nodes.map((n) => n.id).filter((id) => !order.includes(id));
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
