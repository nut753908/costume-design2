import { defineGroupNode } from '../groupNodeFactory';

/** Body を他15種のガーメントと同じ「`<name>Group` ノード」パターンで表現する。
 * `Garments.tsx` はノードの型を問わず内部の `sceneOutput` だけを見て描画するため、
 * `bodyGroup` もガーメントと全く同じ経路でシーンへ描画される(ルート CLAUDE.md 参照)。
 *
 * 外部ソケットは `bodyDimensions`/`bodyLayout`(`state/initialGraph.ts` のトップレベル
 * 共有ノード)が計算済みの生の値(半径・長さ・Y座標)そのもので、`bodyGroup` 自身は
 * スケール計算を行わない。
 *
 * 胴体(`capsuleGenerator`)・頭(`sphereGenerator`)・腕1組/脚1組(`cylinderGenerator`+
 * `mirrorPair`)の4パーツをそれぞれ `translateY` で配置してから `mergeGeometry` を3回
 * チェーンして1つのジオメトリへ結合し、`sceneOutput` を1個だけ持つ(scarf が
 * belt+box を `mergeGeometry` でまとめるのと同じ、複数プリミティブを1グループ内で完結させる
 * 形 — 詳細は `nodes/CLAUDE.md` の「グループノード」節)。トゥーンのアウトライン
 * (`rendering/Outline.tsx`)はワールド原点基準の一様スケール複製のため、4パーツを個別の
 * `sceneOutput`(=個別メッシュ)として描画しても1つに結合してから描画しても見た目は変わらず、
 * 結合した方がノードグラフ上の階層(ネストしたグループ)が1段減る。
 *
 * 腕/脚とも手首/足首側を根元よりわずかに細くするテーパー比率を持つが、値は左右独立ではなく
 * 部位ごと(腕1本の左右ペアで共通、脚1本の左右ペアで共通)で、`armTaperRatioIn`/
 * `legTaperRatioIn` という別々の `numberInput` として持つ(ラベルで腕用/脚用を区別できる)。
 *
 * 肌色(`skinColorIn`)は4パーツすべてで共有される値のため、`skinColorIn`→`material`
 * (`toonMaterial`)から `sceneOut` の `material` へ1本配線するだけでよい。 */
