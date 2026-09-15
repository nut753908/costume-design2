import { defineGroupNode } from './groupNodeFactory';

/** `bodyGroup`(`bodyGroupNode.ts`)/`garmentPlacement`(`garmentPlacement.ts`)の両方から
 * ネストして再利用される計算グループ — Height/Build/Shoulder スケールから
 * 各部位の半径・長さを求める9つの「基準値(`numberInput`)→ `numberMultiply`」チェーンを
 * 1枚にまとめたもの。以前はこの計算を `geometry/body.ts` の `computeBodyDimensions()` を
 * そのまま配線するだけのブラックボックスノード(`bodyDimensions.ts`、9出力)にしていたが、
 * ノードエディタを見ただけでは何を計算しているノードか分からないという問題があったため、
 * ガーメントの『体に触れる半径』(`waistRadiusIn → numberMultiply(bodyBuild) → generator`)と
 * 同じ粒度までノードグラフ上に展開した。その展開後のグラフが `bodyGroup` 直下に平積みだと
 * 今度は `bodyGroup` 自体が47ノードの塊になって見通しが悪いため、意味のあるまとまり(寸法計算/
 * 配置計算)ごとに `bodyLayoutGroupNode.ts` と対になるこのグループへ再び折りたたんだ —
 * ダブルクリックで中に入れば実際の四則演算グラフがそのまま見え、隠れた計算は無い
 * (`groupNodeFactory.ts` の多段ネスト対応により `bodyGroup` の中にこのグループを普通に
 * 置ける)。
 *
 * 以前は `geometry/body.ts` の `computeBodyDimensions()` 自体は削除せず、15ガーメント共通の
 * アンカー座標計算を担う `garmentPlacement.ts` がその関数を内部で呼び続けていたが、
 * `garmentPlacement` 自身も同じ理由でこのグループをネストして使う `defineGroupNode()`
 * ベースへ置き換わったため、`geometry/body.ts` を呼ぶ本番コードが無くなり、ファイルごと
 * 削除した(`garmentPlacement.ts` のコメント参照)。このグループの基準値は削除前の
 * `BASE_DIMENSIONS` と値を合わせてあるが、変数としては独立している。 */
