import type { Connection, ReactFlowState } from '@xyflow/react';
import { useGraphStore } from '../state/graphStore';
import { multiSocketInsertIndex } from '../nodes/multiInputSocket';

/** 接続ドラッグを離した位置から、落とした先の入力ソケットで新しいエッジを何番目に入れるか
 * (`onConnect`/`dropPickedEdge` の `slot`)。複数接続できないソケットでも値を返すが、ストア側が無視する。
 * React Flow は `onConnect` を接続状態のリセット前に呼ぶため、`connection.pointer`(ペイン左上からの画面座標)が
 * 離した位置として読める。 */
export function multiSocketDropSlot(rf: ReactFlowState, connection: Connection): number | undefined {
  if (!rf.connection.inProgress || !rf.domNode) return undefined;
  const handleEl = rf.domNode.querySelector(
    `.react-flow__handle.target[data-nodeid="${CSS.escape(connection.target)}"][data-handleid="${CSS.escape(connection.targetHandle ?? '')}"]`,
  );
  if (!handleEl) return undefined;

  const count = useGraphStore
    .getState()
    .edges.filter((e) => e.target === connection.target && (e.targetHandle ?? null) === (connection.targetHandle ?? null)).length;
  const handleRect = handleEl.getBoundingClientRect();
  const pointerY = rf.domNode.getBoundingClientRect().top + rf.connection.pointer.y;
  const zoom = rf.transform[2];
  return multiSocketInsertIndex((pointerY - (handleRect.top + handleRect.height / 2)) / zoom, count);
}
