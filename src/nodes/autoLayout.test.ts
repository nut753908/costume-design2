import { describe, expect, it } from 'vitest';
import {
  computeAutoLayout,
  estimateNodeHeight,
  isotonicRegression,
  socketRowFraction,
  COLUMN_SPACING,
  ROW_SPACING,
  type LayoutPosition,
} from './autoLayout';
import { registerNodeType } from './registry';
import type { GraphEdge, GraphNode, NodeTypeDefinition } from './types';

function registerTestType(overrides: Partial<NodeTypeDefinition> & { type: string }): void {
  registerNodeType({
    label: overrides.type,
    category: 'generator',
    inputs: [],
    outputs: [],
    createDefaultData: () => ({}),
    evaluate: () => ({}),
    ...overrides,
  });
}

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

  it('先に並ぶノードの目標値が突出して大きくても、後続ノードは自分の目標値の近くに収まる', () => {
    // 初期プリセットで実際に踏んだケースの最小再現: 同じ列の先頭付近にいるノードが
    // (別の接続元に強く引っ張られて)大きな目標値を持っていても、後続ノード自身の
    // 目標値が小さければ、そちらへ引きずられず自分の目標値の近くに留まるべき。
    // 単純な「直前ノード+ROW_SPACING」を守るだけの前方詰め(旧実装)だと、後続の
    // far は 1000 のまま固定され、near1/near2 はそこから ROW_SPACING ずつ機械的に
    // 押し出されてしまう(1000, 1280, 1560 のような配置になり、near1/near2 自身の
    // 目標値である 0 から大きく外れる)。isotonicRegression による誤差二乗和の最小化
    // では、near1/near2 の希望に合わせて far 自身が下がる方向に妥協する。
    const values = [1000, 0, 0];
    const adjusted = values.map((v, i) => v - i * ROW_SPACING);
    const fitted = isotonicRegression(adjusted).map((v, i) => v + i * ROW_SPACING);

    // far(index0) は自分の目標値(1000)よりずっと下がり、near1/near2(index1,2) の
    // 目標値(0)に引っ張られる。逆に near1/near2 は目標値(0)からそこまで離れない。
    expect(fitted[0]).toBeLessThan(500);
    expect(fitted[2]).toBeLessThan(1000);
  });

  it('接続が1本も無い孤立ノードは各列の末尾へ寄せられ、接続ノードより後ろに来る', () => {
    // isolated は connected より先に並んでいても(ノード配列の順番上)、接続の無い
    // ノードは行バランス調整の目標値を持たないため、列の末尾へ回されるべき。
    const nodes = [node('isolated'), node('connected'), node('target')];
    const edges = [edge('connected', 'target')];

    const positions = computeAutoLayout(nodes, edges);

    // connected は target(独立した列にいるため初期位置 y=0)に一致できる。
    expect(positions.get('connected')!.y).toBe(positions.get('target')!.y);
    expect(positions.get('connected')!.y).toBeLessThan(positions.get('isolated')!.y);
  });

  it('孤立ノードが同じ列に混在していても、接続ノードの行位置は孤立ノードが無い場合と変わらない', () => {
    // 孤立ノードの「目標値」は単に自分自身の(意味を持たない)初期ランクでしかない。
    // これを接続ノードと同じ isotonicRegression の数列に混ぜてしまうと、たまたま
    // 隣り合った接続ノードがこの実体の無い目標値に引きずられ、孤立ノードの有無で
    // 接続ノードの位置が変わってしまう(実際に踏んだ回帰)。孤立ノードは接続ノードの
    // 位置調整に一切影響してはいけない。
    const buildGraph = (withIsolated: boolean) => {
      const nodes = [node('c1'), node('c2'), node('target1'), node('target2')];
      if (withIsolated) nodes.push(node('iso1'), node('iso2'), node('iso3'));
      const edges = [edge('c1', 'target1'), edge('c2', 'target2')];
      return { nodes, edges };
    };
    const without = buildGraph(false);
    const withIsolated = buildGraph(true);

    const positionsWithout = computeAutoLayout(without.nodes, without.edges);
    const positionsWithIsolated = computeAutoLayout(withIsolated.nodes, withIsolated.edges);

    expect(positionsWithIsolated.get('c1')).toEqual(positionsWithout.get('c1'));
    expect(positionsWithIsolated.get('c2')).toEqual(positionsWithout.get('c2'));
  });

  it('複数ノードから成る孤立したまとまり(連結成分)も、本体の位置調整を妨げず独立して詰められる', () => {
    // 孤立ノードに限らず、他と1本も繋がっていない「まとまり」全般に一般化されている
    // ことを確認する。クラスタ(clusterA1/clusterA2 → clusterB)は本体(hub → target群)
    // より小さいので本体側が優先され、クラスタは本体のすぐ下へ独立して積まれるはず。
    const clusterNodes = [node('clusterA1'), node('clusterA2'), node('clusterB')];
    const clusterEdges = [edge('clusterA1', 'clusterB'), edge('clusterA2', 'clusterB')];
    const mainNodes = [node('hub'), node('target1'), node('target2'), node('target3')];
    const mainEdges = [edge('hub', 'target1'), edge('hub', 'target2'), edge('hub', 'target3')];

    const positions = computeAutoLayout([...mainNodes, ...clusterNodes], [...mainEdges, ...clusterEdges]);
    const clusterOnly = computeAutoLayout(clusterNodes, clusterEdges);
    const mainOnly = computeAutoLayout(mainNodes, mainEdges);

    // 本体(hub)の位置は、クラスタの有無で変わらない。
    expect(positions.get('hub')).toEqual(mainOnly.get('hub'));

    // クラスタ内部の相対配置(clusterA1 を基準にした相対 y)は、クラスタ単体で計算した
    // 場合と一致する — 本体の存在はクラスタの内部構造に一切影響しない。
    const relativeY = (pos: Map<string, LayoutPosition>, id: string, baseId: string) =>
      pos.get(id)!.y - pos.get(baseId)!.y;
    expect(relativeY(positions, 'clusterA2', 'clusterA1')).toBe(relativeY(clusterOnly, 'clusterA2', 'clusterA1'));
    expect(relativeY(positions, 'clusterB', 'clusterA1')).toBe(relativeY(clusterOnly, 'clusterB', 'clusterA1'));
  });

  it('同じ層で複数の接続元/接続先が絡み合う場合(2ホップ)でも、後ろの層は前の層の最終位置を見て線を短くする', () => {
    // scarfGroup の内部で実際に踏んだケースの再現: gen(接続元多数)と material(接続元少数)
    // が同じ列に並び、互いに引っ張り合って本来の位置(初期のランク)から動く。その両方に
    // 繋がる output の位置は、gen/material の「動く前の初期値」ではなく「実際に動いた後の
    // 最終位置」を見て決まるべき。
    const nodes = [
      node('p1'),
      node('p2'),
      node('p3'),
      node('p4'),
      node('p5'),
      node('q1'),
      node('gen'),
      node('material'),
      node('output'),
    ];
    const edges = [
      edge('p1', 'gen'),
      edge('p2', 'gen'),
      edge('p3', 'gen'),
      edge('p4', 'gen'),
      edge('p5', 'gen'),
      edge('q1', 'material'),
      edge('gen', 'output'),
      edge('material', 'output'),
    ];

    const positions = computeAutoLayout(nodes, edges);
    const genY = positions.get('gen')!.y;
    const materialY = positions.get('material')!.y;
    const outputY = positions.get('output')!.y;

    // output は gen/material の実際の最終位置のちょうど中間に来る(どちらの辺も
    // 同じ長さになる)。gen/material 自身の位置は変えず(前の層の最適化には影響しない)、
    // output だけがそれに追従する。
    expect(outputY).toBeCloseTo((genY + materialY) / 2, 0);
  });

  it('同じ1つの接続先しか持たないノード同士は、その接続先のソケット行の並び順に合わせて並び替わる', () => {
    // pantsGroup の内部で実際に踏んだケースの再現: target(Pants 相当)は a,b,c という
    // 順でソケットを持つが、それぞれへ繋がる接続元(srcA/srcB/srcC)は配列上わざと
    // バラバラの順序(srcC, srcA, srcB)で定義する。それぞれ target 以外に接続先/接続元を
    // 持たないため、バリセンターの平均順位だけでは同順位になり、並べ替えられないと
    // 元の配列順(srcC, srcA, srcB)のまま残ってしまう。
    registerTestType({
      type: '__socket_order_target__',
      inputs: [
        { id: 'a', label: 'A', type: 'number' },
        { id: 'b', label: 'B', type: 'number' },
        { id: 'c', label: 'C', type: 'number' },
      ],
    });
    const nodes = [node('srcC'), node('srcA'), node('srcB'), { id: 'target', type: '__socket_order_target__', data: {} }];
    const edges = [
      edge('srcC', 'target'),
      edge('srcA', 'target'),
      edge('srcB', 'target'),
    ].map((e, i) => ({ ...e, targetHandle: ['c', 'a', 'b'][i] }));

    const positions = computeAutoLayout(nodes, edges);

    expect(positions.get('srcA')!.y).toBeLessThan(positions.get('srcB')!.y);
    expect(positions.get('srcB')!.y).toBeLessThan(positions.get('srcC')!.y);
  });
});

