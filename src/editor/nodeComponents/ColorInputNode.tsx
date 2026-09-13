import { memo, useEffect, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import type { ColorInputData } from '../../nodes/definitions/colorInput';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';
import { useThrottledNodeDataUpdate } from './useThrottledNodeDataUpdate';

// カラーピッカーは常に完全な6桁hexを返すが、テキスト欄は入力途中で不完全な文字列
// (例: "#f", "#ff00") を経由するため、完全な3桁/6桁hexになるまでは store へ反映しない
// (THREE.Color に不正な文字列を渡しても例外は投げないが、警告なしに変な色になりうる)。
const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function ColorInputNodeViewImpl({ id, data }: NodeProps) {
  const nodeData = data as ColorInputData;
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const throttledUpdate = useThrottledNodeDataUpdate(id);

  // 即座に表示するためのローカル state(store への反映は useThrottledNodeDataUpdate 側で
  // 間引く、詳細はそちらのdocを参照)。外部要因(undo/redo・プリセット読み込みなど)で
  // nodeData.hex が変わった場合はここで同期する。
  const [localHex, setLocalHex] = useState(nodeData.hex);
  useEffect(() => setLocalHex(nodeData.hex), [nodeData.hex]);

  return (
    <div className="rf-node">
      <NodeTitleBar
        id={id}
        label={nodeData.label ?? 'Color'}
        onLabelChange={(label) => updateNodeData(id, { label })}
      />
      <input
        className="rf-node__color nodrag"
        type="color"
        aria-labelledby={`${id}-label`}
        value={localHex}
        onChange={(e) => {
          const hex = e.target.value;
          setLocalHex(hex);
          throttledUpdate({ hex });
        }}
      />
      <input
        className="rf-node__hex-input nodrag"
        type="text"
        aria-labelledby={`${id}-label`}
        value={localHex}
        onChange={(e) => {
          const hex = e.target.value;
          setLocalHex(hex);
          if (HEX_PATTERN.test(hex)) throttledUpdate({ hex });
        }}
      />
      <Handle type="source" position={Position.Right} id="color" style={{ background: SOCKET_COLORS.color }} />
    </div>
  );
}

export const ColorInputNodeView = memo(ColorInputNodeViewImpl);
