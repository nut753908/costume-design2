import { describe, expect, it, beforeAll } from 'vitest';
import { evaluateGraph, GraphCycleError } from './evaluateGraph';
import { registerNodeType, nodeTypeRegistry } from './registry';
import type { GraphEdge, GraphNode, SocketValue } from './types';

function asNumber(v: SocketValue | undefined, fallback: number): number {
  return v?.type === 'number' ? v.value : fallback;
}

beforeAll(() => {
  if (!nodeTypeRegistry.has('testSource')) {
    registerNodeType({
      type: 'testSource',
      label: 'Test Source',
      category: 'input',
      inputs: [],
      outputs: [{ id: 'value', label: 'Value', type: 'number' }],
      evaluate: (_inputs, data: { value: number }) => ({
        value: { type: 'number', value: data.value },
      }),
    });
  }
  if (!nodeTypeRegistry.has('testAdd')) {
    registerNodeType({
      type: 'testAdd',
      label: 'Test Add',
      category: 'generator',
      inputs: [
        { id: 'a', label: 'A', type: 'number' },
        { id: 'b', label: 'B', type: 'number' },
      ],
      outputs: [{ id: 'value', label: 'Value', type: 'number' }],
      evaluate: (inputs, data: { a?: number; b?: number }) => ({
        value: {
          type: 'number',
          value: asNumber(inputs.a, data.a ?? 0) + asNumber(inputs.b, data.b ?? 0),
        },
      }),
    });
  }
});

describe('evaluateGraph', () => {
  it('propagates values through connected edges in topological order', () => {
    const nodes: GraphNode[] = [
      { id: 'src1', type: 'testSource', data: { value: 3 } },
      { id: 'src2', type: 'testSource', data: { value: 4 } },
      { id: 'add', type: 'testAdd', data: {} },
    ];
    const edges: GraphEdge[] = [
      { source: 'src1', sourceHandle: 'value', target: 'add', targetHandle: 'a' },
      { source: 'src2', sourceHandle: 'value', target: 'add', targetHandle: 'b' },
    ];

    const result = evaluateGraph(nodes, edges);
    expect(result.get('add')?.value).toEqual({ type: 'number', value: 7 });
  });

  it('falls back to the node literal data value for unconnected sockets', () => {
    const nodes: GraphNode[] = [{ id: 'add', type: 'testAdd', data: { a: 10, b: 5 } }];
    const result = evaluateGraph(nodes, []);
    expect(result.get('add')?.value).toEqual({ type: 'number', value: 15 });
  });

  it('mixes a connected input with an unconnected literal fallback', () => {
    const nodes: GraphNode[] = [
      { id: 'src1', type: 'testSource', data: { value: 3 } },
      { id: 'add', type: 'testAdd', data: { b: 100 } },
    ];
    const edges: GraphEdge[] = [
      { source: 'src1', sourceHandle: 'value', target: 'add', targetHandle: 'a' },
    ];

    const result = evaluateGraph(nodes, edges);
    expect(result.get('add')?.value).toEqual({ type: 'number', value: 103 });
  });

  it('throws GraphCycleError when the graph contains a cycle', () => {
    const nodes: GraphNode[] = [
      { id: 'a', type: 'testAdd', data: {} },
      { id: 'b', type: 'testAdd', data: {} },
    ];
    const edges: GraphEdge[] = [
      { source: 'a', sourceHandle: 'value', target: 'b', targetHandle: 'a' },
      { source: 'b', sourceHandle: 'value', target: 'a', targetHandle: 'a' },
    ];

    expect(() => evaluateGraph(nodes, edges)).toThrow(GraphCycleError);
  });
});
