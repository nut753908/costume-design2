import { useCallback, useEffect, useRef, useState } from 'react';
import { useGraphStore } from '../../state/graphStore';
import { listExposedParams } from '../../nodes/groupTemplate';

/** 更新を requestAnimationFrame で間引く(`useThrottledNodeDataUpdate` と同じ理由 —
 * スライダー/カラーピッカーのドラッグ中にジオメトリの全再構築を毎イベント走らせない)。 */
function useRafThrottle(update: (patch: Record<string, unknown>) => void) {
  const pendingRef = useRef<Record<string, unknown> | null>(null);
  const frameRef = useRef<number | null>(null);
  const updateRef = useRef(update);
  updateRef.current = update;
  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );
  return useCallback((patch: Record<string, unknown>) => {
    pendingRef.current = { ...pendingRef.current, ...patch };
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) updateRef.current(pending);
    });
  }, []);
}

function ExposedRow({ groupId, node }: { groupId: string; node: { id: string; type: string; data: Record<string, unknown> } }) {
  const updateInternal = useGraphStore((s) => s.updateGroupInternalNodeData);
  const throttled = useRafThrottle((patch) => updateInternal(groupId, node.id, patch));
  const label = node.id;

  const storedValue = node.type === 'colorInput' ? (node.data.hex as string) : node.data.value;
  const [local, setLocal] = useState(storedValue);
  useEffect(() => setLocal(storedValue), [storedValue]);

  if (node.type === 'numberInput') {
    const min = (node.data.min as number | undefined) ?? 0;
    const max = (node.data.max as number | undefined) ?? 10;
    const step = (node.data.step as number | undefined) ?? 0.1;
    return (
      <label className="rf-node__exposed-row nodrag">
        <span className="rf-node__exposed-label">{label}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={local as number}
          onChange={(e) => {
            const value = Number(e.target.value);
            setLocal(value);
            throttled({ value });
          }}
        />
        <span className="rf-node__exposed-value">{(local as number).toFixed(2)}</span>
      </label>
    );
  }
  if (node.type === 'colorInput') {
    return (
      <label className="rf-node__exposed-row nodrag">
        <span className="rf-node__exposed-label">{label}</span>
        <input
          type="color"
          value={local as string}
          onChange={(e) => {
            setLocal(e.target.value);
            throttled({ hex: e.target.value });
          }}
        />
      </label>
    );
  }
  const options = (node.data.options as string[] | undefined) ?? [];
  return (
    <label className="rf-node__exposed-row nodrag">
      <span className="rf-node__exposed-label">{label}</span>
      <select
        value={local as string}
        onChange={(e) => {
          setLocal(e.target.value);
          updateInternal(groupId, node.id, { value: e.target.value });
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

/** グループノードのカード上に、内部の `exposed: true` のパラメータ(`numberInput`/`colorInput`/
 * `enumInput`)の操作UIを並べる。中に入らずに調整でき、値は内部ノードの `data` に書き戻される
 * (`updateGroupInternalNodeData`)。露出させるかは内部ノードの `data.exposed`
 * (テンプレートで指定する)で決まる。 */
export function ExposedParams({ groupId, type, data }: { groupId: string; type: string; data: Record<string, unknown> }) {
  const params = listExposedParams(type, data as { nodes?: never });
  if (params.length === 0) return null;
  return (
    <div className="rf-node__exposed">
      {params.map((node) => (
        <ExposedRow key={node.id} groupId={groupId} node={node} />
      ))}
    </div>
  );
}
