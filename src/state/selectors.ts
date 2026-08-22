import { useMemo, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { GraphEdge, GraphNode } from '../nodes/types';
import { useGraphStore } from './graphStore';
import { composeRootGraph } from './composeRootGraph';

/** React Flow のノードから evaluator が使える形式のノードデータを導出する。位置のみの
 * 変更(ドラッグ)では同じ配列参照を保つことで、下流の useMemo/useEffect フックが
 * id/type/data の実際の変更時にのみ再トリガーされ、ドラッグ中には再トリガーされないようにする。 */
export function useNodesLite(): GraphNode[] {
  const nodes = useGraphStore((s) => s.nodes);
  const cacheRef = useRef<GraphNode[]>([]);

  return useMemo(() => {
    const next = nodes.map(toGraphNode);
    if (sameNodes(cacheRef.current, next)) return cacheRef.current;
    cacheRef.current = next;
    return next;
  }, [nodes]);
}

export function useEdgesLite(): GraphEdge[] {
  const edges = useGraphStore((s) => s.edges);
  const cacheRef = useRef<GraphEdge[]>([]);

  return useMemo(() => {
    const next = edges.map(toGraphEdge);
    if (sameEdges(cacheRef.current, next)) return cacheRef.current;
    cacheRef.current = next;
    return next;
  }, [edges]);
}

/** `useNodesLite`/`useEdgesLite` のトップレベル版。`scopeStack`(グループの中に入っている
 * 場合の上位階層スナップショット)と現在の `nodes`/`edges` を `composeRootGraph()` で合成し、
 * 「今開いている階層」ではなく常にトップレベル視点の完全なグラフを、同じ参照安定化パターンで
 * 返す。`state/useRootEvaluatedGraph.ts`(3D描画・ボディスケールが読む `rootEvaluatedResults`
 * を駆動する)から使う。 */
export function useRootGraphLite(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const scopeStack = useGraphStore((s) => s.scopeStack);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const nodesCacheRef = useRef<GraphNode[]>([]);
  const edgesCacheRef = useRef<GraphEdge[]>([]);

  return useMemo(() => {
    const composed = composeRootGraph(scopeStack, nodes, edges);
    const nextNodes = composed.nodes.map(toGraphNode);
    const nextEdges = composed.edges.map(toGraphEdge);
    const outNodes = sameNodes(nodesCacheRef.current, nextNodes) ? nodesCacheRef.current : nextNodes;
    const outEdges = sameEdges(edgesCacheRef.current, nextEdges) ? edgesCacheRef.current : nextEdges;
    nodesCacheRef.current = outNodes;
    edgesCacheRef.current = outEdges;
    return { nodes: outNodes, edges: outEdges };
  }, [scopeStack, nodes, edges]);
}

// テスト用に export している。React フックの外からでも、リアクティビティの要である
// 参照等価性の比較ロジック(sameNodes/sameEdges)を直接検証できるようにするため。
export function toGraphNode(n: Node): GraphNode {
  return { id: n.id, type: n.type ?? '', data: n.data };
}

export function toGraphEdge(e: Edge): GraphEdge {
  return { source: e.source, sourceHandle: e.sourceHandle, target: e.target, targetHandle: e.targetHandle };
}

export function sameNodes(a: GraphNode[], b: GraphNode[]): boolean {
  return (
    a.length === b.length &&
    a.every((n, i) => n.id === b[i].id && n.type === b[i].type && n.data === b[i].data)
  );
}

export function sameEdges(a: GraphEdge[], b: GraphEdge[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (e, i) =>
        e.source === b[i].source &&
        e.target === b[i].target &&
        e.sourceHandle === b[i].sourceHandle &&
        e.targetHandle === b[i].targetHandle,
    )
  );
}
