import { describe, expect, it } from 'vitest';
import './definitions';
import { getNodeType } from './registry';
import type { GraphNode } from './types';
import {
  fingerprintGroupStructure,
  getGroupTemplateFingerprint,
  isGroupInstanceStale,
  migrateGroupToTemplate,
} from './groupTemplate';

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
  const edge = (source: string, target: string, targetHandle: string) => ({
    source,
    sourceHandle: 'value',
    target,
    targetHandle,
  });

  it('同じ id・型のノードの入力欄の値を引き継ぐ', () => {
    const migrated = migrateGroupToTemplate('skirtGroup', [
      n('scale', 'numberMultiply', { value: 0.45 }),
      n('material', 'toonMaterial', { color: '#123456' }),
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
    expect(migrated.nodes.find((node) => node.id === 'scale')?.data.value).toBe(0.3);
  });

  it('同じ id・型の numberInput/colorInput の値を引き継ぐ(最新のテンプレートにも入力ノードがあるグループ)', () => {
    const migrated = migrateGroupToTemplate('bodyLayoutGroup', [n('feetYIn', 'numberInput', { value: 0.5 })]);
    expect(migrated.nodes.find((node) => node.id === 'feetYIn')?.data.value).toBe(0.5);
  });

  it('古いテンプレートの単独の入力ノードの値を、接続先の入力欄へ引き継ぐ(1本だけ繋がっていた場合)', () => {
    const migrated = migrateGroupToTemplate(
      'skirtGroup',
      [n('waistRadiusIn', 'numberInput', { value: 0.45 }), n('flareIn', 'numberInput', { value: 0.9 }), n('lengthIn', 'numberInput', { value: 0.6 })],
      [edge('waistRadiusIn', 'scale', 'value'), edge('flareIn', 'hemRadiusCalc', 'flare'), edge('lengthIn', 'profile', 'distance')],
    );
    const byId = new Map(migrated.nodes.map((node) => [node.id, node]));
    expect(byId.get('scale')?.data.value).toBe(0.45);
    expect(byId.get('hemRadiusCalc')?.data.flare).toBe(0.9);
    expect(byId.get('profile')?.data.distance).toBe(0.6);
  });

  it('複数へ繋がっていた入力ノード・最新のテンプレートで配線されているソケットへの値は引き継がない', () => {
    const migrated = migrateGroupToTemplate(
      'skirtGroup',
      [n('a', 'numberInput', { value: 9 })],
      [edge('a', 'scale', 'value'), edge('a', 'hemRadiusCalc', 'flare')],
    );
    const byId = new Map(migrated.nodes.map((node) => [node.id, node]));
    expect(byId.get('scale')?.data.value).toBe(0.3);
    expect(byId.get('hemRadiusCalc')?.data.flare).toBe(0.7);

    // scale.factor は最新のテンプレートで input.bodyBuild が配線されているため、入力欄の値にはならない。
    const wired = migrateGroupToTemplate('skirtGroup', [n('b', 'numberInput', { value: 9 })], [edge('b', 'scale', 'factor')]);
    expect(wired.nodes.find((node) => node.id === 'scale')?.data.factor).toBeUndefined();
  });
});
