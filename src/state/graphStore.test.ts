import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react';
import { useGraphStore } from './graphStore';
import { registerNodeType, nodeTypeRegistry } from '../nodes/registry';

beforeAll(() => {
  if (!nodeTypeRegistry.has('testNode')) {
    registerNodeType({
      type: 'testNode',
      label: 'Test Node',
      category: 'input',
      inputs: [],
      outputs: [{ id: 'value', label: 'Value', type: 'number' }],
      createDefaultData: () => ({ value: 0 }),
      evaluate: (_inputs, data: { value: number }) => ({
        value: { type: 'number', value: data.value },
      }),
    });
  }
});

function makeNode(id: string, overrides: Partial<Node> = {}): Node {
  return { id, type: 'testNode', position: { x: 0, y: 0 }, data: {}, ...overrides };
}

function makeEdge(id: string, source: string, target: string): Edge {
  return { id, source, sourceHandle: 'value', target, targetHandle: 'value' };
}

/** 各テストの前にストアを既知の状態にリセットする(zustand のストアはモジュール単位の
 * シングルトンなので、テスト間で状態が漏れないよう明示的に初期化する)。 */
function resetStore(nodes: Node[] = [], edges: Edge[] = []) {
  useGraphStore.setState({
    nodes,
    edges,
    evaluatedResults: null,
    past: [],
    future: [],
    _historyKey: null,
    _historyAt: 0,
    _dragging: false,
    clipboard: null,
    _pasteCount: 0,
  });
}

