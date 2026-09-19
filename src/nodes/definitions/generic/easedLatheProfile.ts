import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { buildEasedLatheProfile, type ProfileDirection } from '../../../geometry/latheProfile';

export interface EasedLatheProfileData extends Record<string, unknown> {
  /** アンカー側から反対側へどちらのY方向にプロファイルを伸ばすか。skirt/pants/gloves/socks
   * のように腰/手首から垂れ下がる形状は `'down'`、shoes/hat/socks のように地面/頭から
   * 上へ伸びる形状は `'up'`。ガーメントの形状そのものを決める値のため、`capsuleGenerator`
   * 等の `capSegments`/`radialSegments` と同じ扱いで、ソケット化せずノード配置時の `data` に
   * 固定する(`nodes/CLAUDE.md` の `extra` と同じ考え方 — こちらは `defineGeneratorNode()` の
   * 対象外(出力が `points` のため)なので `data` へ直接書く)。 */
  direction: ProfileDirection;
  /** プロファイル(半径のイージング)を何段の点列で近似するか。radialSegments 同様、
   * 見た目に影響するがガーメントごとに変える理由に乏しいスタイル寄りの値のため固定する。 */
  steps: number;
}

/** `geometry/latheProfile.ts` の `buildEasedLatheProfile()` を薄くラップし、アンカー側から
 * 反対側の端まで半径をイージングしながら結ぶ点列を `points` 型のソケットとして出力する汎用
 * ノード。`latheGenerator`(`latheGenerator.ts`)へ渡すと `THREE.LatheGeometry` になる —
 * skirt/pants(脚)/shoes/gloves/hat/jacket/socks/belt が個別に持っていた「プロファイル計算+
 * Lathe」という形状生成ロジックは、すべてこの2ノードの組み合わせ(+ 必要に応じて
 * `numberMax`/`scaleZ`/`translatePointsY`/`slicePoints`/`concatPoints` 等)へ置き換わった
 * (`capsuleGenerator` 等と同じ「汎用プリミティブノード」への切り出し、`geometry/CLAUDE.md`
 * 参照)。専用の `build*Geometry()` を今も持つのは、この2ノードだけでは表現しきれない
 * 追加のロジック(`alignedBox.ts` を使う bag/glasses のストラップ/ブリッジ・テンプル、
 * 手組みチューブの sleeve)を持つガーメントに
 * 限られる。 */
registerNodeType<EasedLatheProfileData>({
  type: 'easedLatheProfile',
  label: 'Eased Lathe Profile',
  category: 'generator',
  inputs: [
    { id: 'startRadius', label: 'Start Radius', type: 'number' },
    { id: 'endRadius', label: 'End Radius', type: 'number' },
    { id: 'distance', label: 'Distance', type: 'number' },
  ],
  outputs: [{ id: 'points', label: 'Points', type: 'points' }],
  createDefaultData: () => ({ direction: 'down', steps: 10 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const startRadius = asNumber(inputs.startRadius, 0);
    const endRadius = asNumber(inputs.endRadius, 0);
    const distance = asNumber(inputs.distance, 0);
    const points = buildEasedLatheProfile(startRadius, endRadius, distance, data.direction, data.steps);
    return { points: { type: 'points', value: points } };
  },
});
