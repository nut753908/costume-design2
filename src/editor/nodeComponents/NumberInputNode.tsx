import { memo, useEffect, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NumberInputData } from '../../nodes/definitions/generic/numberInput';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';
import { useThrottledNodeDataUpdate } from './useThrottledNodeDataUpdate';

function NumberInputNodeViewImpl({ id, data }: NodeProps) {
  const nodeData = data as NumberInputData;
  const throttledUpdate = useThrottledNodeDataUpdate(id);

  // 入力途中の文字列("", "-", "0." など)をそのまま保持するためのローカル state。数値として
  // 解釈できたときだけ store へ反映する。外部要因(undo/redo・プリセット読み込みなど)で
  // nodeData.value が変わった場合はここで同期する。
  const [text, setText] = useState(String(nodeData.value));
  useEffect(() => setText(String(nodeData.value)), [nodeData.value]);

  const commit = (raw: string) => {
    if (raw.trim() === '') return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    throttledUpdate({ value: parsed });
  };

  return (
    <div className="rf-node">
      <NodeTitleBar id={id} label="Number" />
      <input
        className="rf-node__number-input nodrag"
        type="number"
        step={0.01}
        aria-labelledby={`${id}-label`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
        onBlur={() => setText(String(nodeData.value))}
      />
      <Handle type="source" position={Position.Right} id="value" style={{ background: SOCKET_COLORS.number }} />
    </div>
  );
}

export const NumberInputNodeView = memo(NumberInputNodeViewImpl);
