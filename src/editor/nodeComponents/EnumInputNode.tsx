import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import type { EnumInputData } from '../../nodes/definitions/enumInput';
import { SOCKET_COLORS } from '../socketColors';

export function EnumInputNodeView({ id, data }: NodeProps) {
  const nodeData = data as EnumInputData;
  const updateNodeData = useGraphStore((s) => s.updateNodeData);

  return (
    <div className="rf-node">
      <div className="rf-node__title">{nodeData.label ?? 'Enum'}</div>
      <select value={nodeData.value} onChange={(e) => updateNodeData(id, { value: e.target.value })}>
        {nodeData.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <Handle type="source" position={Position.Right} id="value" style={{ background: SOCKET_COLORS.enum }} />
    </div>
  );
}
