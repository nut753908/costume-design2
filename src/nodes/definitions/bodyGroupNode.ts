import { defineGroupNode } from './groupNodeFactory';

/** Body(3Dモデル本体)を、他15種のガーメントと同じ「`<name>Group` ノード」パターンで
 * 表現する。以前は `scene/Body.tsx` が `computeBodyDimensions`/`computeBodyLayout` の結果を
 * 使って `<mesh>` を直接組み立てる専用コンポーネントだったが、その組み立て(どの形状を・
 * どのサイズで・どこに置き・何色にするか)をこの `bodyGroup` の埋め込みサブグラフへ移し、
 * `scene/Body.tsx` 自体を削除した。`Garments.tsx` はノードの型を問わず内部の `sceneOutput`
 * (下記参照)だけを見て描画するため、`bodyGroup` もガーメントと全く同じ経路でシーンへ
 * 描画される(`Body` 専用の特別扱いは無くなった、ルート CLAUDE.md 参照)。
 *
 * **各部位の半径・長さ・Y座標を求める計算は、`bodyDimensions`/`bodyLayout` という専用の
 * 計算ノード(`geometry/body.ts` の `computeBodyDimensions()`/`computeBodyLayout()` を
 * そのまま配線するだけの、9個/4個の出力を持つブラックボックス)にまとめていたが、
 * ノードエディタを見ただけでは何を計算しているノードなのか分からないという問題があったため
 * 廃止した。代わりに、各出力を「基準値(`numberInput`)→ `numberMultiply`/`numberAdd`/
 * `numberSubtract` の四則演算チェーン」という、ガーメントの『体に触れる半径』
 * (`waistRadiusIn → numberMultiply(bodyBuild) → generator`)と全く同じ粒度までノードグラフ上に
 * 展開している。下記の計算ノード群のコメントは `geometry/body.ts` の `computeBodyDimensions()`/
 * `computeBodyLayout()` の式をそのまま書き下したもの — 実際、この2関数は現在
 * `nodes/definitions/garmentPlacement.ts` が各ガーメントのアンカー座標を計算するためだけに
 * 使っており(`bodyGroup` は経由しない、別の計算経路)、そちらは 15 ガーメント全部で使い回す
 * 汎用ロジックのため `garmentPlacement` 1個のノードにまとめたままにしている(ルート
 * CLAUDE.md の「ガーメントの取り付け位置」節参照) — Body 自身のメッシュ生成用にここで
 * 改めてノードグラフ上に展開しているのは、あくまで `bodyGroup` 内部のこの計算だけ。
 *
 * 胴体(カプセル)・頭(球)・腕1組・脚1組の4パーツそれぞれを generator→`translateY`
 * (Y座標だけを平行移動する汎用ノード、`garmentPlacement` の anchor 版に相当)→`sceneOutput`
 * という流れで独立した `ToonMesh` として出力する(1つのグループの中に `sceneOutput` は
 * 何個あってもよい、nodes/CLAUDE.md 参照)。肌色(`skinColorIn`)は `bodyGroup` 以外の
 * どのグループとも共有されない単独パラメータのため、他ガーメントの生パラメータ・Color と
 * 同じく groupInput の外部ソケットにはせず、内部の `colorInput` ノードとして保持する
 * (グループの中に入って初めて編集できる)。その値を1つの `toonMaterial` ノードから4つの
 * `sceneOutput` すべてへファンアウトする(1つの出力を複数の入力へ繋ぐだけの通常のエッジ)。
 *
 * `garmentPlacement` が各ガーメントのアンカー座標を計算するために使う
 * `bodyHeight`/`bodyBuild`/`bodyShoulder`(`state/initialGraph.ts` の3つのシードノード)は、
 * この `bodyGroup` とは独立に、従来どおり各 `<name>Group` へ直接ファンアウトされている
 * (`bodyGroup` を経由しない) — `bodyGroup` を削除してもアンカー計算には影響しない。 */
