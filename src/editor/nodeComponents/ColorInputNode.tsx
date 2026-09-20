import { memo, useEffect, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ColorInputData } from '../../nodes/definitions/generic/colorInput';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';
import { useThrottledNodeDataUpdate } from './useThrottledNodeDataUpdate';

function ColorInputNodeViewImpl({ id, data }: NodeProps) {
  const nodeData = data as ColorInputData;
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
        label="Color"
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
      <Handle type="source" position={Position.Right} id="color" style={{ background: SOCKET_COLORS.color }} />
    </div>
  );
}

export const ColorInputNodeView = memo(ColorInputNodeViewImpl);
