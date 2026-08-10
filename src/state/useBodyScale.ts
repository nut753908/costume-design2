import { useMemo } from 'react';
import { useGraphStore } from './graphStore';
import { DEFAULT_BODY_SCALE, type BodyScaleParams } from '../geometry/body';

/** 慣例的な ID を持つ2つの "Body Height"/"Body Build" ナンバーノードを id で直接読み取り、
 * 汎用の evaluateGraph のソケットフローを迂回する — ボディスケールはガーメントの
 * geometry/material 出力ではなく、複数の要素(Body、Garments のアンカー)が合意すべき
 * シーン全体のパラメータであるため。ノードが存在しない(ユーザーが削除した等)場合は
 * DEFAULT_BODY_SCALE にフォールバックする。 */
export function useBodyScale(): BodyScaleParams {
  const heightScale = useGraphStore((s) => {
    const node = s.nodes.find((n) => n.id === 'bodyHeight');
    return typeof node?.data.value === 'number' ? node.data.value : DEFAULT_BODY_SCALE.heightScale;
  });
  const buildScale = useGraphStore((s) => {
    const node = s.nodes.find((n) => n.id === 'bodyBuild');
    return typeof node?.data.value === 'number' ? node.data.value : DEFAULT_BODY_SCALE.buildScale;
  });

  return useMemo(() => ({ heightScale, buildScale }), [heightScale, buildScale]);
}
