import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import { shareGroupIOSockets } from './groupIOSockets';

function io(id: string, type: 'groupInput' | 'groupOutput', socketIds: string[]): Node {
  return { id, type, position: { x: 0, y: 0 }, data: { sockets: socketIds.map((s) => ({ id: s, label: s, type: 'number' })) } };
}

function socketIdsOf(nodes: Node[], id: string): string[] {
  return (nodes.find((n) => n.id === id)!.data as { sockets: { id: string }[] }).sockets.map((s) => s.id);
}

describe('shareGroupIOSockets', () => {
  it('同じ型のノードを preferIds のノードの一覧へ揃える(型をまたいでは揃えない)', () => {
    const nodes = [io('in1', 'groupInput', ['a']), io('in2', 'groupInput', ['a', 'b']), io('out', 'groupOutput', ['x'])];

    const result = shareGroupIOSockets(nodes, [], new Set(['in2']));

    expect(socketIdsOf(result.nodes, 'in1')).toEqual(['a', 'b']);
    expect(socketIdsOf(result.nodes, 'out')).toEqual(['x']);
  });

  it('preferIds に同じ型のノードが無ければ、その型の最初のノードの一覧へ揃える', () => {
    const nodes = [io('in1', 'groupInput', ['a']), io('in2', 'groupInput', [])];

    const result = shareGroupIOSockets(nodes, [], new Set());

    expect(socketIdsOf(result.nodes, 'in2')).toEqual(['a']);
  });

  it('揃えた結果、繋がる先のソケットが無くなった内部エッジを捨てる', () => {
    const nodes = [io('in1', 'groupInput', ['a']), io('in2', 'groupInput', ['b']), io('out', 'groupOutput', ['x'])];
    const edges: Edge[] = [
      { id: 'from-a', source: 'in1', sourceHandle: 'a', target: 'out', targetHandle: 'x' },
      { id: 'from-b', source: 'in2', sourceHandle: 'b', target: 'out', targetHandle: 'x' },
    ];

    const result = shareGroupIOSockets(nodes, edges, new Set(['in1']));

    expect(result.edges.map((e) => e.id)).toEqual(['from-a']);
  });

  it('何も変わらなければ同じ参照を返す', () => {
    const nodes = [io('in1', 'groupInput', ['a'])];
    const edges: Edge[] = [{ id: 'e', source: 'in1', sourceHandle: 'a', target: 'x', targetHandle: 'v' }];

    const result = shareGroupIOSockets(nodes, edges, new Set());

    expect(result.nodes).toBe(nodes);
    expect(result.edges).toBe(edges);
  });
});
