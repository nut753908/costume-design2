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
 * 胴体(`torsoShape`、`generic/torsoShape.ts`)・首(`cylinderGenerator`)・頭(`sphereGenerator`)をそれぞれ `translate`(Y だけを配線)で配置し、
 * 腕1組/脚1組は `limbPair`(`nodes/definitions/generic/limbPair.ts`)で作ってから、
 * すべて `mergeGeometry` 1つで1つのジオメトリへ結合し、`sceneOutput` を1個だけ持つ(scarf が
 * belt+box を `mergeGeometry` でまとめるのと同じ、複数プリミティブを1グループ内で完結させる
 * 形 — 詳細は `nodes/CLAUDE.md` の「グループノード」節)。全パーツが同じマテリアルなので、個別の
 * `sceneOutput`(=個別メッシュ)として描画しても1つに結合してから描画しても見た目は変わらず、
 * 結合した方がノードグラフ上の階層(ネストしたグループ)が1段減る。
 *
 * 腕/脚とも手首/足首側を根元よりわずかに細くするテーパー比率を持つが、値は左右独立ではなく
 * 部位ごと(腕1本の左右ペアで共通、脚1本の左右ペアで共通)で、`armPair`/`legPair`(`limbPair`)の
 * `Taper Ratio` 入力欄の値として別々に持つ(腕用/脚用は別のノードなので区別できる)。
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
    { id: 'torsoTilt', type: 'rotate', data: { x: -8.122 } },
    { id: 'torsoTranslate', type: 'translate', data: {} },

    // 首(cylinderGenerator)。高さを首の長さの2倍にして、上下を頭と胴体の丸みに食い込ませる
    // (長さちょうどだと、首の縁と胴体の上端の丸みの間に隙間が見える)。
    { id: 'neckHeight', type: 'numberMultiply', data: { factor: 2 } },
    { id: 'neckGen', type: 'cylinderGenerator', data: {} },
    { id: 'neckTranslate', type: 'translate', data: { z: -0.0395 } },

    // 頭(`headShape`、原点が下端)。下端を首の上端(`headCenterY - headRadius`)に合わせて置き、
    // 重心は後ろ(Z 負)へずらす(`headTranslate` の入力欄 `z`。あごが前に出て見えるように、頭は
    // 胴体の中心より後ろに置く)。
    { id: 'headGen', type: 'headShape', data: { heightRatio: 0.996 } },
    { id: 'headBottomY', type: 'numberSubtract', data: {} },
    { id: 'headTranslate', type: 'translate', data: { z: -0.1067 } },

    // 腕1組・脚1組(limbPair)。テーパー比率と先端の球(手/足)の形は腕用/脚用で別々の値を持つ。
    // 手は手首から少し下に垂らした丸、足は上下につぶして前に伸ばし、底が地面に来る高さに置く。
    // 腕の付け根を `armDropIn` だけ下げる(付け根の関節の球を胴体の中へ埋め、肩の上に盛り上がって
    // 見えないようにする)。手の位置は変えないよう、腕の長さをその分だけ短くし、腕の中心を半分だけ下げる。
    { id: 'armDropIn', type: 'numberInput', data: { value: 0.05 } },
    { id: 'armDropHalf', type: 'numberHalf', data: {} },
    { id: 'armCenterYAdjusted', type: 'numberSubtract', data: {} },
    { id: 'armLengthAdjusted', type: 'numberSubtract', data: {} },
    { id: 'armPair', type: 'limbPair', data: { taperRatio: 0.8702, endRatio: 1.17, endScaleY: 1.3, endScaleZ: 0.85, endShiftY: -0.7895, swingAngle: 16.55, pitchAngle: -13.14, centerZ: -0.1 } },
    {
      id: 'legPair',
      type: 'limbPair',
      data: { taperRatio: 0.4526, endRatio: 0.9142, endScaleY: 0.6285, endScaleZ: 1.307, endShiftY: 0.3626, endShiftZ: 0.9363, swingAngle: 2.482, pitchAngle: 8.678, centerZ: 0.0235 },
    },

    // 全パーツを1つのジオメトリへ結合してから単一の sceneOutput へ。
    { id: 'merge', type: 'mergeGeometry', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'torsoRadius', target: 'torsoGen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'torsoLength', target: 'torsoGen', targetHandle: 'length' },
    { source: 'torsoGen', sourceHandle: 'geometry', target: 'torsoTilt', targetHandle: 'geometry' },
    { source: 'torsoTilt', sourceHandle: 'geometry', target: 'torsoTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'waistY', target: 'torsoTranslate', targetHandle: 'y' },

    { source: 'input', sourceHandle: 'neckRadius', target: 'neckGen', targetHandle: 'radiusTop' },
    { source: 'input', sourceHandle: 'neckRadius', target: 'neckGen', targetHandle: 'radiusBottom' },
    { source: 'input', sourceHandle: 'neckLength', target: 'neckHeight', targetHandle: 'value' },
    { source: 'neckHeight', sourceHandle: 'value', target: 'neckGen', targetHandle: 'height' },
    { source: 'neckGen', sourceHandle: 'geometry', target: 'neckTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'neckCenterY', target: 'neckTranslate', targetHandle: 'y' },

    { source: 'input', sourceHandle: 'headRadius', target: 'headGen', targetHandle: 'radius' },
    { source: 'headGen', sourceHandle: 'geometry', target: 'headTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'headCenterY', target: 'headBottomY', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'headRadius', target: 'headBottomY', targetHandle: 'b' },
    { source: 'headBottomY', sourceHandle: 'value', target: 'headTranslate', targetHandle: 'y' },

    { source: 'input', sourceHandle: 'armRadius', target: 'armPair', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'armLength', target: 'armLengthAdjusted', targetHandle: 'a' },
    { source: 'armDropIn', sourceHandle: 'value', target: 'armLengthAdjusted', targetHandle: 'b' },
    { source: 'armLengthAdjusted', sourceHandle: 'value', target: 'armPair', targetHandle: 'length' },
    { source: 'armDropIn', sourceHandle: 'value', target: 'armDropHalf', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'armCenterY', target: 'armCenterYAdjusted', targetHandle: 'a' },
    { source: 'armDropHalf', sourceHandle: 'value', target: 'armCenterYAdjusted', targetHandle: 'b' },
    { source: 'input', sourceHandle: 'shoulderSpacing', target: 'armPair', targetHandle: 'spacing' },
    { source: 'armCenterYAdjusted', sourceHandle: 'value', target: 'armPair', targetHandle: 'centerY' },


    { source: 'input', sourceHandle: 'legRadius', target: 'legPair', targetHandle: 'radius' },
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
