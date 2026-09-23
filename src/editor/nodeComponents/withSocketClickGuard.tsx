import { memo, useRef, type ComponentType } from 'react';
import type { NodeProps } from '@xyflow/react';

/** ソケットを押して同じカード内で離したときの click が、React Flow のノード要素(`onClick` で
 * ノードを選択する)まで届かないよう、カードとの間で止める。React Flow が発行した選択変更を
 * `onNodesChange` 側で捨てると、React Flow 内部のノードの `selected` だけが書き換わった
 * ままストアとずれ、次のクリックで選択されなくなるため、click 自体を届かせない。 */
export function withSocketClickGuard(View: ComponentType<NodeProps>): ComponentType<NodeProps> {
  function Guarded(props: NodeProps) {
    const pressedOnHandle = useRef(false);
    return (
      <div
        style={{ display: 'contents' }}
        onPointerDownCapture={(event) => {
          pressedOnHandle.current = (event.target as Element).closest('.react-flow__handle') !== null;
        }}
        onClick={(event) => {
          if (pressedOnHandle.current) event.stopPropagation();
          pressedOnHandle.current = false;
        }}
      >
        <View {...props} />
      </div>
    );
  }
  return memo(Guarded);
}
