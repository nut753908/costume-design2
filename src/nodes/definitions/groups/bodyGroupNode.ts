import { defineGroupNode } from '../groupNodeFactory';
import { colorSocket, shadowMaterialParts } from '../garmentOutput';

/** Body をガーメントと同じ「`<name>Group` ノード」パターンで表現する。
 * `Garments.tsx` はノードの型を問わず内部の `sceneOutput` だけを見て描画するため、
 * `bodyGroup` もガーメントと全く同じ経路でシーンへ描画される(ルート CLAUDE.md 参照)。
 *
 * 外部ソケットは寸法(半径・長さ・間隔)で、固定値のリテラルを既定値に持つ(グループカードの入力欄から調整する)。
 * 胴体・頭・腕・脚のY座標は、この寸法から `bodyLayout`(`generic/bodyLayout.ts`)が求める(寸法を変えると位置も連動する)。
 *
 * 部位ごとの構成:
 * - 胴体+首: 1本の連続した輪郭(`torsoShape`。首は胴体の延長で、`extra` に固定値(首の長さ 0.0565 の 2.4 倍)を渡す)を
 *   `rotate` で前後へ傾け、`translate`(Y だけを配線)で置く。
 * - 頭+耳: `headShape` と `earPair` を `translate` で置く。
 * - 腕1組/脚1組: 軸(`armShaft`/`legShaft`、`generic/limbShaft.ts`)と足(`footShape`)から
 *   `limbPair`(`generic/limbPair.ts`)で作る。軸の長さ・位置の補正は `armShaftAdjust`/`legShaftAdjust`。
 * すべて `mergeGeometry` 1つで1つのジオメトリへ結合し、`sceneOutput` を1個だけ持つ(複数のプリミティブを1グループ内で
 * 完結させる形 — 詳細は `nodes/CLAUDE.md` の「グループノード」節)。
 * 全パーツが同じマテリアルなので、結合した方がノードグラフ上の階層が1段減る。
 *
 * 肌色は他のガーメントと同じ外部ソケット `color`(`colorSocket()`)で、`shadowMaterialParts()` の
 * `material`(`toonShadowMaterial`)へ配線し、`sceneOut` の `material` へ1本配線するだけでよい。 */
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
          { id: 'legHeight', label: 'Leg Height', type: 'number', default: 0.5754 },
          { id: 'legRadius', label: 'Leg Radius', type: 'number', default: 0.0691 },
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number', default: 0.1109 },
          { id: 'torsoLength', label: 'Torso Length', type: 'number', default: 0.3343 },
          { id: 'torsoRadius', label: 'Torso Radius', type: 'number', default: 0.1536 },
          { id: 'headRadius', label: 'Head Radius', type: 'number', default: 0.2966 },
          { id: 'armLength', label: 'Arm Length', type: 'number', default: 0.4683 },
          { id: 'armRadius', label: 'Arm Radius', type: 'number', default: 0.0523 },
          { id: 'shoulderSpacing', label: 'Shoulder Spacing', type: 'number', default: 0.1443 },
          colorSocket('#fae6da'),
        ],
      },
    },

    // 胴体・頭・腕・脚のY座標(寸法から求める)。
    { id: 'layout', type: 'bodyLayout', data: {} },

    // 肌もガーメントと同じ塗り(`shade` + `toonShadowMaterial`)。
    ...shadowMaterialParts().nodes,

    // 胴体(torsoShape、原点が股)。
    { id: 'torsoGen', type: 'torsoShape', data: {} },
    // 股(原点)を支点に、上端を前後へ傾ける(`torsoTilt` の入力欄 `x`、負なら上端が後ろへ倒れる)。
    { id: 'torsoTilt', type: 'rotate', data: { x: -8.599 } },
    { id: 'torsoTranslate', type: 'translate', data: {} },
    // 胴体の下端(股の高さ)だけを `torsoLift` ぶん上げる(長さを短くし、上端が動かないよう同じだけ持ち上げる)。
    { id: 'torsoLift', type: 'numberInput', data: { value: 0.0465 } },
    { id: 'torsoLengthLifted', type: 'numberSubtract', data: {} },
    { id: 'torsoY', type: 'numberAdd', data: {} },

    // 首は胴体の延長として `torsoGen` が作る(`torsoShape` の `extra`)。延長の長さは固定値(首の長さ 0.0565 × 2.4)で、先端は頭の中に埋まる。
    { id: 'neckExtension', type: 'numberInput', data: { value: 0.1356 } },

    // 頭(`headShape`、原点が下端)。下端を首の上端(`headCenterY - headRadius`)に合わせて置き、
    // 重心は後ろ(Z 負)へずらす(`headTranslate` の入力欄 `z`。あごが前に出て見えるように、頭は
    // 胴体の中心より後ろに置く)。
    { id: 'headGen', type: 'headShape', data: { heightRatio: 1.005 } },
    { id: 'headBottomY', type: 'numberSubtract', data: {} },
    // 頭の前後位置は、耳(`earGen`)と共有する。
    { id: 'headZIn', type: 'numberInput', data: { value: -0.1054 } },
    { id: 'headTranslate', type: 'translate', data: {} },
    // 頭の側面の耳(左右の小さな楕円体)。
    { id: 'earGen', type: 'earPair', data: {} },

    // 腕1組・脚1組(limbPair)。先端の球(手/足)の形は腕用/脚用で別々の値を持つ。
    // 足は上下につぶして前に伸ばし、底が地面に来る高さに置く。
    // 腕の付け根を胴体へ寄せる補正(下げる量・内側へ寄せる量は `armShaftAdjust` の `drop`/`inset` の既定値)。
    { id: 'armAdjust', type: 'armShaftAdjust', data: {} },
    { id: 'armShaftGen', type: 'armShaft', data: {} },
    // 脚の軸の長さと持ち上げ量(下端を短く・上端を伸ばす。値は `legShaftAdjust` の `trim`/`raise` の既定値)。
    { id: 'legAdjust', type: 'legShaftAdjust', data: {} },
    { id: 'legShaftGen', type: 'legShaft', data: {} },
    { id: 'legShaftLift', type: 'translate', data: {} },
    // 足(footShape、足の長さは脚の半径の `footLength` の `factor` 倍)。脚の先端の球は使わず、足をこれで作る。
    { id: 'footGen', type: 'footShape', data: {} },
    { id: 'footLength', type: 'numberMultiply', data: { factor: 2.688 } },
    { id: 'armPair', type: 'limbPair', data: { swingAngle: 16.62, pitchAngle: -14.87, centerZ: -0.1151 } },
    // 腕の先端の手(手首から少し下に垂らした丸)と、脚の先端で足に隠れる小さな球。
    {
      id: 'armEnd',
      type: 'limbEnd',
      data: { ratio: 1.309, scaleX: 0.9, scaleY: 1.0109, scaleZ: 1.071, pitch: -22.48, roll: 2, shiftX: -0.2, shiftY: -0.5547 },
    },
    { id: 'legEnd', type: 'limbEnd', data: { ratio: 0.02 } },
    {
      id: 'legPair',
      type: 'limbPair',
      data: { swingAngle: 2.388, pitchAngle: 9.2, centerZ: 0.0205, footZ: -0.0367, footY: -0.008, footX: -0.004, footPitch: 0.297 },
    },

    // 全パーツを1つのジオメトリへ結合してから単一の sceneOutput へ。
    { id: 'merge', type: 'mergeGeometry', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'legHeight', target: 'layout', targetHandle: 'legHeight' },
    { source: 'input', sourceHandle: 'torsoLength', target: 'layout', targetHandle: 'torsoLength' },
    { source: 'input', sourceHandle: 'torsoRadius', target: 'layout', targetHandle: 'torsoRadius' },
    { source: 'input', sourceHandle: 'headRadius', target: 'layout', targetHandle: 'headRadius' },
    { source: 'input', sourceHandle: 'armLength', target: 'layout', targetHandle: 'armLength' },
    { source: 'input', sourceHandle: 'torsoRadius', target: 'torsoGen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'torsoLength', target: 'torsoLengthLifted', targetHandle: 'a' },
    { source: 'torsoLift', sourceHandle: 'value', target: 'torsoLengthLifted', targetHandle: 'b' },
    { source: 'torsoLengthLifted', sourceHandle: 'value', target: 'torsoGen', targetHandle: 'length' },
    { source: 'neckExtension', sourceHandle: 'value', target: 'torsoGen', targetHandle: 'extra' },
    { source: 'torsoGen', sourceHandle: 'geometry', target: 'torsoTilt', targetHandle: 'geometry' },
    { source: 'torsoTilt', sourceHandle: 'geometry', target: 'torsoTranslate', targetHandle: 'geometry' },
    { source: 'layout', sourceHandle: 'waistY', target: 'torsoY', targetHandle: 'a' },
    { source: 'torsoLift', sourceHandle: 'value', target: 'torsoY', targetHandle: 'b' },
    { source: 'torsoY', sourceHandle: 'value', target: 'torsoTranslate', targetHandle: 'y' },

    { source: 'input', sourceHandle: 'headRadius', target: 'headGen', targetHandle: 'radius' },
    { source: 'headGen', sourceHandle: 'geometry', target: 'headTranslate', targetHandle: 'geometry' },
    { source: 'layout', sourceHandle: 'headCenterY', target: 'headBottomY', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'headRadius', target: 'headBottomY', targetHandle: 'b' },
    { source: 'headBottomY', sourceHandle: 'value', target: 'headTranslate', targetHandle: 'y' },
    { source: 'headZIn', sourceHandle: 'value', target: 'headTranslate', targetHandle: 'z' },
    { source: 'input', sourceHandle: 'headRadius', target: 'earGen', targetHandle: 'radius' },
    { source: 'layout', sourceHandle: 'headCenterY', target: 'earGen', targetHandle: 'centerY' },
    { source: 'headZIn', sourceHandle: 'value', target: 'earGen', targetHandle: 'centerZ' },

    { source: 'input', sourceHandle: 'armRadius', target: 'armEnd', targetHandle: 'radius' },
    { source: 'armEnd', sourceHandle: 'geometry', target: 'armPair', targetHandle: 'end' },
    { source: 'input', sourceHandle: 'armRadius', target: 'armShaftGen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'armLength', target: 'armAdjust', targetHandle: 'length' },
    { source: 'layout', sourceHandle: 'armCenterY', target: 'armAdjust', targetHandle: 'centerY' },
    { source: 'input', sourceHandle: 'shoulderSpacing', target: 'armAdjust', targetHandle: 'spacing' },
    { source: 'armAdjust', sourceHandle: 'length', target: 'armShaftGen', targetHandle: 'length' },
    { source: 'armAdjust', sourceHandle: 'length', target: 'armPair', targetHandle: 'length' },
    { source: 'armAdjust', sourceHandle: 'spacing', target: 'armPair', targetHandle: 'spacing' },
    { source: 'armAdjust', sourceHandle: 'centerY', target: 'armPair', targetHandle: 'centerY' },
    { source: 'armShaftGen', sourceHandle: 'geometry', target: 'armPair', targetHandle: 'shaft' },

    { source: 'input', sourceHandle: 'legRadius', target: 'legEnd', targetHandle: 'radius' },
    { source: 'legEnd', sourceHandle: 'geometry', target: 'legPair', targetHandle: 'end' },
    { source: 'input', sourceHandle: 'legRadius', target: 'legShaftGen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'legHeight', target: 'legAdjust', targetHandle: 'length' },
    { source: 'legAdjust', sourceHandle: 'length', target: 'legShaftGen', targetHandle: 'length' },
    { source: 'legAdjust', sourceHandle: 'lift', target: 'legShaftLift', targetHandle: 'y' },
    { source: 'legShaftGen', sourceHandle: 'geometry', target: 'legShaftLift', targetHandle: 'geometry' },
    { source: 'legShaftLift', sourceHandle: 'geometry', target: 'legPair', targetHandle: 'shaft' },
    { source: 'input', sourceHandle: 'legRadius', target: 'footGen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'legRadius', target: 'footLength', targetHandle: 'value' },
    { source: 'footLength', sourceHandle: 'value', target: 'footGen', targetHandle: 'length' },
    { source: 'footGen', sourceHandle: 'geometry', target: 'legPair', targetHandle: 'foot' },
    { source: 'input', sourceHandle: 'legHeight', target: 'legPair', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'legPair', targetHandle: 'spacing' },
    { source: 'layout', sourceHandle: 'legCenterY', target: 'legPair', targetHandle: 'centerY' },

    { source: 'torsoTranslate', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'headTranslate', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'earGen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'armPair', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'legPair', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },

    { source: 'merge', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
    ...shadowMaterialParts().edges,
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
  ],
});
