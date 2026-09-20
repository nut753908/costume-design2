import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import { getNodeType } from '../../nodes/registry';
import { resolveNodeSockets } from '../../nodes/resolveNodeSockets';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';
import { ExposedParams } from './ExposedParams';
import { isGroupInstanceStale } from '../../nodes/groupTemplate';

/** 専用のカスタム UI をまだ持たないノードタイプのための汎用レンダラー — ラベル、
 * 入出力ソケットの行を表示する。 */
function GenericNodeViewImpl({ id, type, data }: NodeProps) {
  const def = getNodeType(type ?? '');
  const { inputs, outputs } = resolveNodeSockets(type ?? '', data as Record<string, unknown>);
  const enterGroup = useGraphStore((s) => s.enterGroup);
  const isGroup = def.category === 'group';

  return (
    <div className="rf-node" onDoubleClick={isGroup ? () => enterGroup(id) : undefined}>
      <NodeTitleBar id={id} label={def.label} />
      {isGroup && <div className="rf-node__group-hint">ダブルクリックで中に入る</div>}
      {isGroup && <ExposedParams groupId={id} type={type ?? ''} data={data as Record<string, unknown>} />}
      {isGroup && isGroupInstanceStale(type ?? '', data as Record<string, never>) && (
        <div className="rf-node__group-hint rf-node__group-hint--stale">テンプレート更新あり(中で更新)</div>
      )}
      {inputs.map((socket) => (
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
