import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import type { ColorInputData } from '../../nodes/definitions/colorInput';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';

export function ColorInputNodeView({ id, data }: NodeProps) {
  const nodeData = data as ColorInputData;
  const updateNodeData = useGraphStore((s) => s.updateNodeData);

  return (
    <div className="rf-node">
      <NodeTitleBar id={id} label={nodeData.label ?? 'Color'} />
      <input
        className="rf-node__color"
        type="color"
        value={nodeData.hex}
        onChange={(e) => updateNodeData(id, { hex: e.target.value })}
      />
      <Handle type="source" position={Position.Right} id="color" style={{ background: SOCKET_COLORS.color }} />
    </div>
  );
}
