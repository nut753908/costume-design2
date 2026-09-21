import { describe, expect, it } from 'vitest';
import { getNodeType, groupNodeTypesBySection, nodeTypeRegistry, registerNodeType } from './registry';
import type { NodeTypeDefinition } from './types';

function def(type: string, category: NodeTypeDefinition['category'], label = type): NodeTypeDefinition {
  return {
    type,
    label,
    category,
    inputs: [],
    outputs: [],
    createDefaultData: () => ({}),
    evaluate: () => ({}),
  };
}

describe('registerNodeType / getNodeType', () => {
  it('登録したノードタイプを getNodeType で取得できる', () => {
    registerNodeType(def('rt-a', 'input'));
    expect(getNodeType('rt-a').label).toBe('rt-a');
  });

  it('同じ type を2回登録しようとすると例外を投げる', () => {
    registerNodeType(def('rt-dup', 'input'));
    expect(() => registerNodeType(def('rt-dup', 'primitive'))).toThrow(/already registered/);
  });

  it('未登録の type を getNodeType すると例外を投げる', () => {
    expect(() => getNodeType('rt-unknown')).toThrow(/Unknown node type/);
  });
});

describe('groupNodeTypesBySection', () => {
  it('input → primitive → material → output の順でカテゴリをまとめる(登録順に依らない)', () => {
    registerNodeType(def('rt-out', 'output'));
    registerNodeType(def('rt-in', 'input'));
    registerNodeType(def('rt-gen', 'primitive'));
    registerNodeType(def('rt-mat', 'material'));

    const categories = groupNodeTypesBySection().map((g) => g.section);
    const relevant = categories.filter((c) => ['input', 'primitive', 'material', 'output'].includes(c));
    expect(relevant).toEqual(['input', 'primitive', 'material', 'output']);
  });

  it('1つも登録されていないカテゴリは結果に含まれない', () => {
    nodeTypeRegistry.clear();
    registerNodeType(def('rt-only-input', 'input'));

    const categories = groupNodeTypesBySection().map((g) => g.section);
    expect(categories).toEqual(['input']);
  });

  it('同じカテゴリの複数ノードタイプは同じグループにまとまる', () => {
    nodeTypeRegistry.clear();
    registerNodeType(def('rt-gen-1', 'primitive', 'Gen 1'));
    registerNodeType(def('rt-gen-2', 'primitive', 'Gen 2'));

    const group = groupNodeTypesBySection().find((g) => g.section === 'primitive')!;
    expect(group.items.map((i) => i.type).sort()).toEqual(['rt-gen-1', 'rt-gen-2']);
  });

  it('同じカテゴリ内は登録順ではなくラベルの昇順で並ぶ(definitions/index.ts の import.meta.glob 解決順に依存させないため)', () => {
    nodeTypeRegistry.clear();
    registerNodeType(def('rt-z', 'primitive', 'Zebra'));
    registerNodeType(def('rt-a', 'primitive', 'Apple'));
    registerNodeType(def('rt-m', 'primitive', 'Mango'));

    const group = groupNodeTypesBySection().find((g) => g.section === 'primitive')!;
    expect(group.items.map((i) => i.label)).toEqual(['Apple', 'Mango', 'Zebra']);
  });
});

describe('paletteSection', () => {
  it('group カテゴリは paletteSection で garment/group-part に振り分ける(省略時は group-part)', () => {
    registerNodeType({ ...def('rt-garment', 'group'), paletteSection: 'garment' });
    registerNodeType(def('rt-part', 'group'));
    const sections = groupNodeTypesBySection();
    expect(sections.find((g) => g.section === 'garment')!.items.map((i) => i.type)).toContain('rt-garment');
    expect(sections.find((g) => g.section === 'group-part')!.items.map((i) => i.type)).toContain('rt-part');
    expect(sections.some((g) => (g.section as string) === 'group')).toBe(false);
  });
});

describe('hiddenInPalette', () => {
  it('hiddenInPalette のノードタイプは一覧に出ないが、登録は残る', () => {
    registerNodeType({ ...def('rt-hidden', 'primitive'), hiddenInPalette: true });
    const types = groupNodeTypesBySection().flatMap((g) => g.items.map((i) => i.type));
    expect(types).not.toContain('rt-hidden');
    expect(getNodeType('rt-hidden').type).toBe('rt-hidden');
  });
});
