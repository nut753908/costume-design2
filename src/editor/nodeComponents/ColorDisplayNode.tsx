import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';

/** 入力された color をスウォッチと hex で表示するだけのカード。値は自身の評価結果
 * (`evaluatedResults`)の `color`(`nodes/definitions/generic/colorDisplay.ts`)から読む。
 * 未接続のときは「—」。 */
function ColorDisplayNodeViewImpl({ id }: NodeProps) {
  const value = useGraphStore((s) => s.evaluatedResults?.get(id)?.color);
  const hex = value?.type === 'color' ? `#${value.value.getHexString()}` : undefined;

  return (
    <div className="rf-node">
      <NodeTitleBar id={id} label="Color Display" />
      <div className="rf-node__display">
        {hex ? (
          <>
            <span className="rf-node__display-swatch" style={{ background: hex }} />
            {hex}
          </>
        ) : (
          '—'
        )}
      </div>
      <Handle type="target" position={Position.Left} id="color" style={{ background: SOCKET_COLORS.color }} />
    </div>
  );
}

export const ColorDisplayNodeView = memo(ColorDisplayNodeViewImpl);
