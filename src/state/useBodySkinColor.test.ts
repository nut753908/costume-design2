// @vitest-environment jsdom
//
// useBodyScale.test.ts と同じ方針: useBodySkinColor 自体は React フック(useGraphStore の購読)
// なので、実際に React のレンダーツリー内で呼ぶ必要があり renderHook には DOM が要る。
import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Node } from '@xyflow/react';
import { DEFAULT_BODY_SKIN_COLOR, readSeedColor, useBodySkinColor } from './useBodySkinColor';
import { useGraphStore } from './graphStore';

function makeColorNode(id: string, hex: unknown): Node {
  return { id, type: 'colorInput', position: { x: 0, y: 0 }, data: { hex } };
}

describe('readSeedColor', () => {
  it('id が一致するノードの hex を返す', () => {
    const nodes = [makeColorNode('bodySkinColor', '#123456')];
    expect(readSeedColor(nodes, 'bodySkinColor', '#000000')).toBe('#123456');
  });

  it('ノードが存在しない場合(ユーザーが削除した場合)はフォールバック値を返す', () => {
    expect(readSeedColor([], 'bodySkinColor', '#000000')).toBe('#000000');
  });

  it('hex が文字列でない場合はフォールバック値を返す', () => {
    const nodes = [makeColorNode('bodySkinColor', 123456)];
    expect(readSeedColor(nodes, 'bodySkinColor', '#000000')).toBe('#000000');
  });

  it('id が異なる同名データのノードには反応しない', () => {
    const nodes = [makeColorNode('someOtherNode', '#123456')];
    expect(readSeedColor(nodes, 'bodySkinColor', '#000000')).toBe('#000000');
  });
});

describe('useBodySkinColor (フック)', () => {
  afterEach(() => {
    useGraphStore.setState({ nodes: [] });
  });

  it('bodySkinColor ノードが無ければ DEFAULT_BODY_SKIN_COLOR を返す', () => {
    const { result } = renderHook(() => useBodySkinColor());
    expect(result.current).toBe(DEFAULT_BODY_SKIN_COLOR);
  });

  it('bodySkinColor ノードの hex を返す', () => {
    useGraphStore.setState({ nodes: [makeColorNode('bodySkinColor', '#abcdef')] });
    const { result } = renderHook(() => useBodySkinColor());
    expect(result.current).toBe('#abcdef');
  });

  it('シードノードの値が変わればストア更新を検知して再計算する', () => {
    useGraphStore.setState({ nodes: [makeColorNode('bodySkinColor', '#111111')] });
    const { result } = renderHook(() => useBodySkinColor());
    expect(result.current).toBe('#111111');

    act(() => {
      useGraphStore.setState({ nodes: [makeColorNode('bodySkinColor', '#222222')] });
    });

    expect(result.current).toBe('#222222');
  });
});
