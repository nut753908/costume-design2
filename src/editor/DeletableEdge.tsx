import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from '@xyflow/react';

/** 標準の Bezier エッジに、パス中央の×ボタンを追加しただけのエッジ。ノード側の
 * NodeTitleBar の削除ボタンと対になる、エッジ単体を消すための明示的な UI 操作。 */
export function DeletableEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd }: EdgeProps) {
  const { deleteElements } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <button
          type="button"
          className="rf-edge__delete nodrag nopan"
          title="エッジを削除"
          aria-label="エッジを削除"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          onClick={() => deleteElements({ edges: [{ id }] })}
        >
          ×
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