beforeEach(() => {
  resetStore();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('graphStore の Undo/Redo', () => {
  it('addNode は1件の履歴エントリを積み、undo/redo で行き来できる', () => {
    resetStore([makeNode('a')]);
    useGraphStore.getState().addNode('testNode', { x: 100, y: 100 });

    expect(useGraphStore.getState().nodes).toHaveLength(2);
    expect(useGraphStore.getState().past).toHaveLength(1);

    useGraphStore.getState().undo();
    expect(useGraphStore.getState().nodes).toHaveLength(1);
    expect(useGraphStore.getState().future).toHaveLength(1);

    useGraphStore.getState().redo();
    expect(useGraphStore.getState().nodes).toHaveLength(2);
  });

  it('複数ノードを同時に削除しても履歴は1件にまとまる', () => {
    resetStore([makeNode('a'), makeNode('b'), makeNode('c')]);
    const changes: NodeChange[] = [
      { id: 'a', type: 'remove' },
      { id: 'b', type: 'remove' },
    ];
    useGraphStore.getState().onNodesChange(changes);

    expect(useGraphStore.getState().nodes.map((n) => n.id)).toEqual(['c']);
    expect(useGraphStore.getState().past).toHaveLength(1);

    useGraphStore.getState().undo();
    expect(useGraphStore.getState().nodes.map((n) => n.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('select/dimensions のみの変更では履歴を積まない', () => {
    resetStore([makeNode('a')]);
    const changes: NodeChange[] = [{ id: 'a', type: 'select', selected: true }];
    useGraphStore.getState().onNodesChange(changes);

    expect(useGraphStore.getState().past).toHaveLength(0);
  });

  it('ノードのドラッグは何度 position change が来ても1件の履歴エントリにまとまる', () => {
    resetStore([makeNode('a', { position: { x: 0, y: 0 } })]);
    const { onNodesChange } = useGraphStore.getState();

    onNodesChange([{ id: 'a', type: 'position', position: { x: 10, y: 0 }, dragging: true }]);
    onNodesChange([{ id: 'a', type: 'position', position: { x: 20, y: 0 }, dragging: true }]);
    onNodesChange([{ id: 'a', type: 'position', position: { x: 30, y: 0 }, dragging: false }]);

    expect(useGraphStore.getState().past).toHaveLength(1);
    expect(useGraphStore.getState().nodes[0].position).toEqual({ x: 30, y: 0 });

    useGraphStore.getState().undo();
    expect(useGraphStore.getState().nodes[0].position).toEqual({ x: 0, y: 0 });
  });

  it('エッジの削除は履歴を積むが、選択の変更は積まない', () => {
    resetStore([makeNode('a'), makeNode('b')], [makeEdge('e-ab', 'a', 'b')]);

    useGraphStore.getState().onEdgesChange([{ id: 'e-ab', type: 'select', selected: true } as EdgeChange]);
    expect(useGraphStore.getState().past).toHaveLength(0);

    useGraphStore.getState().onEdgesChange([{ id: 'e-ab', type: 'remove' }]);
    expect(useGraphStore.getState().edges).toHaveLength(0);
    expect(useGraphStore.getState().past).toHaveLength(1);
  });

  it('onConnect はエッジ追加前の状態を1件の履歴として積む', () => {
    resetStore([makeNode('a'), makeNode('b')]);
    useGraphStore.getState().onConnect({ source: 'a', sourceHandle: 'value', target: 'b', targetHandle: 'value' });

    expect(useGraphStore.getState().edges).toHaveLength(1);
    useGraphStore.getState().undo();
    expect(useGraphStore.getState().edges).toHaveLength(0);
  });

  it('updateNodeData の連続呼び出しは coalesceMs(500ms) 以内なら1件の履歴エントリにまとまる', () => {
    vi.useFakeTimers();
    resetStore([makeNode('a', { data: { value: 0 } })]);
    const { updateNodeData } = useGraphStore.getState();

    updateNodeData('a', { value: 1 });
    vi.advanceTimersByTime(100);
    updateNodeData('a', { value: 2 });
    vi.advanceTimersByTime(100);
    updateNodeData('a', { value: 3 });

    expect(useGraphStore.getState().past).toHaveLength(1);
    expect((useGraphStore.getState().nodes[0].data as { value: number }).value).toBe(3);

    useGraphStore.getState().undo();
    expect((useGraphStore.getState().nodes[0].data as { value: number }).value).toBe(0);
  });

  it('coalesceMs を超えて間隔が空くと新しい履歴エントリになる', () => {
    vi.useFakeTimers();
    resetStore([makeNode('a', { data: { value: 0 } })]);
    const { updateNodeData } = useGraphStore.getState();

    updateNodeData('a', { value: 1 });
    vi.advanceTimersByTime(600);
    updateNodeData('a', { value: 2 });

    expect(useGraphStore.getState().past).toHaveLength(2);
  });

  it('異なるノードへの updateNodeData はコアレッシングされず別エントリになる', () => {
    resetStore([makeNode('a', { data: { value: 0 } }), makeNode('b', { data: { value: 0 } })]);
    const { updateNodeData } = useGraphStore.getState();

    updateNodeData('a', { value: 1 });
    updateNodeData('b', { value: 1 });

    expect(useGraphStore.getState().past).toHaveLength(2);
  });

  it('undo 後に新しい操作を行うと redo スタックはクリアされる', () => {
    resetStore([makeNode('a')]);
    useGraphStore.getState().addNode('testNode', { x: 0, y: 0 });
    useGraphStore.getState().undo();
    expect(useGraphStore.getState().future).toHaveLength(1);

    useGraphStore.getState().addNode('testNode', { x: 0, y: 0 });
    expect(useGraphStore.getState().future).toHaveLength(0);
  });

  it('過去に何も無ければ undo は何もしない', () => {
    resetStore([makeNode('a')]);
    useGraphStore.getState().undo();
    expect(useGraphStore.getState().nodes).toHaveLength(1);
  });

  it('未来に何も無ければ redo は何もしない', () => {
    resetStore([makeNode('a')]);
    useGraphStore.getState().redo();
    expect(useGraphStore.getState().nodes).toHaveLength(1);
  });

  it('履歴は際限なく増え続けず、上限を超えた古いエントリは切り捨てられる', () => {
    resetStore([makeNode('seed')]);
    for (let i = 0; i < 150; i++) {
      useGraphStore.getState().addNode('testNode', { x: i, y: i });
    }
    expect(useGraphStore.getState().past.length).toBeLessThanOrEqual(100);
  });
});

describe('graphStore の setEvaluatedResults', () => {
  it('evaluatedResults をそのままストアへ反映する(履歴は積まない)', () => {
    resetStore([makeNode('a')]);
    const results = new Map([['a', { value: { type: 'number' as const, value: 1 } }]]);

    useGraphStore.getState().setEvaluatedResults(results);

    expect(useGraphStore.getState().evaluatedResults).toBe(results);
    expect(useGraphStore.getState().past).toHaveLength(0);
  });
});

describe('graphStore のコピー&ペースト/複製', () => {
  it('選択が無い状態で copySelected を呼んでもクリップボードは空のまま', () => {
    resetStore([makeNode('a')]);
    useGraphStore.getState().copySelected();
    expect(useGraphStore.getState().clipboard).toBeNull();
  });

  it('選択中ノードと、その内部エッジのみをクリップボードにコピーする(選択外への接続は含めない)', () => {
    resetStore(
      [makeNode('a', { selected: true }), makeNode('b', { selected: true }), makeNode('c')],
      [makeEdge('e-ab', 'a', 'b'), makeEdge('e-ca', 'c', 'a')],
    );
    useGraphStore.getState().copySelected();

    const clip = useGraphStore.getState().clipboard;
    expect(clip?.nodes.map((n) => n.id).sort()).toEqual(['a', 'b']);
    expect(clip?.edges.map((e) => e.id)).toEqual(['e-ab']);
  });

  it('pasteClipboard は新しい id でノードを複製し、貼り付けたノードだけが選択状態になる', () => {
    resetStore([makeNode('a', { selected: true, position: { x: 0, y: 0 } })]);
    useGraphStore.getState().copySelected();
    useGraphStore.getState().pasteClipboard();

    const { nodes } = useGraphStore.getState();
    expect(nodes).toHaveLength(2);
    const original = nodes.find((n) => n.id === 'a')!;
    const pasted = nodes.find((n) => n.id !== 'a')!;
    expect(original.selected).toBe(false);
    expect(pasted.selected).toBe(true);
    expect(pasted.position).not.toEqual({ x: 0, y: 0 });
  });

  it('内部エッジは新しいノード id を指すよう再割り当てされる', () => {
    resetStore(
      [makeNode('a', { selected: true }), makeNode('b', { selected: true })],
      [makeEdge('e-ab', 'a', 'b')],
    );
    useGraphStore.getState().copySelected();
    useGraphStore.getState().pasteClipboard();

    const { nodes, edges } = useGraphStore.getState();
    const pastedIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
    const newEdge = edges.find((e) => e.id !== 'e-ab')!;
    expect(pastedIds.has(newEdge.source)).toBe(true);
    expect(pastedIds.has(newEdge.target)).toBe(true);
  });

  it('連続でペーストするとオフセットがカスケードして重ならない', () => {
    resetStore([makeNode('a', { selected: true, position: { x: 0, y: 0 } })]);
    useGraphStore.getState().copySelected();
    useGraphStore.getState().pasteClipboard();
    useGraphStore.getState().pasteClipboard();

    const positions = useGraphStore.getState().nodes.map((n) => `${n.position.x},${n.position.y}`);
    expect(new Set(positions).size).toBe(positions.length);
  });

  it('duplicateSelected はコピー+ペーストを1回のUndo単位で行う', () => {
    resetStore([makeNode('a', { selected: true })]);
    useGraphStore.getState().duplicateSelected();

    expect(useGraphStore.getState().nodes).toHaveLength(2);
    expect(useGraphStore.getState().past).toHaveLength(1);

    useGraphStore.getState().undo();
    expect(useGraphStore.getState().nodes).toHaveLength(1);
  });

  it('空のクリップボードで pasteClipboard を呼んでも何も起きない', () => {
    resetStore([makeNode('a')]);
    useGraphStore.getState().pasteClipboard();
    expect(useGraphStore.getState().nodes).toHaveLength(1);
    expect(useGraphStore.getState().past).toHaveLength(0);
  });
});

describe('graphStore の autoLayout', () => {
  it('ノードの位置を書き換え、1件の履歴エントリを積む', () => {
    resetStore(
      [makeNode('a', { position: { x: 999, y: 999 } }), makeNode('b', { position: { x: 999, y: 999 } })],
      [makeEdge('e-ab', 'a', 'b')],
    );
    useGraphStore.getState().autoLayout();

    const { nodes, past } = useGraphStore.getState();
    expect(past).toHaveLength(1);
    const a = nodes.find((n) => n.id === 'a')!;
    const b = nodes.find((n) => n.id === 'b')!;
    expect(a.position.x).toBeLessThan(b.position.x);
  });

  it('ノードが無ければ何もしない(履歴も積まない)', () => {
    resetStore([]);
    useGraphStore.getState().autoLayout();
    expect(useGraphStore.getState().past).toHaveLength(0);
  });
});

describe('graphStore の loadGraph', () => {
  it('nodes/edges を置き換え、履歴をクリアする', () => {
    resetStore([makeNode('a')]);
    useGraphStore.getState().addNode('testNode', { x: 0, y: 0 });
    expect(useGraphStore.getState().past).toHaveLength(1);

    useGraphStore.getState().loadGraph([makeNode('z')], []);

    const state = useGraphStore.getState();
    expect(state.nodes.map((n) => n.id)).toEqual(['z']);
    expect(state.past).toHaveLength(0);
    expect(state.future).toHaveLength(0);
  });
});
