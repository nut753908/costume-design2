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
  if (!nodeTypeRegistry.has('testResolveSocketsGroup')) {
    registerNodeType({
      type: 'testResolveSocketsGroup',
      label: 'Test Group',
      category: 'group',
      inputs: [{ id: 'staticIn', label: 'Static In', type: 'number' }],
      outputs: [{ id: 'staticOut', label: 'Static Out', type: 'number' }],
      createDefaultData: () => ({}),
      evaluate: () => ({}),
    });
  }
});

describe('resolveNodeSockets', () => {
  it('通常のノードタイプは型の静的な inputs/outputs を返す', () => {
    const result = resolveNodeSockets('testResolveSocketsType', {});
    expect(result.inputs).toEqual([{ id: 'a', label: 'A', type: 'number' }]);
    expect(result.outputs).toEqual([{ id: 'out', label: 'Out', type: 'number' }]);
  });

  it('type: groupInput は data.sockets を動的な出力ソケット一覧として返す(入力は常に空)', () => {
    const result = resolveNodeSockets('groupInput', {
      sockets: [
        { id: 'x', label: 'X', type: 'number' },
        { id: 'y', label: 'Y', type: 'color' },
      ],
    });
    expect(result.inputs).toEqual([]);
    expect(result.outputs).toEqual([
      { id: 'x', label: 'X', type: 'number' },
      { id: 'y', label: 'Y', type: 'color' },
    ]);
  });

  it('type: groupOutput は data.sockets を動的な入力ソケット一覧として返す(出力は常に空)', () => {
    const result = resolveNodeSockets('groupOutput', {
      sockets: [{ id: 'z', label: 'Z', type: 'material' }],
    });
    expect(result.inputs).toEqual([{ id: 'z', label: 'Z', type: 'material' }]);
    expect(result.outputs).toEqual([]);
  });

  it('type: groupInput/groupOutput で data.sockets が配列でなければ空配列にフォールバックする', () => {
    expect(resolveNodeSockets('groupInput', {}).outputs).toEqual([]);
    expect(resolveNodeSockets('groupOutput', { sockets: 'not-an-array' }).inputs).toEqual([]);
  });

  it('category: group のノードは、実体化済みの data.nodes 内にある groupInput/groupOutput の sockets を外部ソケットとして転送する', () => {
    const result = resolveNodeSockets('testResolveSocketsGroup', {
      nodes: [
        { type: 'groupInput', data: { sockets: [{ id: 'innerIn', label: 'Inner In', type: 'number' }] } },
        { type: 'groupOutput', data: { sockets: [{ id: 'innerOut', label: 'Inner Out', type: 'geometry' }] } },
        { type: 'someOtherType', data: {} },
      ],
    });
    expect(result.inputs).toEqual([{ id: 'innerIn', label: 'Inner In', type: 'number' }]);
    expect(result.outputs).toEqual([{ id: 'innerOut', label: 'Inner Out', type: 'geometry' }]);
  });

  it('category: group のノードで data.nodes が未実体化なら型の静的な inputs/outputs にフォールバックする', () => {
    const result = resolveNodeSockets('testResolveSocketsGroup', {});
    expect(result.inputs).toEqual([{ id: 'staticIn', label: 'Static In', type: 'number' }]);
    expect(result.outputs).toEqual([{ id: 'staticOut', label: 'Static Out', type: 'number' }]);
  });

  it('category: group のノードで data.nodes 内に groupInput/groupOutput が無ければ、その側だけ型の静的な inputs/outputs にフォールバックする', () => {
    const result = resolveNodeSockets('testResolveSocketsGroup', {
      nodes: [{ type: 'someOtherType', data: {} }],
    });
    expect(result.inputs).toEqual([{ id: 'staticIn', label: 'Static In', type: 'number' }]);
    expect(result.outputs).toEqual([{ id: 'staticOut', label: 'Static Out', type: 'number' }]);
  });
});
