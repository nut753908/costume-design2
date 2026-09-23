import { useGraphStore } from '../state/graphStore';
import { nodeDisplayLabel } from '../nodes/registry';

/** 現在の階層パス。クリックで任意の階層へ直接ジャンプできる(`exitToLevel`、内部的には
 * `exitGroup` を必要回数呼ぶだけ)。トップレベルでも「トップレベル」だけを常に表示するのは、
 * 出入りのたびに真下の NodePalette が上下に動かないようにするため。 */
export function BreadcrumbPanel() {
  const scopeStack = useGraphStore((s) => s.scopeStack);
  const exitToLevel = useGraphStore((s) => s.exitToLevel);

  const crumbs = scopeStack.map((frame) => {
    const node = frame.nodes.find((n) => n.id === frame.parentId);
    return node?.type ? nodeDisplayLabel(node.type, node.data) : frame.parentId;
  });

  return (
    <div className="breadcrumb-panel">
      <button
        type="button"
        className="graph-io__button"
        onClick={() => exitToLevel(-1)}
        disabled={scopeStack.length === 0}
      >
        トップレベル
      </button>
      {crumbs.map((label, i) => (
        <span key={i} className="breadcrumb-panel__crumb">
          <span className="breadcrumb-panel__separator">›</span>
          <button
            type="button"
            className="graph-io__button"
            onClick={() => exitToLevel(i)}
            disabled={i === crumbs.length - 1}
          >
            {label}
          </button>
        </span>
      ))}
    </div>
  );
}
