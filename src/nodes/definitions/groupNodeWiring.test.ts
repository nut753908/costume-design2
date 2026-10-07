import { describe, expect, it } from 'vitest';
import './index';
import { nodeTypeRegistry } from '../registry';
import { resolveNodeSockets } from '../resolveNodeSockets';
import type { GroupInternalEdge, GroupInternalNode } from '../types';
import type { GroupNodeData } from './groupNodeFactory';

// evaluateGraph は存在しないノード id/ソケット id を指すエッジを静かに無視して評価を続ける
// (未接続扱いになるだけ)ため、defineGroupNode() のテンプレートの配線タイポは他のテストでは
// 気づけない。登録済みの全グループ型について、内部エッジの端点がそのノード型の実在する
// ソケットを指していることを走査して検証する。
const groupTypes = [...nodeTypeRegistry.values()].filter((def) => def.category === 'group');

describe('全グループノードの内部配線', () => {
  it('グループ型が登録されている(走査対象が空になっていない)', () => {
    expect(groupTypes.length).toBeGreaterThanOrEqual(10);
  });

  describe.each(groupTypes.map((def) => [def.type, def] as const))('%s', (_type, def) => {
    const data = def.createDefaultData() as GroupNodeData;
    const nodes = data.nodes as GroupInternalNode[];
    const edges = data.edges as GroupInternalEdge[];
    const nodesById = new Map(nodes.map((n) => [n.id, n]));

    it('内部ノードの id が重複せず、type がすべて登録済みのノードタイプである', () => {
      expect(nodesById.size).toBe(nodes.length);
      const unknown = nodes.filter((n) => !nodeTypeRegistry.has(n.type)).map((n) => `${n.id}:${n.type}`);
      expect(unknown).toEqual([]);
    });

    it('内部エッジの source/target が実在するノードを指し、ハンドルがそのノード型の実在するソケットである', () => {
      const problems: string[] = [];
      for (const edge of edges) {
        const source = nodesById.get(edge.source);
        const target = nodesById.get(edge.target);
        if (!source) problems.push(`${edge.id}: source ノード ${edge.source} が存在しない`);
        if (!target) problems.push(`${edge.id}: target ノード ${edge.target} が存在しない`);
        if (source && !resolveNodeSockets(source.type, source.data).outputs.some((s) => s.id === edge.sourceHandle)) {
          problems.push(`${edge.id}: ${edge.source}(${source.type}) に出力ソケット ${edge.sourceHandle} が無い`);
        }
        if (target && !resolveNodeSockets(target.type, target.data).inputs.some((s) => s.id === edge.targetHandle)) {
          problems.push(`${edge.id}: ${edge.target}(${target.type}) に入力ソケット ${edge.targetHandle} が無い`);
        }
      }
      expect(problems).toEqual([]);
    });

    it('内部エッジの id が重複しない(複数接続できるソケットへ繋がる複数のエッジも区別できる)', () => {
      const ids = edges.map((e) => e.id);
      expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    });

    it('複数接続できないソケット(`SocketDef.multiple` でない入力)に複数のエッジが接続されていない(1入力につき最大1本)', () => {
      const isMultiple = (e: GroupInternalEdge) => {
        const target = nodesById.get(e.target);
        return !!target && resolveNodeSockets(target.type, target.data).inputs.find((s) => s.id === e.targetHandle)?.multiple === true;
      };
      const keys = edges.filter((e) => !isMultiple(e)).map((e) => `${e.target}.${e.targetHandle}`);
      expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([]);
    });
  });
});
