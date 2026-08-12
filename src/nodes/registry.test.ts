import { describe, expect, it } from 'vitest';
import { getNodeType, groupNodeTypesByCategory, nodeTypeRegistry, registerNodeType } from './registry';
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
    expect(() => registerNodeType(def('rt-dup', 'generator'))).toThrow(/already registered/);
  });

  it('未登録の type を getNodeType すると例外を投げる', () => {
    expect(() => getNodeType('rt-unknown')).toThrow(/Unknown node type/);
  });
});

describe('groupNodeTypesByCategory', () => {
  it('input → generator → material → output の順でカテゴリをまとめる(登録順に依らない)', () => {
    registerNodeType(def('rt-out', 'output'));
    registerNodeType(def('rt-in', 'input'));
    registerNodeType(def('rt-gen', 'generator'));
    registerNodeType(def('rt-mat', 'material'));

    const categories = groupNodeTypesByCategory().map((g) => g.category);
    const relevant = categories.filter((c) => ['input', 'generator', 'material', 'output'].includes(c));
    expect(relevant).toEqual(['input', 'generator', 'material', 'output']);
  });

  it('1つも登録されていないカテゴリは結果に含まれない', () => {
    nodeTypeRegistry.clear();
    registerNodeType(def('rt-only-input', 'input'));

    const categories = groupNodeTypesByCategory().map((g) => g.category);
    expect(categories).toEqual(['input']);
  });

  it('同じカテゴリの複数ノードタイプは同じグループにまとまる', () => {
    nodeTypeRegistry.clear();
    registerNodeType(def('rt-gen-1', 'generator', 'Gen 1'));
    registerNodeType(def('rt-gen-2', 'generator', 'Gen 2'));

    const group = groupNodeTypesByCategory().find((g) => g.category === 'generator')!;
    expect(group.items.map((i) => i.type).sort()).toEqual(['rt-gen-1', 'rt-gen-2']);
  });
});
