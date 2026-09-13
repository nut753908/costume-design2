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
  // bodyHeight/bodyBuild/bodyShoulder/bodySkinColor は state/useBodyScale.ts・
  // state/useBodySkinColor.ts が id で直接読み取る慣例的なシードノード。エッジでは
  // 何にも配線しない(ルート CLAUDE.md の「ボディスケールはソケットグラフを迂回して
  // 直接読み取られる」を参照)。
  { id: 'bodyHeight', type: 'numberInput', position: { x: 0, y: 2070 }, data: { value: 1, min: 0.8, max: 1.25, step: 0.01, label: 'Body Height' } },
  { id: 'bodyBuild', type: 'numberInput', position: { x: 0, y: 1103 }, data: { value: 1, min: 0.8, max: 1.3, step: 0.01, label: 'Body Build' } },
  { id: 'bodyShoulder', type: 'numberInput', position: { x: 0, y: 2178 }, data: { value: 1, min: 0.7, max: 1.4, step: 0.01, label: 'Body Shoulder' } },
  { id: 'bodySkinColor', type: 'colorInput', position: { x: 0, y: 2286 }, data: { hex: '#f2c9a0', label: 'Body Skin Color' } },

  // pantsLegSpacing は pants/shoes/socks の3グループに共有されるため、他のガーメント固有の
  // 生パラメータとは違いグループの内部には取り込まず、外部ノードのまま残している。
  { id: 'pantsLegSpacing', type: 'numberInput', position: { x: 0, y: 1962 }, data: { value: 0.14, min: 0.05, max: 0.25, step: 0.005, label: 'Leg Spacing' } },

  // 全15種のガーメントは、各ガーメントの生パラメータ(numberInput/enumInput/colorInput)+
  // numberMultiply(体に触れる半径があれば)+ generator + toonMaterial + garmentMesh +
  // garmentAnchor という一連のパイプラインを1枚の <name>Group ノード(nodes/definitions/
  // groupNodeFactory.ts の defineGroupNode() で定義、nodes/definitions/<name>GroupNode.ts)に
  // 集約している。生パラメータと
  // Color は他のガーメントと共有されない単独パラメータのため、internalNodes に groupInput ノードと
  // 並べて直接書かれており(グループの中に入って初めて編集できる)、このファイルには現れない —
  // 詳細は src/nodes/CLAUDE.md の「グループノード」節を参照。
  { id: 'skirtGroup', type: 'skirtGroup', position: { x: 340, y: 288 }, data: {} },

  // topGroup/sleeveGroup が共有する Torso Radius(Body Build 適用後のスケール済みの値)と
  // Material — sleeve は Top と同じ生地・同じ太さで縫い付けられているように見せる必要がある
  // ため、この2つの値はどちらのグループの内部にも置かず、このファイル側の共有ノードとして
  // 両方へファンアウトしている。かつては topGroup の内部にこの2つを計算するノードを持ち、
  // groupOutput 経由で sleeve だけに再公開していたが、「本来共有すべき値が一方のグループの
  // 中に閉じ込められている」という設計上の問題があったため、bodyBuild/pantsLegSpacing と同じ
  // 「共有ノードをトップレベルに置いて複数グループへ配線する」形に改めた。
  { id: 'topRadius', type: 'numberInput', position: { x: 0, y: 110 }, data: { value: 0.29, min: 0.2, max: 0.4, step: 0.01, label: 'Torso Radius' } },
  { id: 'topColor', type: 'colorInput', position: { x: 0, y: 0 }, data: { hex: '#5b8fa8', label: 'Top Color' } },
  { id: 'topRadiusScale', type: 'numberMultiply', position: { x: 340, y: 132 }, data: {} },
  { id: 'topMaterial', type: 'toonMaterial', position: { x: 340, y: 0 }, data: {} },
  { id: 'topGroup', type: 'topGroup', position: { x: 680, y: 0 }, data: {} },
  { id: 'sleeveGroup', type: 'sleeveGroup', position: { x: 680, y: 262 }, data: {} },

  { id: 'pantsGroup', type: 'pantsGroup', position: { x: 340, y: 1722 }, data: {} },
  { id: 'shoesGroup', type: 'shoesGroup', position: { x: 340, y: 1984 }, data: {} },
  { id: 'socksGroup', type: 'socksGroup', position: { x: 340, y: 2246 }, data: {} },
  { id: 'glovesGroup', type: 'glovesGroup', position: { x: 340, y: 527 }, data: {} },
  { id: 'beltGroup', type: 'beltGroup', position: { x: 340, y: 766 }, data: {} },
  { id: 'scarfGroup', type: 'scarfGroup', position: { x: 340, y: 1005 }, data: {} },
  { id: 'jacketGroup', type: 'jacketGroup', position: { x: 340, y: 1244 }, data: {} },
  { id: 'dressGroup', type: 'dressGroup', position: { x: 340, y: 1483 }, data: {} },
  { id: 'hatGroup', type: 'hatGroup', position: { x: 0, y: 2376 }, data: {} },
  { id: 'bagGroup', type: 'bagGroup', position: { x: 0, y: 2592 }, data: {} },
  { id: 'necktieGroup', type: 'necktieGroup', position: { x: 0, y: 2808 }, data: {} },
  { id: 'glassesGroup', type: 'glassesGroup', position: { x: 0, y: 3024 }, data: {} },
];

export const initialEdges: Edge[] = [
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
];
