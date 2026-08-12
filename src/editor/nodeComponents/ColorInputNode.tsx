import { memo, useEffect, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ColorInputData } from '../../nodes/definitions/colorInput';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';
import { useThrottledNodeDataUpdate } from './useThrottledNodeDataUpdate';

function ColorInputNodeViewImpl({ id, data }: NodeProps) {
  const nodeData = data as ColorInputData;
  const throttledUpdate = useThrottledNodeDataUpdate(id);

  // ドラッグ中の表示はローカル state で即座に更新し、store への反映(=ジオメトリ再構築+
  // localStorage 書き込み)は間引く。外部要因(undo/redo・プリセット読み込みなど)で
  // nodeData.hex が変わった場合は同期する。
  const [localHex, setLocalHex] = useState(nodeData.hex);
  useEffect(() => setLocalHex(nodeData.hex), [nodeData.hex]);

  return (
    <div className="rf-node">
      <NodeTitleBar id={id} label={nodeData.label ?? 'Color'} />
      <input
        className="rf-node__color"
        type="color"
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
