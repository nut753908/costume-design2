import { describe, expect, it } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import { sameEdges, sameNodes, toGraphEdge, toGraphNode } from './selectors';

// useNodesLite/useEdgesLite 自体は React フックなので(useMemo/useRef が render 外では
// 呼べない)、このプロジェクトの方針(ブラウザ用テストランナーは持たず、フックの外に
// 出せる純粋ロジックは vitest でテストする)に沿って、実際にリアクティビティを支えている
// sameNodes/sameEdges/toGraphNode/toGraphEdge を直接テストする。

describe('toGraphNode', () => {
  it('id/type/data を写し取る', () => {
    const node: Node = { id: 'a', type: 'numberInput', position: { x: 0, y: 0 }, data: { value: 1 } };
    expect(toGraphNode(node)).toEqual({ id: 'a', type: 'numberInput', data: { value: 1 } });
  });

  it('type が未設定の場合は空文字にフォールバックする', () => {
    const node: Node = { id: 'a', position: { x: 0, y: 0 }, data: {} };
    expect(toGraphNode(node).type).toBe('');
  });
});

describe('toGraphEdge', () => {
  it('source/target/handle を写し取る', () => {
    const edge: Edge = { id: 'e1', source: 'a', sourceHandle: 'out', target: 'b', targetHandle: 'in' };
    expect(toGraphEdge(edge)).toEqual({ source: 'a', sourceHandle: 'out', target: 'b', targetHandle: 'in' });
  });
});

describe('sameNodes', () => {
  it('data がドラッグなどで再生成されず同じ参照のままなら、内容が同一として true になる', () => {
    // これが CLAUDE.md に書かれている「ノードをドラッグしても evaluator が再実行されない」
    // 仕組みの核心: 位置(position)の変更は data に触れないため、toGraphNode の出力の
    // data 参照は変化前後で同じになる。sameNodes はその参照を比較しているだけなので、
    // ドラッグ中の再評価を防げる。
    const sharedData = { value: 1 };
    const before = [{ id: 'a', type: 'numberInput', data: sharedData }];
    const after = [{ id: 'a', type: 'numberInput', data: sharedData }];
    expect(sameNodes(before, after)).toBe(true);
  });

  it('data の参照が変わっていれば(内容が同じでも)false になる', () => {
    const before = [{ id: 'a', type: 'numberInput', data: { value: 1 } }];
    const after = [{ id: 'a', type: 'numberInput', data: { value: 1 } }]; // 別オブジェクト
    expect(sameNodes(before, after)).toBe(false);
  });

  it('id/type が異なれば false になる', () => {
    const sharedData = { value: 1 };
    const before = [{ id: 'a', type: 'numberInput', data: sharedData }];
    expect(sameNodes(before, [{ id: 'b', type: 'numberInput', data: sharedData }])).toBe(false);
    expect(sameNodes(before, [{ id: 'a', type: 'colorInput', data: sharedData }])).toBe(false);
  });

  it('件数が異なれば false になる', () => {
    const sharedData = { value: 1 };
    const before = [{ id: 'a', type: 'numberInput', data: sharedData }];
    const after = [
      { id: 'a', type: 'numberInput', data: sharedData },
      { id: 'b', type: 'numberInput', data: sharedData },
    ];
    expect(sameNodes(before, after)).toBe(false);
  });

  it('空配列同士は true になる', () => {
    expect(sameNodes([], [])).toBe(true);
  });
});

describe('sameEdges', () => {
  it('source/target/handle がすべて同じなら true になる', () => {
    const before = [{ source: 'a', sourceHandle: 'out', target: 'b', targetHandle: 'in' }];
    const after = [{ source: 'a', sourceHandle: 'out', target: 'b', targetHandle: 'in' }];
    expect(sameEdges(before, after)).toBe(true);
  });

  it('handle が異なれば false になる', () => {
    const before = [{ source: 'a', sourceHandle: 'out', target: 'b', targetHandle: 'in' }];
    const after = [{ source: 'a', sourceHandle: 'out2', target: 'b', targetHandle: 'in' }];
    expect(sameEdges(before, after)).toBe(false);
  });

  it('件数が異なれば false になる', () => {
    const before = [{ source: 'a', sourceHandle: 'out', target: 'b', targetHandle: 'in' }];
    expect(sameEdges(before, [])).toBe(false);
  });

  it('空配列同士は true になる', () => {
    expect(sameEdges([], [])).toBe(true);
  });
});
