import type { NodeCategory } from '../nodes/types';

/** ノードパレットとコンテキストメニューで共有するカテゴリ表示名。 */
export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  input: 'Inputs',
  math: 'Math',
  primitive: 'Primitives',
  'geometry-op': 'Geometry Ops',
  points: 'Points',
  group: 'Groups',
  'group-io': 'Group I/O',
  material: 'Materials',
  output: 'Outputs',
};

/** パレットからキャンバスへのドラッグ&ドロップで、ノードタイプを運ぶための dataTransfer MIME タイプ。 */
export const NODE_TYPE_DND_MIME = 'application/costume-design-node-type';

/** `fitView()`/`fitViewOptions` に渡す共通の padding。`NodePalette`(`Panel
 * position="top-left"`、幅は内容依存だが実測200px前後)は画面座標に固定表示されるため、
 * 通常の均等な割合パディングだけでは足りず、入次数0のノード(`groupInput` など、
 * `computeAutoLayout()` が常に列0=キャンバス左端に置く)がパレットの真下に完全に隠れて
 * しまうことがある(実際に発生した不具合 — bodyDimensionsGroup の Group Input が中に
 * 入るたびにパレットへ隠れ、外部から見て配線が無いように見えていた)。左側だけ固定px、
 * 他3辺は従来どおり割合指定にすることでこれを避ける。呼び出しのたびに新しいオブジェクトを
 * 返す(呼び出し側でそのまま `fitView({ padding: fitViewPadding(), ... })` と渡す想定)。 */
export function fitViewPadding(): { left: `${number}px`; top: number; right: number; bottom: number } {
  return { left: '260px', top: 0.2, right: 0.2, bottom: 0.2 };
}
