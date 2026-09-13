// @vitest-environment jsdom
//
// readBodyNumber はピュア関数なので既定の 'node' 環境で十分だが、useBodyScale 自体
// (useGraphStore の購読 + useMemo)は React フックなので、実際に React のレンダー
// ツリー内で呼ぶ必要がある。renderHook には DOM が要るため、このファイルだけ jsdom に
// 切り替える(keyboardGuards.test.ts と同じ方針)。
import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { EvaluatedGraph } from '../nodes/evaluateGraph';
import { readBodyNumber, useBodyScale } from './useBodyScale';
import { useGraphStore } from './graphStore';

function makeResults(socketValues: Record<string, number>): EvaluatedGraph {
  return new Map([
    [
      'body',
      Object.fromEntries(
        Object.entries(socketValues).map(([socketId, value]) => [socketId, { type: 'number' as const, value }]),
      ),
    ],
  ]);
}

describe('readBodyNumber', () => {
  it('body ノードの評価結果からソケットの値を返す', () => {
    const results = makeResults({ height: 1.1 });
    expect(readBodyNumber(results, 'height', 1)).toBe(1.1);
  });

  it('評価結果が無い(まだ評価が走っていない)場合はフォールバック値を返す', () => {
    expect(readBodyNumber(null, 'height', 1)).toBe(1);
  });

  it('body ノードが評価結果に無い場合(ユーザーが削除した場合)はフォールバック値を返す', () => {
    expect(readBodyNumber(new Map(), 'height', 1)).toBe(1);
  });

  it('ソケットが number 型でない場合はフォールバック値を返す', () => {
    const results: EvaluatedGraph = new Map([['body', { height: { type: 'color', value: {} as never } }]]);
    expect(readBodyNumber(results, 'height', 1)).toBe(1);
  });
});

describe('useBodyScale (フック)', () => {
  afterEach(() => {
    useGraphStore.setState({ rootEvaluatedResults: null });
  });

  it('body ノードの height/build/shoulder ソケットの値を BodyScaleParams として返す', () => {
    useGraphStore.setState({ rootEvaluatedResults: makeResults({ height: 1.1, build: 0.9, shoulder: 1.2 }) });

    const { result } = renderHook(() => useBodyScale());

    expect(result.current).toEqual({ heightScale: 1.1, buildScale: 0.9, shoulderScale: 1.2 });
  });

  it('評価結果が変わればストア更新を検知して再計算する', () => {
    useGraphStore.setState({ rootEvaluatedResults: makeResults({ build: 1 }) });
    const { result } = renderHook(() => useBodyScale());
    expect(result.current.buildScale).toBe(1);

    act(() => {
      useGraphStore.setState({ rootEvaluatedResults: makeResults({ build: 1.3 }) });
    });

    expect(result.current.buildScale).toBe(1.3);
  });
});
