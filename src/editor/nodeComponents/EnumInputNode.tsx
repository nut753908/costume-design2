import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import type { EnumInputData } from '../../nodes/definitions/enumInput';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';

function EnumInputNodeViewImpl({ id, data }: NodeProps) {
  const nodeData = data as EnumInputData;
  const updateNodeData = useGraphStore((s) => s.updateNodeData);

  return (
    <div className="rf-node">
      <NodeTitleBar id={id} label={nodeData.label ?? 'Enum'} />
      <select
        aria-labelledby={`${id}-label`}
        value={nodeData.value}
        onChange={(e) => updateNodeData(id, { value: e.target.value })}
      >
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

export const EnumInputNodeView = memo(EnumInputNodeViewImpl);
