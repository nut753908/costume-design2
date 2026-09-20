import type { Node, Edge } from '@xyflow/react';
import '../nodes/definitions';
import { computeAutoLayout } from '../nodes/autoLayout';

// initialNodes/initialEdges は GraphIO の Export/Import・ユーザープリセット(usePresetStore)と
// 同じ { nodes, edges } 形状。PresetPanel.tsx はこれを「初期状態(デフォルト)」という固定の
// 擬似プリセットとして扱い、通常のプリセットと同じ読み込み経路(loadGraph)でいつでも復帰できる
// ようにしている(詳細は src/state/CLAUDE.md の「初期状態への復帰」節)。
//
// ノードの position は、下記のノード定義自体には持たせず、モジュール読み込み時に
// nodes/autoLayout.ts の computeAutoLayout()(GraphIO.tsx の「Arrange」ボタンが呼ぶのと同じ
// 関数)を適用して算出する — 初回ロード時から「Arrange」を1度押した後の状態になり、ノード/
// エッジの構成を変えても座標を手で更新する必要は無い。computeAutoLayout() はノードタイプの
// 登録内容(カードの高さの見積もり)に依存するため、ここで definitions を読み込んでから
// 計算する。新しいガーメント種を追加する際は add-garment-type スキル・下記の慣例に従うこと。
const initialNodeDefs: Omit<Node, 'position'>[] = [
  // bodyBuild は慣例的な id を持つシードノード。`bodyDimensions`(下記)への配線に加え、
  // ガーメント自身の半径スケーリング用に各ガーメントへも直接配線される(下記参照)。
  // Height/Shoulder は `bodyDimensions` からしか参照されない単独パラメータのため、
  // `bodyDimensionsGroup` 内部の `numberInput`(`heightScaleIn`/`shoulderScaleIn`)として
  // 持ち、この階層には現れない(nodes/CLAUDE.md の「グループノード」節参照)。
  { id: 'bodyBuild', type: 'numberInput', data: { value: 1} },

  // ボディの寸法(9個)・配置Y座標(8個、うち5個は waist/shoulder/feet/wrist/head の
  // アンカー候補)を計算する2つの共有ノード。bodyGroup と全14ガーメントへ普通の外部
  // ソケットとしてファンアウトする(nodes/CLAUDE.md の「グループノード」節参照)。
  { id: 'bodyDimensions', type: 'bodyDimensionsGroup', data: {} },
  { id: 'bodyLayout', type: 'bodyLayoutGroup', data: {} },

  // Body(3Dモデル本体)。他14種のガーメントと同じグループノードで、胴体/頭/腕/脚を
  // 組み立てて描画する(nodes/definitions/groups/bodyGroupNode.ts 参照)。bodyDimensions/bodyLayout
  // が計算済みの生の値(半径・長さ・Y座標)を外部ソケットとして直接受け取るだけで、
  // 自分ではスケール計算を一切行わない。
  { id: 'bodyGroup', type: 'bodyGroup', data: {} },

  // 全14種のガーメントは、各ガーメントの生パラメータ(numberInput/enumInput/colorInput)+
  // numberMultiply(体に触れる半径があれば)+ generator + toonMaterial + offsetY用の
  // numberInput + garmentPlacement という一連のパイプラインを1枚の <name>Group ノード
  // (nodes/definitions/groupNodeFactory.ts の defineGroupNode() で定義、nodes/definitions/
  // groups/<name>GroupNode.ts)に集約している。生パラメータと Color は他のガーメントと共有されない
  // 単独パラメータのため、internalNodes に groupInput ノードと並べて直接書かれており
  // (グループの中に入って初めて編集できる)、このファイルには現れない — 詳細は
  // src/nodes/CLAUDE.md の「グループノード」節を参照。各 <name>GroupNode.ts の internalNodes
  // は `sceneOutput`(nodes/definitions/generic/sceneOutput.ts)ノードも内包しており、実際に
  // シーンへ描画されるのはこの内部 `sceneOutput` への配線があるからである(このファイルには
  // その配線は現れない)。
  { id: 'skirtGroup', type: 'skirtGroup', data: {} },

  { id: 'topGroup', type: 'topGroup', data: {} },

  { id: 'pantsGroup', type: 'pantsGroup', data: {} },
  { id: 'shoesGroup', type: 'shoesGroup', data: {} },
  { id: 'socksGroup', type: 'socksGroup', data: {} },
  { id: 'glovesGroup', type: 'glovesGroup', data: {} },
  { id: 'beltGroup', type: 'beltGroup', data: {} },
  { id: 'scarfGroup', type: 'scarfGroup', data: {} },
  { id: 'jacketGroup', type: 'jacketGroup', data: {} },
  { id: 'dressGroup', type: 'dressGroup', data: {} },
  { id: 'hatGroup', type: 'hatGroup', data: {} },
  { id: 'bagGroup', type: 'bagGroup', data: {} },
  { id: 'necktieGroup', type: 'necktieGroup', data: {} },
  { id: 'glassesGroup', type: 'glassesGroup', data: {} },
];

