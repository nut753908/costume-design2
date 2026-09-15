import type { Node, Edge } from '@xyflow/react';

// initialNodes/initialEdges は GraphIO の Export/Import・ユーザープリセット(usePresetStore)と
// 同じ { nodes, edges } 形状。PresetPanel.tsx はこれを「初期状態(デフォルト)」という固定の
// 擬似プリセットとして扱い、通常のプリセットと同じ読み込み経路(loadGraph)でいつでも復帰できる
// ようにしている(詳細は src/state/CLAUDE.md の「初期状態への復帰」節)。
//
// ノードの position は nodes/autoLayout.ts の computeAutoLayout()(GraphIO.tsx の
// 「Arrange」ボタンが呼ぶのと同じ関数)を initialNodes/initialEdges 自身に適用して機械的に
// 算出し、静的な座標として埋め込んだもの — 初回ロード時から「Arrange」を1度押した後の状態に
// なっている。以前は(孤立ノードや要素数の少ない連結成分を分けて並べる・ノードの種類ごとの
// 実高さを見積もる・同じ1つの接続先のソケット行の並びに合わせて同順位内を並べ替える、と
// いった調整が無かった頃の)computeAutoLayout() では全ガーメントの入力ノードが1つの巨大な
// 層にまとまって大量に線が交差してしまうため使えず、ガーメントごとに手作業で列テンプレートに
// 沿って配置していたが、その後 computeAutoLayout() 側にこれらの調整が入り機械的な算出でも
// 十分読みやすくなったため、この形に改めた。
//
// ノード/エッジの構成(特にどのノードが何に接続されているか)を変更した場合、この座標は
// 古くなりうるため、変更と同じコミットで次のように再計算し直すこと:
//   1. アプリを起動し、初期状態のまま(もしくは変更後の構成で)トップレベルで「Arrange」を押す
//   2. 各ノードの新しい座標を Export JSON で取り出し、対応する position をここへ書き戻す
// 新しいガーメント種を追加する際は add-garment-type スキル・下記の慣例に従うこと。
export const initialNodes: Node[] = [
  // bodyHeight/bodyBuild/bodyShoulder は慣例的な id を持つシードノード。以前は全16グループ
  // (ガーメント15種+bodyGroup)へ3つとも無条件でファンアウトしていたが、`bodyDimensions`/
  // `bodyLayout`(下記)という2つの共有ノードへ集約したことで、この3つが直接配線される先は
  // `bodyDimensions` 1箇所だけになった(ガーメント自身の半径スケーリングに使う `bodyBuild`
  // だけは、下記の通り各ガーメントへも別途配線される)。
  { id: 'bodyHeight', type: 'numberInput', position: { x: 0, y: 0 }, data: { value: 1, min: 0.8, max: 1.25, step: 0.01, label: 'Body Height' } },
  { id: 'bodyBuild', type: 'numberInput', position: { x: 0, y: 1228 }, data: { value: 1, min: 0.8, max: 1.3, step: 0.01, label: 'Body Build' } },
  { id: 'bodyShoulder', type: 'numberInput', position: { x: 0, y: 151 }, data: { value: 1, min: 0.7, max: 1.4, step: 0.01, label: 'Body Shoulder' } },

  // ボディの寸法(9個)・配置Y座標(8個、うち5個は waist/shoulder/feet/wrist/head の
  // アンカー候補)を計算する2つの共有ノード。以前は bodyGroup(1個)と15個の
  // garmentPlacement インスタンスのそれぞれが独立してこれと同じ2つのグループをネストし、
  // 合計16回同じ計算を重複して行っていた(値は常に同じだが計算そのものが重複)。
  // `bodyBuild`/`topRadiusScale` と同じ「値が複数グループで共有される場合はトップレベルの
  // 共有ノードへ引き上げる」パターン(nodes/CLAUDE.md の「グループノード」節)に合わせ、
  // この2つの計算をトップレベルへ引き上げて1回だけ行い、各グループへ普通の外部ソケットとして
  // ファンアウトする形に改めた。この結果、`garmentPlacement.ts` からは `anchor`(enum)と
  // `anchorSelect` ノードが不要になった — 「どのアンカーを使うか」は実行時のドロップダウンで
  // はなく、`bodyLayout` のどの出力をそのガーメントの `anchorY` へ配線するかという、
  // グラフ上で見える配線そのものになった(下記 initialEdges 参照)。
  { id: 'bodyDimensions', type: 'bodyDimensionsGroup', position: { x: 340, y: 0 }, data: {} },
  { id: 'bodyLayout', type: 'bodyLayoutGroup', position: { x: 680, y: 134 }, data: {} },

  // Body(3Dモデル本体)。他15種のガーメントと同じグループノードで、胴体/頭/腕/脚を
  // 組み立てて描画する(nodes/definitions/bodyGroupNode.ts 参照)。bodyDimensions/bodyLayout
  // が計算済みの生の値(半径・長さ・Y座標)を外部ソケットとして直接受け取るだけで、
  // 自分ではスケール計算を一切行わない。
  { id: 'bodyGroup', type: 'bodyGroup', position: { x: 1020, y: 0 }, data: {} },

  // pantsLegSpacing は pants/shoes/socks の3グループに共有されるため、他のガーメント固有の
  // 生パラメータとは違いグループの内部には取り込まず、外部ノードのまま残している。
  { id: 'pantsLegSpacing', type: 'numberInput', position: { x: 680, y: 695 }, data: { value: 0.14, min: 0.05, max: 0.25, step: 0.005, label: 'Leg Spacing' } },

  // 全15種のガーメントは、各ガーメントの生パラメータ(numberInput/enumInput/colorInput)+
  // numberMultiply(体に触れる半径があれば)+ generator + toonMaterial + offsetY用の
  // numberInput + garmentPlacement という一連のパイプラインを1枚の <name>Group ノード
  // (nodes/definitions/groupNodeFactory.ts の defineGroupNode() で定義、nodes/definitions/
  // <name>GroupNode.ts)に集約している。生パラメータと Color は他のガーメントと共有されない
  // 単独パラメータのため、internalNodes に groupInput ノードと並べて直接書かれており
  // (グループの中に入って初めて編集できる)、このファイルには現れない — 詳細は
  // src/nodes/CLAUDE.md の「グループノード」節を参照。各 <name>GroupNode.ts の internalNodes
  // は `sceneOutput`(nodes/definitions/sceneOutput.ts)ノードも内包しており、実際に
  // シーンへ描画されるのはこの内部 `sceneOutput` への配線があるからである(このファイルには
  // その配線は現れない)。
  { id: 'skirtGroup', type: 'skirtGroup', position: { x: 1020, y: 781 }, data: {} },

  // topGroup/sleeveGroup が共有する Torso Radius(Body Build 適用後のスケール済みの値)と
  // Material — sleeve は Top と同じ生地・同じ太さで縫い付けられているように見せる必要がある
  // ため、この2つの値はどちらのグループの内部にも置かず、このファイル側の共有ノードとして
  // 両方へファンアウトしている。かつては topGroup の内部にこの2つを計算するノードを持ち、
  // groupOutput 経由で sleeve だけに再公開していたが、「本来共有すべき値が一方のグループの
  // 中に閉じ込められている」という設計上の問題があったため、bodyBuild/pantsLegSpacing と同じ
  // 「共有ノードをトップレベルに置いて複数グループへ配線する」形に改めた。
  { id: 'topRadius', type: 'numberInput', position: { x: 340, y: 712 }, data: { value: 0.29, min: 0.2, max: 0.4, step: 0.01, label: 'Torso Radius' } },
  { id: 'topColor', type: 'colorInput', position: { x: 340, y: 868 }, data: { hex: '#5b8fa8', label: 'Top Color' } },
  { id: 'topRadiusScale', type: 'numberMultiply', position: { x: 680, y: 846 }, data: {} },
  { id: 'topMaterial', type: 'toonMaterial', position: { x: 680, y: 1002 }, data: {} },
  { id: 'topGroup', type: 'topGroup', position: { x: 1360, y: 773 }, data: {} },
  { id: 'sleeveGroup', type: 'sleeveGroup', position: { x: 1360, y: 920 }, data: {} },

  { id: 'pantsGroup', type: 'pantsGroup', position: { x: 1020, y: 1525 }, data: {} },
  { id: 'shoesGroup', type: 'shoesGroup', position: { x: 1020, y: 1672 }, data: {} },
  { id: 'socksGroup', type: 'socksGroup', position: { x: 1020, y: 1819 }, data: {} },
  { id: 'glovesGroup', type: 'glovesGroup', position: { x: 1020, y: 905 }, data: {} },
  { id: 'beltGroup', type: 'beltGroup', position: { x: 1020, y: 1029 }, data: {} },
  { id: 'scarfGroup', type: 'scarfGroup', position: { x: 1020, y: 1153 }, data: {} },
  { id: 'jacketGroup', type: 'jacketGroup', position: { x: 1020, y: 1277 }, data: {} },
  { id: 'dressGroup', type: 'dressGroup', position: { x: 1020, y: 1401 }, data: {} },
  { id: 'hatGroup', type: 'hatGroup', position: { x: 1020, y: 377 }, data: {} },
  { id: 'bagGroup', type: 'bagGroup', position: { x: 1020, y: 579 }, data: {} },
  { id: 'necktieGroup', type: 'necktieGroup', position: { x: 1020, y: 680 }, data: {} },
  { id: 'glassesGroup', type: 'glassesGroup', position: { x: 1020, y: 478 }, data: {} },
];

