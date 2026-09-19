import { describe, expect, it, beforeAll } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import { validateGraph } from './validateGraph';
import { registerNodeType, nodeTypeRegistry } from '../nodes/registry';

beforeAll(() => {
  if (!nodeTypeRegistry.has('validateGraphTestNode')) {
    registerNodeType({
      type: 'validateGraphTestNode',
      label: 'Test',
      category: 'input',
      inputs: [{ id: 'in', label: 'In', type: 'number' }],
      outputs: [{ id: 'out', label: 'Out', type: 'number' }],
      createDefaultData: () => ({}),
      evaluate: () => ({ out: { type: 'number', value: 0 } }),
    });
  }
});

function node(id: string, type = 'validateGraphTestNode'): Node {
  return { id, type, position: { x: 0, y: 0 }, data: {} };
}

describe('validateGraph', () => {
  it('グループノードの埋め込みサブグラフ(data.nodes/edges)に未登録の型があれば unknown-node-type を返す', () => {
    const group: Node = {
      id: 'g',
      type: 'validateGraphTestNode',
      position: { x: 0, y: 0 },
      data: { nodes: [node('x', 'removedNodeType')], edges: [] },
    };
    expect(validateGraph([group], [])).toBe('unknown-node-type');
  });

  it('グループノードの埋め込みサブグラフ内の循環は cycle を返す', () => {
    const group: Node = {
      id: 'g',
      type: 'validateGraphTestNode',
      position: { x: 0, y: 0 },
      data: {
        nodes: [node('a'), node('b')],
        edges: [
          { id: 'e1', source: 'a', target: 'b' },
          { id: 'e2', source: 'b', target: 'a' },
        ],
      },
    };
    expect(validateGraph([group], [])).toBe('cycle');
  });

  it('登録済みのノードタイプのみで循環も無ければ null(有効)を返す', () => {
    const nodes = [node('a'), node('b')];
    const edges: Edge[] = [{ id: 'e1', source: 'a', target: 'b' }];
    expect(validateGraph(nodes, edges)).toBeNull();
  });

  it('未登録のノードタイプが含まれる場合は unknown-node-type を返す', () => {
    const nodes = [node('a', 'noSuchNodeType')];
    expect(validateGraph(nodes, [])).toBe('unknown-node-type');
  });

  it('循環がある場合は cycle を返す', () => {
    const nodes = [node('a'), node('b')];
    const edges: Edge[] = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'a' },
    ];
    expect(validateGraph(nodes, edges)).toBe('cycle');
  });
});
