import { memo, useRef, type ComponentType } from 'react';
import type { NodeProps } from '@xyflow/react';

/** カード上のソケット・入力欄・プルダウン・ボタンの操作ではノードを選択しないもの。 */
const CONTROL_SELECTOR = '.react-flow__handle, input, select, textarea, button';

/** 上記の操作の click が、React Flow のノード要素(`onClick` でノードを選択する)まで届かない
 * よう、カードとの間で止める。押し始めで判定するのは、ソケットを掴んで同じカード内の別の所で
 * 離すと click の対象がソケットではなくカード側の要素になるため(キーボードでのボタン操作は
 * pointerdown が無いので click の対象で判定する)。React Flow が発行した選択変更を
 * `onNodesChange` 側で捨てると、React Flow 内部のノードの `selected` だけが書き換わった
 * ままストアとずれ、次のクリックで選択されなくなるため、click 自体を届かせない。 */
export function withControlClickGuard(View: ComponentType<NodeProps>): ComponentType<NodeProps> {
  function Guarded(props: NodeProps) {
    const pressedOnControl = useRef(false);
    return (
      <div
        style={{ display: 'contents' }}
        onPointerDownCapture={(event) => {
          pressedOnControl.current = (event.target as Element).closest(CONTROL_SELECTOR) !== null;
        }}
        onClick={(event) => {
          if (pressedOnControl.current || (event.target as Element).closest(CONTROL_SELECTOR) !== null) {
            event.stopPropagation();
          }
          pressedOnControl.current = false;
        }}
      >
        <View {...props} />
      </div>
    );
  }
  return memo(Guarded);
}
