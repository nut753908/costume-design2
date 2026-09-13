import { useMemo } from 'react';
import { useGraphStore } from './graphStore';
import { DEFAULT_BODY_SCALE, type BodyScaleParams } from '../geometry/body';
import { BODY_NODE_ID } from '../nodes/definitions/body';
import type { EvaluatedGraph } from '../nodes/evaluateGraph';

// テスト用に export している。id 'body' の Body ノード(nodes/definitions/body.ts)の
// 評価結果から、指定ソケットの number 値を読み取る。ノードが削除されている・まだ評価が
// 走っていない(rootEvaluatedResults が null)・ソケットの値が number でない、のいずれの
// 場合もフォールバック値を返す。
export function readBodyNumber(results: EvaluatedGraph | null, socketId: string, fallback: number): number {
  const socketValue = results?.get(BODY_NODE_ID)?.[socketId];
  return socketValue?.type === 'number' ? socketValue.value : fallback;
}

/** Body(3Dモデル本体)がシーン全体のパラメータとして使う Height/Build/Shoulder スケールを、
 * `rootEvaluatedResults`(state/useRootEvaluatedGraph.ts、常にトップレベル視点)上の id 'body'
 * ノード(nodes/definitions/body.ts、BODY_NODE_ID)の評価結果から読み取る。この Body ノードは
 * `bodyHeight`/`bodyBuild`/`bodyShoulder`(慣例的な id を持つ numberInput ノード、ガーメントの
 * アンカー計算にも通常のソケット配線で使われる)から実際にワイヤーで配線されており、
 * ソケットグラフを迂回してノードを id で直接読んでいた以前の実装と異なり、キャンバス上で
 * 「Body がどこから値を受け取っているか」が普通のエッジとして見える(ルート CLAUDE.md の
 * 「ボディスケールはソケットグラフを迂回して直接読み取られる」節参照)。Body ノード自体が
 * 削除されている場合は DEFAULT_BODY_SCALE (1, 1, 1) にフォールバックする。 */
export function useBodyScale(): BodyScaleParams {
  const heightScale = useGraphStore((s) =>
    readBodyNumber(s.rootEvaluatedResults, 'height', DEFAULT_BODY_SCALE.heightScale),
  );
  const buildScale = useGraphStore((s) =>
    readBodyNumber(s.rootEvaluatedResults, 'build', DEFAULT_BODY_SCALE.buildScale),
  );
  const shoulderScale = useGraphStore((s) =>
    readBodyNumber(s.rootEvaluatedResults, 'shoulder', DEFAULT_BODY_SCALE.shoulderScale),
  );

  return useMemo(() => ({ heightScale, buildScale, shoulderScale }), [heightScale, buildScale, shoulderScale]);
}