defineGroupNode({
  type: 'bodyGroup',
  label: 'Body',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'bodyHeight', label: 'Height', type: 'number', default: 1 },
          { id: 'bodyBuild', label: 'Build', type: 'number', default: 1 },
          { id: 'bodyShoulder', label: 'Shoulder', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'skinColorIn', type: 'colorInput', data: { hex: '#f2c9a0', label: 'Skin Color' } },

    // --- 四則演算チェーンで使い回す定数。0.5 は「半分」、2 は「カプセルの両端ぶん」、
    // 0.4 は腕を胴体にわずかに食い込ませる ARM_TORSO_OVERLAP_RATIO(geometry/body.ts の
    // 同名定数)にそれぞれ対応する。bodyBuild などのシードノードと同じ「1つの値を複数の
    // numberMultiply へファンアウトする」形。
    { id: 'halfIn', type: 'numberInput', data: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'Half' } },
    { id: 'capEndsFactorIn', type: 'numberInput', data: { value: 2, min: 1, max: 3, step: 0.1, label: 'Torso Cap Ends (x2)' } },
    { id: 'armTorsoOverlapRatioIn', type: 'numberInput', data: { value: 0.4, min: 0, max: 1, step: 0.01, label: 'Arm-Torso Overlap Ratio' } },

    // --- Body Dimensions だったもの: 部位ごとの基準値(computeBodyDimensions() の
    // BASE_DIMENSIONS と同じ値)→ Height/Build のどちらでスケールするかに応じて
    // numberMultiply を1回(Head だけはスケール無し)。Shoulder Spacing だけ Build→Shoulder の
    // 2段階スケール(computeBodyDimensions() の `* buildScale * shoulderScale` に対応)。
    { id: 'legHeightBaseIn', type: 'numberInput', data: { value: 0.85, min: 0.5, max: 1.2, step: 0.01, label: 'Leg Height Base' } },
    { id: 'legHeightScale', type: 'numberMultiply', data: {} },
    { id: 'legRadiusBaseIn', type: 'numberInput', data: { value: 0.11, min: 0.05, max: 0.2, step: 0.005, label: 'Leg Radius Base' } },
    { id: 'legRadiusScale', type: 'numberMultiply', data: {} },
    { id: 'legSpacingBaseIn', type: 'numberInput', data: { value: 0.14, min: 0.05, max: 0.3, step: 0.005, label: 'Leg Spacing Base' } },
    { id: 'legSpacingScale', type: 'numberMultiply', data: {} },
    { id: 'torsoLengthBaseIn', type: 'numberInput', data: { value: 0.55, min: 0.3, max: 0.9, step: 0.01, label: 'Torso Length Base' } },
    { id: 'torsoLengthScale', type: 'numberMultiply', data: {} },
    { id: 'torsoRadiusBaseIn', type: 'numberInput', data: { value: 0.26, min: 0.15, max: 0.4, step: 0.01, label: 'Torso Radius Base' } },
    { id: 'torsoRadiusScale', type: 'numberMultiply', data: {} },
    { id: 'headRadiusBaseIn', type: 'numberInput', data: { value: 0.16, min: 0.1, max: 0.25, step: 0.005, label: 'Head Radius Base' } },
    { id: 'armLengthBaseIn', type: 'numberInput', data: { value: 0.62, min: 0.4, max: 0.9, step: 0.01, label: 'Arm Length Base' } },
    { id: 'armLengthScale', type: 'numberMultiply', data: {} },
    { id: 'armRadiusBaseIn', type: 'numberInput', data: { value: 0.075, min: 0.03, max: 0.15, step: 0.005, label: 'Arm Radius Base' } },
    { id: 'armRadiusScale', type: 'numberMultiply', data: {} },
    { id: 'shoulderSpacingBaseIn', type: 'numberInput', data: { value: 0.34, min: 0.2, max: 0.5, step: 0.01, label: 'Shoulder Spacing Base' } },
    { id: 'shoulderSpacingBuildScale', type: 'numberMultiply', data: {} },
    { id: 'shoulderSpacingScale', type: 'numberMultiply', data: {} },

    // --- Body Layout だったもの: computeBodyLayout() の式をそのまま numberAdd/
    // numberSubtract/numberMultiply へ書き下す。feetY(地面のY座標)は常に0固定のため
    // 「+0」にしかならず、ノードとしては置かずに省略している(waistY = feetY + legHeight は
    // legHeightScale.value をそのまま waistY として使い回す)。
    { id: 'torsoRadiusDoubled', type: 'numberMultiply', data: {} },
    { id: 'torsoCapsuleHeight', type: 'numberAdd', data: {} },
    { id: 'torsoCapsuleHeightHalf', type: 'numberMultiply', data: {} },
    { id: 'torsoCenterYCalc', type: 'numberAdd', data: {} },
    { id: 'shoulderYCalc', type: 'numberAdd', data: {} },
    { id: 'headCenterYCalc', type: 'numberAdd', data: {} },
    { id: 'armLengthHalf', type: 'numberMultiply', data: {} },
    { id: 'armTorsoOverlap', type: 'numberMultiply', data: {} },
    { id: 'armCenterYStep1', type: 'numberSubtract', data: {} },
    { id: 'armCenterYCalc', type: 'numberSubtract', data: {} },
    { id: 'legCenterYCalc', type: 'numberMultiply', data: {} },

    { id: 'torsoGen', type: 'bodyTorsoGenerator', data: {} },
    { id: 'headGen', type: 'bodyHeadGenerator', data: {} },
    { id: 'armGen', type: 'bodyLimbGenerator', data: {} },
    { id: 'legGen', type: 'bodyLimbGenerator', data: {} },
    { id: 'torsoTranslate', type: 'translateY', data: {} },
    { id: 'headTranslate', type: 'translateY', data: {} },
    { id: 'armTranslate', type: 'translateY', data: {} },
    { id: 'legTranslate', type: 'translateY', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'sceneOutTorso', type: 'sceneOutput', data: {} },
    { id: 'sceneOutHead', type: 'sceneOutput', data: {} },
    { id: 'sceneOutArms', type: 'sceneOutput', data: {} },
    { id: 'sceneOutLegs', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    // legHeight = legHeightBase * bodyHeight
    { source: 'legHeightBaseIn', sourceHandle: 'value', target: 'legHeightScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyHeight', target: 'legHeightScale', targetHandle: 'factor' },
    // legRadius = legRadiusBase * bodyBuild
    { source: 'legRadiusBaseIn', sourceHandle: 'value', target: 'legRadiusScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'legRadiusScale', targetHandle: 'factor' },
    // legSpacing = legSpacingBase * bodyBuild
    { source: 'legSpacingBaseIn', sourceHandle: 'value', target: 'legSpacingScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'legSpacingScale', targetHandle: 'factor' },
    // torsoLength = torsoLengthBase * bodyHeight
    { source: 'torsoLengthBaseIn', sourceHandle: 'value', target: 'torsoLengthScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyHeight', target: 'torsoLengthScale', targetHandle: 'factor' },
    // torsoRadius = torsoRadiusBase * bodyBuild
    { source: 'torsoRadiusBaseIn', sourceHandle: 'value', target: 'torsoRadiusScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'torsoRadiusScale', targetHandle: 'factor' },
    // armLength = armLengthBase * bodyHeight
    { source: 'armLengthBaseIn', sourceHandle: 'value', target: 'armLengthScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyHeight', target: 'armLengthScale', targetHandle: 'factor' },
    // armRadius = armRadiusBase * bodyBuild
    { source: 'armRadiusBaseIn', sourceHandle: 'value', target: 'armRadiusScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'armRadiusScale', targetHandle: 'factor' },
    // shoulderSpacing = shoulderSpacingBase * bodyBuild * bodyShoulder
    { source: 'shoulderSpacingBaseIn', sourceHandle: 'value', target: 'shoulderSpacingBuildScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'shoulderSpacingBuildScale', targetHandle: 'factor' },
    { source: 'shoulderSpacingBuildScale', sourceHandle: 'value', target: 'shoulderSpacingScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyShoulder', target: 'shoulderSpacingScale', targetHandle: 'factor' },
    // headRadius はスケール無しでそのまま headRadiusBaseIn.value を使う(下記の配線で直接参照)。

    // --- generator への配線(旧 dims.* → 新しい各 *Scale.value / headRadiusBaseIn.value)
    { source: 'torsoRadiusScale', sourceHandle: 'value', target: 'torsoGen', targetHandle: 'radius' },
    { source: 'torsoLengthScale', sourceHandle: 'value', target: 'torsoGen', targetHandle: 'length' },
    { source: 'headRadiusBaseIn', sourceHandle: 'value', target: 'headGen', targetHandle: 'radius' },
    { source: 'armRadiusScale', sourceHandle: 'value', target: 'armGen', targetHandle: 'radius' },
    { source: 'armLengthScale', sourceHandle: 'value', target: 'armGen', targetHandle: 'length' },
    { source: 'shoulderSpacingScale', sourceHandle: 'value', target: 'armGen', targetHandle: 'spacing' },
    { source: 'legRadiusScale', sourceHandle: 'value', target: 'legGen', targetHandle: 'radius' },
    { source: 'legHeightScale', sourceHandle: 'value', target: 'legGen', targetHandle: 'length' },
    { source: 'legSpacingScale', sourceHandle: 'value', target: 'legGen', targetHandle: 'spacing' },

    // --- Y座標の算出(computeBodyLayout() を書き下したもの。waistY は使い回すため
    // 専用ノードを置かず legHeightScale.value をそのまま waistY として配線する)。
    // legCenterY = legHeight * half
    { source: 'legHeightScale', sourceHandle: 'value', target: 'legCenterYCalc', targetHandle: 'value' },
    { source: 'halfIn', sourceHandle: 'value', target: 'legCenterYCalc', targetHandle: 'factor' },
    // torsoCapsuleHeight = torsoLength + torsoRadius * capEndsFactor(2)
    { source: 'torsoRadiusScale', sourceHandle: 'value', target: 'torsoRadiusDoubled', targetHandle: 'value' },
    { source: 'capEndsFactorIn', sourceHandle: 'value', target: 'torsoRadiusDoubled', targetHandle: 'factor' },
    { source: 'torsoLengthScale', sourceHandle: 'value', target: 'torsoCapsuleHeight', targetHandle: 'a' },
    { source: 'torsoRadiusDoubled', sourceHandle: 'value', target: 'torsoCapsuleHeight', targetHandle: 'b' },
    // torsoCenterY = waistY(=legHeight) + torsoCapsuleHeight * half
    { source: 'torsoCapsuleHeight', sourceHandle: 'value', target: 'torsoCapsuleHeightHalf', targetHandle: 'value' },
    { source: 'halfIn', sourceHandle: 'value', target: 'torsoCapsuleHeightHalf', targetHandle: 'factor' },
    { source: 'legHeightScale', sourceHandle: 'value', target: 'torsoCenterYCalc', targetHandle: 'a' },
    { source: 'torsoCapsuleHeightHalf', sourceHandle: 'value', target: 'torsoCenterYCalc', targetHandle: 'b' },
    // shoulderY = waistY(=legHeight) + torsoCapsuleHeight
    { source: 'legHeightScale', sourceHandle: 'value', target: 'shoulderYCalc', targetHandle: 'a' },
    { source: 'torsoCapsuleHeight', sourceHandle: 'value', target: 'shoulderYCalc', targetHandle: 'b' },
    // headCenterY = shoulderY + headRadius
    { source: 'shoulderYCalc', sourceHandle: 'value', target: 'headCenterYCalc', targetHandle: 'a' },
    { source: 'headRadiusBaseIn', sourceHandle: 'value', target: 'headCenterYCalc', targetHandle: 'b' },
    // armCenterY = shoulderY - armLength * half - torsoRadius * armTorsoOverlapRatio(0.4)
    { source: 'armLengthScale', sourceHandle: 'value', target: 'armLengthHalf', targetHandle: 'value' },
    { source: 'halfIn', sourceHandle: 'value', target: 'armLengthHalf', targetHandle: 'factor' },
    { source: 'torsoRadiusScale', sourceHandle: 'value', target: 'armTorsoOverlap', targetHandle: 'value' },
    { source: 'armTorsoOverlapRatioIn', sourceHandle: 'value', target: 'armTorsoOverlap', targetHandle: 'factor' },
    { source: 'shoulderYCalc', sourceHandle: 'value', target: 'armCenterYStep1', targetHandle: 'a' },
    { source: 'armLengthHalf', sourceHandle: 'value', target: 'armCenterYStep1', targetHandle: 'b' },
    { source: 'armCenterYStep1', sourceHandle: 'value', target: 'armCenterYCalc', targetHandle: 'a' },
    { source: 'armTorsoOverlap', sourceHandle: 'value', target: 'armCenterYCalc', targetHandle: 'b' },

    // --- 平行移動
    { source: 'torsoGen', sourceHandle: 'geometry', target: 'torsoTranslate', targetHandle: 'geometry' },
    { source: 'torsoCenterYCalc', sourceHandle: 'value', target: 'torsoTranslate', targetHandle: 'y' },
    { source: 'headGen', sourceHandle: 'geometry', target: 'headTranslate', targetHandle: 'geometry' },
    { source: 'headCenterYCalc', sourceHandle: 'value', target: 'headTranslate', targetHandle: 'y' },
    { source: 'armGen', sourceHandle: 'geometry', target: 'armTranslate', targetHandle: 'geometry' },
    { source: 'armCenterYCalc', sourceHandle: 'value', target: 'armTranslate', targetHandle: 'y' },
    { source: 'legGen', sourceHandle: 'geometry', target: 'legTranslate', targetHandle: 'geometry' },
    { source: 'legCenterYCalc', sourceHandle: 'value', target: 'legTranslate', targetHandle: 'y' },

    { source: 'skinColorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },

    { source: 'torsoTranslate', sourceHandle: 'geometry', target: 'sceneOutTorso', targetHandle: 'geometry' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOutTorso', targetHandle: 'material' },
    { source: 'headTranslate', sourceHandle: 'geometry', target: 'sceneOutHead', targetHandle: 'geometry' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOutHead', targetHandle: 'material' },
    { source: 'armTranslate', sourceHandle: 'geometry', target: 'sceneOutArms', targetHandle: 'geometry' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOutArms', targetHandle: 'material' },
    { source: 'legTranslate', sourceHandle: 'geometry', target: 'sceneOutLegs', targetHandle: 'geometry' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOutLegs', targetHandle: 'material' },
  ],
});
