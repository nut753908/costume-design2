import { defineGroupNode } from './groupNodeFactory';

/** Body(3Dモデル本体)を、他15種のガーメントと同じ「`<name>Group` ノード」パターンで
 * 表現する。以前は `scene/Body.tsx` が `computeBodyDimensions`/`computeBodyLayout` の結果を
 * 使って `<mesh>` を直接組み立てる専用コンポーネントだったが、その組み立て(どの形状を・
 * どのサイズで・どこに置き・何色にするか)をこの `bodyGroup` の埋め込みサブグラフへ移し、
 * `scene/Body.tsx` 自体を削除した。`Garments.tsx` はノードの型を問わず内部の `sceneOutput`
 * (下記参照)だけを見て描画するため、`bodyGroup` もガーメントと全く同じ経路でシーンへ
 * 描画される(`Body` 専用の特別扱いは無くなった、ルート CLAUDE.md 参照)。
 *
 * `bodyDimensions`/`bodyLayout` の2ノードが `geometry/body.ts` の
 * `computeBodyDimensions()`/`computeBodyLayout()`(Height/Build/Shoulder スケールから
 * 各部位の半径・長さ・Y座標を算出する純粋関数)をそのまま配線する — 「どう計算するか」という
 * 式自体は他ガーメントの build*Geometry と同じくコード側に残し、「どの値がどのジェネレーター/
 * 配置ノードへ渡るか」という配線をここで可視化する。胴体(カプセル)・頭(球)・腕1組・脚1組の
 * 4パーツそれぞれを generator→`translateY`(Y座標だけを平行移動する汎用ノード、
 * `garmentPlacement` の anchor 版に相当)→`sceneOutput` という流れで独立した `ToonMesh` として
 * 出力する(1つのグループの中に `sceneOutput` は何個あってもよい、nodes/CLAUDE.md 参照)。
 * 肌色は1つの `toonMaterial` ノードから4つの `sceneOutput` すべてへファンアウトする
 * (`bodyBuild` が全ガーメントへファンアウトするのと同じ、1つの出力を複数の入力へ繋ぐだけの
 * 通常のエッジ)。
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
          { id: 'skinColor', label: 'Skin Color', type: 'color', default: '#f2c9a0' },
        ],
      },
    },
    { id: 'dims', type: 'bodyDimensions', data: {} },
    { id: 'layout', type: 'bodyLayout', data: {} },
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
    { source: 'input', sourceHandle: 'bodyHeight', target: 'dims', targetHandle: 'heightScale' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'dims', targetHandle: 'buildScale' },
    { source: 'input', sourceHandle: 'bodyShoulder', target: 'dims', targetHandle: 'shoulderScale' },

    { source: 'dims', sourceHandle: 'torsoRadius', target: 'torsoGen', targetHandle: 'radius' },
    { source: 'dims', sourceHandle: 'torsoLength', target: 'torsoGen', targetHandle: 'length' },
    { source: 'dims', sourceHandle: 'headRadius', target: 'headGen', targetHandle: 'radius' },
    { source: 'dims', sourceHandle: 'armRadius', target: 'armGen', targetHandle: 'radius' },
    { source: 'dims', sourceHandle: 'armLength', target: 'armGen', targetHandle: 'length' },
    { source: 'dims', sourceHandle: 'shoulderSpacing', target: 'armGen', targetHandle: 'spacing' },
    { source: 'dims', sourceHandle: 'legRadius', target: 'legGen', targetHandle: 'radius' },
    { source: 'dims', sourceHandle: 'legHeight', target: 'legGen', targetHandle: 'length' },
    { source: 'dims', sourceHandle: 'legSpacing', target: 'legGen', targetHandle: 'spacing' },

    { source: 'dims', sourceHandle: 'legHeight', target: 'layout', targetHandle: 'legHeight' },
    { source: 'dims', sourceHandle: 'torsoLength', target: 'layout', targetHandle: 'torsoLength' },
    { source: 'dims', sourceHandle: 'torsoRadius', target: 'layout', targetHandle: 'torsoRadius' },
    { source: 'dims', sourceHandle: 'headRadius', target: 'layout', targetHandle: 'headRadius' },
    { source: 'dims', sourceHandle: 'armLength', target: 'layout', targetHandle: 'armLength' },

    { source: 'torsoGen', sourceHandle: 'geometry', target: 'torsoTranslate', targetHandle: 'geometry' },
    { source: 'layout', sourceHandle: 'torsoCenterY', target: 'torsoTranslate', targetHandle: 'y' },
    { source: 'headGen', sourceHandle: 'geometry', target: 'headTranslate', targetHandle: 'geometry' },
    { source: 'layout', sourceHandle: 'headCenterY', target: 'headTranslate', targetHandle: 'y' },
    { source: 'armGen', sourceHandle: 'geometry', target: 'armTranslate', targetHandle: 'geometry' },
    { source: 'layout', sourceHandle: 'armCenterY', target: 'armTranslate', targetHandle: 'y' },
    { source: 'legGen', sourceHandle: 'geometry', target: 'legTranslate', targetHandle: 'geometry' },
    { source: 'layout', sourceHandle: 'legCenterY', target: 'legTranslate', targetHandle: 'y' },

    { source: 'input', sourceHandle: 'skinColor', target: 'material', targetHandle: 'color' },

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
