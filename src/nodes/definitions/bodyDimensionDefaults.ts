/** ボディの各部位の半径・長さの基準値。ボディ(`bodyGroup`/`bodyLayout`)と各ガーメントの固定値の元になる単一の値で、`bodyGroup` の外部ソケットの既定値と
 * `bodyLayout` の内部の入力欄にここから値が入る(ガーメントの「体に触れる半径」は倍率を掛けたもの、`garmentParts.ts` の `fixedBodyRadius`)。 */
export const BODY_DIMENSIONS = {
  legHeight: 0.5754,
  legRadius: 0.0691,
  legSpacing: 0.1109,
  torsoLength: 0.3343,
  torsoRadius: 0.1536,
  headRadius: 0.2966,
  armLength: 0.4683,
  armRadius: 0.0523,
  shoulderSpacing: 0.1443,
  neckLength: 0.0565,
  neckRadius: 0.0525,
} as const;
