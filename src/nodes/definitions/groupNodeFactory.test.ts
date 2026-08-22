import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { getNodeType, nodeTypeRegistry, registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { defineGroupNode } from './groupNodeFactory';
import './numberInput';
import './colorInput';
import './enumInput';
import './numberMultiply';

// テスト専用の「終端」ノード型。geometry/material のような実ノードを持ち込まずに、
// - 宣言されていない追加キー(garmentOutput の anchor/offsetY 相当)を返す
// - config.outputs 経由で別ノードの出力も追加公開できる
// ことを検証するための最小限のスタブ。
function registerTestTerminal() {
  if (nodeTypeRegistry.has('groupFactoryTestTerminal')) return;
  registerNodeType({
    type: 'groupFactoryTestTerminal',
    label: 'Test Terminal',
    category: 'output',
    inputs: [
      { id: 'radius', label: 'Radius', type: 'number' },
      { id: 'color', label: 'Color', type: 'color' },
      { id: 'mode', label: 'Mode', type: 'enum' },
    ],
    outputs: [],
    createDefaultData: () => ({}),
    evaluate: (inputs): Record<string, SocketValue> => ({
      doubledRadius: inputs.radius ?? { type: 'number', value: -1 },
      tint: inputs.color ?? { type: 'color', value: new THREE.Color('#000000') },
      mode: inputs.mode ?? { type: 'enum', value: '?' },
      // outputs/terminalNodeId のどちらにも宣言していないキー。
      unlisted: { type: 'number', value: 999 },
    }),
  });
}

function buildInternalGraph() {
  return {
    internalNodes: [
      { id: 'radiusIn', type: 'numberInput', data: { value: 2 } },
      { id: 'colorIn', type: 'colorInput', data: { hex: '#112233' } },
      { id: 'modeIn', type: 'enumInput', data: { value: 'a' } },
      { id: 'double', type: 'numberMultiply', data: { factor: 2 } },
      { id: 'terminal', type: 'groupFactoryTestTerminal', data: {} },
    ],
    internalEdges: [
      { source: 'radiusIn', sourceHandle: 'value', target: 'double', targetHandle: 'value' },
      { source: 'double', sourceHandle: 'value', target: 'terminal', targetHandle: 'radius' },
      { source: 'colorIn', sourceHandle: 'color', target: 'terminal', targetHandle: 'color' },
      { source: 'modeIn', sourceHandle: 'value', target: 'terminal', targetHandle: 'mode' },
    ],
  };
}

describe('defineGroupNode', () => {
  beforeAll(() => {
    registerTestTerminal();

    if (!nodeTypeRegistry.has('groupFactoryTestGroup')) {
      const { internalNodes, internalEdges } = buildInternalGraph();
      defineGroupNode({
        type: 'groupFactoryTestGroup',
        label: 'Test Group',
        inputs: [
          { id: 'radius', label: 'Radius', type: 'number', internalNodeId: 'radiusIn', internalDataKey: 'value' },
          { id: 'color', label: 'Color', type: 'color', internalNodeId: 'colorIn', internalDataKey: 'hex' },
          { id: 'mode', label: 'Mode', type: 'enum', internalNodeId: 'modeIn', internalDataKey: 'value' },
        ],
        outputs: [{ id: 'doubledOnly', label: 'Doubled', type: 'number', internalNodeId: 'double', internalSocketId: 'value' }],
        terminalNodeId: 'terminal',
        internalNodes,
        internalEdges,
      });
    }
  });

  it('createDefaultData は internalNodes/internalEdges/inputs/outputs のクローンを返す', () => {
    const data = getNodeType('groupFactoryTestGroup').createDefaultData() as {
      nodes: { id: string }[];
      edges: { id: string }[];
      exposedInputs: { id: string }[];
      exposedOutputs: { id: string }[];
    };
    expect(data.nodes.map((n) => n.id).sort()).toEqual(
      ['radiusIn', 'colorIn', 'modeIn', 'double', 'terminal'].sort(),
    );
    expect(data.edges).toHaveLength(4);
    expect(data.exposedInputs.map((s) => s.id)).toEqual(['radius', 'color', 'mode']);
    expect(data.exposedOutputs.map((s) => s.id)).toEqual(['doubledOnly']);
  });

  it('createDefaultData は呼ぶたびに独立した参照を返す(インスタンス間で共有されない)', () => {
    const def = getNodeType('groupFactoryTestGroup');
    const a = def.createDefaultData() as { nodes: unknown[] };
    const b = def.createDefaultData() as { nodes: unknown[] };
    expect(a.nodes).not.toBe(b.nodes);
    expect(a.nodes[0]).not.toBe(b.nodes[0]);
  });

  it('data.nodes/data.exposedInputs があればそちらを優先する(インスタンスごとの編集内容)', () => {
    const data = getNodeType('groupFactoryTestGroup').createDefaultData() as {
      nodes: { id: string; data: Record<string, unknown> }[];
      edges: unknown[];
      exposedInputs: unknown[];
      exposedOutputs: unknown[];
    };
    // このインスタンスだけ radiusIn のデフォルト値を書き換える(中に入って編集した想定)。
    data.nodes = data.nodes.map((n) => (n.id === 'radiusIn' ? { ...n, data: { value: 100 } } : n));

    const result = getNodeType('groupFactoryTestGroup').evaluate({}, data);
    expect(result.doubledRadius).toEqual({ type: 'number', value: 200 }); // 100 * factor(2)
  });

  it('未接続なら埋め込みサブグラフ自身のデフォルト値が使われる', () => {
    const result = getNodeType('groupFactoryTestGroup').evaluate({}, {});
    expect(result.doubledRadius).toEqual({ type: 'number', value: 4 }); // radiusIn(2) * factor(2)
    expect(result.tint).toEqual({ type: 'color', value: new THREE.Color('#112233') });
    expect(result.mode).toEqual({ type: 'enum', value: 'a' });
    expect(result.doubledOnly).toEqual({ type: 'number', value: 4 });
  });

  it('接続された入力値が埋め込みサブグラフのプレースホルダーへ注入される(number/color/enum)', () => {
    const result = getNodeType('groupFactoryTestGroup').evaluate(
      {
        radius: { type: 'number', value: 5 },
        color: { type: 'color', value: new THREE.Color('#ff0000') },
        mode: { type: 'enum', value: 'b' },
      },
      {},
    );
    expect(result.doubledRadius).toEqual({ type: 'number', value: 10 });
    expect(result.tint).toEqual({ type: 'color', value: new THREE.Color('#ff0000') });
    expect(result.mode).toEqual({ type: 'enum', value: 'b' });
    expect(result.doubledOnly).toEqual({ type: 'number', value: 10 });
  });

  it('terminalNodeId の宣言されていないキーもそのまま転送される', () => {
    const result = getNodeType('groupFactoryTestGroup').evaluate({}, {});
    expect(result.unlisted).toEqual({ type: 'number', value: 999 });
  });

  it('存在しない internalNodeId を inputs に指定すると登録時に例外を投げる', () => {
    const { internalNodes, internalEdges } = buildInternalGraph();
    expect(() =>
      defineGroupNode({
        type: 'groupFactoryTestInvalidInput',
        label: 'Invalid',
        inputs: [{ id: 'x', label: 'X', type: 'number', internalNodeId: 'doesNotExist', internalDataKey: 'value' }],
        outputs: [],
        terminalNodeId: 'terminal',
        internalNodes,
        internalEdges,
      }),
    ).toThrow(/doesNotExist/);
  });

  it('存在しない internalNodeId を outputs に指定すると登録時に例外を投げる', () => {
    const { internalNodes, internalEdges } = buildInternalGraph();
    expect(() =>
      defineGroupNode({
        type: 'groupFactoryTestInvalidOutput',
        label: 'Invalid',
        inputs: [],
        outputs: [{ id: 'x', label: 'X', type: 'number', internalNodeId: 'doesNotExist', internalSocketId: 'value' }],
        terminalNodeId: 'terminal',
        internalNodes,
        internalEdges,
      }),
    ).toThrow(/doesNotExist/);
  });

  it('存在しない terminalNodeId を指定すると登録時に例外を投げる', () => {
    const { internalNodes, internalEdges } = buildInternalGraph();
    expect(() =>
      defineGroupNode({
        type: 'groupFactoryTestInvalidTerminal',
        label: 'Invalid',
        inputs: [],
        outputs: [],
        terminalNodeId: 'doesNotExist',
        internalNodes,
        internalEdges,
      }),
    ).toThrow(/doesNotExist/);
  });
});
