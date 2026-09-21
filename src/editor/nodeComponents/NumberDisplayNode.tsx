import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';

/** 入力された number の値を表示するだけのカード。値は自身の評価結果(`evaluatedResults`)の
 * `value`(`nodes/definitions/generic/numberDisplay.ts`)から読む。未接続のときは「—」。 */
function NumberDisplayNodeViewImpl({ id }: NodeProps) {
  const value = useGraphStore((s) => s.evaluatedResults?.get(id)?.value);
  const text = value?.type === 'number' ? String(Number(value.value.toFixed(4))) : '—';

  return (
    <div className="rf-node">
      <NodeTitleBar id={id} label="Number Display" />
      <div className="rf-node__display">{text}</div>
      <Handle type="target" position={Position.Left} id="value" style={{ background: SOCKET_COLORS.number }} />
    </div>
  );
}

export const NumberDisplayNodeView = memo(NumberDisplayNodeViewImpl);
