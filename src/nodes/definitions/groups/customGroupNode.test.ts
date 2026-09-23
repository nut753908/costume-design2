import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import { resolveNodeSockets } from '../../resolveNodeSockets';
import { isGroupInstanceStale } from '../../groupTemplate';
import type { GroupNodeData } from '../groupNodeFactory';
import '../../definitions';

describe('customGroup', () => {
  const create = () => getNodeType('customGroup').createDefaultData() as Required<Pick<GroupNodeData, 'nodes' | 'edges'>> & GroupNodeData;

  it('中身は Group Input(左)と Group Output(右)だけで、外部ソケットは0個', () => {
    const data = create();
    expect(data.nodes.map((n) => [n.type, n.position])).toEqual([
      ['groupInput', { x: 0, y: 0 }],
      ['groupOutput', { x: 400, y: 0 }],
    ]);
    expect(data.edges).toEqual([]);
    expect(resolveNodeSockets('customGroup', data)).toEqual({ inputs: [], outputs: [] });
  });

  it('インスタンスごとに独立したコピーを返す', () => {
    const a = create();
    const b = create();
    a.nodes.push({ id: 'x', type: 'numberInput', data: { value: 1 }, position: { x: 0, y: 0 } });
    expect(b.nodes).toHaveLength(2);
  });

  it('テンプレートを持たないので、中身を編集してもテンプレート更新ありにならない', () => {
    const data = create();
    expect(data.templateFingerprint).toBeUndefined();
    const edited = { ...data, nodes: [...data.nodes, { id: 'x', type: 'numberInput', data: { value: 1 }, position: { x: 0, y: 0 } }] };
    expect(isGroupInstanceStale('customGroup', edited)).toBe(false);
  });

  it('中で追加したソケットと配線がそのまま外部の入出力になる', () => {
    const data = create();
    const socket = { id: 's', label: 'Size', type: 'number' as const, default: 0 };
    data.nodes = data.nodes.map((n) => ({ ...n, data: { sockets: [socket] } }));
    data.edges = [{ id: 'e', source: 'input', sourceHandle: 's', target: 'output', targetHandle: 's' }];

    const sockets = resolveNodeSockets('customGroup', data);
    expect(sockets.inputs.map((s) => s.id)).toEqual(['s']);
    expect(sockets.outputs.map((s) => s.id)).toEqual(['s']);
    expect(getNodeType('customGroup').evaluate({ s: { type: 'number', value: 3 } }, data).s).toEqual({ type: 'number', value: 3 });
  });
});
