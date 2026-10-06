import { describe, expect, it } from 'vitest';
import './definitions';
import { getNodeType } from './registry';
import { defineGroupNode } from './definitions/groupNodeFactory';
import type { GraphNode } from './types';
import {
  fingerprintGroupStructure,
  getGroupTemplateFingerprint,
  isGroupInstanceStale,
  migrateGroupToTemplate,
} from './groupTemplate';

// groupOutput のソケットが既定値を持つ(入力欄の値がそのまま出力になる)グループ。このテスト専用。
defineGroupNode({
  type: 'testOutputDefaultsGroup',
  label: 'Test Output Defaults',
  internalNodes: [
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [
          { id: 'first', label: 'First', type: 'number', default: 0.1 },
          { id: 'second', label: 'Second', type: 'number', default: 0.25 },
        ],
      },
    },
  ],
  internalEdges: [],
});

const SKIRT_SCALE = 0.17664;
const n = (id: string, type: string, data: Record<string, unknown> = {}): GraphNode => ({ id, type, data });

describe('fingerprintGroupStructure', () => {
  const edges = [{ source: 'a', sourceHandle: 'value', target: 'b', targetHandle: 'value' }];

  it('パラメータの値・並び順が違うだけなら同じ指紋になる', () => {
    const f1 = fingerprintGroupStructure([n('a', 'numberInput', { value: 1 }), n('b', 'numberNegate')], edges);
    const f2 = fingerprintGroupStructure([n('b', 'numberNegate'), n('a', 'numberInput', { value: 9 })], edges);
    expect(f1).toBe(f2);
  });

  it('ノードの型・エッジ・groupInput のソケット構成が変われば指紋が変わる', () => {
    const base = fingerprintGroupStructure([n('a', 'numberInput'), n('b', 'numberNegate')], edges);
    expect(fingerprintGroupStructure([n('a', 'numberInput'), n('b', 'numberHalf')], edges)).not.toBe(base);
    expect(fingerprintGroupStructure([n('a', 'numberInput'), n('b', 'numberNegate')], [])).not.toBe(base);
    const withSocket = (id: string) => fingerprintGroupStructure([n('i', 'groupInput', { sockets: [{ id, type: 'number' }] })], []);
    expect(withSocket('x')).not.toBe(withSocket('y'));
  });
});

describe('isGroupInstanceStale', () => {
  it('実体化前(data.nodes なし)は常に最新', () => {
    expect(isGroupInstanceStale('skirtGroup', {})).toBe(false);
  });

  it('createDefaultData() 直後のインスタンスは最新で、指紋が古ければ stale になる', () => {
    const data = getNodeType('skirtGroup').createDefaultData() as { nodes: GraphNode[]; templateFingerprint: string };
    expect(data.templateFingerprint).toBe(getGroupTemplateFingerprint('skirtGroup'));
    expect(isGroupInstanceStale('skirtGroup', data)).toBe(false);
    expect(isGroupInstanceStale('skirtGroup', { ...data, templateFingerprint: 'deadbeef' })).toBe(true);
  });

  it('指紋を持たない古いインスタンスは、内部構造そのものの指紋で比較する', () => {
    const data = getNodeType('skirtGroup').createDefaultData() as { nodes: GraphNode[]; edges: never[] };
    expect(isGroupInstanceStale('skirtGroup', { nodes: data.nodes, edges: data.edges })).toBe(false);
    expect(isGroupInstanceStale('skirtGroup', { nodes: data.nodes.slice(1), edges: data.edges })).toBe(true);
  });

  it('ユーザーが値だけ編集しても(構造が同じなら)stale にならない', () => {
    const data = getNodeType('skirtGroup').createDefaultData() as { nodes: GraphNode[]; templateFingerprint: string };
    const edited = data.nodes.map((node) => (node.id === 'scale' ? { ...node, data: { ...node.data, value: 0.5 } } : node));
    expect(isGroupInstanceStale('skirtGroup', { ...data, nodes: edited })).toBe(false);
  });
});

