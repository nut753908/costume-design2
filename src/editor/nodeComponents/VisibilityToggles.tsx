import { useMemo } from 'react';
import { useGraphStore } from '../../state/graphStore';
import { sceneMeshKeys, useViewStore } from '../../state/viewStore';

/** グループカードのタイトル行に出す、3Dビューでの表示切り替えボタン(S: このグループだけを
 * 単独表示、H: 非表示)。3Dビューに描画されるグループ(トップレベルにあり、内部に `sceneOutput`
 * を持つもの)にだけ出る。状態は `state/viewStore.ts` にあり、グラフの内容には影響しない。 */
export function VisibilityToggles({ nodeId }: { nodeId: string }) {
  const atTopLevel = useGraphStore((s) => s.scopeStack.length === 0);
  const result = useGraphStore((s) => s.rootEvaluatedResults?.get(nodeId));
  const keys = useMemo(() => sceneMeshKeys(nodeId, result), [nodeId, result]);
  const solo = useViewStore((s) => s.solo);
  const hidden = useViewStore((s) => s.hidden);
  const toggleSolo = useViewStore((s) => s.toggleSolo);
  const toggleHidden = useViewStore((s) => s.toggleHidden);

  // 中に入っている間は、このカードは別階層のノードで rootEvaluatedResults の id と対応しない。
  if (!atTopLevel || keys.length === 0) return null;

  const isSolo = solo.size === keys.length && keys.every((k) => solo.has(k));
  const isHidden = keys.every((k) => hidden.has(k));

  return (
    <>
      <button
        type="button"
        className={`rf-node__view-toggle nodrag${isSolo ? ' rf-node__view-toggle--on' : ''}`}
        title="3Dビューでこのグループだけを表示(もう一度で解除)"
        aria-label="単独表示"
        aria-pressed={isSolo}
        onClick={() => toggleSolo(keys)}
      >
        S
      </button>
      <button
        type="button"
        className={`rf-node__view-toggle nodrag${isHidden ? ' rf-node__view-toggle--on' : ''}`}
        title="3Dビューでこのグループを非表示(もう一度で再表示)"
        aria-label="非表示"
        aria-pressed={isHidden}
        onClick={() => toggleHidden(keys)}
      >
        H
      </button>
    </>
  );
}
