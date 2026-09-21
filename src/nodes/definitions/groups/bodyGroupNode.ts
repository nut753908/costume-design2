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
 * 胴体(`capsuleGenerator`)・頭(`sphereGenerator`)をそれぞれ `translateY` で配置し、
 * 腕1組/脚1組は `limbPair`(`nodes/definitions/generic/limbPair.ts`)で作ってから、
 * 4つを `mergeGeometry` 1つで1つのジオメトリへ結合し、`sceneOutput` を1個だけ持つ(scarf が
 * belt+box を `mergeGeometry` でまとめるのと同じ、複数プリミティブを1グループ内で完結させる
 * 形 — 詳細は `nodes/CLAUDE.md` の「グループノード」節)。トゥーンのアウトライン
 * (`rendering/Outline.tsx`)はワールド原点基準の一様スケール複製のため、4パーツを個別の
 * `sceneOutput`(=個別メッシュ)として描画しても1つに結合してから描画しても見た目は変わらず、
 * 結合した方がノードグラフ上の階層(ネストしたグループ)が1段減る。
 *
 * 腕/脚とも手首/足首側を根元よりわずかに細くするテーパー比率を持つが、値は左右独立ではなく
 * 部位ごと(腕1本の左右ペアで共通、脚1本の左右ペアで共通)で、`armPair`/`legPair`(`limbPair`)の
 * `Taper Ratio` 入力欄の値として別々に持つ(腕用/脚用は別のノードなので区別できる)。
 *
 * 肌色は他のガーメントと同じ外部ソケット `color`(`colorSocket()`)で、`material`(`toonMaterial`)の
 * `color` へ配線し、`material` から `sceneOut` の `material` へ1本配線するだけでよい
 * (4パーツすべてが同じマテリアルを使う)。 */
defineGroupNode({
  type: 'bodyGroup',
  label: 'Body Group',
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
          colorSocket('#f2c9a0'),
        ],
      },
    },
    { id: 'material', type: 'toonMaterial', data: {} },

    // 胴体(capsuleGenerator)。
    { id: 'torsoGen', type: 'capsuleGenerator', data: {} },
    { id: 'torsoTranslate', type: 'translateY', data: {} },

    // 頭(sphereGenerator)。
    { id: 'headGen', type: 'sphereGenerator', data: {} },
    { id: 'headTranslate', type: 'translateY', data: {} },

    // 腕1組・脚1組(limbPair)。テーパー比率は腕用/脚用で別々の値を持つ。
    { id: 'armPair', type: 'limbPair', data: { taperRatio: 0.85 } },
    { id: 'legPair', type: 'limbPair', data: { taperRatio: 0.85 } },

    // 4パーツを1つのジオメトリへ結合してから単一の sceneOutput へ。
    { id: 'merge', type: 'mergeGeometry', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'torsoRadius', target: 'torsoGen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'torsoLength', target: 'torsoGen', targetHandle: 'length' },
    { source: 'torsoGen', sourceHandle: 'geometry', target: 'torsoTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'torsoCenterY', target: 'torsoTranslate', targetHandle: 'y' },

    { source: 'input', sourceHandle: 'headRadius', target: 'headGen', targetHandle: 'radius' },
    { source: 'headGen', sourceHandle: 'geometry', target: 'headTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'headCenterY', target: 'headTranslate', targetHandle: 'y' },

    { source: 'input', sourceHandle: 'armRadius', target: 'armPair', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'armLength', target: 'armPair', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'shoulderSpacing', target: 'armPair', targetHandle: 'spacing' },
    { source: 'input', sourceHandle: 'armCenterY', target: 'armPair', targetHandle: 'centerY' },

    { source: 'input', sourceHandle: 'legRadius', target: 'legPair', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'legHeight', target: 'legPair', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'legPair', targetHandle: 'spacing' },
    { source: 'input', sourceHandle: 'legCenterY', target: 'legPair', targetHandle: 'centerY' },

    { source: 'torsoTranslate', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'headTranslate', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'armPair', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'legPair', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },

    { source: 'merge', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
  ],
});
