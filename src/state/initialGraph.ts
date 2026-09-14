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
  // bodyHeight/bodyBuild/bodyShoulder は慣例的な id を持つシードノード。全15ガーメント
  // グループへの通常のソケット配線(アンカー計算・半径スケーリング用、下記 initialEdges 参照)
  // に加えて、下記の bodyGroup ノードへも配線されている — Body 自身の形状組み立ても他の
  // ガーメントと同じ `<name>Group` パターン(nodes/definitions/bodyGroupNode.ts)で表現されて
  // いるため、他のガーメントと全く同じ「シードノード→グループの groupInput」という配線になる。
  // 肌色(Skin Color)は bodyGroup 以外のどのグループとも共有されない単独パラメータのため、
  // 他ガーメントの生パラメータ・Color と同じくシードノードにはせず bodyGroup 内部の
  // colorInput ノードとして保持している(bodyGroupNode.ts 参照、このファイルには現れない)。
  { id: 'bodyHeight', type: 'numberInput', position: { x: 0, y: 534 }, data: { value: 1, min: 0.8, max: 1.25, step: 0.01, label: 'Body Height' } },
  { id: 'bodyBuild', type: 'numberInput', position: { x: 0, y: 383 }, data: { value: 1, min: 0.8, max: 1.3, step: 0.01, label: 'Body Build' } },
  { id: 'bodyShoulder', type: 'numberInput', position: { x: 0, y: 685 }, data: { value: 1, min: 0.7, max: 1.4, step: 0.01, label: 'Body Shoulder' } },

  // Body(3Dモデル本体)。他15種のガーメントと同じグループノードで、胴体/頭/腕/脚を
  // 組み立てて描画する(nodes/definitions/bodyGroupNode.ts 参照)。
  { id: 'bodyGroup', type: 'bodyGroup', position: { x: 340, y: 266 }, data: {} },

  // pantsLegSpacing は pants/shoes/socks の3グループに共有されるため、他のガーメント固有の
  // 生パラメータとは違いグループの内部には取り込まず、外部ノードのまま残している。
  { id: 'pantsLegSpacing', type: 'numberInput', position: { x: 0, y: 836 }, data: { value: 0.14, min: 0.05, max: 0.25, step: 0.005, label: 'Leg Spacing' } },

  // 全15種のガーメントは、各ガーメントの生パラメータ(numberInput/enumInput/colorInput)+
  // numberMultiply(体に触れる半径があれば)+ generator + toonMaterial + anchor/offsetY用の
  // numberInput/enumInput + garmentPlacement という一連のパイプラインを1枚の <name>Group ノード
  // (nodes/definitions/groupNodeFactory.ts の defineGroupNode() で定義、nodes/definitions/
  // <name>GroupNode.ts)に集約している。生パラメータと Color は他のガーメントと共有されない
  // 単独パラメータのため、internalNodes に groupInput ノードと並べて直接書かれており
  // (グループの中に入って初めて編集できる)、このファイルには現れない — 詳細は
  // src/nodes/CLAUDE.md の「グループノード」節を参照。各 <name>GroupNode.ts の internalNodes
  // は `sceneOutput`(nodes/definitions/sceneOutput.ts)ノードも内包しており、実際に
  // シーンへ描画されるのはこの内部 `sceneOutput` への配線があるからである(このファイルには
  // その配線は現れない)。
  { id: 'skirtGroup', type: 'skirtGroup', position: { x: 340, y: 413 }, data: {} },

  // topGroup/sleeveGroup が共有する Torso Radius(Body Build 適用後のスケール済みの値)と
  // Material — sleeve は Top と同じ生地・同じ太さで縫い付けられているように見せる必要がある
  // ため、この2つの値はどちらのグループの内部にも置かず、このファイル側の共有ノードとして
  // 両方へファンアウトしている。かつては topGroup の内部にこの2つを計算するノードを持ち、
  // groupOutput 経由で sleeve だけに再公開していたが、「本来共有すべき値が一方のグループの
  // 中に閉じ込められている」という設計上の問題があったため、bodyBuild/pantsLegSpacing と同じ
  // 「共有ノードをトップレベルに置いて複数グループへ配線する」形に改めた。
  { id: 'topRadius', type: 'numberInput', position: { x: 0, y: 0 }, data: { value: 0.29, min: 0.2, max: 0.4, step: 0.01, label: 'Torso Radius' } },
  { id: 'topColor', type: 'colorInput', position: { x: 0, y: 156 }, data: { hex: '#5b8fa8', label: 'Top Color' } },
  { id: 'topRadiusScale', type: 'numberMultiply', position: { x: 340, y: 0 }, data: {} },
  { id: 'topMaterial', type: 'toonMaterial', position: { x: 340, y: 156 }, data: {} },
  { id: 'topGroup', type: 'topGroup', position: { x: 1020, y: 287 }, data: {} },
  { id: 'sleeveGroup', type: 'sleeveGroup', position: { x: 1020, y: 480 }, data: {} },

  { id: 'pantsGroup', type: 'pantsGroup', position: { x: 340, y: 1883 }, data: {} },
  { id: 'shoesGroup', type: 'shoesGroup', position: { x: 680, y: 525 }, data: {} },
  { id: 'socksGroup', type: 'socksGroup', position: { x: 680, y: 695 }, data: {} },
  { id: 'glovesGroup', type: 'glovesGroup', position: { x: 340, y: 560 }, data: {} },
  { id: 'beltGroup', type: 'beltGroup', position: { x: 340, y: 707 }, data: {} },
  { id: 'scarfGroup', type: 'scarfGroup', position: { x: 340, y: 854 }, data: {} },
  { id: 'jacketGroup', type: 'jacketGroup', position: { x: 340, y: 1001 }, data: {} },
  { id: 'dressGroup', type: 'dressGroup', position: { x: 340, y: 1148 }, data: {} },
  { id: 'hatGroup', type: 'hatGroup', position: { x: 340, y: 1295 }, data: {} },
  { id: 'bagGroup', type: 'bagGroup', position: { x: 340, y: 1442 }, data: {} },
  { id: 'necktieGroup', type: 'necktieGroup', position: { x: 340, y: 1589 }, data: {} },
  { id: 'glassesGroup', type: 'glassesGroup', position: { x: 340, y: 1736 }, data: {} },
];

