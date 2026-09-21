import { useEffect, useState } from 'react';
import type { SocketDef } from '../../nodes/types';
import { useThrottledNodeDataUpdate } from './useThrottledNodeDataUpdate';

/** `number`/`color` の値を編集する小さな入力欄。未接続の入力ソケットの行(`GenericNode.tsx`、値は
 * ノードの `data[socket.id]`)が使う。`toPatch` は編集した値を `updateNodeData` へ渡す `data` の
 * 一部へ変換する。`numberInput`/`colorInput` ノードと同じく、入力途中の文字列/ドラッグ中の色は
 * ローカル state で即座に表示し、store への反映は間引く。 */
export interface SocketFieldProps {
  nodeId: string;
  label: string;
  type: SocketDef['type'];
  value: unknown;
  toPatch: (value: number | string) => Record<string, unknown>;
}

export function SocketField(props: SocketFieldProps) {
  if (props.type === 'number') return <NumberField {...props} />;
  if (props.type === 'color') return <ColorField {...props} />;
  return null;
}

function NumberField({ nodeId, label, value, toPatch }: SocketFieldProps) {
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
      aria-label={label}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const raw = e.target.value;
        if (raw.trim() === '') return;
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) throttledUpdate(toPatch(parsed));
      }}
      onBlur={() => setText(String(current))}
    />
  );
}

function ColorField({ nodeId, label, value, toPatch }: SocketFieldProps) {
  const throttledUpdate = useThrottledNodeDataUpdate(nodeId);
  const current = typeof value === 'string' ? value : '#cccccc';
  const [localHex, setLocalHex] = useState(current);
  useEffect(() => setLocalHex(current), [current]);

  return (
    <input
      className="rf-node__socket-field rf-node__socket-field--color nodrag"
      type="color"
      aria-label={label}
      value={localHex}
      onChange={(e) => {
        setLocalHex(e.target.value);
        throttledUpdate(toPatch(e.target.value));
      }}
    />
  );
}
