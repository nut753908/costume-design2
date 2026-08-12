import { useMemo } from 'react';
import type { Node } from '@xyflow/react';
import { useGraphStore } from './graphStore';
import { DEFAULT_BODY_SCALE, type BodyScaleParams } from '../geometry/body';

// テスト用に export している。useBodyScale 自体は React フックだが、ノード削除時の
// フォールバックというロジックの核心はここに集約されているため、直接検証できるようにする。
export function readSeedNumber(nodes: Node[], id: string, fallback: number): number {
  const node = nodes.find((n) => n.id === id);
  return typeof node?.data.value === 'number' ? node.data.value : fallback;
}

/** 慣例的な ID を持つ3つの "Body Height"/"Body Build"/"Body Shoulder" ナンバーノードを id で直接
 * 読み取り、汎用の evaluateGraph のソケットフローを迂回する — ボディスケールはガーメントの
 * geometry/material 出力ではなく、複数の要素(Body、Garments のアンカー)が合意すべき
 * シーン全体のパラメータであるため。ノードが存在しない(ユーザーが削除した等)場合は
 * DEFAULT_BODY_SCALE にフォールバックする。 */
export function useBodyScale(): BodyScaleParams {
  const heightScale = useGraphStore((s) => readSeedNumber(s.nodes, 'bodyHeight', DEFAULT_BODY_SCALE.heightScale));
  const buildScale = useGraphStore((s) => readSeedNumber(s.nodes, 'bodyBuild', DEFAULT_BODY_SCALE.buildScale));
  const shoulderScale = useGraphStore((s) =>
    readSeedNumber(s.nodes, 'bodyShoulder', DEFAULT_BODY_SCALE.shoulderScale),
  );

  return useMemo(() => ({ heightScale, buildScale, shoulderScale }), [heightScale, buildScale, shoulderScale]);
}
