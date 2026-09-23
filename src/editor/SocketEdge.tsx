import { memo } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';
import { useGraphStore } from '../state/graphStore';
import { multiSocketSlotOffset } from '../nodes/multiInputSocket';

/** 全エッジの描画(React Flow の既定のベジェ曲線と同じ形)。複数接続できる入力ソケットでは、
 * 同じソケットに入るエッジの中での並び順(=結合順、`evaluateGraph()` と同じくエッジ配列の順)に
 * 応じて、刺さる位置をカプセル上で縦にずらす(`InputHandle.tsx`)。1本しか入らないソケットでは
 * ずれは常に 0。 */
function SocketEdgeImpl({ id, target, targetHandleId, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, ...rest }: EdgeProps) {
  // 数値を1つだけ返し、並び順・本数が変わらない限り再描画しない。
  const offset = useGraphStore((s) => {
    let index = -1;
    let count = 0;
    for (const e of s.edges) {
      if (e.target !== target || (e.targetHandle ?? null) !== (targetHandleId ?? null)) continue;
      if (e.id === id) index = count;
      count++;
    }
    return index < 0 ? 0 : multiSocketSlotOffset(index, count);
  });
  const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY: targetY + offset, targetPosition });
  return <BaseEdge id={id} path={path} markerEnd={rest.markerEnd} markerStart={rest.markerStart} style={rest.style} interactionWidth={rest.interactionWidth} />;
}

export const SocketEdge = memo(SocketEdgeImpl);
