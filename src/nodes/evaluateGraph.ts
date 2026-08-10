import * as THREE from 'three';
import type { GraphEdge, GraphNode, SocketValue } from './types';
import { getNodeType } from './registry';

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

    for (const socket of def.inputs) {
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

function topologicalSort(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    dependents.set(node.id, []);
  }
  for (const edge of edges) {
    if (!inDegree.has(edge.source) || !inDegree.has(edge.target)) continue;
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    dependents.get(edge.source)!.push(edge.target);
  }

  const queue = nodes.filter((n) => inDegree.get(n.id) === 0).map((n) => n.id);
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

  if (order.length !== nodes.length) {
    const remaining = nodes.map((n) => n.id).filter((id) => !order.includes(id));
    throw new GraphCycleError(remaining);
  }

  return order;
}
