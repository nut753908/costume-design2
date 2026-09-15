import { defineGroupNode } from './groupNodeFactory';

/** Body(3Dモデル本体)を、他15種のガーメントと同じ「`<name>Group` ノード」パターンで
 * 表現する。以前は `scene/Body.tsx` が `computeBodyDimensions`/`computeBodyLayout` の結果を
 * 使って `<mesh>` を直接組み立てる専用コンポーネントだったが、その組み立て(どの形状を・
 * どのサイズで・どこに置き・何色にするか)をこの `bodyGroup` の埋め込みサブグラフへ移し、
 * `scene/Body.tsx` 自体を削除した。`Garments.tsx` はノードの型を問わず内部の `sceneOutput`
 * (下記参照)だけを見て描画するため、`bodyGroup` もガーメントと全く同じ経路でシーンへ
 * 描画される(`Body` 専用の特別扱いは無くなった、ルート CLAUDE.md 参照)。
 *
 * 各部位の半径・長さ・Y座標を求める計算は、`bodyDimensionsGroup`(`bodyDimensionsGroupNode.ts`)
 * /`bodyLayoutGroup`(`bodyLayoutGroupNode.ts`)という2つのネストしたグループノードへ委譲する
 * (`groupNodeFactory.ts` は多段ネストに対応済み)。以前はこの計算を `bodyDimensions`/
 * `bodyLayout` という、`geometry/body.ts` の `computeBodyDimensions()`/`computeBodyLayout()`
 * をそのまま配線するだけのブラックボックスノード(9個/4個の出力)にまとめていたが、
 * ノードエディタを見ただけでは何を計算しているノードか分からないという問題があったため
 * 廃止し、`numberInput`(基準値)→ `numberMultiply`/`numberAdd`/`numberSubtract` の四則演算
 * チェーンへ展開し直した(ガーメントの『体に触れる半径』と同じ粒度)。ただしその展開結果を
 * `bodyGroup` 直下にそのまま平積みすると `bodyGroup` 自体が数十ノードの塊になって見通しが
 * 悪くなるため、`bodyDimensionsGroup`/`bodyLayoutGroup` という意味のあるまとまりへ
 * 再度グループ化した — ダブルクリックで中に入れば実際の四則演算グラフがそのまま見える
 * (詳細・実際の式は両ファイルのコメント参照)。
 *
 * `nodes/definitions/garmentPlacement.ts` も15ガーメント共通のアンカー座標計算のために
 * `bodyDimensionsGroup`/`bodyLayoutGroup` の両方をネストして再利用している(`bodyGroup`
 * 自身のメッシュ生成とは独立した、別のインスタンス)。以前は `garmentPlacement.ts` だけが
 * `geometry/body.ts` の `computeBodyDimensions()`/`computeBodyLayout()`/`computeBodyAnchors()`
 * を直接呼び続けていたが、`garmentPlacement.ts` 自身もこのグループを再利用する形へ置き換わり、
 * `geometry/body.ts` を呼ぶ本番コードが無くなったためファイルごと削除した(詳細は
 * `garmentPlacement.ts` のコメント参照)。
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
    { id: 'dimsGroup', type: 'bodyDimensionsGroup', data: {} },
    { id: 'layoutGroup', type: 'bodyLayoutGroup', data: {} },
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
    { source: 'input', sourceHandle: 'bodyHeight', target: 'dimsGroup', targetHandle: 'heightScale' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'dimsGroup', targetHandle: 'buildScale' },
    { source: 'input', sourceHandle: 'bodyShoulder', target: 'dimsGroup', targetHandle: 'shoulderScale' },

    { source: 'dimsGroup', sourceHandle: 'torsoRadius', target: 'torsoGen', targetHandle: 'radius' },
    { source: 'dimsGroup', sourceHandle: 'torsoLength', target: 'torsoGen', targetHandle: 'length' },
    { source: 'dimsGroup', sourceHandle: 'headRadius', target: 'headGen', targetHandle: 'radius' },
    { source: 'dimsGroup', sourceHandle: 'armRadius', target: 'armGen', targetHandle: 'radius' },
    { source: 'dimsGroup', sourceHandle: 'armLength', target: 'armGen', targetHandle: 'length' },
    { source: 'dimsGroup', sourceHandle: 'shoulderSpacing', target: 'armGen', targetHandle: 'spacing' },
    { source: 'dimsGroup', sourceHandle: 'legRadius', target: 'legGen', targetHandle: 'radius' },
    { source: 'dimsGroup', sourceHandle: 'legHeight', target: 'legGen', targetHandle: 'length' },
    { source: 'dimsGroup', sourceHandle: 'legSpacing', target: 'legGen', targetHandle: 'spacing' },

    { source: 'dimsGroup', sourceHandle: 'legHeight', target: 'layoutGroup', targetHandle: 'legHeight' },
    { source: 'dimsGroup', sourceHandle: 'torsoLength', target: 'layoutGroup', targetHandle: 'torsoLength' },
    { source: 'dimsGroup', sourceHandle: 'torsoRadius', target: 'layoutGroup', targetHandle: 'torsoRadius' },
    { source: 'dimsGroup', sourceHandle: 'headRadius', target: 'layoutGroup', targetHandle: 'headRadius' },
    { source: 'dimsGroup', sourceHandle: 'armLength', target: 'layoutGroup', targetHandle: 'armLength' },

    { source: 'torsoGen', sourceHandle: 'geometry', target: 'torsoTranslate', targetHandle: 'geometry' },
    { source: 'layoutGroup', sourceHandle: 'torsoCenterY', target: 'torsoTranslate', targetHandle: 'y' },
    { source: 'headGen', sourceHandle: 'geometry', target: 'headTranslate', targetHandle: 'geometry' },
    { source: 'layoutGroup', sourceHandle: 'headCenterY', target: 'headTranslate', targetHandle: 'y' },
    { source: 'armGen', sourceHandle: 'geometry', target: 'armTranslate', targetHandle: 'geometry' },
    { source: 'layoutGroup', sourceHandle: 'armCenterY', target: 'armTranslate', targetHandle: 'y' },
    { source: 'legGen', sourceHandle: 'geometry', target: 'legTranslate', targetHandle: 'geometry' },
    { source: 'layoutGroup', sourceHandle: 'legCenterY', target: 'legTranslate', targetHandle: 'y' },

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
