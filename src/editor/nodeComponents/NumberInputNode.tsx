import { memo, useEffect, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NumberInputData } from '../../nodes/definitions/generic/numberInput';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';
import { ExposeToggle } from './ExposeToggle';
import { useThrottledNodeDataUpdate } from './useThrottledNodeDataUpdate';

function NumberInputNodeViewImpl({ id, data }: NodeProps) {
  const nodeData = data as NumberInputData;
  const throttledUpdate = useThrottledNodeDataUpdate(id);
  const min = nodeData.min ?? 0;
  const max = nodeData.max ?? 10;
  const step = nodeData.step ?? 0.1;

  // 入力途中の文字列("", "-", "0." など)をそのまま保持するためのローカル state。数値として
  // 解釈できたときだけ [min, max] に収めて store へ反映する(`constNumberInput` の min=max
  // で固定した定数が入力で変わらないようにするため)。外部要因(undo/redo・プリセット読み込み
  // など)で nodeData.value が変わった場合はここで同期する。
  const [text, setText] = useState(String(nodeData.value));
  useEffect(() => setText(String(nodeData.value)), [nodeData.value]);

  const commit = (raw: string) => {
    if (raw.trim() === '') return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    throttledUpdate({ value: Math.min(max, Math.max(min, parsed)) });
  };

  return (
    <div className="rf-node">
      <NodeTitleBar id={id} label="Number" />
      <input
        className="rf-node__number-input nodrag"
        type="number"
        min={min}
        max={max}
        step={step}
        aria-labelledby={`${id}-label`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
        onBlur={() => setText(String(nodeData.value))}
      />
      <ExposeToggle id={id} exposed={nodeData.exposed === true} />
      <Handle type="source" position={Position.Right} id="value" style={{ background: SOCKET_COLORS.number }} />
    </div>
  );
}

export const NumberInputNodeView = memo(NumberInputNodeViewImpl);
