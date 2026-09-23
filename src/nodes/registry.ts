import type { NodeTypeDefinition, PaletteSection } from './types';

export const nodeTypeRegistry = new Map<string, NodeTypeDefinition<any>>();

const SECTION_ORDER: PaletteSection[] = [
  'input',
  'math',
  'primitive',
  'geometry-op',
  'curve',
  'garment',
  'group-part',
  'group-io',
  'material',
  'output',
];

/** ノードタイプの、パレット/コンテキストメニューでの見出し。 */
function sectionOf(def: NodeTypeDefinition): PaletteSection {
  return def.category === 'group' ? (def.paletteSection ?? 'group-part') : def.category;
}

/** 登録済みノードタイプをパレットの見出し別にグループ化する。パレットとコンテキストメニューで共有する。 */
export function groupNodeTypesBySection(): {
  section: PaletteSection;
  items: { type: string; label: string }[];
}[] {
  const bySection = new Map<PaletteSection, { type: string; label: string }[]>();
  for (const def of nodeTypeRegistry.values()) {
    const section = sectionOf(def);
    const list = bySection.get(section) ?? [];
    list.push({ type: def.type, label: def.label });
    bySection.set(section, list);
  }
  return SECTION_ORDER.filter((s) => bySection.has(s)).map((s) => ({
    section: s,
    // ラベルで安定ソートする。登録順(= definitions/index.ts の import.meta.glob が
    // 解決するファイルシステム順)に依存させないため。
    items: bySection.get(s)!.sort((a, b) => a.label.localeCompare(b.label)),
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

/** ノードインスタンスの表示名。`renamable` な型で `data.label` が空でなければそれを、
 * それ以外は型のラベルを返す。カードのタイトル・パンくず・3Dビューのメッシュ一覧で共有する。 */
export function nodeDisplayLabel(type: string, data: Record<string, unknown>): string {
  const def = getNodeType(type);
  const label = data.label;
  return def.renamable && typeof label === 'string' && label.trim() !== '' ? label : def.label;
}
