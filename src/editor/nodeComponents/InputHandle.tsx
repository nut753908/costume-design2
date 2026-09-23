import type { CSSProperties, MouseEvent, TouchEvent } from 'react';
import { Handle, Position, useNodeConnections, useNodeId, useStoreApi } from '@xyflow/react';
import { XYHandle } from '@xyflow/system';
import { useGraphStore } from '../../state/graphStore';
import { MULTI_SOCKET_SLOT, MULTI_SOCKET_WIDTH, multiSocketHeight } from '../../nodes/multiInputSocket';

/** 入力ソケットのハンドル。未接続なら通常どおりここから接続を始められ、接続済みなら
 * Blender と同じく左ドラッグでそのエッジを外して掴む(別の入力へ落とすと繋ぎ替え、
 * 何もない所で離すと外れたまま)。
 * `multiple`(`SocketDef.multiple`)なら接続本数に応じて伸びるカプセル形で描き、各エッジは
 * `SocketEdge` が結合順に縦にずらして刺す。掴むのは押した位置に一番近いエッジ。 */
export function InputHandle({ id, style, multiple = false }: { id: string; style?: CSSProperties; multiple?: boolean }) {
  const nodeId = useNodeId();
  const rfStore = useStoreApi();
  const count = useNodeConnections({ handleType: 'target', handleId: id }).length;
  const connected = count > 0;

  const pickUp = (event: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    if ('button' in event && event.button !== 0) return;
    const { edges, pickUpEdge, dropPickedEdge } = useGraphStore.getState();
    const incoming = edges.filter((e) => e.target === nodeId && (e.targetHandle ?? null) === id);
    const edge = incoming[multiple ? nearestSlot(event, incoming.length, rfStore.getState().transform[2]) : incoming.length - 1];
    if (!edge) return;

    // React Flow がエッジの端を掴んだとき(EdgeUpdateAnchors)と同じく、エッジの接続元の
    // 出力ソケットを起点にした接続ドラッグとして始める。
    const s = rfStore.getState();
    XYHandle.onPointerDown(event.nativeEvent, {
      handleDomNode: event.currentTarget,
      autoPanOnConnect: s.autoPanOnConnect,
      connectionMode: s.connectionMode,
      connectionRadius: s.connectionRadius,
      domNode: s.domNode,
      nodeLookup: s.nodeLookup,
      lib: s.lib,
      isTarget: false,
      edgeUpdaterType: 'source',
      handleId: edge.sourceHandle ?? null,
      nodeId: edge.source,
      flowId: s.rfId,
      panBy: s.panBy,
      cancelConnection: s.cancelConnection,
      // ドラッグしきい値を超えて実際に動かし始めた時点で外す(クリックだけでは外れない)。
      onConnectStart: (e, params) => {
        pickUpEdge(edge.id);
        rfStore.getState().onConnectStart?.(e, params);
      },
      onConnectEnd: (...args) => rfStore.getState().onConnectEnd?.(...args),
      onConnect: dropPickedEdge,
      isValidConnection: (connection) => rfStore.getState().isValidConnection?.(connection) ?? true,
      updateConnection: s.updateConnection,
      getTransform: () => rfStore.getState().transform,
      getFromHandle: () => rfStore.getState().connection.fromHandle,
      autoPanSpeed: s.autoPanSpeed,
      dragThreshold: s.connectionDragThreshold,
    });
  };

  return (
    <Handle
      type="target"
      position={Position.Left}
      id={id}
      // borderRadius は枠線 1px を含む外形(幅 8px)の端が半円になるよう、幅の半分より大きくする。
      style={multiple ? { ...style, width: MULTI_SOCKET_WIDTH, height: multiSocketHeight(count), borderRadius: MULTI_SOCKET_WIDTH } : style}
      // 接続済みなら React Flow 自身の接続開始(入力側からの新規接続)を止め、pickUp に任せる。
      isConnectableStart={!connected}
      className={connected ? 'rf-socket--pickup' : undefined}
      onMouseDown={connected ? pickUp : undefined}
      onTouchStart={connected ? pickUp : undefined}
    />
  );
}

/** 押した位置が、ソケットに縦に並んだ `count` 個の刺さる位置のうち何番目(0=先頭)に一番近いか。
 * `zoom` はキャンバスの拡大率(画面上の間隔は `MULTI_SOCKET_SLOT * zoom`)。 */
function nearestSlot(event: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>, count: number, zoom: number): number {
  const rect = event.currentTarget.getBoundingClientRect();
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
  const offset = (clientY - (rect.top + rect.height / 2)) / (MULTI_SOCKET_SLOT * zoom);
  return Math.min(count - 1, Math.max(0, Math.round(offset + (count - 1) / 2)));
}
