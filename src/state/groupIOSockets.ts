import type { Edge, Node } from '@xyflow/react';

const GROUP_IO_TYPES = ['groupInput', 'groupOutput'] as const;

function socketsOf(node: Node): { id: string }[] {
  return (node.data as { sockets?: { id: string }[] }).sockets ?? [];
}

/** 同じ階層の `groupInput` 同士・`groupOutput` 同士は、グループの入出力の一覧(`data.sockets`)を
 * 共有する(Blender の Group Input/Output を複数置けるのと同じ)。型ごとに、`preferIds` の中で最初に
 * 見つかったノード(無ければその型の最初のノード)の一覧へ同じ型の全ノードを揃え、揃えた結果
 * 繋がる先のソケットが無くなった内部エッジを捨てる。何も変わらなければ同じ参照を返す。 */
export function shareGroupIOSockets(
  nodes: Node[],
  edges: Edge[],
  preferIds: ReadonlySet<string>,
): { nodes: Node[]; edges: Edge[] } {
  let nextNodes = nodes;
  for (const type of GROUP_IO_TYPES) {
    const sameType = nextNodes.filter((n) => n.type === type);
    if (sameType.length < 2) continue;
    const leader = sameType.find((n) => preferIds.has(n.id)) ?? sameType[0];
    const sockets = socketsOf(leader);
    if (sameType.every((n) => socketsOf(n) === sockets)) continue;
    nextNodes = nextNodes.map((n) =>
      n.type === type && socketsOf(n) !== sockets ? { ...n, data: { ...n.data, sockets } } : n,
    );
  }

  const socketIds = new Map(
    nextNodes.filter((n) => n.type === 'groupInput' || n.type === 'groupOutput').map((n) => [n.id, new Set(socketsOf(n).map((s) => s.id))]),
  );
  const nodeType = new Map(nextNodes.map((n) => [n.id, n.type]));
  const dangling = (e: Edge) =>
    (nodeType.get(e.source) === 'groupInput' && !socketIds.get(e.source)!.has(e.sourceHandle ?? '')) ||
    (nodeType.get(e.target) === 'groupOutput' && !socketIds.get(e.target)!.has(e.targetHandle ?? ''));
  const nextEdges = edges.some(dangling) ? edges.filter((e) => !dangling(e)) : edges;

  return { nodes: nextNodes, edges: nextEdges };
}