export const initialEdges: Edge[] = [
  // bodyBuild → bodyDimensions(共有の寸法計算ノード)。
  { id: 'e-body-dims-build', source: 'bodyBuild', sourceHandle: 'value', target: 'bodyDimensions', targetHandle: 'buildScale' },

  // bodyDimensions → bodyLayout(共有の配置Y座標計算ノード)。bodyLayoutGroup が入力に
  // 使う5個の寸法だけを配線する(nodes/definitions/groups/bodyLayoutGroupNode.ts 参照)。
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

  // ガーメント自身の「体に触れる半径」を bodyBuild でスケールするグループ(12種)への配線。
  // アンカー座標の計算は下記の bodyLayout → anchorY の配線が別途担うため、ここでの bodyBuild
  // はあくまで各ガーメントの半径スケーリング専用。
  { id: 'e-waist-build', source: 'bodyBuild', sourceHandle: 'value', target: 'skirtGroup', targetHandle: 'bodyBuild' },
  { id: 'e-pants-waist-build', source: 'bodyBuild', sourceHandle: 'value', target: 'pantsGroup', targetHandle: 'bodyBuild' },
  { id: 'e-pants-leg-spacing', source: 'bodyDimensions', sourceHandle: 'legSpacing', target: 'pantsGroup', targetHandle: 'legSpacing' },
  { id: 'e-shoes-leg-spacing', source: 'bodyDimensions', sourceHandle: 'legSpacing', target: 'shoesGroup', targetHandle: 'legSpacing' },
  { id: 'e-shoes-sole-build', source: 'bodyBuild', sourceHandle: 'value', target: 'shoesGroup', targetHandle: 'bodyBuild' },
  { id: 'e-gloves-arm-spacing', source: 'bodyDimensions', sourceHandle: 'shoulderSpacing', target: 'glovesGroup', targetHandle: 'armSpacing' },
  { id: 'e-gloves-wrist-build', source: 'bodyBuild', sourceHandle: 'value', target: 'glovesGroup', targetHandle: 'bodyBuild' },
  { id: 'e-belt-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'beltGroup', targetHandle: 'bodyBuild' },
  { id: 'e-scarf-neck-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'scarfGroup', targetHandle: 'bodyBuild' },
  { id: 'e-jacket-shoulder-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'jacketGroup', targetHandle: 'bodyBuild' },
  { id: 'e-socks-leg-spacing', source: 'bodyDimensions', sourceHandle: 'legSpacing', target: 'socksGroup', targetHandle: 'legSpacing' },
  { id: 'e-socks-ankle-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'socksGroup', targetHandle: 'bodyBuild' },
  { id: 'e-top-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'topGroup', targetHandle: 'bodyBuild' },
  { id: 'e-bag-build', source: 'bodyBuild', sourceHandle: 'value', target: 'bagGroup', targetHandle: 'bodyBuild' },
  { id: 'e-necktie-front-depth-build', source: 'bodyBuild', sourceHandle: 'value', target: 'necktieGroup', targetHandle: 'bodyBuild' },
  { id: 'e-dress-torso-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'dressGroup', targetHandle: 'bodyBuild' },

  // garmentPlacement(取り付け位置をジオメトリへ焼き込むノード、nodes/definitions/
  // generic/garmentPlacement.ts 参照)の `anchorY` へ、bodyLayout が計算した5つのアンカー候補
  // (waistY/shoulderY/feetY/wristY/headCenterY)のうち、そのガーメントが実際に使う1つを
  // 配線する。
  { id: 'e-anchor-skirt', source: 'bodyLayout', sourceHandle: 'waistY', target: 'skirtGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-pants', source: 'bodyLayout', sourceHandle: 'waistY', target: 'pantsGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-belt', source: 'bodyLayout', sourceHandle: 'waistY', target: 'beltGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-dress', source: 'bodyLayout', sourceHandle: 'shoulderY', target: 'dressGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-necktie', source: 'bodyLayout', sourceHandle: 'shoulderY', target: 'necktieGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-bag', source: 'bodyLayout', sourceHandle: 'shoulderY', target: 'bagGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-jacket', source: 'bodyLayout', sourceHandle: 'shoulderY', target: 'jacketGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-top', source: 'bodyLayout', sourceHandle: 'shoulderY', target: 'topGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-scarf', source: 'bodyLayout', sourceHandle: 'shoulderY', target: 'scarfGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-socks', source: 'bodyLayout', sourceHandle: 'feetY', target: 'socksGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-shoes', source: 'bodyLayout', sourceHandle: 'feetY', target: 'shoesGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-gloves', source: 'bodyLayout', sourceHandle: 'wristY', target: 'glovesGroup', targetHandle: 'anchorY' },
  { id: 'e-head-radius-hat', source: 'bodyDimensions', sourceHandle: 'headRadius', target: 'hatGroup', targetHandle: 'headRadius' },
  { id: 'e-head-radius-glasses', source: 'bodyDimensions', sourceHandle: 'headRadius', target: 'glassesGroup', targetHandle: 'headRadius' },
  { id: 'e-anchor-hat', source: 'bodyLayout', sourceHandle: 'headCenterY', target: 'hatGroup', targetHandle: 'anchorY' },
  { id: 'e-anchor-glasses', source: 'bodyLayout', sourceHandle: 'headCenterY', target: 'glassesGroup', targetHandle: 'anchorY' },
];

const initialPositions = computeAutoLayout(
  initialNodeDefs.map((n) => ({ id: n.id, type: n.type ?? '', data: n.data })),
  initialEdges.map((e) => ({
    source: e.source,
    sourceHandle: e.sourceHandle,
    target: e.target,
    targetHandle: e.targetHandle,
  })),
);

export const initialNodes: Node[] = initialNodeDefs.map((n) => ({
  ...n,
  position: initialPositions.get(n.id) ?? { x: 0, y: 0 },
}));