describe('socketRowFraction', () => {
  it('登録済みのノード型では、入力ソケットは前半・出力ソケットは後半の行として割合を返す', () => {
    registerTestType({
      type: '__socket_fraction_test__',
      inputs: [
        { id: 'a', label: 'A', type: 'number' },
        { id: 'b', label: 'B', type: 'number' },
      ],
      outputs: [{ id: 'out', label: 'Out', type: 'geometry' }],
    });
    // 全3行のうち、a=0行目、b=1行目、out=2行目。
    expect(socketRowFraction('__socket_fraction_test__', {}, 'a', 'input')).toBe(0);
    expect(socketRowFraction('__socket_fraction_test__', {}, 'b', 'input')).toBe(1 / 3);
    expect(socketRowFraction('__socket_fraction_test__', {}, 'out', 'output')).toBe(2 / 3);
  });

  it('未登録の型・専用UI系・存在しないソケットIDは 0 を返す(優先順位をつけない)', () => {
    expect(socketRowFraction('__unregistered__', {}, 'a', 'input')).toBe(0);
    expect(socketRowFraction('numberInput', {}, 'value', 'output')).toBe(0);
    registerTestType({ type: '__socket_fraction_missing__', inputs: [{ id: 'a', label: 'A', type: 'number' }] });
    expect(socketRowFraction('__socket_fraction_missing__', {}, 'nonexistent', 'input')).toBe(0);
  });
});

