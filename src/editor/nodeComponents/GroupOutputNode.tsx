import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import type { GroupOutputData } from '../../nodes/definitions/groupOutput';
import type { GroupIOSocket } from '../../nodes/definitions/groupIOSocket';
import type { SocketType } from '../../nodes/types';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';

const SOCKET_TYPES: SocketType[] = ['number', 'color', 'enum', 'geometry', 'material'];

function uniqueSocketId(sockets: GroupIOSocket[]): string {
  const taken = new Set(sockets.map((s) => s.id));
  let n = sockets.length + 1;
  while (taken.has(`socket-${n}`)) n++;
  return `socket-${n}`;
}

/** Blender の Geometry Nodes における「Group Output」ノード相当のカスタム描画。
 * グループの中に入っている間、外部へ公開したい内部ノードの出力をこのノードへ配線するだけで
 * グループ本体の外部から見える出力ハンドルが増減する(`nodes/definitions/groupOutput.ts`/
 * `nodes/resolveNodeSockets.ts` 参照)。geometry(`garmentPlacement`)/material(`toonMaterial`
 * など)のような主要な出力も、他ガーメントへの再公開と同じくこのノードへの配線が必須
 * (`groupNodeFactory.ts` の `defineGroupNode()` 参照 — 区別しない)。 */
function GroupOutputNodeViewImpl({ id, data }: NodeProps) {
  const nodeData = data as GroupOutputData;
  const sockets = nodeData.sockets ?? [];
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const removeGroupIOSocket = useGraphStore((s) => s.removeGroupIOSocket);
  const [newType, setNewType] = useState<SocketType>('number');

  const addSocket = () => {
    const newId = uniqueSocketId(sockets);
    updateNodeData(id, { sockets: [...sockets, { id: newId, label: newId, type: newType }] });
  };

  return (
    <div className="rf-node rf-node--io">
      <NodeTitleBar id={id} label="Group Output" />
      {sockets.map((socket) => (
        <div key={socket.id} className="rf-node__io-row">
          <Handle type="target" position={Position.Left} id={socket.id} style={{ background: SOCKET_COLORS[socket.type] }} />
          <input
            className="rf-node__io-label nodrag"
            type="text"
            value={socket.label}
            onChange={(e) =>
              updateNodeData(id, { sockets: sockets.map((s) => (s.id === socket.id ? { ...s, label: e.target.value } : s)) })
            }
          />
          <button
            type="button"
            className="rf-node__io-remove nodrag"
            title="ソケットを削除"
            aria-label="ソケットを削除"
            onClick={() => removeGroupIOSocket(id, socket.id)}
          >
            ×
          </button>
        </div>
      ))}
      <div className="rf-node__io-add">
        <select className="nodrag" value={newType} onChange={(e) => setNewType(e.target.value as SocketType)}>
          {SOCKET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button type="button" className="nodrag" onClick={addSocket}>
          + Add
        </button>
      </div>
    </div>
  );
}

export const GroupOutputNodeView = memo(GroupOutputNodeViewImpl);
