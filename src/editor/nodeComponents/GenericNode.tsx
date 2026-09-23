import { memo } from 'react';
import { Handle, Position, useNodeConnections, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import { getNodeType, nodeDisplayLabel } from '../../nodes/registry';
import { resolveNodeSockets } from '../../nodes/resolveNodeSockets';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';
import { SocketField } from './SocketField';
import { InputHandle } from './InputHandle';
import { multiSocketRowExtra } from '../../nodes/multiInputSocket';
import { isGroupInstanceStale } from '../../nodes/groupTemplate';

/** 専用のカスタム UI をまだ持たないノードタイプのための汎用レンダラー — ラベル、
 * 入出力ソケットの行を表示する。 */
function GenericNodeViewImpl({ id, type, data }: NodeProps) {
  const def = getNodeType(type ?? '');
  const { inputs, outputs } = resolveNodeSockets(type ?? '', data as Record<string, unknown>);
  const enterGroup = useGraphStore((s) => s.enterGroup);
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const isGroup = def.category === 'group';
  const inputCounts = new Map<string | null, number>();
  for (const c of useNodeConnections({ handleType: 'target' })) inputCounts.set(c.targetHandle, (inputCounts.get(c.targetHandle) ?? 0) + 1);

  return (
    <div className="rf-node">
      <NodeTitleBar
        id={id}
        label={nodeDisplayLabel(type ?? '', data as Record<string, unknown>)}
        onRename={def.renamable ? (label) => updateNodeData(id, { label }) : undefined}
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
        const count = inputCounts.get(socket.id) ?? 0;
        const hasField = socket.default !== undefined && count === 0;
        // 複数接続できるソケットはカプセルが伸びた分だけ行を高くする(autoLayout.ts の見積もりと対応)。
        const rowStyle = socket.multiple ? { paddingTop: 3 + multiSocketRowExtra(count) / 2, paddingBottom: 3 + multiSocketRowExtra(count) / 2 } : undefined;
        return (
          <div key={socket.id} className={hasField ? 'rf-node__socket-row rf-node__socket-row--field' : 'rf-node__socket-row'} style={rowStyle}>
            <InputHandle id={socket.id} style={{ background: SOCKET_COLORS[socket.type] }} multiple={socket.multiple} />
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
