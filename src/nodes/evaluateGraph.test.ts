import { describe, expect, it, beforeAll } from 'vitest';
import * as THREE from 'three';
import { evaluateGraph, getNodeEvalCacheStats, GraphCycleError, hasCycle, resolveIncomingValue } from './evaluateGraph';
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
  if (!nodeTypeRegistry.has('groupOutput')) {
    // 静的な inputs は意図的に空にする。もし evaluateGraph が def.inputs を直接見て
    // いたら(resolveNodeSockets 経由でなければ)、data.sockets で 'c' を追加しても
    // このノードは絶対に 'c' を解決できない(nodes/definitions/groupOutput.ts の実装を模した最小限のスタブ)。
    registerNodeType({
      type: 'groupOutput',
      label: 'Test Group Output',
      category: 'group-io',
      inputs: [],
      outputs: [],
      createDefaultData: () => ({ sockets: [] }),
      evaluate: (inputs) => inputs,
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
  if (!nodeTypeRegistry.has('testCounter')) {
    registerNodeType({
      type: 'testCounter',
      label: 'Test Counter',
      category: 'generator',
      inputs: [{ id: 'a', label: 'A', type: 'number' }],
      outputs: [{ id: 'value', label: 'Value', type: 'number' }],
      createDefaultData: () => ({}),
      // evaluate() が実際に呼ばれた回数を数えるためだけのノード(下記「ノード単位メモ化」節)。
      evaluate: (inputs) => {
        testCounterCalls++;
        return { value: { type: 'number', value: asNumber(inputs.a, 0) * 2 } };
      },
    });
  }
});

// beforeAll のクロージャから毎回インクリメントされる、testCounter ノードの evaluate() 実行回数。
let testCounterCalls = 0;

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

  it('data.sockets があれば型の静的な inputs ではなくそちらでソケットを解決する(groupOutput ノードの動的ソケット用)', () => {
    // groupOutput の静的な inputs は空だが、この特定のノードインスタンスは
    // data.sockets で 'c' という新しいソケットを動的に公開している。
    const nodesConnected: GraphNode[] = [
      { id: 'src1', type: 'testSource', data: { value: 9 } },
      { id: 'probe', type: 'groupOutput', data: { sockets: [{ id: 'c', label: 'C', type: 'number' }] } },
    ];
    const edges: GraphEdge[] = [{ source: 'src1', sourceHandle: 'value', target: 'probe', targetHandle: 'c' }];
    expect(evaluateGraph(nodesConnected, edges).get('probe')?.c).toEqual({ type: 'number', value: 9 });

    // sockets が無ければ(型の静的 inputs が空のままなので)同じエッジがあっても
    // 'c' は解決されない ― 上のケースが「無条件で通る」だけのテストになっていないことの確認。
    const nodesWithoutSockets: GraphNode[] = [
      { id: 'src1', type: 'testSource', data: { value: 9 } },
      { id: 'probe', type: 'groupOutput', data: {} },
    ];
    expect(evaluateGraph(nodesWithoutSockets, edges).get('probe')?.c).toBeUndefined();
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

// ノード単位のメモ化キャッシュ(evaluateGraph.ts 冒頭のコメント参照)。data 参照が同じ
// (= 編集されていない)かつ解決済み inputs も前回と同じ値なら、evaluate() を呼ばずに前回の
// 結果オブジェクトをそのまま再利用する。src/testSetup.ts の beforeEach がテストごとに
// キャッシュを空にするため、ここでの検証は他のテストの残骸に影響されない。
describe('evaluateGraph のノード単位メモ化', () => {
  it('data 参照・inputs がどちらも前回と同じなら evaluate() を呼ばず、同じ結果オブジェクトを再利用する', () => {
    testCounterCalls = 0;
    const nodes: GraphNode[] = [
      { id: 'src', type: 'testSource', data: { value: 5 } },
      { id: 'counter', type: 'testCounter', data: {} },
    ];
    const edges: GraphEdge[] = [{ source: 'src', sourceHandle: 'value', target: 'counter', targetHandle: 'a' }];

    const first = evaluateGraph(nodes, edges);
    const second = evaluateGraph(nodes, edges);

    expect(testCounterCalls).toBe(1);
    expect(second.get('counter')).toBe(first.get('counter'));
  });

  it('getNodeEvalCacheStats はキャッシュのヒット/ミスを数える', () => {
    const nodes: GraphNode[] = [{ id: 'src', type: 'testSource', data: { value: 1 } }];
    evaluateGraph(nodes, []);
    evaluateGraph(nodes, []);
    expect(getNodeEvalCacheStats()).toEqual({ hits: 1, misses: 1 });
  });

  it('無関係なノードが増えても、data・inputs が変わらないノードは再評価されない', () => {
    testCounterCalls = 0;
    const srcData = { value: 5 };
    const counterData = {};
    const nodesV1: GraphNode[] = [
      { id: 'src', type: 'testSource', data: srcData },
      { id: 'counter', type: 'testCounter', data: counterData },
    ];
    const edges: GraphEdge[] = [{ source: 'src', sourceHandle: 'value', target: 'counter', targetHandle: 'a' }];
    const first = evaluateGraph(nodesV1, edges);

    // src/counter とは無関係な3つ目のノードを追加しただけの、実質的に無関係な変更。
    const nodesV2: GraphNode[] = [
      ...nodesV1,
      { id: 'unrelated', type: 'testSource', data: { value: 999 } },
    ];
    const second = evaluateGraph(nodesV2, edges);

    expect(testCounterCalls).toBe(1);
    expect(second.get('counter')).toBe(first.get('counter'));
  });

  it('上流ノードの data が変わり inputs の値も変わると、キャッシュミスして再評価する', () => {
    testCounterCalls = 0;
    const counterData = {};
    const edges: GraphEdge[] = [{ source: 'src', sourceHandle: 'value', target: 'counter', targetHandle: 'a' }];

    const nodesV1: GraphNode[] = [
      { id: 'src', type: 'testSource', data: { value: 5 } },
      { id: 'counter', type: 'testCounter', data: counterData },
    ];
    const first = evaluateGraph(nodesV1, edges);

    const nodesV2: GraphNode[] = [
      { id: 'src', type: 'testSource', data: { value: 9 } }, // 新しい data オブジェクト、値も変わった
      { id: 'counter', type: 'testCounter', data: counterData }, // counter 自身の data は使い回す
    ];
    const second = evaluateGraph(nodesV2, edges);

    expect(testCounterCalls).toBe(2);
    expect(second.get('counter')).not.toEqual(first.get('counter'));
    expect(second.get('counter')?.value).toEqual({ type: 'number', value: 18 });
  });

  it('data 参照が同じでも、ソケットに現れないフィールドが直接ミューテートされていれば再評価する', () => {
    // testSource は data.value を直接読む(入力ソケットを持たない)ため、inputs の比較だけでは
    // ミューテートを検知できない。data のトップレベルの浅いスナップショットとの比較で検知する。
    const data = { value: 1 };
    const nodes: GraphNode[] = [{ id: 'src', type: 'testSource', data }];

    expect(evaluateGraph(nodes, []).get('src')?.value).toEqual({ type: 'number', value: 1 });
    data.value = 2;
    expect(evaluateGraph(nodes, []).get('src')?.value).toEqual({ type: 'number', value: 2 });
  });

  it('data 参照が同じでも(直接ミューテートされていて)literal な値が変われば再評価する', () => {
    // グループノードの内部サブグラフが data: {} のまま(config.internalNodes に
    // フォールバック)の場合、内部ノードの data はモジュール定数として複数回の
    // evaluate() 呼び出しをまたいで共有されうる(nodes/definitions/groupNodeFactory.ts
    // 参照)。data 参照の一致だけでキャッシュを信用しているわけではないことの確認として、
    // 同じ data オブジェクトを直接ミューテートした場合でも(このアプリの実際の更新経路では
    // 起きないが)正しく再評価されることを見る。
    testCounterCalls = 0;
    const counterData: { a: number } = { a: 3 };
    const nodes: GraphNode[] = [{ id: 'counter', type: 'testCounter', data: counterData }];

    const first = evaluateGraph(nodes, []);
    expect(first.get('counter')?.value).toEqual({ type: 'number', value: 6 });

    counterData.a = 7;
    const second = evaluateGraph(nodes, []);
    expect(second.get('counter')?.value).toEqual({ type: 'number', value: 14 });

    expect(testCounterCalls).toBe(2);
  });
});

describe('resolveIncomingValue', () => {
  it('targetId/targetHandle へ入ってくる接続元の評価済みの値を返す', () => {
    const nodes: GraphNode[] = [{ id: 'src1', type: 'testSource', data: { value: 42 } }];
    const results = evaluateGraph(nodes, []);
    const edges: GraphEdge[] = [{ source: 'src1', sourceHandle: 'value', target: 'group1', targetHandle: 'bodyBuild' }];

    expect(resolveIncomingValue(edges, results, 'group1', 'bodyBuild')).toEqual({ type: 'number', value: 42 });
  });

  it('該当する接続が無ければ undefined を返す(未接続のソケット)', () => {
    const nodes: GraphNode[] = [{ id: 'src1', type: 'testSource', data: { value: 42 } }];
    const results = evaluateGraph(nodes, []);
    const edges: GraphEdge[] = [{ source: 'src1', sourceHandle: 'value', target: 'group1', targetHandle: 'other' }];

    expect(resolveIncomingValue(edges, results, 'group1', 'bodyBuild')).toBeUndefined();
  });

  it('接続元がまだ評価結果に含まれていなければ undefined を返す', () => {
    const results = evaluateGraph([], []);
    const edges: GraphEdge[] = [{ source: 'ghost', sourceHandle: 'value', target: 'group1', targetHandle: 'bodyBuild' }];

    expect(resolveIncomingValue(edges, results, 'group1', 'bodyBuild')).toBeUndefined();
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
