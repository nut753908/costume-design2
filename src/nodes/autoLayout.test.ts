import { describe, expect, it } from 'vitest';
import { computeAutoLayout, COLUMN_SPACING, ROW_SPACING } from './autoLayout';
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
    expect(maxY).toBeLessThan(19 * ROW_SPACING); // 20行ぶん(折り返し無しの場合の高さ)には積み上がっていない
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

  it('接続先が接続元よりずっと遠いノードは、層の余裕(slack)を使って間に寄る', () => {
    // m は p のすぐ後ろ(layer1)にしか置けないが、唯一の接続先 q は並行する長い経路
    // (p→d1→d2→d3→d4→q)によって layer5 まで押し出される。最長経路だけなら m は
    // layer1 に固定され p-q 間で著しく偏った(短い辺+長い辺の)配置になるが、層バランス
    // 調整は m を p と q の間に寄せて、より均等な配置にするはず。
    const nodes = [node('p'), node('m'), node('d1'), node('d2'), node('d3'), node('d4'), node('q')];
    const edges = [
      edge('p', 'm'),
      edge('m', 'q'),
      edge('p', 'd1'),
      edge('d1', 'd2'),
      edge('d2', 'd3'),
      edge('d3', 'd4'),
      edge('d4', 'q'),
    ];

    const positions = computeAutoLayout(nodes, edges);
    const layerOf = (id: string) => positions.get(id)!.x / COLUMN_SPACING;

    expect(layerOf('p')).toBe(0);
    expect(layerOf('q')).toBe(5); // 並行する長い経路により固定される
    expect(layerOf('m')).toBeGreaterThan(1); // 最長経路だけの場合の位置(layer1)より後ろへ寄る
    expect(layerOf('m')).toBeLessThan(5); // それでも接続先の手前
  });

  it('層バランス調整で余裕のあるノードを動かしても、循環を含まない辺は必ず接続元より接続先が後ろになる', () => {
    // 複数の「余裕のあるノード」(m1/m2/x1/x2)を同時に動かしても、DAG として不正な
    // (接続先が接続元より前になる)配置を作らないことを確認する回帰テスト。
    const ids = ['p', 'm1', 'm2', 'd1', 'd2', 'd3', 'd4', 'q', 'x1', 'x2'];
    const nodes = ids.map(node);
    const edges = [
      edge('p', 'm1'),
      edge('m1', 'q'),
      edge('p', 'm2'),
      edge('m2', 'q'),
      edge('p', 'd1'),
      edge('d1', 'd2'),
      edge('d2', 'd3'),
      edge('d3', 'd4'),
      edge('d4', 'q'),
      edge('p', 'x1'),
      edge('x1', 'x2'),
      edge('x2', 'q'),
    ];

    const positions = computeAutoLayout(nodes, edges);

    for (const e of edges) {
      expect(positions.get(e.target)!.x).toBeGreaterThan(positions.get(e.source)!.x);
    }
  });

  it('複数の接続元を持つ孤立した行のノードは、それらの中間の y へ寄る', () => {
    // a1, a2 は同じ層の隣接する行(rank0, rank1)のまま。m はその列に自分1つしか
    // いないので初期値は rank0(y=0)だが、行バランス調整で接続元2つの中間へ寄るはず。
    const nodes = [node('a1'), node('a2'), node('m')];
    const edges = [edge('a1', 'm'), edge('a2', 'm')];

    const positions = computeAutoLayout(nodes, edges);
    const a1y = positions.get('a1')!.y;
    const a2y = positions.get('a2')!.y;
    const my = positions.get('m')!.y;

    expect(a2y - a1y).toBe(ROW_SPACING); // 前提: a1, a2 は隣接する行のまま
    expect(my).toBeCloseTo((a1y + a2y) / 2, 0);
  });

  it('多数の接続先を持つハブノードでも、行バランス調整の値が際限なく増えない(発散しない)', () => {
    // 実際に初期プリセットで踏んだ不具合の最小再現: hub の目標値(desired)を接続先
    // (leaf群)の「更新され続ける現在値」から計算すると、hub → leaf → hub → leaf ... と
    // 互いに引っ張り合って値が反復のたびに増え続けてしまう。目標値は最初のランクに
    // 基づく固定値から計算しなければならない。
    const hub = node('hub');
    const leaves = Array.from({ length: 9 }, (_, i) => node(`leaf${i}`));
    const nodes = [hub, ...leaves];
    const edges = leaves.map((leaf) => edge('hub', leaf.id));

    const positions = computeAutoLayout(nodes, edges);
    const maxY = Math.max(...nodes.map((n) => positions.get(n.id)!.y));

    // 素朴なランクベースの配置(0, ROW_SPACING, ..., (leaves.length-1)*ROW_SPACING)と
    // 同じ範囲に収まっているはず。発散していれば、この上限を大きく超える。
    expect(maxY).toBe((leaves.length - 1) * ROW_SPACING);
    // hub はリーフ群のちょうど中間(中央値)に寄る。
    expect(positions.get('hub')!.y).toBe(Math.floor(leaves.length / 2) * ROW_SPACING);
  });

  it('行バランス調整後も、同じ列(x)に並ぶノード同士は ROW_SPACING 以上離れる', () => {
    const nodes = [node('a1'), node('a2'), node('a3'), node('m1'), node('m2')];
    const edges = [edge('a1', 'm1'), edge('a2', 'm1'), edge('a2', 'm2'), edge('a3', 'm2')];

    const positions = computeAutoLayout(nodes, edges);
    const ysByX = new Map<number, number[]>();
    for (const pos of positions.values()) {
      const ys = ysByX.get(pos.x) ?? [];
      ys.push(pos.y);
      ysByX.set(pos.x, ys);
    }
    for (const ys of ysByX.values()) {
      const sorted = [...ys].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(ROW_SPACING);
      }
    }
  });
});
