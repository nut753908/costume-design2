// @vitest-environment jsdom
//
// readSeedNumber はピュア関数なので既定の 'node' 環境で十分だが、useBodyScale 自体
// (useGraphStore の購読 + useMemo)は React フックなので、実際に React のレンダー
// ツリー内で呼ぶ必要がある。renderHook には DOM が要るため、このファイルだけ jsdom に
// 切り替える(keyboardGuards.test.ts と同じ方針)。
import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Node } from '@xyflow/react';
import { readSeedNumber, useBodyScale } from './useBodyScale';
import { useGraphStore } from './graphStore';

function makeNode(id: string, value: unknown): Node {
  return { id, type: 'numberInput', position: { x: 0, y: 0 }, data: { value } };
}

describe('readSeedNumber', () => {
  it('id が一致するノードの value を返す', () => {
    const nodes = [makeNode('bodyHeight', 1.1)];
    expect(readSeedNumber(nodes, 'bodyHeight', 1)).toBe(1.1);
  });

  it('ノードが存在しない場合(ユーザーが削除した場合)はフォールバック値を返す', () => {
    expect(readSeedNumber([], 'bodyHeight', 1)).toBe(1);
  });

  it('value が数値でない場合はフォールバック値を返す', () => {
    const nodes = [makeNode('bodyHeight', 'not-a-number')];
    expect(readSeedNumber(nodes, 'bodyHeight', 1)).toBe(1);
  });

  it('id が異なる同名データのノードには反応しない', () => {
    const nodes = [makeNode('someOtherNode', 1.5)];
    expect(readSeedNumber(nodes, 'bodyHeight', 1)).toBe(1);
  });
});

describe('useBodyScale (フック)', () => {
  afterEach(() => {
    useGraphStore.setState({ nodes: [] });
  });

  it('bodyHeight/bodyBuild/bodyShoulder ノードの value を BodyScaleParams として返す', () => {
    useGraphStore.setState({
      nodes: [makeNode('bodyHeight', 1.1), makeNode('bodyBuild', 0.9), makeNode('bodyShoulder', 1.2)],
    });

    const { result } = renderHook(() => useBodyScale());

    expect(result.current).toEqual({ heightScale: 1.1, buildScale: 0.9, shoulderScale: 1.2 });
  });

  it('シードノードの値が変わればストア更新を検知して再計算する', () => {
    useGraphStore.setState({ nodes: [makeNode('bodyBuild', 1)] });
    const { result } = renderHook(() => useBodyScale());
    expect(result.current.buildScale).toBe(1);

    act(() => {
      useGraphStore.setState({ nodes: [makeNode('bodyBuild', 1.3)] });
    });

    expect(result.current.buildScale).toBe(1.3);
  });
});
