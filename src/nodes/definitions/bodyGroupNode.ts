import { defineGroupNode } from './groupNodeFactory';

/** Body(3Dモデル本体)を、他15種のガーメントと同じ「`<name>Group` ノード」パターンで
 * 表現する。以前は `scene/Body.tsx` が `computeBodyDimensions`/`computeBodyLayout` の結果を
 * 使って `<mesh>` を直接組み立てる専用コンポーネントだったが、その組み立て(どの形状を・
 * どのサイズで・どこに置き・何色にするか)をこの `bodyGroup` の埋め込みサブグラフへ移し、
 * `scene/Body.tsx` 自体を削除した。`Garments.tsx` はノードの型を問わず内部の `sceneOutput`
 * (下記参照)だけを見て描画するため、`bodyGroup` もガーメントと全く同じ経路でシーンへ
 * 描画される(`Body` 専用の特別扱いは無くなった、ルート CLAUDE.md 参照)。
 *
 * 各部位の半径・長さ・Y座標を求める計算(`bodyDimensionsGroup`/`bodyLayoutGroup`)自体は
 * `bodyGroup` の中にネストされていない — `state/initialGraph.ts` 側のトップレベル共有ノード
 * (`bodyDimensions`/`bodyLayout`)としてただ1つだけ存在し、その9個+4個の出力を
 * `bodyGroup` の外部ソケットとして直接受け取る。以前は `bodyGroup`(1個)と15個の
 * `garmentPlacement` インスタンスのそれぞれが独立してこの2つのグループをネストし、
 * 合計16回同じ計算を重複して行っていたが、`bodyBuild`/`topRadiusScale` と同じ「値が複数
 * グループで共有される場合はトップレベルの共有ノードへ引き上げる」パターン(`nodes/CLAUDE.md`
 * の「グループノード」節)へ改め、計算そのものは1回だけに集約した(詳細な経緯は
 * `state/initialGraph.ts` のコメント参照)。この結果 `bodyGroup` の外部インターフェースは
 * `bodyHeight`/`bodyBuild`/`bodyShoulder`(3つのスケール係数)ではなく、`bodyDimensions`/
 * `bodyLayout` が計算済みの生の値そのもの(半径・長さ・Y座標)になっている。
 *
 * 胴体(カプセル)・頭(球)・腕1組・脚1組の4パーツそれぞれを generator→`translateY`
 * (Y座標だけを平行移動する汎用ノード、`garmentPlacement` が使うのと同じ)→`sceneOutput`
 * という流れで独立した `ToonMesh` として出力する(1つのグループの中に `sceneOutput` は
 * 何個あってもよい、nodes/CLAUDE.md 参照)。肌色(`skinColorIn`)は `bodyGroup` 以外の
 * どのグループとも共有されない単独パラメータのため、他ガーメントの生パラメータ・Color と
 * 同じく groupInput の外部ソケットにはせず、内部の `colorInput` ノードとして保持する
 * (グループの中に入って初めて編集できる)。その値を1つの `toonMaterial` ノードから4つの
 * `sceneOutput` すべてへファンアウトする(1つの出力を複数の入力へ繋ぐだけの通常のエッジ)。 */
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
    { source: 'input', sourceHandle: 'torsoRadius', target: 'torsoGen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'torsoLength', target: 'torsoGen', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'headRadius', target: 'headGen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'armRadius', target: 'armGen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'armLength', target: 'armGen', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'shoulderSpacing', target: 'armGen', targetHandle: 'spacing' },
    { source: 'input', sourceHandle: 'legRadius', target: 'legGen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'legHeight', target: 'legGen', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'legGen', targetHandle: 'spacing' },

    { source: 'torsoGen', sourceHandle: 'geometry', target: 'torsoTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'torsoCenterY', target: 'torsoTranslate', targetHandle: 'y' },
    { source: 'headGen', sourceHandle: 'geometry', target: 'headTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'headCenterY', target: 'headTranslate', targetHandle: 'y' },
    { source: 'armGen', sourceHandle: 'geometry', target: 'armTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'armCenterY', target: 'armTranslate', targetHandle: 'y' },
    { source: 'legGen', sourceHandle: 'geometry', target: 'legTranslate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'legCenterY', target: 'legTranslate', targetHandle: 'y' },

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
