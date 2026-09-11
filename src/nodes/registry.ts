import type { NodeCategory, NodeTypeDefinition } from './types';

export const nodeTypeRegistry = new Map<string, NodeTypeDefinition<any>>();

const CATEGORY_ORDER: NodeCategory[] = ['input', 'generator', 'group', 'group-io', 'material', 'output'];

/** 登録済みノードタイプをカテゴリ別にグループ化する。パレットとコンテキストメニューで共有する。 */
export function groupNodeTypesByCategory(): {
  category: NodeCategory;
  items: { type: string; label: string }[];
}[] {
  const byCategory = new Map<NodeCategory, { type: string; label: string }[]>();
  for (const def of nodeTypeRegistry.values()) {
    const list = byCategory.get(def.category) ?? [];
    list.push({ type: def.type, label: def.label });
    byCategory.set(def.category, list);
  }
  return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((c) => ({
    category: c,
    // ラベルで安定ソートする。登録順(= definitions/index.ts の import.meta.glob が
    // 解決するファイルシステム順)に依存させないため。
    items: byCategory.get(c)!.sort((a, b) => a.label.localeCompare(b.label)),
  }));
}

/** 新しいノードタイプ(ガーメントジェネレーター、入力など)が登録される唯一の場所。 */
export function registerNodeType<TData>(def: NodeTypeDefinition<TData>): void {
  if (nodeTypeRegistry.has(def.type)) {
    throw new Error(`Node type "${def.type}" is already registered`);
  }
  nodeTypeRegistry.set(def.type, def as NodeTypeDefinition<any>);
}

export function getNodeType(type: string): NodeTypeDefinition<any> {
  const def = nodeTypeRegistry.get(type);
  if (!def) {
    throw new Error(`Unknown node type "${type}"`);
  }
  return def;
}
