import { defineGroupNode } from '../groupNodeFactory';
import { colorSocket } from '../garmentOutput';

/** Body を他14種のガーメントと同じ「`<name>Group` ノード」パターンで表現する。
 * `Garments.tsx` はノードの型を問わず内部の `sceneOutput` だけを見て描画するため、
 * `bodyGroup` もガーメントと全く同じ経路でシーンへ描画される(ルート CLAUDE.md 参照)。
 *
 * 外部ソケットは `bodyDimensions`/`bodyLayout`(`state/initialGraph.ts` のトップレベル
 * 共有ノード)が計算済みの生の値(半径・長さ・Y座標)そのもので、`bodyGroup` 自身は
 * スケール計算を行わない。
 *
 * 胴体(`torsoShape`、`generic/torsoShape.ts`)・首(`neckShape`)・頭(`sphereGenerator`)をそれぞれ `translate`(Y だけを配線)で配置し、
 * 腕1組/脚1組は `limbPair`(`nodes/definitions/generic/limbPair.ts`)で作ってから、
 * すべて `mergeGeometry` 1つで1つのジオメトリへ結合し、`sceneOutput` を1個だけ持つ(scarf が
 * belt+box を `mergeGeometry` でまとめるのと同じ、複数プリミティブを1グループ内で完結させる
 * 形 — 詳細は `nodes/CLAUDE.md` の「グループノード」節)。全パーツが同じマテリアルなので、個別の
 * `sceneOutput`(=個別メッシュ)として描画しても1つに結合してから描画しても見た目は変わらず、
 * 結合した方がノードグラフ上の階層(ネストしたグループ)が1段減る。
 *
 * 腕/脚の軸は `armShaft`/`legShaft`(`generic/limbShaft.ts`)で、太ももや腕の付け根の太さの変化は、それぞれの
 * 3枚の `profileCurve` カードの値として別々に持つ(腕用/脚用は別のノードなので区別できる)。
 *
 * 肌色は他のガーメントと同じ外部ソケット `color`(`colorSocket()`)で、`material`(`toonMaterial`)の
 * `color` へ配線し、`material` から `sceneOut` の `material` へ1本配線するだけでよい
 * (全パーツが同じマテリアルを使う)。 */
