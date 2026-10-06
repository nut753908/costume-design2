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
  // 配置Y座標(7個、うち5個は waist/shoulder/feet/wrist/head のアンカー候補)を計算する共有ノード。
  // bodyGroup へ普通の外部ソケットとして渡す(nodes/CLAUDE.md の「グループノード」節参照)。
  { id: 'bodyLayout', type: 'bodyLayoutGroup', data: {} },

  // Body(3Dモデル本体)。ガーメントと同じグループノードで、胴体/頭/腕/脚を
  // 組み立てて描画する(nodes/definitions/groups/bodyGroupNode.ts 参照)。寸法は
  // 固定値(bodyDimensionDefaults.ts)で、配置Y座標は bodyLayout が計算済みの値を外部ソケットとして受け取る。
  { id: 'bodyGroup', type: 'bodyGroup', data: {} },
];

export const initialEdges: Edge[] = [
  // bodyLayout(bodyGroup 自身のメッシュ配置に使う4出力)→ bodyGroup。
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
