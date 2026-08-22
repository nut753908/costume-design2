import { beforeAll, describe, expect, it } from 'vitest';
import { nodeTypeRegistry, registerNodeType } from './registry';
import { resolveNodeSockets } from './resolveNodeSockets';

beforeAll(() => {
  if (!nodeTypeRegistry.has('testResolveSocketsType')) {
    registerNodeType({
      type: 'testResolveSocketsType',
      label: 'Test',
      category: 'generator',
      inputs: [{ id: 'a', label: 'A', type: 'number' }],
      outputs: [{ id: 'out', label: 'Out', type: 'number' }],
      createDefaultData: () => ({}),
      evaluate: () => ({}),
    });
  }
});

describe('resolveNodeSockets', () => {
  it('data.exposedInputs/exposedOutputs が無ければ型の静的な inputs/outputs を返す', () => {
    const result = resolveNodeSockets('testResolveSocketsType', {});
    expect(result.inputs).toEqual([{ id: 'a', label: 'A', type: 'number' }]);
    expect(result.outputs).toEqual([{ id: 'out', label: 'Out', type: 'number' }]);
  });

  it('data.exposedInputs/exposedOutputs があればそちらを優先する', () => {
    const result = resolveNodeSockets('testResolveSocketsType', {
      exposedInputs: [{ id: 'b', label: 'B', type: 'color', internalNodeId: 'x', internalDataKey: 'hex' }],
      exposedOutputs: [{ id: 'c', label: 'C', type: 'material', internalNodeId: 'y', internalSocketId: 'material' }],
    });
    expect(result.inputs).toEqual([{ id: 'b', label: 'B', type: 'color' }]);
    expect(result.outputs).toEqual([{ id: 'c', label: 'C', type: 'material' }]);
  });

  it('data.exposedInputs が配列でなければ型の静的な inputs にフォールバックする', () => {
    const result = resolveNodeSockets('testResolveSocketsType', { exposedInputs: 'not-an-array' });
    expect(result.inputs).toEqual([{ id: 'a', label: 'A', type: 'number' }]);
  });

  it('片方だけ data にあれば、その片方だけ優先し、もう片方は型のフォールバックのまま', () => {
    const result = resolveNodeSockets('testResolveSocketsType', {
      exposedInputs: [{ id: 'b', label: 'B', type: 'number', internalNodeId: 'x', internalDataKey: 'value' }],
    });
    expect(result.inputs).toEqual([{ id: 'b', label: 'B', type: 'number' }]);
    expect(result.outputs).toEqual([{ id: 'out', label: 'Out', type: 'number' }]);
  });
});
