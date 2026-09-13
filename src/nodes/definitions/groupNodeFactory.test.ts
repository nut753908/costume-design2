import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { getNodeType, nodeTypeRegistry, registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { defineGroupNode } from './groupNodeFactory';
import './groupInput';
import './groupOutput';
import './numberMultiply';
import './sceneOutput';

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

  it('内部に sceneOutput ノードを置いて geometry+material を配線すると、sceneOutputGeometry0/sceneOutputMaterial0 として外部出力に転送される', () => {
    if (!nodeTypeRegistry.has('groupFactoryTestMeshSource')) {
      registerNodeType({
        type: 'groupFactoryTestMeshSource',
        label: 'Test Mesh Source',
        category: 'generator',
        inputs: [],
        outputs: [
          { id: 'geometry', label: 'Geometry', type: 'geometry' },
          { id: 'material', label: 'Material', type: 'material' },
        ],
        createDefaultData: () => ({}),
        evaluate: (): Record<string, SocketValue> => ({
          geometry: { type: 'geometry', value: {} as THREE.BufferGeometry },
          material: { type: 'material', value: {} as THREE.Material },
        }),
      });
    }

    const { internalNodes, internalEdges } = buildInternalGraph();
    const withSceneOutput = {
      internalNodes: [
        ...internalNodes,
        { id: 'meshSource', type: 'groupFactoryTestMeshSource', data: {} },
        { id: 'sceneOut', type: 'sceneOutput', data: {} },
      ],
      internalEdges: [
        ...internalEdges,
        { source: 'meshSource', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
        { source: 'meshSource', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
      ],
    };
    if (!nodeTypeRegistry.has('groupFactoryTestGroupWithSceneOutput')) {
      defineGroupNode({
        type: 'groupFactoryTestGroupWithSceneOutput',
        label: 'Test Group (internal sceneOutput)',
        ...withSceneOutput,
      });
    }

    const result = getNodeType('groupFactoryTestGroupWithSceneOutput').evaluate({}, {});
    expect(result.sceneOutputGeometry0).toEqual({ type: 'geometry', value: {} });
    expect(result.sceneOutputMaterial0).toEqual({ type: 'material', value: {} });
    expect(result.sceneOutputGeometry1).toBeUndefined(); // sceneOutput は1つしか無い。
    // sceneOutputGeometry0/sceneOutputMaterial0 は groupOutput 経由の通常出力とは独立している。
    expect(result.doubledRadius).toBeDefined();
  });

  it('sceneOutput ノードが内部に無ければ、sceneOutputGeometry0/sceneOutputMaterial0 は現れない', () => {
    const result = getNodeType('groupFactoryTestGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0).toBeUndefined();
    expect(result.sceneOutputMaterial0).toBeUndefined();
  });

  it('内部の sceneOutput が geometry/material 片方しか受け取っていなければ転送されない', () => {
    const { internalNodes, internalEdges } = buildInternalGraph();
    const withPartialSceneOutput = {
      internalNodes: [
        ...internalNodes,
        { id: 'meshSource', type: 'groupFactoryTestMeshSource', data: {} },
        { id: 'sceneOut', type: 'sceneOutput', data: {} },
      ],
      internalEdges: [
        ...internalEdges,
        // material だけ配線し、geometry は未接続のままにする。
        { source: 'meshSource', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
      ],
    };
    if (!nodeTypeRegistry.has('groupFactoryTestGroupPartialSceneOutput')) {
      defineGroupNode({
        type: 'groupFactoryTestGroupPartialSceneOutput',
        label: 'Test Group (partial internal sceneOutput)',
        ...withPartialSceneOutput,
      });
    }

    const result = getNodeType('groupFactoryTestGroupPartialSceneOutput').evaluate({}, {});
    expect(result.sceneOutputGeometry0).toBeUndefined();
    expect(result.sceneOutputMaterial0).toBeUndefined();
  });

  it('1つのグループの中に sceneOutput を複数置くと、それぞれ独立したインデックスで転送される', () => {
    const { internalNodes, internalEdges } = buildInternalGraph();
    const withTwoSceneOutputs = {
      internalNodes: [
        ...internalNodes,
        { id: 'meshSourceA', type: 'groupFactoryTestMeshSource', data: {} },
        { id: 'meshSourceB', type: 'groupFactoryTestMeshSource', data: {} },
        { id: 'sceneOutA', type: 'sceneOutput', data: {} },
        { id: 'sceneOutB', type: 'sceneOutput', data: {} },
      ],
      internalEdges: [
        ...internalEdges,
        { source: 'meshSourceA', sourceHandle: 'geometry', target: 'sceneOutA', targetHandle: 'geometry' },
        { source: 'meshSourceA', sourceHandle: 'material', target: 'sceneOutA', targetHandle: 'material' },
        { source: 'meshSourceB', sourceHandle: 'geometry', target: 'sceneOutB', targetHandle: 'geometry' },
        { source: 'meshSourceB', sourceHandle: 'material', target: 'sceneOutB', targetHandle: 'material' },
      ],
    };
    if (!nodeTypeRegistry.has('groupFactoryTestGroupWithTwoSceneOutputs')) {
      defineGroupNode({
        type: 'groupFactoryTestGroupWithTwoSceneOutputs',
        label: 'Test Group (2 internal sceneOutputs)',
        ...withTwoSceneOutputs,
      });
    }

    const result = getNodeType('groupFactoryTestGroupWithTwoSceneOutputs').evaluate({}, {});
    expect(result.sceneOutputGeometry0).toEqual({ type: 'geometry', value: {} });
    expect(result.sceneOutputMaterial0).toEqual({ type: 'material', value: {} });
    expect(result.sceneOutputGeometry1).toEqual({ type: 'geometry', value: {} });
    expect(result.sceneOutputMaterial1).toEqual({ type: 'material', value: {} });
    expect(result.sceneOutputGeometry2).toBeUndefined(); // sceneOutput は2つしか無い。
  });

  it('多段ネスト: 複数の sceneOutput を持つ子グループを埋め込むと、親グループでもすべて0から振り直されて転送される', () => {
    // このテスト専用の、他のテストの登録に依存しない自己完結したグループを組む。孫にあたる
    // グループが sceneOutput を2つ持ち、それを何も持たない親グループの内部に1つだけ埋め込む。
    if (!nodeTypeRegistry.has('groupFactoryTestGrandchildGroupWithTwoSceneOutputs')) {
      defineGroupNode({
        type: 'groupFactoryTestGrandchildGroupWithTwoSceneOutputs',
        label: 'Test Grandchild Group (2 sceneOutputs)',
        internalNodes: [
          {
            id: 'sceneOutA',
            type: 'sceneOutput',
            data: { geometry: {} as THREE.BufferGeometry, material: {} as THREE.Material },
          },
          {
            id: 'sceneOutB',
            type: 'sceneOutput',
            data: { geometry: {} as THREE.BufferGeometry, material: {} as THREE.Material },
          },
        ],
        internalEdges: [],
      });
    }
    if (!nodeTypeRegistry.has('groupFactoryTestParentOfTwoSceneOutputs')) {
      defineGroupNode({
        type: 'groupFactoryTestParentOfTwoSceneOutputs',
        label: 'Test Parent Group (nests 2 sceneOutputs)',
        internalNodes: [{ id: 'child', type: 'groupFactoryTestGrandchildGroupWithTwoSceneOutputs', data: {} }],
        internalEdges: [],
      });
    }

    const result = getNodeType('groupFactoryTestParentOfTwoSceneOutputs').evaluate({}, {});
    expect(result.sceneOutputGeometry0).toEqual({ type: 'geometry', value: {} });
    expect(result.sceneOutputMaterial0).toEqual({ type: 'material', value: {} });
    expect(result.sceneOutputGeometry1).toEqual({ type: 'geometry', value: {} });
    expect(result.sceneOutputMaterial1).toEqual({ type: 'material', value: {} });
    expect(result.sceneOutputGeometry2).toBeUndefined();
  });

  it('多段ネスト: 孫グループの内部 sceneOutput が、間の子グループを2階層以上またいで祖先グループまで転送される', () => {
    // このテスト専用に、他のテストの登録に依存しない自己完結した「孫」グループを用意する
    // (`groupFactoryTestGroupWithSceneOutput` など他のテストが登録するグループ型は使わない —
    // このテストだけを実行しても、他のテストの実行順序が変わっても成立するようにするため)。
    // sceneOutput ノード自身の data に geometry/material のリテラル値を直接持たせれば、
    // 生成ノードを挟まずに「geometry+material が解決済みの sceneOutput」を用意できる
    // (evaluateGraph() は未接続ソケットをノード自身の data 値にフォールバックさせる —
    // nodes/CLAUDE.md の evaluateGraph の節参照)。
    if (!nodeTypeRegistry.has('groupFactoryTestGrandchildGroup')) {
      defineGroupNode({
        type: 'groupFactoryTestGrandchildGroup',
        label: 'Test Grandchild Group',
        internalNodes: [
          {
            id: 'sceneOut',
            type: 'sceneOutput',
            data: { geometry: {} as THREE.BufferGeometry, material: {} as THREE.Material },
          },
        ],
        internalEdges: [],
      });
    }
    // 子・親グループはどちらも自分自身の sceneOutput を持たない — 孫が解決した
    // sceneOutputGeometry0/sceneOutputMaterial0 を findResolvedSceneOutputs() がそのまま
    // 見つけて転送するだけで、階層の深さに関わらず動くことを確認する。
    if (!nodeTypeRegistry.has('groupFactoryTestChildGroup')) {
      defineGroupNode({
        type: 'groupFactoryTestChildGroup',
        label: 'Test Child Group',
        internalNodes: [{ id: 'grandchild', type: 'groupFactoryTestGrandchildGroup', data: {} }],
        internalEdges: [],
      });
    }
    if (!nodeTypeRegistry.has('groupFactoryTestParentGroup')) {
      defineGroupNode({
        type: 'groupFactoryTestParentGroup',
        label: 'Test Parent Group',
        internalNodes: [{ id: 'child', type: 'groupFactoryTestChildGroup', data: {} }],
        internalEdges: [],
      });
    }

    const result = getNodeType('groupFactoryTestParentGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0).toEqual({ type: 'geometry', value: {} });
    expect(result.sceneOutputMaterial0).toEqual({ type: 'material', value: {} });
  });

  it('groupOutput ノードも groupInput と同様に省略でき、外部出力は0個になる(既存15種のガーメントの実例)', () => {
    const { internalNodes, internalEdges } = buildInternalGraph();
    const withoutOutput = {
      internalNodes: internalNodes.filter((n) => n.type !== 'groupOutput'),
      internalEdges: internalEdges.filter((e) => e.target !== 'output'),
    };
    if (!nodeTypeRegistry.has('groupFactoryTestGroupNoOutput')) {
      defineGroupNode({
        type: 'groupFactoryTestGroupNoOutput',
        label: 'Test Group (no groupOutput)',
        ...withoutOutput,
      });
    }
    const def = getNodeType('groupFactoryTestGroupNoOutput');
    expect(def.outputs).toEqual([]);

    // groupOutput 自体が無いので、外部出力は常に空オブジェクトになる。
    expect(def.evaluate({}, {})).toEqual({});
  });
});
