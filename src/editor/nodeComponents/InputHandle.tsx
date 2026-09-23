import type { CSSProperties, MouseEvent, TouchEvent } from 'react';
import { Handle, Position, useNodeConnections, useNodeId, useStoreApi } from '@xyflow/react';
import { XYHandle } from '@xyflow/system';
import { useGraphStore } from '../../state/graphStore';

/** 入力ソケットのハンドル。未接続なら通常どおりここから接続を始められ、接続済みなら
 * Blender と同じく左ドラッグでそのエッジを外して掴む(別の入力へ落とすと繋ぎ替え、
 * 何もない所で離すと外れたまま)。複数接続できるソケットでは最後に繋いだエッジを掴む。 */
export function InputHandle({ id, style }: { id: string; style?: CSSProperties }) {
  const nodeId = useNodeId();
  const rfStore = useStoreApi();
  const connected = useNodeConnections({ handleType: 'target', handleId: id }).length > 0;

  const pickUp = (event: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    if ('button' in event && event.button !== 0) return;
    const { edges, pickUpEdge, dropPickedEdge } = useGraphStore.getState();
    const edge = edges.findLast((e) => e.target === nodeId && (e.targetHandle ?? null) === id);
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
      style={style}
      // 接続済みなら React Flow 自身の接続開始(入力側からの新規接続)を止め、pickUp に任せる。
      isConnectableStart={!connected}
      className={connected ? 'rf-socket--pickup' : undefined}
      onMouseDown={connected ? pickUp : undefined}
      onTouchStart={connected ? pickUp : undefined}
    />
  );
}
