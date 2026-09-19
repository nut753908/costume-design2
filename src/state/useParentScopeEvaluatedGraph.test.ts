import { beforeAll, describe, expect, it } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import { registerNodeType, nodeTypeRegistry } from '../nodes/registry';
import { resolveIncomingValue } from '../nodes/evaluateGraph';
import type { SocketValue } from '../nodes/types';
import { evaluateScopeChain } from './useParentScopeEvaluatedGraph';
import type { ScopeFrame } from './composeRootGraph';

function makeNode(id: string, type: string, data: Record<string, unknown> = {}): Node {
  return { id, type, position: { x: 0, y: 0 }, data };
}

function makeEdge(id: string, source: string, sourceHandle: string, target: string, targetHandle: string): Edge {
  return { id, source, sourceHandle, target, targetHandle };
}

beforeAll(() => {
  if (!nodeTypeRegistry.has('testSource')) {
    registerNodeType({
      type: 'testSource',
      label: 'Test Source',
      category: 'input',
      inputs: [],
      outputs: [{ id: 'value', label: 'Value', type: 'number' }],
      createDefaultData: () => ({ value: 0 }),
      evaluate: (_inputs, data: { value: number }) => ({ value: { type: 'number', value: data.value } }),
    });
  }
  // nodes/definitions/groupInput.ts を模した最小限のスタブ(state/ レイヤーはそちらに
  // 依存しないため、evaluate() のロジックだけここで再現する)。
  if (!nodeTypeRegistry.has('groupInput')) {
    registerNodeType({
      type: 'groupInput',
      label: 'Group Input',
      category: 'group-io',
      inputs: [],
      outputs: [],
      createDefaultData: () => ({ sockets: [] }),
      evaluate: (
        _inputs,
        data: { sockets: { id: string; default?: number }[]; injected?: Record<string, SocketValue> },
      ) => {
        const result: Record<string, SocketValue> = {};
        for (const socket of data.sockets) {
          const value: SocketValue = data.injected?.[socket.id] ?? { type: 'number', value: socket.default ?? 0 };
          result[socket.id] = value;
        }
        return result;
      },
    });
  }
  // トップレベルの中継ノード(値をそのまま転送するだけ)。
  if (!nodeTypeRegistry.has('testPassthrough')) {
    registerNodeType({
      type: 'testPassthrough',
      label: 'Test Passthrough',
      category: 'generator',
      inputs: [{ id: 'value', label: 'Value', type: 'number' }],
      outputs: [{ id: 'value', label: 'Value', type: 'number' }],
      createDefaultData: () => ({}),
      evaluate: (inputs) => ({ value: inputs.value }),
    });
  }
});

describe('evaluateScopeChain', () => {
  it('1階層のみ(トップレベル直下)の場合、その階層をそのまま評価する', () => {
    const frames: ScopeFrame[] = [
      {
        parentId: 'group1',
        nodes: [makeNode('src', 'testSource', { value: 3 }), makeNode('group1', 'testPassthrough', {})],
        edges: [makeEdge('e1', 'src', 'value', 'group1', 'value')],
      },
    ];

    const [level0] = evaluateScopeChain(frames);
    expect(level0.get('group1')?.value).toEqual({ type: 'number', value: 3 });
  });

  it('多段ネスト: 親スコープ自身が外側のグループの中で groupInput 経由の値を受け取っていても、内側の階層まで正しく伝播する', () => {
    // トップレベル: src(5) -> outerGroup.bodyBuild
    // outerGroup 内部(=frames[1]): groupInput(bodyBuild) -> innerGroup.bodyBuild
    // innerGroup 内部(=frames[2], 今回は評価対象外だが、値の伝播元として使うのは frames[1] の結果)
    const frames: ScopeFrame[] = [
      {
        parentId: 'outerGroup',
        nodes: [makeNode('src', 'testSource', { value: 5 }), makeNode('outerGroup', 'testPassthrough', {})],
        // outerGroup 自身が外部から受け取る「bodyBuild」という名の外部ソケット
        // (testPassthrough が実際に宣言している入力ハンドル名とは無関係 — resolveIncomingValue()
        // はエッジの target/targetHandle だけを見て接続元の評価結果を引くため、ここでは
        // outerGroup というノードが実際に 'bodyBuild' という入力を持っているかどうかは
        // 関係ない)。
        edges: [makeEdge('e1', 'src', 'value', 'outerGroup', 'bodyBuild')],
      },
      {
        parentId: 'innerGroup',
        nodes: [
          makeNode('input', 'groupInput', { sockets: [{ id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 }] }),
          makeNode('innerGroup', 'testPassthrough', {}),
        ],
        edges: [makeEdge('e2', 'input', 'bodyBuild', 'innerGroup', 'value')],
      },
    ];

    const [level0, level1] = evaluateScopeChain(frames);
    // レベル0(トップレベル)は外部注入の必要が無いのでそのまま評価され、src の値がそのまま出る。
    expect(level0.get('src')?.value).toEqual({ type: 'number', value: 5 });
    // レベル1の groupInput ノード「input」は、level0 での outerGroup への実際の配線値(5)を
    // 注入された上で評価されているはず ― 未接続時のデフォルト(1)ではない。
    expect(level1.get('input')?.bodyBuild).toEqual({ type: 'number', value: 5 });
    expect(level1.get('innerGroup')?.value).toEqual({ type: 'number', value: 5 });

    // resolveIncomingValue() で「今開いている(内側の)groupInput ノード」への注入値を
    // 引く、GroupInputNode.tsx と同じ経路も確認する。
    const injected = resolveIncomingValue(frames[1].edges, level1, 'innerGroup', 'value');
    expect(injected).toEqual({ type: 'number', value: 5 });
  });

  it('外側の配線が無ければ groupInput はデフォルト値のまま評価される', () => {
    const frames: ScopeFrame[] = [
      { parentId: 'outerGroup', nodes: [makeNode('outerGroup', 'testPassthrough', {})], edges: [] },
      {
        parentId: 'innerGroup',
        nodes: [
          makeNode('input', 'groupInput', { sockets: [{ id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 }] }),
          makeNode('innerGroup', 'testPassthrough', {}),
        ],
        edges: [makeEdge('e2', 'input', 'bodyBuild', 'innerGroup', 'value')],
      },
    ];

    const [, level1] = evaluateScopeChain(frames);
    expect(level1.get('input')?.bodyBuild).toEqual({ type: 'number', value: 1 });
  });

  it('空の scopeStack では空配列を返す', () => {
    expect(evaluateScopeChain([])).toEqual([]);
  });
});
