import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import { getNodeType } from '../../nodes/registry';
import { resolveNodeSockets } from '../../nodes/resolveNodeSockets';
import type { SocketValue } from '../../nodes/types';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';

function isDisplayable(value: SocketValue): value is Extract<SocketValue, { type: 'number' | 'enum' }> {
  return value.type === 'number' || value.type === 'enum';
}

/** 専用のカスタム UI をまだ持たないノードタイプのための汎用レンダラー — ラベル、
 * 入出力ソケットの行、(終端ノードの場合は)リアルタイムの評価値を表示する。
 *
 * 注意: evaluatedResults(store 全体の Map)を購読しているため、evaluateGraph は
 * 変更があったノードだけでなく全ノードの出力を毎回作り直す実装上、グラフ内のどこか
 * 1箇所が変化するとこのコンポーネントは(memo化していても)再レンダーされる。React.memo は
 * React Flow 側の無関係な再レンダー(パン/ズーム/他ノード選択など、props が変わらない
 * ケース)を防ぐためのもので、evaluatedResults 変化による再レンダーまでは防げない。 */
function GenericNodeViewImpl({ id, type, data }: NodeProps) {
  const def = getNodeType(type ?? '');
  const { inputs, outputs } = resolveNodeSockets(type ?? '', data as Record<string, unknown>);
  const evaluated = useGraphStore((s) => s.evaluatedResults);
  const outputValues = evaluated?.get(id);
  const label = (data as { label?: string }).label ?? def.label;

  return (
    <div className="rf-node">
      <NodeTitleBar id={id} label={label} />
      {inputs.map((socket) => (
        <div key={socket.id} className="rf-node__socket-row">
          <Handle
            type="target"
            position={Position.Left}
            id={socket.id}
            style={{ background: SOCKET_COLORS[socket.type] }}
          />
          {socket.label}
        </div>
      ))}
      {outputs.map((socket) => (
        <div key={socket.id} className="rf-node__socket-row rf-node__socket-row--out">
          {socket.label}
          <Handle
            type="source"
            position={Position.Right}
            id={socket.id}
            style={{ background: SOCKET_COLORS[socket.type] }}
          />
        </div>
      ))}
      {outputValues &&
        Object.entries(outputValues)
          .filter((entry): entry is [string, Extract<SocketValue, { type: 'number' | 'enum' }>] =>
            isDisplayable(entry[1]),
          )
          .map(([key, value]) => (
            <div key={key} className="rf-node__value">
              {key}: {value.type === 'number' ? value.value.toFixed(2) : value.value}
            </div>
          ))}
    </div>
  );
}

export const GenericNodeView = memo(GenericNodeViewImpl);
