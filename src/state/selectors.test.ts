// @vitest-environment jsdom
//
// sameNodes/sameEdges/toGraphNode/toGraphEdge はピュア関数なので既定の 'node' 環境で
// 十分だが、useNodesLite/useEdgesLite 自体(useMemo/useRef + useGraphStore の購読)は
// React フックなので、実際に React のレンダーツリー内で呼ぶ必要がある。renderHook には
// DOM が要るため、このファイルだけ jsdom に切り替える(keyboardGuards.test.ts と同じ方針)。
import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Node, Edge } from '@xyflow/react';
import { sameEdges, sameNodes, toGraphEdge, toGraphNode, useEdgesLite, useNodesLite } from './selectors';
import { useGraphStore } from './graphStore';

// sameNodes/sameEdges/toGraphNode/toGraphEdge は、実際にリアクティビティを支えている
// 参照等価性の比較ロジックを直接テストする。useNodesLite/useEdgesLite 自体は下の
// 「(フック)」の describe ブロックで renderHook 経由で検証する。

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

describe('useNodesLite (フック)', () => {
  afterEach(() => {
    useGraphStore.setState({ nodes: [] });
  });

  it('position のみが変わっても同じ配列参照を返す(ドラッグ中に再評価させないための仕組み)', () => {
    const sharedData = { value: 1 };
    useGraphStore.setState({
      nodes: [{ id: 'a', type: 'numberInput', position: { x: 0, y: 0 }, data: sharedData, selected: false }],
    });
    const { result } = renderHook(() => useNodesLite());
    const first = result.current;

    act(() => {
      useGraphStore.setState({
        nodes: [{ id: 'a', type: 'numberInput', position: { x: 50, y: 50 }, data: sharedData, selected: false }],
      });
    });

    expect(result.current).toBe(first);
  });

  it('ノードの data が変われば新しい配列参照を返す', () => {
    useGraphStore.setState({
      nodes: [{ id: 'a', type: 'numberInput', position: { x: 0, y: 0 }, data: { value: 1 } }],
    });
    const { result } = renderHook(() => useNodesLite());
    const first = result.current;

    act(() => {
      useGraphStore.setState({
        nodes: [{ id: 'a', type: 'numberInput', position: { x: 0, y: 0 }, data: { value: 2 } }],
      });
    });

    expect(result.current).not.toBe(first);
    expect(result.current[0].data).toEqual({ value: 2 });
  });
});

describe('useEdgesLite (フック)', () => {
  afterEach(() => {
    useGraphStore.setState({ edges: [] });
  });

  it('内容が同一なら再構築後も同じ配列参照を返す', () => {
    useGraphStore.setState({
      edges: [{ id: 'e1', source: 'a', sourceHandle: 'out', target: 'b', targetHandle: 'in' }],
    });
    const { result } = renderHook(() => useEdgesLite());
    const first = result.current;

    act(() => {
      useGraphStore.setState({
        edges: [{ id: 'e1', source: 'a', sourceHandle: 'out', target: 'b', targetHandle: 'in', selected: true }],
      });
    });

    expect(result.current).toBe(first);
  });

  it('接続先が変われば新しい配列参照を返す', () => {
    useGraphStore.setState({
      edges: [{ id: 'e1', source: 'a', sourceHandle: 'out', target: 'b', targetHandle: 'in' }],
    });
    const { result } = renderHook(() => useEdgesLite());
    const first = result.current;

    act(() => {
      useGraphStore.setState({
        edges: [{ id: 'e1', source: 'a', sourceHandle: 'out', target: 'c', targetHandle: 'in' }],
      });
    });

    expect(result.current).not.toBe(first);
    expect(result.current[0].target).toBe('c');
  });
});
