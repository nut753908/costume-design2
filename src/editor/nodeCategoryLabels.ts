import type { NodeCategory } from '../nodes/types';

/** ノードパレットとコンテキストメニューで共有するカテゴリ表示名。 */
export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  input: 'Inputs',
  generator: 'Generators',
  material: 'Materials',
  output: 'Outputs',
};