export const initialEdges: Edge[] = [
  // bodyHeight/bodyBuild/bodyShoulder から bodyGroup の groupInput へ。他15種のガーメント
  // グループが bodyBuild 等を受け取るのと同じ、通常の外部ソケット配線。
  { id: 'e-body-height', source: 'bodyHeight', sourceHandle: 'value', target: 'bodyGroup', targetHandle: 'bodyHeight' },
  { id: 'e-body-build', source: 'bodyBuild', sourceHandle: 'value', target: 'bodyGroup', targetHandle: 'bodyBuild' },
  { id: 'e-body-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'bodyGroup', targetHandle: 'bodyShoulder' },

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
  // garmentPlacement.ts 参照)がボディのアンカー座標を正しく計算できるよう、bodyHeight/
  // bodyBuild/bodyShoulder を全15グループへ配線する。ガーメント自身の半径スケーリングに
  // bodyBuild を使わないガーメント(hat/bag/necktie/glasses/top/sleeve)であっても、
  // アンカー座標の計算にはボディ全体の寸法が必要なため、この3つは例外なく全グループへ配線する。
  { id: 'e-skirt-height', source: 'bodyHeight', sourceHandle: 'value', target: 'skirtGroup', targetHandle: 'bodyHeight' },
  { id: 'e-skirt-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'skirtGroup', targetHandle: 'bodyShoulder' },
  { id: 'e-pants-height', source: 'bodyHeight', sourceHandle: 'value', target: 'pantsGroup', targetHandle: 'bodyHeight' },
  { id: 'e-pants-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'pantsGroup', targetHandle: 'bodyShoulder' },
  { id: 'e-shoes-height', source: 'bodyHeight', sourceHandle: 'value', target: 'shoesGroup', targetHandle: 'bodyHeight' },
  { id: 'e-shoes-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'shoesGroup', targetHandle: 'bodyShoulder' },
  { id: 'e-gloves-height', source: 'bodyHeight', sourceHandle: 'value', target: 'glovesGroup', targetHandle: 'bodyHeight' },
  { id: 'e-gloves-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'glovesGroup', targetHandle: 'bodyShoulder' },
  { id: 'e-belt-height', source: 'bodyHeight', sourceHandle: 'value', target: 'beltGroup', targetHandle: 'bodyHeight' },
  { id: 'e-belt-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'beltGroup', targetHandle: 'bodyShoulder' },
  { id: 'e-scarf-height', source: 'bodyHeight', sourceHandle: 'value', target: 'scarfGroup', targetHandle: 'bodyHeight' },
  { id: 'e-scarf-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'scarfGroup', targetHandle: 'bodyShoulder' },
  { id: 'e-jacket-height', source: 'bodyHeight', sourceHandle: 'value', target: 'jacketGroup', targetHandle: 'bodyHeight' },
  { id: 'e-jacket-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'jacketGroup', targetHandle: 'bodyShoulder' },
  { id: 'e-socks-height', source: 'bodyHeight', sourceHandle: 'value', target: 'socksGroup', targetHandle: 'bodyHeight' },
  { id: 'e-socks-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'socksGroup', targetHandle: 'bodyShoulder' },
  { id: 'e-dress-height', source: 'bodyHeight', sourceHandle: 'value', target: 'dressGroup', targetHandle: 'bodyHeight' },
  { id: 'e-dress-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'dressGroup', targetHandle: 'bodyShoulder' },
  { id: 'e-top-height', source: 'bodyHeight', sourceHandle: 'value', target: 'topGroup', targetHandle: 'bodyHeight' },
  { id: 'e-top-build', source: 'bodyBuild', sourceHandle: 'value', target: 'topGroup', targetHandle: 'bodyBuild' },
  { id: 'e-top-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'topGroup', targetHandle: 'bodyShoulder' },
  { id: 'e-sleeve-height', source: 'bodyHeight', sourceHandle: 'value', target: 'sleeveGroup', targetHandle: 'bodyHeight' },
  { id: 'e-sleeve-build', source: 'bodyBuild', sourceHandle: 'value', target: 'sleeveGroup', targetHandle: 'bodyBuild' },
  { id: 'e-sleeve-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'sleeveGroup', targetHandle: 'bodyShoulder' },
  { id: 'e-hat-height', source: 'bodyHeight', sourceHandle: 'value', target: 'hatGroup', targetHandle: 'bodyHeight' },
  { id: 'e-hat-build', source: 'bodyBuild', sourceHandle: 'value', target: 'hatGroup', targetHandle: 'bodyBuild' },
  { id: 'e-hat-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'hatGroup', targetHandle: 'bodyShoulder' },
  { id: 'e-bag-height', source: 'bodyHeight', sourceHandle: 'value', target: 'bagGroup', targetHandle: 'bodyHeight' },
  { id: 'e-bag-build', source: 'bodyBuild', sourceHandle: 'value', target: 'bagGroup', targetHandle: 'bodyBuild' },
  { id: 'e-bag-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'bagGroup', targetHandle: 'bodyShoulder' },
  { id: 'e-necktie-height', source: 'bodyHeight', sourceHandle: 'value', target: 'necktieGroup', targetHandle: 'bodyHeight' },
  { id: 'e-necktie-build', source: 'bodyBuild', sourceHandle: 'value', target: 'necktieGroup', targetHandle: 'bodyBuild' },
  { id: 'e-necktie-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'necktieGroup', targetHandle: 'bodyShoulder' },
  { id: 'e-glasses-height', source: 'bodyHeight', sourceHandle: 'value', target: 'glassesGroup', targetHandle: 'bodyHeight' },
  { id: 'e-glasses-build', source: 'bodyBuild', sourceHandle: 'value', target: 'glassesGroup', targetHandle: 'bodyBuild' },
  { id: 'e-glasses-shoulder', source: 'bodyShoulder', sourceHandle: 'value', target: 'glassesGroup', targetHandle: 'bodyShoulder' },
];
