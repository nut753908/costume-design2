import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { getNodeType, nodeTypeRegistry, registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { defineGroupNode } from './groupNodeFactory';
import './groupInput';
import './groupOutput';
import './numberMultiply';

// テスト専用の中間ノード型。geometry/material のような実ノードを持ち込まずに、
// 「groupOutput に配線されたキーだけが外部出力になり、配線されていないキーは転送されない」
// ことを検証するための最小限のスタブ。
function registerTestMiddle() {
  if (nodeTypeRegistry.has('groupFactoryTestMiddle')) return;
  registerNodeType({
    type: 'groupFactoryTestMiddle',
    label: 'Test Middle',
    category: 'generator',
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
      // groupOutput のどのソケットにも配線しないキー。
      unlisted: { type: 'number', value: 999 },
    }),
  });
}

function buildInternalGraph() {
  return {
    internalNodes: [
      {
        id: 'input',
        type: 'groupInput',
        data: {
          sockets: [
            { id: 'radius', label: 'Radius', type: 'number', default: 2 },
            { id: 'color', label: 'Color', type: 'color', default: '#112233' },
            { id: 'mode', label: 'Mode', type: 'enum', default: 'a' },
          ],
        },
      },
      { id: 'double', type: 'numberMultiply', data: { factor: 2 } },
      { id: 'middle', type: 'groupFactoryTestMiddle', data: {} },
      {
        id: 'output',
        type: 'groupOutput',
        data: {
          sockets: [
            { id: 'doubledRadius', label: 'Doubled Radius', type: 'number' },
            { id: 'tint', label: 'Tint', type: 'color' },
            { id: 'mode', label: 'Mode', type: 'enum' },
          ],
        },
      },
    ],
    internalEdges: [
      { source: 'input', sourceHandle: 'radius', target: 'double', targetHandle: 'value' },
      { source: 'double', sourceHandle: 'value', target: 'middle', targetHandle: 'radius' },
      { source: 'input', sourceHandle: 'color', target: 'middle', targetHandle: 'color' },
      { source: 'input', sourceHandle: 'mode', target: 'middle', targetHandle: 'mode' },
      { source: 'middle', sourceHandle: 'doubledRadius', target: 'output', targetHandle: 'doubledRadius' },
      { source: 'middle', sourceHandle: 'tint', target: 'output', targetHandle: 'tint' },
      { source: 'middle', sourceHandle: 'mode', target: 'output', targetHandle: 'mode' },
    ],
  };
}

describe('defineGroupNode', () => {
  beforeAll(() => {
    registerTestMiddle();

    if (!nodeTypeRegistry.has('groupFactoryTestGroup')) {
      const { internalNodes, internalEdges } = buildInternalGraph();
      defineGroupNode({
        type: 'groupFactoryTestGroup',
        label: 'Test Group',
        internalNodes,
        internalEdges,
      });
    }
  });

  it('登録時に internalNodes 内の groupInput/groupOutput ノードの sockets から静的な inputs/outputs を導出する', () => {
    const def = getNodeType('groupFactoryTestGroup');
    expect(def.inputs).toEqual([
      { id: 'radius', label: 'Radius', type: 'number' },
      { id: 'color', label: 'Color', type: 'color' },
      { id: 'mode', label: 'Mode', type: 'enum' },
    ]);
    expect(def.outputs).toEqual([
      { id: 'doubledRadius', label: 'Doubled Radius', type: 'number' },
      { id: 'tint', label: 'Tint', type: 'color' },
      { id: 'mode', label: 'Mode', type: 'enum' },
    ]);
  });

  it('createDefaultData は internalNodes/internalEdges のクローンを返す', () => {
    const data = getNodeType('groupFactoryTestGroup').createDefaultData() as {
      nodes: { id: string }[];
      edges: { id: string }[];
    };
    expect(data.nodes.map((n) => n.id).sort()).toEqual(['double', 'input', 'middle', 'output']);
    expect(data.edges).toHaveLength(7);
  });

  it('createDefaultData は呼ぶたびに独立した参照を返す(インスタンス間で共有されない)', () => {
    const def = getNodeType('groupFactoryTestGroup');
    const a = def.createDefaultData() as { nodes: unknown[] };
    const b = def.createDefaultData() as { nodes: unknown[] };
    expect(a.nodes).not.toBe(b.nodes);
    expect(a.nodes[0]).not.toBe(b.nodes[0]);
  });

  it('data.nodes があればそちらを優先する(インスタンスごとの編集内容)', () => {
    const data = getNodeType('groupFactoryTestGroup').createDefaultData() as {
      nodes: { id: string; type: string; data: Record<string, unknown> }[];
      edges: unknown[];
    };
    // このインスタンスだけ groupInput の radius デフォルトを書き換える(中に入って編集した想定)。
    data.nodes = data.nodes.map((n) =>
      n.id === 'input'
        ? { ...n, data: { sockets: (n.data.sockets as { id: string }[]).map((s) => (s.id === 'radius' ? { ...s, default: 100 } : s)) } }
        : n,
    );

    const result = getNodeType('groupFactoryTestGroup').evaluate({}, data);
    expect(result.doubledRadius).toEqual({ type: 'number', value: 200 }); // 100 * factor(2)
  });

  it('未接続なら groupInput ソケット自身のデフォルト値が使われる', () => {
    const result = getNodeType('groupFactoryTestGroup').evaluate({}, {});
    expect(result.doubledRadius).toEqual({ type: 'number', value: 4 }); // radius(2) * factor(2)
    expect(result.tint).toEqual({ type: 'color', value: new THREE.Color('#112233') });
    expect(result.mode).toEqual({ type: 'enum', value: 'a' });
  });

  it('接続された入力値が groupInput ノードへ注入される(任意のソケット型)', () => {
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
  });

  it('groupOutput のどのソケットにも配線されていないキーは外部出力に含まれない', () => {
    const result = getNodeType('groupFactoryTestGroup').evaluate({}, {});
    expect(result.unlisted).toBeUndefined();
  });

  it('groupInput ノードが無くても登録でき、外部入力は0個になる(hat/bag/necktie/glasses の実例)', () => {
    const { internalNodes, internalEdges } = buildInternalGraph();
    const withoutInput = {
      internalNodes: internalNodes.filter((n) => n.type !== 'groupInput'),
      internalEdges: internalEdges.filter((e) => e.source !== 'input'),
    };
    if (!nodeTypeRegistry.has('groupFactoryTestGroupNoInput')) {
      defineGroupNode({
        type: 'groupFactoryTestGroupNoInput',
        label: 'Test Group (no groupInput)',
        ...withoutInput,
      });
    }
    const def = getNodeType('groupFactoryTestGroupNoInput');
    expect(def.inputs).toEqual([]);

    // groupInput 自体が無いので、注入先が無く外部からの値は評価結果に一切影響しない。
    const withExternalInput = def.evaluate({ radius: { type: 'number', value: 999 } }, {});
    const withoutExternalInput = def.evaluate({}, {});
    expect(withExternalInput).toEqual(withoutExternalInput);
  });

  it('groupOutput ノードが無いと登録時に例外を投げる', () => {
    const { internalNodes, internalEdges } = buildInternalGraph();
    const withoutOutput = {
      internalNodes: internalNodes.filter((n) => n.type !== 'groupOutput'),
      internalEdges: internalEdges.filter((e) => e.target !== 'output'),
    };
    expect(() =>
      defineGroupNode({
        type: 'groupFactoryTestGroupNoOutput',
        label: 'Invalid',
        ...withoutOutput,
      }),
    ).toThrow(/groupOutput/);
  });
});
