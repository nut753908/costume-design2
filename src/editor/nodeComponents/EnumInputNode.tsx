import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import type { EnumInputData } from '../../nodes/definitions/generic/enumInput';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';
import { ExposeToggle } from './ExposeToggle';

function uniqueOptionLabel(options: string[]): string {
  const taken = new Set(options);
  let n = options.length + 1;
  while (taken.has(`option${n}`)) n++;
  return `option${n}`;
}

function EnumInputNodeViewImpl({ id, data }: NodeProps) {
  const nodeData = data as EnumInputData;
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const options = nodeData.options;

  // 選択肢の文字列を書き換えた/削除した場合、現在選択中の value がその選択肢を指していたなら
  // 追従させる(でないと value が options に存在しない値のまま宙に浮いてしまう)。
  const renameOption = (index: number, newLabel: string) => {
    const oldLabel = options[index];
    const nextOptions = options.map((o, i) => (i === index ? newLabel : o));
    const value = nodeData.value === oldLabel ? newLabel : nodeData.value;
    updateNodeData(id, { options: nextOptions, value });
  };

  const removeOption = (index: number) => {
    if (options.length <= 1) return; // 選択肢は最低1つ残す
    const removedLabel = options[index];
    const nextOptions = options.filter((_, i) => i !== index);
    const value = nodeData.value === removedLabel ? nextOptions[0] : nodeData.value;
    updateNodeData(id, { options: nextOptions, value });
  };

  const addOption = () => {
    updateNodeData(id, { options: [...options, uniqueOptionLabel(options)] });
  };

  return (
    <div className="rf-node">
      <NodeTitleBar
        id={id}
        label="Enum"
      />
      <select
        className="nodrag"
        aria-labelledby={`${id}-label`}
        value={nodeData.value}
        onChange={(e) => updateNodeData(id, { value: e.target.value })}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {options.map((opt, index) => (
        <div key={index} className="rf-node__io-row rf-node__io-row--out">
          <button
            type="button"
            className="rf-node__io-remove nodrag"
            title="選択肢を削除"
            aria-label="選択肢を削除"
            disabled={options.length <= 1}
            onClick={() => removeOption(index)}
          >
            ×
          </button>
          <input
            className="rf-node__io-label nodrag"
            type="text"
            value={opt}
            onChange={(e) => renameOption(index, e.target.value)}
          />
        </div>
      ))}
      <div className="rf-node__io-add">
        <button type="button" className="nodrag" onClick={addOption}>
          + Add
        </button>
      </div>
      <ExposeToggle id={id} exposed={(nodeData as { exposed?: boolean }).exposed === true} />
      <Handle type="source" position={Position.Right} id="value" style={{ background: SOCKET_COLORS.enum }} />
    </div>
  );
}

export const EnumInputNodeView = memo(EnumInputNodeViewImpl);
