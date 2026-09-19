import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import { getNodeType } from '../../nodes/registry';
import { resolveNodeSockets } from '../../nodes/resolveNodeSockets';
import type { SocketValue } from '../../nodes/types';
import { SOCKET_COLORS } from '../socketColors';
import { NodeTitleBar } from './NodeTitleBar';
import { ExposedParams } from './ExposedParams';
import { isGroupInstanceStale } from '../../nodes/groupTemplate';

function isDisplayable(value: SocketValue): value is Extract<SocketValue, { type: 'number' | 'enum' }> {
  return value.type === 'number' || value.type === 'enum';
}

/** ラベルを直接編集できる `GenericNode.tsx` 系ノードの type 名。出力が number 型で
 * 統一されておりソケット色だけでは互いに判別できない numberAdd/numberMultiply/
 * numberSubtract/numberMax/numberNegate/numberHalf は、意味的な名前を付けて見分ける必要性が他の
 * generator 系ノードより高いため、numberInput などの専用UIノードと同じくラベルをカード上で
 * 直接編集可能にしている(元の type 名は編集後もサブタイトルとして残るため判別性は失われない、
 * 下記 typeName 参照)。 */
const EDITABLE_LABEL_TYPES = new Set(['numberAdd', 'numberSubtract', 'numberMultiply', 'numberMax', 'numberNegate', 'numberHalf']);

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
  const enterGroup = useGraphStore((s) => s.enterGroup);
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const outputValues = evaluated?.get(id);
  const customLabel = (data as { label?: string }).label;
  const label = customLabel ?? def.label;
  const isGroup = def.category === 'group';
  // numberAdd/numberMultiply/numberSubtract のように出力が number 型で統一されている
  // ノードは、SOCKET_COLORS によるソケット色だけでは(numberInput/enumInput/colorInput と
  // 違って)互いに区別できない。data.label で独自の名前が付けられている場合に限り、
  // 元のノード種別(type)をそのまま併記して、ラベルの記述内容に頼らず判別できるようにする。
  const typeName = customLabel !== undefined ? type : undefined;
  const onLabelChange = EDITABLE_LABEL_TYPES.has(type ?? '')
    ? (newLabel: string) => updateNodeData(id, { label: newLabel })
    : undefined;

  return (
    <div className="rf-node" onDoubleClick={isGroup ? () => enterGroup(id) : undefined}>
      <NodeTitleBar id={id} label={label} typeName={typeName} onLabelChange={onLabelChange} />
      {isGroup && <div className="rf-node__group-hint">ダブルクリックで中に入る</div>}
      {isGroup && <ExposedParams groupId={id} type={type ?? ''} data={data as Record<string, unknown>} />}
      {isGroup && isGroupInstanceStale(type ?? '', data as Record<string, never>) && (
        <div className="rf-node__group-hint rf-node__group-hint--stale">テンプレート更新あり(中で更新)</div>
      )}
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
