import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import type { NumberInputData } from '../../nodes/definitions/numberInput';
import { SOCKET_COLORS } from '../socketColors';

export function NumberInputNodeView({ id, data }: NodeProps) {
  const nodeData = data as NumberInputData;
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const min = nodeData.min ?? 0;
  const max = nodeData.max ?? 10;
  const step = nodeData.step ?? 0.1;

  return (
    <div className="rf-node">
      <div className="rf-node__title">{nodeData.label ?? 'Number'}</div>
      <input
        className="rf-node__slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={nodeData.value}
        onChange={(e) => updateNodeData(id, { value: Number(e.target.value) })}
      />
      <div className="rf-node__value">{nodeData.value.toFixed(2)}</div>
      <Handle type="source" position={Position.Right} id="value" style={{ background: SOCKET_COLORS.number }} />
    </div>
  );
}
