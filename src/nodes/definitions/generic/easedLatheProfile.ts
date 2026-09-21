import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { buildEasedLatheProfile } from '../../../geometry/latheProfile';

/** `geometry/latheProfile.ts` の `buildEasedLatheProfile()` を薄くラップし、アンカー側から
 * 反対側の端まで半径をイージングしながら結ぶ点列を `points` 型のソケットとして出力する汎用
 * ノード。`latheGenerator`(`latheGenerator.ts`)へ渡すと `THREE.LatheGeometry` になる —
 * skirt/pants(脚)/shoes/gloves/hat/jacket/socks/belt が個別に持っていた「プロファイル計算+
 * Lathe」という形状生成ロジックは、すべてこの2ノードの組み合わせ(+ 必要に応じて
 * `numberMax`/`scaleZ`/`translatePointsY`/`slicePoints`/`concatPoints` 等)へ置き換わった
 * (`capsuleGenerator` 等と同じ「汎用プリミティブノード」への切り出し、`geometry/CLAUDE.md`
 * 参照)。 */
registerNodeType({
  type: 'easedLatheProfile',
  label: 'Eased Lathe Profile',
  category: 'points',
  inputs: [
    { id: 'startRadius', label: 'Start Radius', type: 'number', default: 0 },
    { id: 'endRadius', label: 'End Radius', type: 'number', default: 0 },
    { id: 'distance', label: 'Distance', type: 'number', default: 0 },
    { id: 'steps', label: 'Steps', type: 'number', default: 10 },
  ],
  // アンカー側から反対側へどちらのY方向にプロファイルを伸ばすか(skirt/pants/gloves のように
  // 腰/手首から垂れ下がる形状は `down`、shoes/hat/socks のように地面/頭から上へ伸びる形状は `up`)は、
  // どちらの出力を配線するかで選ぶ(`necklineShapes` の形の選択と同じ)。使われなかった側は
  // 評価されるだけで何にも使われない。
  outputs: [
    { id: 'up', label: 'Points Up', type: 'points' },
    { id: 'down', label: 'Points Down', type: 'points' },
  ],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    const startRadius = asNumber(inputs.startRadius, 0);
    const endRadius = asNumber(inputs.endRadius, 0);
    const distance = asNumber(inputs.distance, 0);
    const steps = asNumber(inputs.steps, 10);
    const build = (direction: 'up' | 'down') => ({
      type: 'points' as const,
      value: buildEasedLatheProfile(startRadius, endRadius, distance, direction, steps),
    });
    return { up: build('up'), down: build('down') };
  },
});
