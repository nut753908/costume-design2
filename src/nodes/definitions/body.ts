import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';

/** `state/useBodyScale.ts`/`state/useBodySkinColor.ts` が id で直接読み取る、慣例的な
 * ノードidの唯一の真実の源(`sceneOutputGeometryKey()` 等と同じ命名規則パターン)。 */
export const BODY_NODE_ID = 'body';

export interface BodyNodeData extends Record<string, unknown> {
  height: number;
  build: number;
  shoulder: number;
  skinColor: string;
}

/** Body(3Dモデル本体、`scene/Body.tsx`)がシーン全体のパラメータとして使う4つの値
 * (Height/Build/Shoulder/Skin Color)の受け口を表す終端ノード。`sceneOutput`
 * (`nodes/definitions/sceneOutput.ts`)と同じく他ノードへは配線できない専用の出口で、
 * 入力をそのまま素通しするだけ。ジオメトリを持たない Body は `<name>Group` のような
 * 埋め込みサブグラフを持たないため、このノードはグループの外(トップレベル)に単独で置く
 * ことを前提にしている(`state/initialGraph.ts` に1つだけ存在、id は `BODY_NODE_ID`)。
 *
 * 以前は Body が単独のグラフノードとして存在せず、`bodyHeight`/`bodyBuild`/
 * `bodyShoulder`/`bodySkinColor` の4つのシードノードを id で直接読み取ることで
 * ソケット配線を完全に迂回していた(接続先がキャンバス上に一切見えなかった)。この
 * ノードを導入し、4つのシードノードから本ノードへ実際にワイヤーを繋ぐことで、
 * 「Body の肌色/体型がどこから来ているか」が普通のエッジとして目に見えるようになる
 * (ルート CLAUDE.md の「ボディスケールはソケットグラフを迂回して直接読み取られる」節参照)。 */
registerNodeType<BodyNodeData>({
  type: 'body',
  label: 'Body',
  category: 'output',
  inputs: [
    { id: 'height', label: 'Height', type: 'number' },
    { id: 'build', label: 'Build', type: 'number' },
    { id: 'shoulder', label: 'Shoulder', type: 'number' },
    { id: 'skinColor', label: 'Skin Color', type: 'color' },
  ],
  outputs: [],
  // 未接続時のリテラルなフォールバック。geometry/body.ts の DEFAULT_BODY_SCALE (1,1,1)・
  // state/useBodySkinColor.ts の DEFAULT_BODY_SKIN_COLOR ('#f2c9a0') と値を揃えている
  // (nodes/ レイヤーは state/ に依存しない方針のため、定数の共有はせず値だけ揃える)。
  createDefaultData: () => ({ height: 1, build: 1, shoulder: 1, skinColor: '#f2c9a0' }),
  evaluate: (inputs): Record<string, SocketValue> => inputs,
});
