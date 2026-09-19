import { useGraphStore } from '../../state/graphStore';

/** グループの内部にある `numberInput`/`colorInput`/`enumInput` のカードに付く、「グループの
 * カードに表示」のチェックボックス(`data.exposed`)。チェックすると、外側(親の階層)の
 * グループノードのカード上にこのパラメータの操作UIが出て、中に入らずに調整できる
 * (`ExposedParams.tsx`)。グループの中に入っていない(トップレベル)間は、露出先の
 * グループが無いので表示しない。 */
export function ExposeToggle({ id, exposed }: { id: string; exposed: boolean }) {
  const insideGroup = useGraphStore((s) => s.scopeStack.length > 0);
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  if (!insideGroup) return null;
  return (
    <label className="rf-node__expose nodrag">
      <input type="checkbox" checked={exposed} onChange={(e) => updateNodeData(id, { exposed: e.target.checked })} />
      グループに表示
    </label>
  );
}
