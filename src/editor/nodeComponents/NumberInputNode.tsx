import { memo, useEffect, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import type { NumberInputData } from '../../nodes/definitions/generic/numberInput';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';
import { ExposeToggle } from './ExposeToggle';
import { useThrottledNodeDataUpdate } from './useThrottledNodeDataUpdate';

function NumberInputNodeViewImpl({ id, data }: NodeProps) {
  const nodeData = data as NumberInputData;
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const throttledUpdate = useThrottledNodeDataUpdate(id);
  const min = nodeData.min ?? 0;
  const max = nodeData.max ?? 10;
  const step = nodeData.step ?? 0.1;

  // 即座に表示するためのローカル state(store への反映は useThrottledNodeDataUpdate 側で
  // 間引く、詳細はそちらのdocを参照)。外部要因(undo/redo・プリセット読み込みなど)で
  // nodeData.value が変わった場合はここで同期する。
  const [localValue, setLocalValue] = useState(nodeData.value);
  useEffect(() => setLocalValue(nodeData.value), [nodeData.value]);

  return (
    <div className="rf-node">
      <NodeTitleBar
        id={id}
        label={nodeData.label ?? 'Number'}
      />
      <input
        className="rf-node__slider nodrag"
        type="range"
        min={min}
        max={max}
        step={step}
        aria-labelledby={`${id}-label`}
        value={localValue}
        onChange={(e) => {
          const value = Number(e.target.value);
          setLocalValue(value);
          throttledUpdate({ value });
        }}
      />
      <div className="rf-node__value">{localValue.toFixed(2)}</div>
      <div className="rf-node__settings-row nodrag">
        <label className="rf-node__settings-field">
          Min
          <input type="number" value={min} onChange={(e) => updateNodeData(id, { min: Number(e.target.value) })} />
        </label>
        <label className="rf-node__settings-field">
          Max
          <input type="number" value={max} onChange={(e) => updateNodeData(id, { max: Number(e.target.value) })} />
        </label>
        <label className="rf-node__settings-field">
          Step
          <input
            type="number"
            value={step}
            onChange={(e) => updateNodeData(id, { step: Number(e.target.value) })}
          />
        </label>
      </div>
      <ExposeToggle id={id} exposed={nodeData.exposed === true} />
      <Handle type="source" position={Position.Right} id="value" style={{ background: SOCKET_COLORS.number }} />
    </div>
  );
}

export const NumberInputNodeView = memo(NumberInputNodeViewImpl);