defineGroupNode({
  type: 'bodyGroup',
  label: 'Body',
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
          { id: 'legCenterY', label: 'Leg Center Y', type: 'number', default: 0 },
          { id: 'torsoCenterY', label: 'Torso Center Y', type: 'number', default: 0 },
          { id: 'headCenterY', label: 'Head Center Y', type: 'number', default: 0 },
          { id: 'armCenterY', label: 'Arm Center Y', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'skinColorIn', type: 'colorInput', data: { hex: '#f2c9a0', label: 'Skin Color' } },
    { id: 'material', type: 'toonMaterial', data: {} },

    // 胴体(capsuleGenerator)。
    { id: 'torsoGen', type: 'capsuleGenerator', data: {} },
    { id: 'torsoTranslate', type: 'translateY', data: {} },

    // 頭(sphereGenerator)。
    { id: 'headGen', type: 'sphereGenerator', data: {} },
    { id: 'headTranslate', type: 'translateY', data: {} },

    // 腕1組(cylinderGenerator+mirrorPair)。
    { id: 'armTaperRatioIn', type: 'numberInput', data: { value: 0.85, min: 0, max: 1, step: 0.01, label: 'Arm Taper Ratio' } },
    { id: 'armTaper', type: 'numberMultiply', data: { label: 'Arm Taper' } },
    { id: 'armGen', type: 'cylinderGenerator', data: {} },
    { id: 'armMirror', type: 'mirrorPair', data: {} },
    { id: 'armTranslate', type: 'translateY', data: {} },

    // 脚1組(cylinderGenerator+mirrorPair)。
    { id: 'legTaperRatioIn', type: 'numberInput', data: { value: 0.85, min: 0, max: 1, step: 0.01, label: 'Leg Taper Ratio' } },
    { id: 'legTaper', type: 'numberMultiply', data: { label: 'Leg Taper' } },
    { id: 'legGen', type: 'cylinderGenerator', data: {} },
    { id: 'legMirror', type: 'mirrorPair', data: {} },
    { id: 'legTranslate', type: 'translateY', data: {} },

    // 4パーツを1つのジオメトリへ結合してから単一の sceneOutput へ。
    { id: 'mergeTorsoHead', type: 'mergeGeometry', data: {} },
    { id: 'mergeArm', type: 'mergeGeometry', data: {} },
    { id: 'mergeLeg', type: 'mergeGeometry', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'skinColorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },

    { source: 'input', sourceHandle: 'torsoRadius', target: 'torsoGen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'torsoLength', target: 'torsoGen', targetHandle: 'length' },
    { source: 'torsoGen', sourceHandle: 'geometry', target: 'torsoTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'torsoCenterY', target: 'torsoTranslate', targetHandle: 'y' },

    { source: 'input', sourceHandle: 'headRadius', target: 'headGen', targetHandle: 'radius' },
    { source: 'headGen', sourceHandle: 'geometry', target: 'headTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'headCenterY', target: 'headTranslate', targetHandle: 'y' },

    { source: 'input', sourceHandle: 'armRadius', target: 'armGen', targetHandle: 'radiusTop' },
    { source: 'input', sourceHandle: 'armRadius', target: 'armTaper', targetHandle: 'value' },
    { source: 'armTaperRatioIn', sourceHandle: 'value', target: 'armTaper', targetHandle: 'factor' },
    { source: 'armTaper', sourceHandle: 'value', target: 'armGen', targetHandle: 'radiusBottom' },
    { source: 'input', sourceHandle: 'armLength', target: 'armGen', targetHandle: 'height' },
    { source: 'armGen', sourceHandle: 'geometry', target: 'armMirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'shoulderSpacing', target: 'armMirror', targetHandle: 'offset' },
    { source: 'armMirror', sourceHandle: 'geometry', target: 'armTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'armCenterY', target: 'armTranslate', targetHandle: 'y' },

    { source: 'input', sourceHandle: 'legRadius', target: 'legGen', targetHandle: 'radiusTop' },
    { source: 'input', sourceHandle: 'legRadius', target: 'legTaper', targetHandle: 'value' },
    { source: 'legTaperRatioIn', sourceHandle: 'value', target: 'legTaper', targetHandle: 'factor' },
    { source: 'legTaper', sourceHandle: 'value', target: 'legGen', targetHandle: 'radiusBottom' },
    { source: 'input', sourceHandle: 'legHeight', target: 'legGen', targetHandle: 'height' },
    { source: 'legGen', sourceHandle: 'geometry', target: 'legMirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'legMirror', targetHandle: 'offset' },
    { source: 'legMirror', sourceHandle: 'geometry', target: 'legTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'legCenterY', target: 'legTranslate', targetHandle: 'y' },

    { source: 'torsoTranslate', sourceHandle: 'geometry', target: 'mergeTorsoHead', targetHandle: 'geometryA' },
    { source: 'headTranslate', sourceHandle: 'geometry', target: 'mergeTorsoHead', targetHandle: 'geometryB' },
    { source: 'mergeTorsoHead', sourceHandle: 'geometry', target: 'mergeArm', targetHandle: 'geometryA' },
    { source: 'armTranslate', sourceHandle: 'geometry', target: 'mergeArm', targetHandle: 'geometryB' },
    { source: 'mergeArm', sourceHandle: 'geometry', target: 'mergeLeg', targetHandle: 'geometryA' },
    { source: 'legTranslate', sourceHandle: 'geometry', target: 'mergeLeg', targetHandle: 'geometryB' },

    { source: 'mergeLeg', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
  ],
});
