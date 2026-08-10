import { useMemo, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { GraphEdge, GraphNode } from '../nodes/types';
import { useGraphStore } from './graphStore';

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

function toGraphNode(n: Node): GraphNode {
  return { id: n.id, type: n.type ?? '', data: n.data };
}

function toGraphEdge(e: Edge): GraphEdge {
  return { source: e.source, sourceHandle: e.sourceHandle, target: e.target, targetHandle: e.targetHandle };
}

function sameNodes(a: GraphNode[], b: GraphNode[]): boolean {
  return (
    a.length === b.length &&
    a.every((n, i) => n.id === b[i].id && n.type === b[i].type && n.data === b[i].data)
  );
}

function sameEdges(a: GraphEdge[], b: GraphEdge[]): boolean {
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