describe('isotonicRegression', () => {
  it('すでに非減少な列はそのまま返す', () => {
    expect(isotonicRegression([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('減少している2値は平均値に均す', () => {
    expect(isotonicRegression([3, 1])).toEqual([2, 2]);
  });

  it('一部だけ違反している区間だけをブロックとして併合する', () => {
    // 1 → 3 → 2 の並びは 3→2 の部分だけが非減少に違反しているため、その2つだけが
    // 平均値(2.5)に均され、違反していない先頭の 1 はそのまま残る。
    expect(isotonicRegression([1, 3, 2])).toEqual([1, 2.5, 2.5]);
  });

  it('併合済みのブロックがさらに前のブロックと違反する場合は連鎖して併合する', () => {
    // 5,1 は違反しているので併合され平均3のブロックになるが、続く -10 はその
    // 平均3をも下回って違反するため、既に併合済みのブロックごと巻き込んで
    // 全体が1つのブロック(全要素の平均)に併合される。
    const result = isotonicRegression([5, 1, -10]);
    const avg = (5 + 1 - 10) / 3;
    expect(result).toEqual([avg, avg, avg]);
  });

  it('空配列を渡すと空配列を返す', () => {
    expect(isotonicRegression([])).toEqual([]);
  });
});

describe('estimateNodeHeight', () => {
  it('nodeTypeRegistry に登録の無い種類は ROW_SPACING - NODE_GAP(24) 相当を返す', () => {
    // 導入前の固定行間隔(ROW_SPACING)と一致させ、単体テストの type: 'test' や未知の
    // 種類のノードに対する挙動を変えないためのフォールバック。
    expect(estimateNodeHeight('__unregistered_test_type__', {})).toBe(ROW_SPACING - 24);
  });

  it('専用UIを持つ入力系ノードは実測した固定値を返す(ソケット数によらない)', () => {
    expect(estimateNodeHeight('numberInput', {})).toBe(84);
    expect(estimateNodeHeight('colorInput', {})).toBe(66);
    expect(estimateNodeHeight('enumInput', {})).toBe(60);
  });

  it('入出力ソケット数が多いほど、その分だけ線形に高さが増える', () => {
    registerTestType({ type: '__height_test_a__', inputs: [{ id: 'a', label: 'A', type: 'number' }] });
    registerTestType({
      type: '__height_test_b__',
      inputs: [
        { id: 'a', label: 'A', type: 'number' },
        { id: 'b', label: 'B', type: 'number' },
        { id: 'c', label: 'C', type: 'number' },
      ],
    });
    const heightA = estimateNodeHeight('__height_test_a__', {});
    const heightB = estimateNodeHeight('__height_test_b__', {});
    // b は a よりソケット2つぶん多い(3行 vs 1行)。
    expect(heightB - heightA).toBe(2 * 23);
  });

  it('数値/enum型の出力ソケットは、ソケット行とは別に値表示行の分だけ高さが増える', () => {
    registerTestType({ type: '__height_test_geometry_out__', outputs: [{ id: 'out', label: 'Out', type: 'geometry' }] });
    registerTestType({ type: '__height_test_number_out__', outputs: [{ id: 'out', label: 'Out', type: 'number' }] });
    const geometryOutHeight = estimateNodeHeight('__height_test_geometry_out__', {});
    const numberOutHeight = estimateNodeHeight('__height_test_number_out__', {});
    expect(numberOutHeight - geometryOutHeight).toBe(23); // 値表示行1行ぶん
  });

  it('group カテゴリのノードは、ダブルクリックヒント行の分だけ高さが増える', () => {
    registerTestType({ type: '__height_test_group__', category: 'group', inputs: [{ id: 'a', label: 'A', type: 'number' }] });
    registerTestType({ type: '__height_test_generator_same_inputs__', inputs: [{ id: 'a', label: 'A', type: 'number' }] });
    const groupHeight = estimateNodeHeight('__height_test_group__', {});
    const generatorHeight = estimateNodeHeight('__height_test_generator_same_inputs__', {});
    // group はヒント行(14)ぶんだけ高い。anchor/offsetY のような garmentOutput 相当の出力は
    // 現在は静的な outputs 宣言(または内部の groupOutput ノードの sockets)として通常の
    // ソケット行の計算にそのまま乗るため、ここでは特殊扱いしない。
    expect(groupHeight - generatorHeight).toBe(14);
  });
});
