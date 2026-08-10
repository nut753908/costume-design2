import type { NodeTypeDefinition } from './types';

export const nodeTypeRegistry = new Map<string, NodeTypeDefinition<any>>();

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
