import { useEffect, useState } from 'react';
import type { SocketDef } from '../../nodes/types';
import { useThrottledNodeDataUpdate } from './useThrottledNodeDataUpdate';

/** 未接続の `number`/`color` 入力ソケットの行に出す入力欄。値はノードの `data[socket.id]` に
 * 保持され(未設定なら `socket.default`)、`evaluateGraph()` が未接続ソケットの値として
 * 使う。`numberInput`/`colorInput` ノードと同じく、入力途中の文字列/ドラッグ中の色は
 * ローカル state で即座に表示し、store への反映は間引く。 */
export function SocketField({ nodeId, socket, value }: { nodeId: string; socket: SocketDef; value: unknown }) {
  if (socket.type === 'number') return <NumberField nodeId={nodeId} socket={socket} value={value} />;
  if (socket.type === 'color') return <ColorField nodeId={nodeId} socket={socket} value={value} />;
  return null;
}

function NumberField({ nodeId, socket, value }: { nodeId: string; socket: SocketDef; value: unknown }) {
  const throttledUpdate = useThrottledNodeDataUpdate(nodeId);
  const current = typeof value === 'number' ? value : 0;

  // 入力途中の文字列("", "-", "0." など)をそのまま保持するためのローカル state。数値として
  // 解釈できたときだけ store へ反映する。外部要因(undo/redo・プリセット読み込みなど)で
  // 値が変わった場合はここで同期する。
  const [text, setText] = useState(String(current));
  useEffect(() => setText(String(current)), [current]);

  return (
    <input
      className="rf-node__socket-field nodrag"
      type="number"
      step={0.01}
      aria-label={socket.label}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const raw = e.target.value;
        if (raw.trim() === '') return;
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) throttledUpdate({ [socket.id]: parsed });
      }}
      onBlur={() => setText(String(current))}
    />
  );
}

function ColorField({ nodeId, socket, value }: { nodeId: string; socket: SocketDef; value: unknown }) {
  const throttledUpdate = useThrottledNodeDataUpdate(nodeId);
  const current = typeof value === 'string' ? value : '#cccccc';
  const [localHex, setLocalHex] = useState(current);
  useEffect(() => setLocalHex(current), [current]);

  return (
    <input
      className="rf-node__socket-field rf-node__socket-field--color nodrag"
      type="color"
      aria-label={socket.label}
      value={localHex}
      onChange={(e) => {
        setLocalHex(e.target.value);
        throttledUpdate({ [socket.id]: e.target.value });
      }}
    />
  );
}
