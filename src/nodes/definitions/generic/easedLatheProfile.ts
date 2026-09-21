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
    // アンカー側から反対側へどちらのY方向にプロファイルを伸ばすか。skirt/pants/gloves のように
    // 腰/手首から垂れ下がる形状は下向き(-1)、shoes/hat/socks のように地面/頭から上へ伸びる
    // 形状は上向き(1)。
    { id: 'direction', label: 'Direction (1 up / -1 down)', type: 'number', default: -1 },
  ],
  outputs: [{ id: 'points', label: 'Points', type: 'points' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    const startRadius = asNumber(inputs.startRadius, 0);
    const endRadius = asNumber(inputs.endRadius, 0);
    const distance = asNumber(inputs.distance, 0);
    const steps = asNumber(inputs.steps, 10);
    const direction = asNumber(inputs.direction, -1) < 0 ? 'down' : 'up';
    const points = buildEasedLatheProfile(startRadius, endRadius, distance, direction, steps);
    return { points: { type: 'points', value: points } };
  },
});