export const initialEdges: Edge[] = [
  // bodyHeight/bodyBuild/bodyShoulder → bodyDimensions(共有の寸法計算ノード)。
  { id: 'e-body-dims-height', source: 'bodyHeight', sourceHandle: 'value', target: 'bodyDimensions', targetHandle: 'heightScale' },
  { id: 'e-body-dims-build', source: 'bodyBuild', sourceHandle: 'value', target: 'bodyDimensions', targetHandle: 'buildScale' },
  { id: 'e-body-dims-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'bodyDimensions', targetHandle: 'shoulderScale' },

  // bodyDimensions → bodyLayout(共有の配置Y座標計算ノード)。bodyLayoutGroup が入力に
  // 使う5個の寸法だけを配線する(nodes/definitions/bodyLayoutGroupNode.ts 参照)。
  { id: 'e-body-layout-leg-height', source: 'bodyDimensions', sourceHandle: 'legHeight', target: 'bodyLayout', targetHandle: 'legHeight' },
  { id: 'e-body-layout-torso-length', source: 'bodyDimensions', sourceHandle: 'torsoLength', target: 'bodyLayout', targetHandle: 'torsoLength' },
  { id: 'e-body-layout-torso-radius', source: 'bodyDimensions', sourceHandle: 'torsoRadius', target: 'bodyLayout', targetHandle: 'torsoRadius' },
  { id: 'e-body-layout-head-radius', source: 'bodyDimensions', sourceHandle: 'headRadius', target: 'bodyLayout', targetHandle: 'headRadius' },
  { id: 'e-body-layout-arm-length', source: 'bodyDimensions', sourceHandle: 'armLength', target: 'bodyLayout', targetHandle: 'armLength' },

  // bodyDimensions(9出力すべて)→ bodyGroup。bodyGroup 自身は寸法を計算せず、
  // 計算済みの値をそのままジェネレーターへ渡すだけ(bodyGroupNode.ts 参照)。
  { id: 'e-body-group-leg-height', source: 'bodyDimensions', sourceHandle: 'legHeight', target: 'bodyGroup', targetHandle: 'legHeight' },
  { id: 'e-body-group-leg-radius', source: 'bodyDimensions', sourceHandle: 'legRadius', target: 'bodyGroup', targetHandle: 'legRadius' },
  { id: 'e-body-group-leg-spacing', source: 'bodyDimensions', sourceHandle: 'legSpacing', target: 'bodyGroup', targetHandle: 'legSpacing' },
  { id: 'e-body-group-torso-length', source: 'bodyDimensions', sourceHandle: 'torsoLength', target: 'bodyGroup', targetHandle: 'torsoLength' },
  { id: 'e-body-group-torso-radius', source: 'bodyDimensions', sourceHandle: 'torsoRadius', target: 'bodyGroup', targetHandle: 'torsoRadius' },
  { id: 'e-body-group-head-radius', source: 'bodyDimensions', sourceHandle: 'headRadius', target: 'bodyGroup', targetHandle: 'headRadius' },
  { id: 'e-body-group-arm-length', source: 'bodyDimensions', sourceHandle: 'armLength', target: 'bodyGroup', targetHandle: 'armLength' },
  { id: 'e-body-group-arm-radius', source: 'bodyDimensions', sourceHandle: 'armRadius', target: 'bodyGroup', targetHandle: 'armRadius' },
  { id: 'e-body-group-shoulder-spacing', source: 'bodyDimensions', sourceHandle: 'shoulderSpacing', target: 'bodyGroup', targetHandle: 'shoulderSpacing' },

  // bodyLayout(bodyGroup 自身のメッシュ配置に使う4出力)→ bodyGroup。
  { id: 'e-body-group-leg-center-y', source: 'bodyLayout', sourceHandle: 'legCenterY', target: 'bodyGroup', targetHandle: 'legCenterY' },
  { id: 'e-body-group-torso-center-y', source: 'bodyLayout', sourceHandle: 'torsoCenterY', target: 'bodyGroup', targetHandle: 'torsoCenterY' },
  { id: 'e-body-group-head-center-y', source: 'bodyLayout', sourceHandle: 'headCenterY', target: 'bodyGroup', targetHandle: 'headCenterY' },
  { id: 'e-body-group-arm-center-y', source: 'bodyLayout', sourceHandle: 'armCenterY', target: 'bodyGroup', targetHandle: 'armCenterY' },

  // ガーメント自身の「体に触れる半径」を bodyBuild でスケールするグループ(9種)への配線。
  // アンカー座標の計算は下記の bodyLayout → anchorY の配線が別途担うため、ここでの bodyBuild
  // はあくまで各ガーメントの半径スケーリング専用。
  { id: 'e-waist-build', source: 'bodyBuild', sourceHandle: 'value', target: 'skirtGroup', targetHandle: 'bodyBuild' },
  { id: 'e-pants-waist-build', source: 'bodyBuild', sourceHandle: 'value', target: 'pantsGroup', targetHandle: 'bodyBuild' },
  { id: 'e-pants-leg-spacing', source: 'pantsLegSpacing', sourceHandle: 'value', target: 'pantsGroup', targetHandle: 'legSpacing' },
  { id: 'e-shoes-leg-spacing', source: 'pantsLegSpacing', sourceHandle: 'value', target: 'shoesGroup', targetHandle: 'legSpacing' },
  { id: 'e-shoes-sole-build', source: 'bodyBuild', sourceHandle: 'value', target: 'shoesGroup', targetHandle: 'bodyBuild' },
  { id: 'e-gloves-wrist-build', source: 'bodyBuild', sourceHandle: 'value', target: 'glovesGroup', targetHandle: 'bodyBuild' },
  { id: 'e-belt-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'beltGroup', targetHandle: 'bodyBuild' },
  { id: 'e-scarf-neck-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'scarfGroup', targetHandle: 'bodyBuild' },
  { id: 'e-jacket-shoulder-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'jacketGroup', targetHandle: 'bodyBuild' },
  { id: 'e-socks-leg-spacing', source: 'pantsLegSpacing', sourceHandle: 'value', target: 'socksGroup', targetHandle: 'legSpacing' },
  { id: 'e-socks-ankle-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'socksGroup', targetHandle: 'bodyBuild' },
  { id: 'e-dress-torso-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'dressGroup', targetHandle: 'bodyBuild' },
  { id: 'e-top-radius', source: 'topRadius', sourceHandle: 'value', target: 'topRadiusScale', targetHandle: 'value' },
  { id: 'e-top-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'topRadiusScale', targetHandle: 'factor' },
  { id: 'e-top-radius-scaled-topgroup', source: 'topRadiusScale', sourceHandle: 'value', target: 'topGroup', targetHandle: 'torsoRadius' },
  { id: 'e-top-radius-scaled-sleeve', source: 'topRadiusScale', sourceHandle: 'value', target: 'sleeveGroup', targetHandle: 'attachRadius' },
  { id: 'e-top-color', source: 'topColor', sourceHandle: 'color', target: 'topMaterial', targetHandle: 'color' },
  { id: 'e-top-material-topgroup', source: 'topMaterial', sourceHandle: 'material', target: 'topGroup', targetHandle: 'material' },
  { id: 'e-top-material-sleeve', source: 'topMaterial', sourceHandle: 'material', target: 'sleeveGroup', targetHandle: 'material' },

  // garmentPlacement(取り付け位置をジオメトリへ焼き込むノード、nodes/definitions/
  // garmentPlacement.ts 参照)の `anchorY` へ、bodyLayout が計算した5つのアンカー候補
  // (waistY/shoulderY/feetY/wristY/headCenterY)のうち、そのガーメントが実際に使う1つを
  // 配線する。以前はこれを各グループ内部の `anchorIn`(enumInput のドロップダウン)で実行時に
  // 選んでいたが、`bodyDimensions`/`bodyLayout` を共有ノードへ引き上げたことで
  // 「5候補のうちどれを配線するか」というグラフ上の配線そのもので表現できるようになったため、
  // `anchor`(enum)と `anchorSelect` ノードは廃止した(nodes/CLAUDE.md の「グループノード」節、
  // garmentPlacement.ts のコメント参照)。
  { id: 'e-anchor-skirt', source: 'bodyLayout', sourceHandle: 'waistY', target: 'skirtGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-pants', source: 'bodyLayout', sourceHandle: 'waistY', target: 'pantsGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-belt', source: 'bodyLayout', sourceHandle: 'waistY', target: 'beltGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-dress', source: 'bodyLayout', sourceHandle: 'shoulderY', target: 'dressGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-necktie', source: 'bodyLayout', sourceHandle: 'shoulderY', target: 'necktieGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-bag', source: 'bodyLayout', sourceHandle: 'shoulderY', target: 'bagGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-jacket', source: 'bodyLayout', sourceHandle: 'shoulderY', target: 'jacketGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-sleeve', source: 'bodyLayout', sourceHandle: 'shoulderY', target: 'sleeveGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-top', source: 'bodyLayout', sourceHandle: 'shoulderY', target: 'topGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-scarf', source: 'bodyLayout', sourceHandle: 'shoulderY', target: 'scarfGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-socks', source: 'bodyLayout', sourceHandle: 'feetY', target: 'socksGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-shoes', source: 'bodyLayout', sourceHandle: 'feetY', target: 'shoesGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-gloves', source: 'bodyLayout', sourceHandle: 'wristY', target: 'glovesGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-hat', source: 'bodyLayout', sourceHandle: 'headCenterY', target: 'hatGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-glasses', source: 'bodyLayout', sourceHandle: 'headCenterY', target: 'glassesGroup', targetHandle: 'anchorY' },
];
