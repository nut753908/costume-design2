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
// 計算する。
//
// 初期状態は体(bodyGroup)だけで、ガーメントのグループノードは置かない(体の作り込みに
// 専念するため)。ガーメントは各 <name>GroupNode.ts の定義が残っており、ノード追加メニューから
// 追加できる。
const initialNodeDefs: Omit<Node, 'position'>[] = [
  // Build/Height/Shoulder の各スケールは `bodyDimensionsGroup` の外部ソケット
  // (`buildScale`/`heightScale`/`shoulderScale`、未接続時の既定値1)として、この階層では
  // 配線せずグループカードの入力欄から調整する(nodes/CLAUDE.md の「グループノード」節参照)。
  // ボディの寸法(11個)・配置Y座標(8個、うち5個は waist/shoulder/feet/wrist/head の
  // アンカー候補)を計算する2つの共有ノード。bodyGroup へ普通の外部
  // ソケットとして渡す(nodes/CLAUDE.md の「グループノード」節参照)。
  { id: 'bodyDimensions', type: 'bodyDimensionsGroup', data: {} },
  { id: 'bodyLayout', type: 'bodyLayoutGroup', data: {} },

  // Body(3Dモデル本体)。ガーメントと同じグループノードで、胴体/頭/腕/脚を
  // 組み立てて描画する(nodes/definitions/groups/bodyGroupNode.ts 参照)。bodyDimensions/bodyLayout
  // が計算済みの生の値(半径・長さ・Y座標)を外部ソケットとして直接受け取るだけで、
  // 自分ではスケール計算を一切行わない。
  { id: 'bodyGroup', type: 'bodyGroup', data: {} },
];

export const initialEdges: Edge[] = [
  // bodyDimensions → bodyLayout(共有の配置Y座標計算ノード)。bodyLayoutGroup が入力に
  // 使う6個の寸法だけを配線する(nodes/definitions/groups/bodyLayoutGroupNode.ts 参照)。
  { id: 'e-body-layout-leg-height', source: 'bodyDimensions', sourceHandle: 'legHeight', target: 'bodyLayout', targetHandle: 'legHeight' },
  { id: 'e-body-layout-torso-length', source: 'bodyDimensions', sourceHandle: 'torsoLength', target: 'bodyLayout', targetHandle: 'torsoLength' },
  { id: 'e-body-layout-torso-radius', source: 'bodyDimensions', sourceHandle: 'torsoRadius', target: 'bodyLayout', targetHandle: 'torsoRadius' },
  { id: 'e-body-layout-head-radius', source: 'bodyDimensions', sourceHandle: 'headRadius', target: 'bodyLayout', targetHandle: 'headRadius' },
  { id: 'e-body-layout-arm-length', source: 'bodyDimensions', sourceHandle: 'armLength', target: 'bodyLayout', targetHandle: 'armLength' },
  { id: 'e-body-layout-neck-length', source: 'bodyDimensions', sourceHandle: 'neckLength', target: 'bodyLayout', targetHandle: 'neckLength' },

  // bodyDimensions(11出力すべて)→ bodyGroup。bodyGroup 自身は寸法を計算せず、
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
  { id: 'e-body-group-neck-length', source: 'bodyDimensions', sourceHandle: 'neckLength', target: 'bodyGroup', targetHandle: 'neckLength' },

  // bodyLayout(bodyGroup 自身のメッシュ配置に使う5出力)→ bodyGroup。
  { id: 'e-body-group-leg-center-y', source: 'bodyLayout', sourceHandle: 'legCenterY', target: 'bodyGroup', targetHandle: 'legCenterY' },
  { id: 'e-body-group-waist-y', source: 'bodyLayout', sourceHandle: 'waistY', target: 'bodyGroup', targetHandle: 'waistY' },
  { id: 'e-body-group-head-center-y', source: 'bodyLayout', sourceHandle: 'headCenterY', target: 'bodyGroup', targetHandle: 'headCenterY' },
  { id: 'e-body-group-arm-center-y', source: 'bodyLayout', sourceHandle: 'armCenterY', target: 'bodyGroup', targetHandle: 'armCenterY' },
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
