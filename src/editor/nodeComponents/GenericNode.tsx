import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import { getNodeType } from '../../nodes/registry';
import type { SocketValue } from '../../nodes/types';
import { SOCKET_COLORS } from '../socketColors';

function isDisplayable(value: SocketValue): value is Extract<SocketValue, { type: 'number' | 'enum' }> {
  return value.type === 'number' || value.type === 'enum';
}

/** 専用のカスタム UI をまだ持たないノードタイプのための汎用レンダラー — ラベル、
 * 入出力ソケットの行、(終端ノードの場合は)リアルタイムの評価値を表示する。 */
export function GenericNodeView({ id, type, data }: NodeProps) {
  const def = getNodeType(type ?? '');
  const evaluated = useGraphStore((s) => s.evaluatedResults);
  const outputValues = evaluated?.get(id);
  const label = (data as { label?: string }).label ?? def.label;

  return (
    <div className="rf-node">
      <div className="rf-node__title">{label}</div>
      {def.inputs.map((socket) => (
        <div key={socket.id} className="rf-node__socket-row">
          <Handle
            type="target"
            position={Position.Left}
            id={socket.id}
            style={{ background: SOCKET_COLORS[socket.type] }}
          />
          {socket.label}
        </div>
      ))}
      {def.outputs.map((socket) => (
        <div key={socket.id} className="rf-node__socket-row rf-node__socket-row--out">
          {socket.label}
          <Handle
            type="source"
            position={Position.Right}
            id={socket.id}
            style={{ background: SOCKET_COLORS[socket.type] }}
          />
        </div>
      ))}
      {outputValues &&
        Object.entries(outputValues)
          .filter((entry): entry is [string, Extract<SocketValue, { type: 'number' | 'enum' }>] =>
            isDisplayable(entry[1]),
          )
          .map(([key, value]) => (
            <div key={key} className="rf-node__value">
              {key}: {value.type === 'number' ? value.value.toFixed(2) : value.value}
            </div>
          ))}
    </div>
  );
}
