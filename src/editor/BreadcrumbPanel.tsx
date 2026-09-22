import { useGraphStore } from '../state/graphStore';
import { getNodeType } from '../nodes/registry';

/** グループの中に入っている間だけ表示される、現在の階層パス。クリックで任意の階層へ
 * 直接ジャンプできる(`exitToLevel`、内部的には `exitGroup` を必要回数呼ぶだけ)。 */
export function BreadcrumbPanel() {
  const scopeStack = useGraphStore((s) => s.scopeStack);
  const exitToLevel = useGraphStore((s) => s.exitToLevel);

  if (scopeStack.length === 0) return null;

  const crumbs = scopeStack.map((frame) => {
    const node = frame.nodes.find((n) => n.id === frame.parentId);
    return node?.type ? getNodeType(node.type).label : frame.parentId;
  });

  return (
    <div className="breadcrumb-panel">
      <button type="button" className="graph-io__button" onClick={() => exitToLevel(-1)}>
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
