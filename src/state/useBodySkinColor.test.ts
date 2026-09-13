// @vitest-environment jsdom
//
// useBodyScale.test.ts と同じ方針: useBodySkinColor 自体は React フック(useGraphStore の購読)
// なので、実際に React のレンダーツリー内で呼ぶ必要があり renderHook には DOM が要る。
import * as THREE from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { EvaluatedGraph } from '../nodes/evaluateGraph';
import { DEFAULT_BODY_SKIN_COLOR, readBodyColor, useBodySkinColor } from './useBodySkinColor';
import { useGraphStore } from './graphStore';

function makeResults(hex: string): EvaluatedGraph {
  return new Map([['body', { skinColor: { type: 'color' as const, value: new THREE.Color(hex) } }]]);
}

describe('readBodyColor', () => {
  it('body ノードの評価結果から hex 文字列を返す', () => {
    const results = makeResults('#123456');
    expect(readBodyColor(results, 'skinColor', '#000000')).toBe('#123456');
  });

  it('評価結果が無い(まだ評価が走っていない)場合はフォールバック値を返す', () => {
    expect(readBodyColor(null, 'skinColor', '#000000')).toBe('#000000');
  });

  it('body ノードが評価結果に無い場合(ユーザーが削除した場合)はフォールバック値を返す', () => {
    expect(readBodyColor(new Map(), 'skinColor', '#000000')).toBe('#000000');
  });

  it('ソケットが color 型でない場合はフォールバック値を返す', () => {
    const results: EvaluatedGraph = new Map([['body', { skinColor: { type: 'number', value: 1 } }]]);
    expect(readBodyColor(results, 'skinColor', '#000000')).toBe('#000000');
  });
});

describe('useBodySkinColor (フック)', () => {
  afterEach(() => {
    useGraphStore.setState({ rootEvaluatedResults: null });
  });

  it('評価結果が無ければ DEFAULT_BODY_SKIN_COLOR を返す', () => {
    const { result } = renderHook(() => useBodySkinColor());
    expect(result.current).toBe(DEFAULT_BODY_SKIN_COLOR);
  });

  it('body ノードの skinColor ソケットの hex 文字列を返す', () => {
    useGraphStore.setState({ rootEvaluatedResults: makeResults('#abcdef') });
    const { result } = renderHook(() => useBodySkinColor());
    expect(result.current).toBe('#abcdef');
  });

  it('評価結果が変わればストア更新を検知して再計算する', () => {
    useGraphStore.setState({ rootEvaluatedResults: makeResults('#111111') });
    const { result } = renderHook(() => useBodySkinColor());
    expect(result.current).toBe('#111111');

    act(() => {
      useGraphStore.setState({ rootEvaluatedResults: makeResults('#222222') });
    });

    expect(result.current).toBe('#222222');
  });
});
