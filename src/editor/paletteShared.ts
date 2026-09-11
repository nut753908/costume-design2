import type { NodeCategory } from '../nodes/types';

/** ノードパレットとコンテキストメニューで共有するカテゴリ表示名。 */
export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  input: 'Inputs',
  generator: 'Generators',
  group: 'Groups',
  'group-io': 'Group I/O',
  material: 'Materials',
  output: 'Outputs',
};

/** パレットからキャンバスへのドラッグ&ドロップで、ノードタイプを運ぶための dataTransfer MIME タイプ。 */
export const NODE_TYPE_DND_MIME = 'application/costume-design-node-type';