describe('migrateGroupToTemplate', () => {
  it('同じ id・型のノードの入力欄の値を引き継ぐ', () => {
    const migrated = migrateGroupToTemplate('skirtGroup', [
      n('scale', 'numberInput', { value: 0.45 }),
      n('material', 'toonShadowMaterial', { color: '#123456' }),
      n('removedNode', 'numberInput', { value: 7 }),
    ]);
    const byId = new Map(migrated.nodes.map((node) => [node.id, node]));
    expect(byId.get('scale')?.data.value).toBe(0.45);
    expect(byId.get('material')?.data.color).toBe('#123456');
    expect(byId.has('removedNode')).toBe(false);
    expect(migrated.templateFingerprint).toBe(getGroupTemplateFingerprint('skirtGroup'));
  });

  it('型が変わっている同じ id の値は引き継がない', () => {
    const migrated = migrateGroupToTemplate('skirtGroup', [n('scale', 'colorInput', { hex: '#fff' })]);
    expect(migrated.nodes.find((node) => node.id === 'scale')?.data.value).toBe(SKIRT_SCALE);
  });

  it('同じ id・型の numberInput/colorInput の値を引き継ぐ(最新のテンプレートにも入力ノードがあるグループ)', () => {
    const migrated = migrateGroupToTemplate('scarfGroup', [n('bandThicknessIn', 'numberInput', { value: 0.5 })]);
    expect(migrated.nodes.find((node) => node.id === 'bandThicknessIn')?.data.value).toBe(0.5);
  });

  it('同じ id の groupInput のソケットの既定値(Group Input で編集した値)を引き継ぐ', () => {
    const template = getNodeType('skirtGroup').createDefaultData() as { nodes: GraphNode[] };
    const input = template.nodes.find((node) => node.id === 'input')!;
    const edited = {
      ...input,
      data: { sockets: (input.data.sockets as { id: string }[]).map((sock) => (sock.id === 'color' ? { ...sock, default: '#112233' } : sock)) },
    };
    const migrated = migrateGroupToTemplate('skirtGroup', [edited]);
    const sockets = migrated.nodes.find((node) => node.id === 'input')?.data.sockets as { id: string; default: unknown }[];
    expect(sockets.find((sock) => sock.id === 'color')?.default).toBe('#112233');
  });

  it('同じ id の groupOutput のソケットの既定値(Group Output で編集した値)を引き継ぐ', () => {
    const template = getNodeType('testOutputDefaultsGroup').createDefaultData() as { nodes: GraphNode[] };
    const output = template.nodes.find((node) => node.id === 'output')!;
    const edited = {
      ...output,
      data: { sockets: (output.data.sockets as { id: string }[]).map((sock) => (sock.id === 'first' ? { ...sock, default: 0.5 } : sock)) },
    };
    const migrated = migrateGroupToTemplate('testOutputDefaultsGroup', [edited]);
    const sockets = migrated.nodes.find((node) => node.id === 'output')?.data.sockets as { id: string; default: unknown }[];
    expect(sockets.find((sock) => sock.id === 'first')?.default).toBe(0.5);
    // 編集していないソケットはテンプレートの既定値のまま
    expect(sockets.find((sock) => sock.id === 'second')?.default).toBe(0.25);
  });

  it('値の置き場所が別のノードへ移っている場合は追跡せず、最新のテンプレートの既定値になる', () => {
    // 古いテンプレートで numberInput(waistRadiusIn)が持っていた値は、最新のテンプレートでは scale の入力欄にある。
    const migrated = migrateGroupToTemplate('skirtGroup', [n('waistRadiusIn', 'numberInput', { value: 0.45 })]);
    const byId = new Map(migrated.nodes.map((node) => [node.id, node]));
    expect(byId.has('waistRadiusIn')).toBe(false);
    expect(byId.get('scale')?.data.value).toBe(SKIRT_SCALE);
  });
});
