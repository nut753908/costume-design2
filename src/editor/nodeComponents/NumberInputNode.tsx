import { memo, useEffect, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NumberInputData } from '../../nodes/definitions/numberInput';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';
import { useThrottledNodeDataUpdate } from './useThrottledNodeDataUpdate';

function NumberInputNodeViewImpl({ id, data }: NodeProps) {
  const nodeData = data as NumberInputData;
  const throttledUpdate = useThrottledNodeDataUpdate(id);
  const min = nodeData.min ?? 0;
  const max = nodeData.max ?? 10;
  const step = nodeData.step ?? 0.1;

  // ドラッグ中の表示はローカル state で即座に更新し、store への反映(=ジオメトリ再構築+
  // localStorage 書き込み)は間引く。外部要因(undo/redo・プリセット読み込みなど)で
  // nodeData.value が変わった場合は同期する。
  const [localValue, setLocalValue] = useState(nodeData.value);
  useEffect(() => setLocalValue(nodeData.value), [nodeData.value]);

  return (
    <div className="rf-node">
      <NodeTitleBar id={id} label={nodeData.label ?? 'Number'} />
      <input
        className="rf-node__slider"
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
      <Handle type="source" position={Position.Right} id="value" style={{ background: SOCKET_COLORS.number }} />
    </div>
  );
}

export const NumberInputNodeView = memo(NumberInputNodeViewImpl);
