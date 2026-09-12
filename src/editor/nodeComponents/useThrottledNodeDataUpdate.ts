import { useCallback, useEffect, useRef } from 'react';
import { useGraphStore } from '../../state/graphStore';

/** updateNodeData の呼び出しを requestAnimationFrame で間引く。
 *
 * スライダー/カラーピッカーのドラッグ中は input の onChange がネイティブイベントの
 * 発火頻度でそのまま連続発火し、呼び出しのたびにジオメトリの全再構築(evaluateGraph)と
 * localStorage への同期書き込み(zustand persist)が走ってしまう。1フレームにつき最大1回
 * まで store への反映を間引くことで、UI 表示自体はローカル state で即座に更新しつつ、
 * 重い処理の発火頻度を抑える。呼び出し側は通常、表示用のローカル `useState`(値・外部要因
 * での変更を追従する `useEffect` 付き)とペアで使う(`NumberInputNodeView`/`ColorInputNodeView`
 * 参照)。 */
export function useThrottledNodeDataUpdate(id: string) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const pendingRef = useRef<Record<string, unknown> | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return useCallback(
    (data: Record<string, unknown>) => {
      pendingRef.current = { ...pendingRef.current, ...data };
      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const pending = pendingRef.current;
        pendingRef.current = null;
        if (pending) updateNodeData(id, pending);
      });
    },
    [id, updateNodeData],
  );
}
