import { memo } from 'react';
import { Handle, Position, useNodeConnections, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import { getNodeType } from '../../nodes/registry';
import { resolveNodeSockets } from '../../nodes/resolveNodeSockets';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';
import { SocketField } from './SocketField';
import { InputHandle } from './InputHandle';
import { isGroupInstanceStale } from '../../nodes/groupTemplate';

/** 専用のカスタム UI をまだ持たないノードタイプのための汎用レンダラー — ラベル、
 * 入出力ソケットの行を表示する。 */
function GenericNodeViewImpl({ id, type, data }: NodeProps) {
  const def = getNodeType(type ?? '');
  const { inputs, outputs } = resolveNodeSockets(type ?? '', data as Record<string, unknown>);
  const enterGroup = useGraphStore((s) => s.enterGroup);
  const isGroup = def.category === 'group';
  const connectedInputs = new Set(useNodeConnections({ handleType: 'target' }).map((c) => c.targetHandle));

  return (
    <div className="rf-node">
      <NodeTitleBar
        id={id}
        label={def.label}
        action={
          isGroup && (
            <button
              type="button"
              className="rf-node__enter-group nodrag"
              title="グループの中に入る"
              aria-label="グループの中に入る"
              onClick={() => enterGroup(id)}
            >
              →
            </button>
          )
        }
      />
      {isGroup && isGroupInstanceStale(type ?? '', data as Record<string, never>) && (
        <div className="rf-node__group-hint">テンプレート更新あり(中で更新)</div>
      )}
      {inputs.map((socket) => {
        const hasField = socket.default !== undefined && !connectedInputs.has(socket.id);
        return (
          <div key={socket.id} className={hasField ? 'rf-node__socket-row rf-node__socket-row--field' : 'rf-node__socket-row'}>
            <InputHandle id={socket.id} style={{ background: SOCKET_COLORS[socket.type] }} />
            {socket.label}
            {hasField && (
              <SocketField
                nodeId={id}
                label={socket.label}
                type={socket.type}
                value={(data as Record<string, unknown>)[socket.id] ?? socket.default}
                toPatch={(value) => ({ [socket.id]: value })}
              />
            )}
          </div>
        );
      })}
      {outputs.map((socket) => (
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
    </div>
  );
}

export const GenericNodeView = memo(GenericNodeViewImpl);
