import type { Node, Edge } from '@xyflow/react';

// initialNodes/initialEdges は GraphIO の Export/Import・ユーザープリセット(usePresetStore)と
// 同じ { nodes, edges } 形状。PresetPanel.tsx はこれを「初期状態(デフォルト)」という固定の
// 擬似プリセットとして扱い、通常のプリセットと同じ読み込み経路(loadGraph)でいつでも復帰できる
// ようにしている(詳細は src/state/CLAUDE.md の「初期状態への復帰」節)。
//
// ノードの position はガーメントごとに手作業で「読みやすいエッジになる」列テンプレートに
// 沿って配置している(nodes/autoLayout.ts の computeAutoLayout() を機械的に適用すると、
// 全ガーメントの入力ノードが1つの巨大な層にまとまり、バリセンター順の並び替えだけでは
// エッジがノード上を大量に横切ってしまうため、これは使っていない)。x=0 列には
// bodyHeight/bodyBuild/bodyShoulder/bodySkinColor のシードノード、topRadius/topColor、
// pantsLegSpacing が並ぶ(ガーメント固有の生パラメータは各 <name>GroupNode.ts の内部へ移した
// ため、このファイルにはもう存在しない)。x=200 列には topRadiusScale/topMaterial が
// topRadius/topColor と同じ y に並ぶ。x=400 列に14個のグループノードが200pxおきに並ぶ
// (この各グループの外部ソケットは0〜2個程度まで減っているため、旧レイアウト(生パラメータが
// まだこの列の外側に並んでいた頃の縦幅)よりずっと詰めた間隔にできる)。sleeveGroup だけは
// x=650 で topGroup と同じ y に置き、隣接させている。列の間隔(x方向200、y方向は基本110/
// 200)は、ノードカードが `.react-flow__viewport` の zoom(初期表示は fitView によりおよそ
// 0.48)を考慮しても隣接カードと重ならないよう、実際に描画したノードの
// `getBoundingClientRect()` を計測して逆算した値 — カード自体の座標系での実サイズは
// 画面上のピクセルサイズを zoom で割った値になる点に注意(単純に「離れているように見える
// pxの間隔」を position の数値としてそのまま使うと、zoom<1 の分だけ間隔が狭くなりすぎて
// 重なる)。
// 新しいガーメント種を追加する際は add-garment-type スキル・下記の慣例に従うこと。
export const initialNodes: Node[] = [
  // bodyHeight/bodyBuild/bodyShoulder/bodySkinColor は state/useBodyScale.ts・
  // state/useBodySkinColor.ts が id で直接読み取る慣例的なシードノード。エッジでは
  // 何にも配線しない(ルート CLAUDE.md の「ボディスケールはソケットグラフを迂回して
  // 直接読み取られる」を参照)。
  { id: 'bodyHeight', type: 'numberInput', position: { x: 0, y: 0 }, data: { value: 1, min: 0.8, max: 1.25, step: 0.01, label: 'Body Height' } },
  { id: 'bodyBuild', type: 'numberInput', position: { x: 0, y: 110 }, data: { value: 1, min: 0.8, max: 1.3, step: 0.01, label: 'Body Build' } },
  { id: 'bodyShoulder', type: 'numberInput', position: { x: 0, y: 220 }, data: { value: 1, min: 0.7, max: 1.4, step: 0.01, label: 'Body Shoulder' } },
  { id: 'bodySkinColor', type: 'colorInput', position: { x: 0, y: 330 }, data: { hex: '#f2c9a0', label: 'Body Skin Color' } },

  // pantsLegSpacing は pants/shoes/socks の3グループに共有されるため、他のガーメント固有の
  // 生パラメータとは違いグループの内部には取り込まず、外部ノードのまま残している。
  { id: 'pantsLegSpacing', type: 'numberInput', position: { x: 0, y: 720 }, data: { value: 0.14, min: 0.05, max: 0.25, step: 0.005, label: 'Leg Spacing' } },

  // 全15種のガーメントは、各ガーメントの生パラメータ(numberInput/enumInput/colorInput)+
  // numberMultiply(体に触れる半径があれば)+ generator + toonMaterial + garmentOutput という
  // 一連のパイプラインを1枚の <name>Group ノード(nodes/definitions/groupNodeFactory.ts の
  // defineGroupNode() で定義、nodes/definitions/<name>GroupNode.ts)に集約している。生パラメータと
  // Color は他のガーメントと共有されない単独パラメータのため、internalNodes に groupInput ノードと
  // 並べて直接書かれており(グループの中に入って初めて編集できる)、このファイルには現れない —
  // 詳細は src/nodes/CLAUDE.md の「グループノード」節を参照。
  { id: 'skirtGroup', type: 'skirtGroup', position: { x: 400, y: 0 }, data: {} },

  // topGroup/sleeveGroup が共有する Torso Radius(Body Build 適用後のスケール済みの値)と
  // Material — sleeve は Top と同じ生地・同じ太さで縫い付けられているように見せる必要がある
  // ため、この2つの値はどちらのグループの内部にも置かず、このファイル側の共有ノードとして
  // 両方へファンアウトしている。かつては topGroup の内部にこの2つを計算するノードを持ち、
  // groupOutput 経由で sleeve だけに再公開していたが、「本来共有すべき値が一方のグループの
  // 中に閉じ込められている」という設計上の問題があったため、bodyBuild/pantsLegSpacing と同じ
  // 「共有ノードをトップレベルに置いて複数グループへ配線する」形に改めた。
  { id: 'topRadius', type: 'numberInput', position: { x: 0, y: 440 }, data: { value: 0.29, min: 0.2, max: 0.4, step: 0.01, label: 'Torso Radius' } },
  { id: 'topColor', type: 'colorInput', position: { x: 0, y: 610 }, data: { hex: '#5b8fa8', label: 'Top Color' } },
  { id: 'topRadiusScale', type: 'numberMultiply', position: { x: 200, y: 440 }, data: {} },
  { id: 'topMaterial', type: 'toonMaterial', position: { x: 200, y: 610 }, data: {} },
  { id: 'topGroup', type: 'topGroup', position: { x: 400, y: 200 }, data: {} },
  { id: 'sleeveGroup', type: 'sleeveGroup', position: { x: 650, y: 200 }, data: {} },

  { id: 'pantsGroup', type: 'pantsGroup', position: { x: 400, y: 400 }, data: {} },
  { id: 'shoesGroup', type: 'shoesGroup', position: { x: 400, y: 600 }, data: {} },
  { id: 'socksGroup', type: 'socksGroup', position: { x: 400, y: 800 }, data: {} },
  { id: 'glovesGroup', type: 'glovesGroup', position: { x: 400, y: 1000 }, data: {} },
  { id: 'beltGroup', type: 'beltGroup', position: { x: 400, y: 1200 }, data: {} },
  { id: 'scarfGroup', type: 'scarfGroup', position: { x: 400, y: 1400 }, data: {} },
  { id: 'jacketGroup', type: 'jacketGroup', position: { x: 400, y: 1600 }, data: {} },
  { id: 'dressGroup', type: 'dressGroup', position: { x: 400, y: 1800 }, data: {} },
  { id: 'hatGroup', type: 'hatGroup', position: { x: 400, y: 2000 }, data: {} },
  { id: 'bagGroup', type: 'bagGroup', position: { x: 400, y: 2200 }, data: {} },
  { id: 'necktieGroup', type: 'necktieGroup', position: { x: 400, y: 2400 }, data: {} },
  { id: 'glassesGroup', type: 'glassesGroup', position: { x: 400, y: 2600 }, data: {} },
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