defineGroupNode({
  type: 'bodyDimensionsGroup',
  label: 'Body Dimensions',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'heightScale', label: 'Height Scale', type: 'number', default: 1 },
          { id: 'buildScale', label: 'Build Scale', type: 'number', default: 1 },
          { id: 'shoulderScale', label: 'Shoulder Scale', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'legHeightBaseIn', type: 'numberInput', data: { value: 0.85, min: 0.5, max: 1.2, step: 0.01, label: 'Leg Height Base' } },
    { id: 'legHeightScale', type: 'numberMultiply', data: { label: 'Leg Height' } },
    { id: 'legRadiusBaseIn', type: 'numberInput', data: { value: 0.11, min: 0.05, max: 0.2, step: 0.005, label: 'Leg Radius Base' } },
    { id: 'legRadiusScale', type: 'numberMultiply', data: { label: 'Leg Radius' } },
    { id: 'legSpacingBaseIn', type: 'numberInput', data: { value: 0.14, min: 0.05, max: 0.3, step: 0.005, label: 'Leg Spacing Base' } },
    { id: 'legSpacingScale', type: 'numberMultiply', data: { label: 'Leg Spacing' } },
    { id: 'torsoLengthBaseIn', type: 'numberInput', data: { value: 0.55, min: 0.3, max: 0.9, step: 0.01, label: 'Torso Length Base' } },
    { id: 'torsoLengthScale', type: 'numberMultiply', data: { label: 'Torso Length' } },
    { id: 'torsoRadiusBaseIn', type: 'numberInput', data: { value: 0.26, min: 0.15, max: 0.4, step: 0.01, label: 'Torso Radius Base' } },
    { id: 'torsoRadiusScale', type: 'numberMultiply', data: { label: 'Torso Radius' } },
    { id: 'headRadiusBaseIn', type: 'numberInput', data: { value: 0.16, min: 0.1, max: 0.25, step: 0.005, label: 'Head Radius Base' } },
    { id: 'armLengthBaseIn', type: 'numberInput', data: { value: 0.62, min: 0.4, max: 0.9, step: 0.01, label: 'Arm Length Base' } },
    { id: 'armLengthScale', type: 'numberMultiply', data: { label: 'Arm Length' } },
    { id: 'armRadiusBaseIn', type: 'numberInput', data: { value: 0.075, min: 0.03, max: 0.15, step: 0.005, label: 'Arm Radius Base' } },
    { id: 'armRadiusScale', type: 'numberMultiply', data: { label: 'Arm Radius' } },
    { id: 'shoulderSpacingBaseIn', type: 'numberInput', data: { value: 0.34, min: 0.2, max: 0.5, step: 0.01, label: 'Shoulder Spacing Base' } },
    { id: 'shoulderSpacingBuildScale', type: 'numberMultiply', data: { label: 'Shoulder Spacing × Build' } },
    { id: 'shoulderSpacingScale', type: 'numberMultiply', data: { label: 'Shoulder Spacing' } },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [
          { id: 'legHeight', label: 'Leg Height', type: 'number' },
          { id: 'legRadius', label: 'Leg Radius', type: 'number' },
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number' },
          { id: 'torsoLength', label: 'Torso Length', type: 'number' },
          { id: 'torsoRadius', label: 'Torso Radius', type: 'number' },
          { id: 'headRadius', label: 'Head Radius', type: 'number' },
          { id: 'armLength', label: 'Arm Length', type: 'number' },
          { id: 'armRadius', label: 'Arm Radius', type: 'number' },
          { id: 'shoulderSpacing', label: 'Shoulder Spacing', type: 'number' },
        ],
      },
    },
  ],
  internalEdges: [
    // legHeight = legHeightBase * heightScale
    { source: 'legHeightBaseIn', sourceHandle: 'value', target: 'legHeightScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'heightScale', target: 'legHeightScale', targetHandle: 'factor' },
    { source: 'legHeightScale', sourceHandle: 'value', target: 'output', targetHandle: 'legHeight' },
    // legRadius = legRadiusBase * buildScale
    { source: 'legRadiusBaseIn', sourceHandle: 'value', target: 'legRadiusScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'buildScale', target: 'legRadiusScale', targetHandle: 'factor' },
    { source: 'legRadiusScale', sourceHandle: 'value', target: 'output', targetHandle: 'legRadius' },
    // legSpacing = legSpacingBase * buildScale
    { source: 'legSpacingBaseIn', sourceHandle: 'value', target: 'legSpacingScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'buildScale', target: 'legSpacingScale', targetHandle: 'factor' },
    { source: 'legSpacingScale', sourceHandle: 'value', target: 'output', targetHandle: 'legSpacing' },
    // torsoLength = torsoLengthBase * heightScale
    { source: 'torsoLengthBaseIn', sourceHandle: 'value', target: 'torsoLengthScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'heightScale', target: 'torsoLengthScale', targetHandle: 'factor' },
    { source: 'torsoLengthScale', sourceHandle: 'value', target: 'output', targetHandle: 'torsoLength' },
    // torsoRadius = torsoRadiusBase * buildScale
    { source: 'torsoRadiusBaseIn', sourceHandle: 'value', target: 'torsoRadiusScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'buildScale', target: 'torsoRadiusScale', targetHandle: 'factor' },
    { source: 'torsoRadiusScale', sourceHandle: 'value', target: 'output', targetHandle: 'torsoRadius' },
    // headRadius はスケール無し
    { source: 'headRadiusBaseIn', sourceHandle: 'value', target: 'output', targetHandle: 'headRadius' },
    // armLength = armLengthBase * heightScale
    { source: 'armLengthBaseIn', sourceHandle: 'value', target: 'armLengthScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'heightScale', target: 'armLengthScale', targetHandle: 'factor' },
    { source: 'armLengthScale', sourceHandle: 'value', target: 'output', targetHandle: 'armLength' },
    // armRadius = armRadiusBase * buildScale
    { source: 'armRadiusBaseIn', sourceHandle: 'value', target: 'armRadiusScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'buildScale', target: 'armRadiusScale', targetHandle: 'factor' },
    { source: 'armRadiusScale', sourceHandle: 'value', target: 'output', targetHandle: 'armRadius' },
    // shoulderSpacing = shoulderSpacingBase * buildScale * shoulderScale
    { source: 'shoulderSpacingBaseIn', sourceHandle: 'value', target: 'shoulderSpacingBuildScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'buildScale', target: 'shoulderSpacingBuildScale', targetHandle: 'factor' },
    { source: 'shoulderSpacingBuildScale', sourceHandle: 'value', target: 'shoulderSpacingScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'shoulderScale', target: 'shoulderSpacingScale', targetHandle: 'factor' },
    { source: 'shoulderSpacingScale', sourceHandle: 'value', target: 'output', targetHandle: 'shoulderSpacing' },
  ],
});
