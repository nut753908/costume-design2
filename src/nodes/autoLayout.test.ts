import { describe, expect, it } from 'vitest';
import { computeAutoLayout } from './autoLayout';
import type { GraphEdge, GraphNode } from './types';

function node(id: string): GraphNode {
  return { id, type: 'test', data: {} };
}

function edge(source: string, target: string): GraphEdge {
  return { source, sourceHandle: 'out', target, targetHandle: 'in' };
}

describe('computeAutoLayout', () => {
  it('直列に接続されたノードを層ごとに列(x)を分けて配置する', () => {
    const nodes = [node('a'), node('b'), node('c')];
    const edges = [edge('a', 'b'), edge('b', 'c')];

    const positions = computeAutoLayout(nodes, edges);

    expect(positions.get('a')!.x).toBeLessThan(positions.get('b')!.x);
    expect(positions.get('b')!.x).toBeLessThan(positions.get('c')!.x);
  });

  it('接続の無いノードはすべて layer 0(同じ x)に配置される', () => {
    const nodes = [node('a'), node('b'), node('c')];
    const positions = computeAutoLayout(nodes, []);

    const xs = new Set(nodes.map((n) => positions.get(n.id)!.x));
    expect(xs.size).toBe(1);
  });

  it('複数の入力から合流するノードは、入力より後ろの層に置かれる', () => {
    const nodes = [node('in1'), node('in2'), node('merge')];
    const edges = [edge('in1', 'merge'), edge('in2', 'merge')];

    const positions = computeAutoLayout(nodes, edges);

    expect(positions.get('merge')!.x).toBeGreaterThan(positions.get('in1')!.x);
    expect(positions.get('merge')!.x).toBeGreaterThan(positions.get('in2')!.x);
  });

  it('同じ層のノードは異なる行(y)に重ならず配置される', () => {
    const nodes = [node('in1'), node('in2'), node('in3')];
    const positions = computeAutoLayout(nodes, []);

    const ys = new Set(nodes.map((n) => positions.get(n.id)!.y));
    expect(ys.size).toBe(3);
  });

  it('循環しているノードでも例外を投げず、layer 0 にフォールバックして配置する', () => {
    const nodes = [node('a'), node('b')];
    const edges = [edge('a', 'b'), edge('b', 'a')];

    expect(() => computeAutoLayout(nodes, edges)).not.toThrow();
    const positions = computeAutoLayout(nodes, edges);
    expect(positions.get('a')!.x).toBe(0);
    expect(positions.get('b')!.x).toBe(0);
  });

  it('ノードが無ければ空の Map を返す', () => {
    expect(computeAutoLayout([], []).size).toBe(0);
  });

  it('同じ層のノードが多い場合、1列に積み上げず複数のサブ列に折り返す', () => {
    const nodes = Array.from({ length: 20 }, (_, i) => node(`n${i}`));
    const positions = computeAutoLayout(nodes, []);

    const xs = new Set(nodes.map((n) => positions.get(n.id)!.x));
    const maxY = Math.max(...nodes.map((n) => positions.get(n.id)!.y));

    expect(xs.size).toBeGreaterThan(1); // 折り返して複数列になっている
    expect(maxY).toBeLessThan(20 * 110); // 20行ぶんの高さには積み上がっていない
  });

  it('存在しないノードを参照するエッジ(削除済みノードの残骸など)は無視される', () => {
    const nodes = [node('a'), node('b')];
    const edges = [edge('a', 'b'), edge('ghost', 'b'), edge('a', 'ghost')];

    expect(() => computeAutoLayout(nodes, edges)).not.toThrow();
    const positions = computeAutoLayout(nodes, edges);
    expect(positions.get('a')!.x).toBeLessThan(positions.get('b')!.x);
  });

  it('後続層の複数ノードは、接続元ノードの行位置(バリセンター)の順に並ぶ', () => {
    // a1 は行0、a2 は行1。b1 は a2(行1)から、b2 は a1(行0)からのみ接続されているため、
    // バリセンターに従うと行順は b2 → b1 に入れ替わるはず。
    const nodes = [node('a1'), node('a2'), node('b1'), node('b2')];
    const edges = [edge('a2', 'b1'), edge('a1', 'b2')];

    const positions = computeAutoLayout(nodes, edges);

    expect(positions.get('a1')!.y).toBeLessThan(positions.get('a2')!.y);
    expect(positions.get('b2')!.y).toBeLessThan(positions.get('b1')!.y);
  });
});
