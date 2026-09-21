import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import type { GroupInputData } from '../../nodes/definitions/groupInput';
import type { GroupIOSocket } from '../../nodes/definitions/groupIOSocket';
import type { SocketType, SocketValue } from '../../nodes/types';
import { SOCKET_COLORS, SOCKET_TYPES } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';
import { resolveIncomingValue } from '../../nodes/evaluateGraph';
import { SocketField } from './SocketField';

function uniqueSocketId(sockets: GroupIOSocket[]): string {
  const taken = new Set(sockets.map((s) => s.id));
  let n = sockets.length + 1;
  while (taken.has(`socket-${n}`)) n++;
  return `socket-${n}`;
}

function defaultForType(type: SocketType): GroupIOSocket['default'] {
  if (type === 'number') return 0;
  if (type === 'color') return '#cccccc';
  return undefined;
}

/** Blender の Geometry Nodes における「Group Input」ノード相当のカスタム描画。
 * グループの中に入っている間、このノードにソケットを増減・配線するだけでグループ本体の
 * 外部から見える入力ハンドルが増減する(`nodes/definitions/groupInput.ts`/
 * `nodes/resolveNodeSockets.ts` 参照)。`number`/`color` のソケットの未接続時のデフォルト値
 * (`socket.default`)は、親スコープ側でそのソケットに何も配線されていなければ、行の入力欄
 * (`SocketField.tsx`)でその場で編集できる(グループノードのカードの未接続入力の欄の初期値にも
 * なる)。親スコープ側で値が配線されている間は入力欄を出さず、値も表示しない
 * (配線の有無は `parentScopeEvaluatedResults`、`state/useParentScopeEvaluatedGraph.ts` から引く)。 */
function GroupInputNodeViewImpl({ id, data }: NodeProps) {
  const nodeData = data as GroupInputData;
  const sockets = nodeData.sockets ?? [];
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const removeGroupIOSocket = useGraphStore((s) => s.removeGroupIOSocket);
  const scopeStack = useGraphStore((s) => s.scopeStack);
  const parentScopeResults = useGraphStore((s) => s.parentScopeEvaluatedResults);
  const parentFrame = scopeStack.at(-1);
  const [newType, setNewType] = useState<SocketType>('number');

  // 親スコープ側でそのソケットに実際に値が配線されていれば、その注入値(`undefined` なら未接続)。
  const injectedFor = (socketId: string): SocketValue | undefined =>
    parentFrame && parentScopeResults
      ? resolveIncomingValue(parentFrame.edges, parentScopeResults, parentFrame.parentId, socketId)
      : undefined;

  const patchSocket = (socketId: string, patch: Partial<GroupIOSocket>) => {
    updateNodeData(id, { sockets: sockets.map((s) => (s.id === socketId ? { ...s, ...patch } : s)) });
  };

  const addSocket = () => {
    const newId = uniqueSocketId(sockets);
    const socket: GroupIOSocket = { id: newId, label: newId, type: newType, default: defaultForType(newType) };
    updateNodeData(id, { sockets: [...sockets, socket] });
  };

  return (
    <div className="rf-node rf-node--io">
      <NodeTitleBar id={id} label="Group Input" />
      {sockets.map((socket) => (
        <div key={socket.id} className="rf-node__io-row rf-node__io-row--out">
          <button
            type="button"
            className="rf-node__io-remove nodrag"
            title="ソケットを削除"
            aria-label="ソケットを削除"
            onClick={() => removeGroupIOSocket(id, socket.id)}
          >
            ×
          </button>
          <input
            className="rf-node__io-label nodrag"
            type="text"
            value={socket.label}
            onChange={(e) => patchSocket(socket.id, { label: e.target.value })}
          />
          {injectedFor(socket.id) === undefined && socket.default !== undefined && (
            <SocketField
              nodeId={id}
              label={socket.label}
              type={socket.type}
              value={socket.default}
              toPatch={(value) => ({ sockets: sockets.map((s) => (s.id === socket.id ? { ...s, default: value } : s)) })}
            />
          )}
          <Handle type="source" position={Position.Right} id={socket.id} style={{ background: SOCKET_COLORS[socket.type] }} />
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

export const GroupInputNodeView = memo(GroupInputNodeViewImpl);