defineGroupNode({
  type: 'bodyGroup',
  label: 'Body',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'legHeight', label: 'Leg Height', type: 'number', default: 0 },
          { id: 'legRadius', label: 'Leg Radius', type: 'number', default: 0 },
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number', default: 0 },
          { id: 'torsoLength', label: 'Torso Length', type: 'number', default: 0 },
          { id: 'torsoRadius', label: 'Torso Radius', type: 'number', default: 0 },
          { id: 'headRadius', label: 'Head Radius', type: 'number', default: 0 },
          { id: 'armLength', label: 'Arm Length', type: 'number', default: 0 },
          { id: 'armRadius', label: 'Arm Radius', type: 'number', default: 0 },
          { id: 'shoulderSpacing', label: 'Shoulder Spacing', type: 'number', default: 0 },
          { id: 'neckLength', label: 'Neck Length', type: 'number', default: 0 },
          { id: 'neckRadius', label: 'Neck Radius', type: 'number', default: 0 },
          { id: 'legCenterY', label: 'Leg Center Y', type: 'number', default: 0 },
          { id: 'waistY', label: 'Waist Y', type: 'number', default: 0 },
          { id: 'neckCenterY', label: 'Neck Center Y', type: 'number', default: 0 },
          { id: 'headCenterY', label: 'Head Center Y', type: 'number', default: 0 },
          { id: 'armCenterY', label: 'Arm Center Y', type: 'number', default: 0 },
          colorSocket('#f2c9a0'),
        ],
      },
    },
    { id: 'material', type: 'toonMaterial', data: {} },

    // 胴体(torsoShape、原点が股)。
    { id: 'torsoGen', type: 'torsoShape', data: {} },
    // 股(原点)を支点に、上端を前後へ傾ける(`torsoTilt` の入力欄 `x`、負なら上端が後ろへ倒れる)。
    { id: 'torsoTilt', type: 'rotate', data: { x: -8.599 } },
    { id: 'torsoTranslate', type: 'translate', data: {} },
    // 胴体の下端(股の高さ)だけを `torsoLift` ぶん上げる(長さを短くし、上端が動かないよう同じだけ持ち上げる)。
    { id: 'torsoLift', type: 'numberInput', data: { value: 0.048 } },
    { id: 'torsoLengthLifted', type: 'numberSubtract', data: {} },
    { id: 'torsoY', type: 'numberAdd', data: {} },

    // 首(neckShape)。高さを首の長さの2倍にして、上下を頭と胴体の丸みに食い込ませる
    // (長さちょうどだと、首の縁と胴体の上端の丸みの間に隙間が見える)。
    { id: 'neckHeight', type: 'numberMultiply', data: { factor: 2 } },
    { id: 'neckGen', type: 'neckShape', data: {} },
    // 首の中心を支点に、上端を前後へ傾ける(`neckTilt` の入力欄 `x`、負なら上端が後ろへ倒れる)。
    { id: 'neckTilt', type: 'rotate', data: { x: 16.18 } },
    { id: 'neckTranslate', type: 'translate', data: { z: -0.1245 } },

    // 頭(`headShape`、原点が下端)。下端を首の上端(`headCenterY - headRadius`)に合わせて置き、
    // 重心は後ろ(Z 負)へずらす(`headTranslate` の入力欄 `z`。あごが前に出て見えるように、頭は
    // 胴体の中心より後ろに置く)。
    { id: 'headGen', type: 'headShape', data: { heightRatio: 1.003 } },
    { id: 'headBottomY', type: 'numberSubtract', data: {} },
    { id: 'headTranslate', type: 'translate', data: { z: -0.1054 } },

    // 腕1組・脚1組(limbPair)。先端の球(手/足)の形は腕用/脚用で別々の値を持つ。
    // 手は手首から少し下に垂らした丸、足は上下につぶして前に伸ばし、底が地面に来る高さに置く。
    // 腕の付け根を `armDropIn` だけ下げる(付け根の丸みを胴体の中へ埋め、肩の上に盛り上がって
    // 見えないようにする)。手の位置は変えないよう、腕の長さをその分だけ短くし、腕の中心を半分だけ下げる。
    { id: 'armDropIn', type: 'numberInput', data: { value: 0.0293 } },
    { id: 'armDropHalf', type: 'numberHalf', data: {} },
    // 腕の付け根(軸の上端)を首側(内側)へ `armInsetIn` だけ寄せる。手の位置は `swingAngle` で保つ。
    { id: 'armInsetIn', type: 'numberInput', data: { value: 0.0279 } },
    { id: 'armSpacingAdjusted', type: 'numberSubtract', data: {} },
    { id: 'armCenterYAdjusted', type: 'numberSubtract', data: {} },
    { id: 'armLengthAdjusted', type: 'numberSubtract', data: {} },
    { id: 'armShaftGen', type: 'armShaft', data: {} },
    // 脚の軸は下端だけを `legTrim` ぶん上げる(長さを短くし、上端が動かないよう `legTrim / 2` だけ持ち上げる)。
    // 足の後ろ下から軸の下端の角がはみ出すのを防ぐ。
    { id: 'legTrim', type: 'numberInput', data: { value: 0.02 } },
    { id: 'legTrimHalf', type: 'numberHalf', data: {} },
    { id: 'legShaftLength', type: 'numberSubtract', data: {} },
    { id: 'legShaftGen', type: 'legShaft', data: {} },
    { id: 'legShaftLift', type: 'translate', data: {} },
    // 足(footShape、足の長さは脚の半径の `footLength` の `factor` 倍)。脚の先端の球は使わず、足をこれで作る。
    { id: 'footGen', type: 'footShape', data: {} },
    { id: 'footLength', type: 'numberMultiply', data: { factor: 2.688 } },
    { id: 'armPair', type: 'limbPair', data: { endRatio: 1.201, endScaleY: 1.101, endScaleZ: 0.85, endShiftY: -0.7102, swingAngle: 17.8, pitchAngle: -11.9, centerZ: -0.1, endScaleX: 1.07, endPitch: -19.42 } },
    {
      id: 'legPair',
      type: 'limbPair',
      data: { endRatio: 0.02, swingAngle: 2.288, pitchAngle: 9.2, centerZ: 0.0205, footZ: -0.0367, footY: -0.008, footPitch: 0.297 },
    },

    // 全パーツを1つのジオメトリへ結合してから単一の sceneOutput へ。
    { id: 'merge', type: 'mergeGeometry', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'torsoRadius', target: 'torsoGen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'torsoLength', target: 'torsoLengthLifted', targetHandle: 'a' },
    { source: 'torsoLift', sourceHandle: 'value', target: 'torsoLengthLifted', targetHandle: 'b' },
    { source: 'torsoLengthLifted', sourceHandle: 'value', target: 'torsoGen', targetHandle: 'length' },
    { source: 'torsoGen', sourceHandle: 'geometry', target: 'torsoTilt', targetHandle: 'geometry' },
    { source: 'torsoTilt', sourceHandle: 'geometry', target: 'torsoTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'waistY', target: 'torsoY', targetHandle: 'a' },
    { source: 'torsoLift', sourceHandle: 'value', target: 'torsoY', targetHandle: 'b' },
    { source: 'torsoY', sourceHandle: 'value', target: 'torsoTranslate', targetHandle: 'y' },

    { source: 'input', sourceHandle: 'neckRadius', target: 'neckGen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'neckLength', target: 'neckHeight', targetHandle: 'value' },
    { source: 'neckHeight', sourceHandle: 'value', target: 'neckGen', targetHandle: 'length' },
    { source: 'neckGen', sourceHandle: 'geometry', target: 'neckTilt', targetHandle: 'geometry' },
    { source: 'neckTilt', sourceHandle: 'geometry', target: 'neckTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'neckCenterY', target: 'neckTranslate', targetHandle: 'y' },

    { source: 'input', sourceHandle: 'headRadius', target: 'headGen', targetHandle: 'radius' },
    { source: 'headGen', sourceHandle: 'geometry', target: 'headTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'headCenterY', target: 'headBottomY', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'headRadius', target: 'headBottomY', targetHandle: 'b' },
    { source: 'headBottomY', sourceHandle: 'value', target: 'headTranslate', targetHandle: 'y' },

    { source: 'input', sourceHandle: 'armRadius', target: 'armPair', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'armRadius', target: 'armShaftGen', targetHandle: 'radius' },
    { source: 'armLengthAdjusted', sourceHandle: 'value', target: 'armShaftGen', targetHandle: 'length' },
    { source: 'armShaftGen', sourceHandle: 'geometry', target: 'armPair', targetHandle: 'shaft' },
    { source: 'input', sourceHandle: 'armLength', target: 'armLengthAdjusted', targetHandle: 'a' },
    { source: 'armDropIn', sourceHandle: 'value', target: 'armLengthAdjusted', targetHandle: 'b' },
    { source: 'armLengthAdjusted', sourceHandle: 'value', target: 'armPair', targetHandle: 'length' },
    { source: 'armDropIn', sourceHandle: 'value', target: 'armDropHalf', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'armCenterY', target: 'armCenterYAdjusted', targetHandle: 'a' },
    { source: 'armDropHalf', sourceHandle: 'value', target: 'armCenterYAdjusted', targetHandle: 'b' },
    { source: 'input', sourceHandle: 'shoulderSpacing', target: 'armSpacingAdjusted', targetHandle: 'a' },
    { source: 'armInsetIn', sourceHandle: 'value', target: 'armSpacingAdjusted', targetHandle: 'b' },
    { source: 'armSpacingAdjusted', sourceHandle: 'value', target: 'armPair', targetHandle: 'spacing' },
    { source: 'armCenterYAdjusted', sourceHandle: 'value', target: 'armPair', targetHandle: 'centerY' },


    { source: 'input', sourceHandle: 'legRadius', target: 'legPair', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'legRadius', target: 'legShaftGen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'legHeight', target: 'legShaftLength', targetHandle: 'a' },
    { source: 'legTrim', sourceHandle: 'value', target: 'legShaftLength', targetHandle: 'b' },
    { source: 'legShaftLength', sourceHandle: 'value', target: 'legShaftGen', targetHandle: 'length' },
    { source: 'legTrim', sourceHandle: 'value', target: 'legTrimHalf', targetHandle: 'value' },
    { source: 'legShaftGen', sourceHandle: 'geometry', target: 'legShaftLift', targetHandle: 'geometry' },
    { source: 'legTrimHalf', sourceHandle: 'value', target: 'legShaftLift', targetHandle: 'y' },
    { source: 'legShaftLift', sourceHandle: 'geometry', target: 'legPair', targetHandle: 'shaft' },
    { source: 'input', sourceHandle: 'legRadius', target: 'footGen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'legRadius', target: 'footLength', targetHandle: 'value' },
    { source: 'footLength', sourceHandle: 'value', target: 'footGen', targetHandle: 'length' },
    { source: 'footGen', sourceHandle: 'geometry', target: 'legPair', targetHandle: 'foot' },
    { source: 'input', sourceHandle: 'legHeight', target: 'legPair', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'legPair', targetHandle: 'spacing' },
    { source: 'input', sourceHandle: 'legCenterY', target: 'legPair', targetHandle: 'centerY' },

    { source: 'torsoTranslate', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'neckTranslate', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'headTranslate', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'armPair', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'legPair', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },

    { source: 'merge', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
  ],
});
