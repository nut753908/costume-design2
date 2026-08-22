import { describe, expect, it, beforeAll } from 'vitest';
import * as THREE from 'three';
import { evaluateGraph, GraphCycleError, hasCycle } from './evaluateGraph';
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
      createDefaultData: () => ({ value: 0 }),
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
      createDefaultData: () => ({}),
      evaluate: (inputs, data: { a?: number; b?: number }) => ({
        value: {
          type: 'number',
          value: asNumber(inputs.a, data.a ?? 0) + asNumber(inputs.b, data.b ?? 0),
        },
      }),
    });
  }
  if (!nodeTypeRegistry.has('testDynamicProbe')) {
    registerNodeType({
      type: 'testDynamicProbe',
      label: 'Test Dynamic Probe',
      category: 'generator',
      // 静的な inputs は意図的に空にする。もし evaluateGraph が def.inputs を直接見て
      // いたら(resolveNodeSockets 経由でなければ)、data.exposedInputs で 'c' を
      // 追加してもこのノードは絶対に 'c' を解決できない。
      inputs: [],
      outputs: [{ id: 'cPresent', label: 'C Present', type: 'number' }],
      createDefaultData: () => ({}),
      evaluate: (inputs) => ({ cPresent: { type: 'number', value: inputs.c ? 1 : 0 } }),
    });
  }
  if (!nodeTypeRegistry.has('testColorSink')) {
    registerNodeType({
      type: 'testColorSink',
      label: 'Test Color Sink',
      category: 'generator',
      inputs: [{ id: 'color', label: 'Color', type: 'color' }],
      outputs: [{ id: 'color', label: 'Color', type: 'color' }],
      createDefaultData: () => ({}),
      // 受け取った color ソケットの値をそのまま素通しする — literalSocketValue が
      // 未接続ソケットを正しく THREE.Color に変換しているかをテストから覗くための道具。
      evaluate: (inputs) => ({ color: inputs.color! }),
    });
  }
});

describe('evaluateGraph', () => {
  it('接続されたエッジを通じてトポロジカル順に値を伝播する', () => {
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

  it('未接続のソケットはノード自身のリテラルな data 値にフォールバックする', () => {
    const nodes: GraphNode[] = [{ id: 'add', type: 'testAdd', data: { a: 10, b: 5 } }];
    const result = evaluateGraph(nodes, []);
    expect(result.get('add')?.value).toEqual({ type: 'number', value: 15 });
  });

  it('未接続の color ソケットは data のリテラルな hex 文字列を THREE.Color に変換してフォールバックする', () => {
    const nodes: GraphNode[] = [{ id: 'sink', type: 'testColorSink', data: { color: '#336699' } }];
    const result = evaluateGraph(nodes, []);
    expect(result.get('sink')?.color).toEqual({ type: 'color', value: new THREE.Color('#336699') });
  });

  it('接続された入力と未接続のリテラルフォールバックが混在しても動作する', () => {
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

  it('グラフに循環がある場合は GraphCycleError を投げる', () => {
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

  it('data.exposedInputs があれば型の静的な inputs ではなくそちらでソケットを解決する(グループノードの動的ソケット用)', () => {
    // testDynamicProbe の静的な inputs は空だが、この特定のノードインスタンスは
    // data.exposedInputs で 'c' という新しいソケットを動的に公開している。
    const nodesConnected: GraphNode[] = [
      { id: 'src1', type: 'testSource', data: { value: 9 } },
      { id: 'probe', type: 'testDynamicProbe', data: { exposedInputs: [{ id: 'c', label: 'C', type: 'number' }] } },
    ];
    const edges: GraphEdge[] = [{ source: 'src1', sourceHandle: 'value', target: 'probe', targetHandle: 'c' }];
    expect(evaluateGraph(nodesConnected, edges).get('probe')?.cPresent).toEqual({ type: 'number', value: 1 });

    // exposedInputs が無ければ(型の静的 inputs が空のままなので)同じエッジがあっても
    // 'c' は解決されない ― 上のケースが「無条件でtrueになる」だけのテストになっていないことの確認。
    const nodesWithoutExposed: GraphNode[] = [
      { id: 'src1', type: 'testSource', data: { value: 9 } },
      { id: 'probe', type: 'testDynamicProbe', data: {} },
    ];
    expect(evaluateGraph(nodesWithoutExposed, edges).get('probe')?.cPresent).toEqual({ type: 'number', value: 0 });
  });

  it('存在しないノードを参照するエッジ(削除済みノードの残骸など)は無視して評価を続ける', () => {
    const nodes: GraphNode[] = [
      { id: 'src1', type: 'testSource', data: { value: 3 } },
      { id: 'add', type: 'testAdd', data: { b: 100 } },
    ];
    const edges: GraphEdge[] = [
      { source: 'src1', sourceHandle: 'value', target: 'add', targetHandle: 'a' },
      { source: 'ghost', sourceHandle: 'value', target: 'add', targetHandle: 'b' },
    ];

    const result = evaluateGraph(nodes, edges);
    expect(result.get('add')?.value).toEqual({ type: 'number', value: 103 });
  });
});

describe('hasCycle', () => {
  it('循環が無ければ false を返す', () => {
    const nodes = [{ id: 'a' }, { id: 'b' }];
    const edges = [{ source: 'a', target: 'b' }];
    expect(hasCycle(nodes, edges)).toBe(false);
  });

  it('循環があれば true を返す(evaluateGraph が GraphCycleError を投げるのと同じ定義)', () => {
    const nodes = [{ id: 'a' }, { id: 'b' }];
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'a' },
    ];
    expect(hasCycle(nodes, edges)).toBe(true);
  });

  it('新しいエッジを1本加えるだけで循環になるケースを検出できる(接続時の事前チェック用途)', () => {
    const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const existingEdges = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
    ];
    expect(hasCycle(nodes, existingEdges)).toBe(false);

    const candidateEdges = [...existingEdges, { source: 'c', target: 'a' }];
    expect(hasCycle(nodes, candidateEdges)).toBe(true);
  });
});
