import { describe, expect, it } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import { composeRootGraph, type ScopeFrame } from './composeRootGraph';

function makeNode(id: string, data: Record<string, unknown> = {}): Node {
  return { id, type: 'testNode', position: { x: 0, y: 0 }, data };
}

function makeEdge(id: string, source: string, target: string): Edge {
  return { id, source, sourceHandle: 'value', target, targetHandle: 'value' };
}

describe('composeRootGraph', () => {
  it('scopeStack が空なら leafNodes/leafEdges をそのまま返す(恒等関数)', () => {
    const leafNodes = [makeNode('a')];
    const leafEdges = [makeEdge('e', 'a', 'a')];

    const result = composeRootGraph([], leafNodes, leafEdges);

    expect(result.nodes).toBe(leafNodes);
    expect(result.edges).toBe(leafEdges);
  });

  it('1階層のネストで、親ノードの data.nodes/edges が現在の内部グラフに置き換わる', () => {
    const scopeStack: ScopeFrame[] = [
      {
        parentId: 'group1',
        nodes: [makeNode('group1', { label: 'stale' }), makeNode('sibling')],
        edges: [],
      },
    ];
    const leafNodes = [makeNode('inner-a'), makeNode('inner-b')];
    const leafEdges = [makeEdge('inner-e', 'inner-a', 'inner-b')];

    const result = composeRootGraph(scopeStack, leafNodes, leafEdges);

    expect(result.nodes.map((n) => n.id).sort()).toEqual(['group1', 'sibling']);
    const group1 = result.nodes.find((n) => n.id === 'group1');
    expect(group1).toBeDefined();
    expect((group1!.data as { nodes?: Node[] }).nodes).toBe(leafNodes);
    expect((group1!.data as { edges?: Edge[] }).edges).toBe(leafEdges);
    // 他のトップレベルの内容(label 等)は保持される。
    expect((group1!.data as { label?: string }).label).toBe('stale');
    // トップレベルのエッジは scopeStack の最上位フレームのものになる。
    expect(result.edges).toEqual([]);
  });

  it('多段ネストでも再帰的に正しく合成される', () => {
    const scopeStack: ScopeFrame[] = [
      { parentId: 'outer', nodes: [makeNode('outer')], edges: [makeEdge('outer-e', 'x', 'y')] },
      { parentId: 'inner', nodes: [makeNode('inner'), makeNode('inner-sibling')], edges: [] },
    ];
    const leafNodes = [makeNode('leaf')];
    const leafEdges: Edge[] = [];

    const result = composeRootGraph(scopeStack, leafNodes, leafEdges);

    // トップレベルは outer 単体。
    expect(result.nodes.map((n) => n.id)).toEqual(['outer']);
    expect(result.edges).toEqual([makeEdge('outer-e', 'x', 'y')]);

    const outer = result.nodes.find((n) => n.id === 'outer');
    expect(outer).toBeDefined();
    const outerInnerNodes = (outer!.data as { nodes?: Node[] }).nodes ?? [];
    expect(outerInnerNodes.map((n) => n.id).sort()).toEqual(['inner', 'inner-sibling']);

    const inner = outerInnerNodes.find((n) => n.id === 'inner');
    expect(inner).toBeDefined();
    expect((inner!.data as { nodes?: Node[] }).nodes).toBe(leafNodes);
  });
});
