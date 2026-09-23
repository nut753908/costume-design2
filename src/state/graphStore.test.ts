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
  // 複数接続できる入力ソケット(`SocketDef.multiple`)を持つノード(onConnect のテスト用)。
  if (!nodeTypeRegistry.has('testMultiSink')) {
    registerNodeType({
      type: 'testMultiSink',
      label: 'Test Multi Sink',
      category: 'primitive',
      inputs: [{ id: 'items', label: 'Items', type: 'geometry', multiple: true }],
      outputs: [],
      createDefaultData: () => ({}),
      evaluate: () => ({}),
    });
  }
  // removeGroupIOSocket のテスト用(nodes/definitions/groupInput.ts/groupOutput.ts を
  // 模した最小限のスタブ)。
  if (!nodeTypeRegistry.has('groupInput')) {
    registerNodeType({
      type: 'groupInput',
      label: 'Group Input',
      category: 'group-io',
      inputs: [],
      outputs: [],
      createDefaultData: () => ({ sockets: [] }),
      evaluate: () => ({}),
    });
  }
  if (!nodeTypeRegistry.has('groupOutput')) {
    registerNodeType({
      type: 'groupOutput',
      label: 'Group Output',
      category: 'group-io',
      inputs: [],
      outputs: [],
      createDefaultData: () => ({ sockets: [] }),
      evaluate: (inputs) => inputs,
    });
  }
  // enterGroup/exitGroup のテスト用。createDefaultData() が毎回独立した内部ノード配列を
  // 返す(defineGroupNode の実際の挙動を模した最小限のスタブ)。
  if (!nodeTypeRegistry.has('testGroupNode')) {
    registerNodeType({
      type: 'testGroupNode',
      label: 'Test Group',
      category: 'group',
      inputs: [],
      outputs: [],
      createDefaultData: () => ({
        nodes: [makeNode('inner-a'), makeNode('inner-b')],
        edges: [makeEdge('inner-e', 'inner-a', 'inner-b')],
      }),
      evaluate: () => ({}),
    });
  }
});

function makeNode(id: string, overrides: Partial<Node> = {}): Node {
  return { id, type: 'testNode', position: { x: 0, y: 0 }, data: {}, ...overrides };
}

function makeEdge(id: string, source: string, target: string): Edge {
  return { id, source, sourceHandle: 'value', target, targetHandle: 'value' };
}

function makeGroupNode(id: string, overrides: Partial<Node> = {}): Node {
  return { id, type: 'testGroupNode', position: { x: 0, y: 0 }, data: {}, ...overrides };
}

function makeGroupIONode(
  id: string,
  type: 'groupInput' | 'groupOutput',
  sockets: { id: string }[],
  overrides: Partial<Node> = {},
): Node {
  return { id, type, position: { x: 0, y: 0 }, data: { sockets }, ...overrides };
}

/** 各テストの前にストアを既知の状態にリセットする(zustand のストアはモジュール単位の
 * シングルトンなので、テスト間で状態が漏れないよう明示的に初期化する)。 */
function resetStore(nodes: Node[] = [], edges: Edge[] = []) {
  useGraphStore.setState({
    nodes,
    edges,
    evaluatedResults: null,
    rootEvaluatedResults: null,
    scopeStack: [],
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
  vi.unstubAllGlobals();
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

  it('配線付きノードの削除(接続エッジの削除+ノードの削除の2回の呼び出し)は履歴1件にまとまり、Undo 1回で元に戻る', () => {
    resetStore([makeNode('a'), makeNode('b')], [makeEdge('e-ab', 'a', 'b')]);
    useGraphStore.getState().onEdgesChange([{ id: 'e-ab', type: 'remove' }]);
    useGraphStore.getState().onNodesChange([{ id: 'b', type: 'remove' }]);

    expect(useGraphStore.getState().nodes.map((n) => n.id)).toEqual(['a']);
    expect(useGraphStore.getState().edges).toHaveLength(0);
    expect(useGraphStore.getState().past).toHaveLength(1);

    useGraphStore.getState().undo();
    expect(useGraphStore.getState().nodes.map((n) => n.id).sort()).toEqual(['a', 'b']);
    expect(useGraphStore.getState().edges).toHaveLength(1);
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

  it('onConnect は同じ入力ソケットへの既存の接続を新しい接続に置き換える(evaluateGraph が最初の接続しか見ないため、放置すると新しい方が黙って無視される)', () => {
    resetStore([makeNode('a'), makeNode('b'), makeNode('c')]);
    useGraphStore.getState().onConnect({ source: 'a', sourceHandle: 'value', target: 'c', targetHandle: 'value' });
    useGraphStore.getState().onConnect({ source: 'b', sourceHandle: 'value', target: 'c', targetHandle: 'value' });

    const { edges } = useGraphStore.getState();
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('b');
  });

  it('onConnect は複数接続できる入力ソケット(multiple)への既存の接続を置き換えず、追加する', () => {
    resetStore([makeNode('a'), makeNode('b'), makeNode('m', { type: 'testMultiSink' })]);
    useGraphStore.getState().onConnect({ source: 'a', sourceHandle: 'value', target: 'm', targetHandle: 'items' });
    useGraphStore.getState().onConnect({ source: 'b', sourceHandle: 'value', target: 'm', targetHandle: 'items' });

    expect(useGraphStore.getState().edges.map((e) => e.source)).toEqual(['a', 'b']);
  });

  it('異なる入力ソケットへの接続は置き換えられず両方残る', () => {
    resetStore([makeNode('a'), makeNode('b'), makeNode('c')]);
    useGraphStore.getState().onConnect({ source: 'a', sourceHandle: 'value', target: 'c', targetHandle: 'x' });
    useGraphStore.getState().onConnect({ source: 'b', sourceHandle: 'value', target: 'c', targetHandle: 'y' });

    expect(useGraphStore.getState().edges).toHaveLength(2);
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

describe('graphStore の pickUpEdge/dropPickedEdge', () => {
  it('掴んだ時点でエッジを外し、落とした先へ繋ぐ。Undo 1回で掴む前に戻る', () => {
    resetStore([makeNode('a'), makeNode('b'), makeNode('c')], [makeEdge('e1', 'a', 'b')]);

    useGraphStore.getState().pickUpEdge('e1');
    expect(useGraphStore.getState().edges).toEqual([]);

    useGraphStore.getState().dropPickedEdge({ source: 'a', sourceHandle: 'value', target: 'c', targetHandle: 'value' });
    expect(useGraphStore.getState().edges.map((e) => [e.source, e.target])).toEqual([['a', 'c']]);
    expect(useGraphStore.getState().past).toHaveLength(1);

    useGraphStore.getState().undo();
    expect(useGraphStore.getState().edges).toEqual([makeEdge('e1', 'a', 'b')]);
  });

  it('落とした先の入力に既存の接続があれば置き換える', () => {
    resetStore([makeNode('a'), makeNode('b'), makeNode('c')], [makeEdge('e1', 'a', 'b'), makeEdge('e2', 'b', 'c')]);

    useGraphStore.getState().pickUpEdge('e1');
    useGraphStore.getState().dropPickedEdge({ source: 'a', sourceHandle: 'value', target: 'c', targetHandle: 'value' });

    expect(useGraphStore.getState().edges.map((e) => [e.source, e.target])).toEqual([['a', 'c']]);
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
  it('nodes/edges を置き換え、Undo で読み込み前に戻し Redo で再度読み込める', () => {
    resetStore([makeNode('a')]);

    useGraphStore.getState().loadGraph([makeNode('z')], []);
    expect(useGraphStore.getState().nodes.map((n) => n.id)).toEqual(['z']);

    useGraphStore.getState().undo();
    expect(useGraphStore.getState().nodes.map((n) => n.id)).toEqual(['a']);

    useGraphStore.getState().redo();
    expect(useGraphStore.getState().nodes.map((n) => n.id)).toEqual(['z']);
  });

  // loadGraph が evaluatedResults を無条件に null へリセットしていた頃のバグの回帰テスト。
  // Garments.tsx は state.evaluatedResults を直接読むが、それを埋め戻すのは
  // useEvaluatedGraph.ts の useEffect(nodesLite/edgesLite の参照が実際に変化した時にしか
  // 発火しない)のみ。loadGraph に渡す nodes/edges が現在の state と同一参照(例:
  // PresetPanel.tsx の「初期状態」プリセットを2回連続でLoadする)だと、その useEffect が
  // 発火する保証がなく、evaluatedResults が null のまま固まってガーメントが消えていた。
  it('渡された nodes/edges が現在の state と同一参照でも evaluatedResults を null にリセットしない', () => {
    const nodes = [makeNode('a')];
    const edges: Edge[] = [];
    resetStore(nodes, edges);
    useGraphStore.setState({ evaluatedResults: new Map() });

    useGraphStore.getState().loadGraph(nodes, edges);

    expect(useGraphStore.getState().evaluatedResults).not.toBeNull();
  });
});

describe('graphStore の loadGroupGraph', () => {
  it('Undo で内部グラフと親ノードの templateFingerprint を読み込み前に戻す', () => {
    resetStore([makeGroupNode('g')]);
    useGraphStore.getState().enterGroup('g');
    const before = useGraphStore.getState();

    useGraphStore.getState().loadGroupGraph([makeNode('z')], [], 'fp-new');
    const parentData = () => {
      const frame = useGraphStore.getState().scopeStack.at(-1)!;
      return frame.nodes.find((n) => n.id === 'g')!.data as { templateFingerprint?: string };
    };
    expect(parentData().templateFingerprint).toBe('fp-new');

    useGraphStore.getState().undo();
    expect(useGraphStore.getState().nodes).toBe(before.nodes);
    expect(useGraphStore.getState().scopeStack).toBe(before.scopeStack);

    useGraphStore.getState().redo();
    expect(useGraphStore.getState().nodes.map((n) => n.id)).toEqual(['z']);
    expect(parentData().templateFingerprint).toBe('fp-new');
  });
});

describe('graphStore の enterGroup/exitGroup/exitToLevel', () => {
  it('category が group でないノードでは何も起きない', () => {
    resetStore([makeNode('a')]);
    useGraphStore.getState().enterGroup('a');
    const state = useGraphStore.getState();
    expect(state.scopeStack).toHaveLength(0);
    expect(state.nodes.map((n) => n.id)).toEqual(['a']);
  });

  it('data.nodes が未実体化(data:{})なら createDefaultData() で実体化してから中に入る', () => {
    resetStore([makeGroupNode('g')]);
    useGraphStore.getState().enterGroup('g');

    const state = useGraphStore.getState();
    expect(state.scopeStack).toHaveLength(1);
    expect(state.scopeStack[0].parentId).toBe('g');
    expect(state.nodes.map((n) => n.id).sort()).toEqual(['inner-a', 'inner-b']);
    expect(state.edges.map((e) => e.id)).toEqual(['inner-e']);
    // 実体化された data が、退避されたトップレベルのノード自身にも書き込まれている。
    const parentAtTopLevel = state.scopeStack[0].nodes.find((n) => n.id === 'g');
    expect(parentAtTopLevel).toBeDefined();
    expect((parentAtTopLevel!.data as { nodes?: Node[] }).nodes).toBeDefined();
  });

  it('未実体化のグループへ入っても、ノードカード上の入力欄の値(data[socketId])は保たれる', () => {
    const node = makeGroupNode('g');
    resetStore([{ ...node, data: { ...node.data, offset: 1.5 } }]);
    useGraphStore.getState().enterGroup('g');
    useGraphStore.getState().exitGroup();

    const g = useGraphStore.getState().nodes.find((n) => n.id === 'g');
    expect((g!.data as { offset?: number }).offset).toBe(1.5);
    expect((g!.data as { nodes?: Node[] }).nodes).toBeDefined();
  });

  it('exitGroup で編集結果が親ノードの data へ書き戻され、上位階層の nodes/edges が復元される', () => {
    resetStore([makeGroupNode('g'), makeNode('sibling')]);
    useGraphStore.getState().enterGroup('g');

    // 中で1ノード追加する(実際のキャンバス編集を模す)。
    useGraphStore.getState().addNode('testNode', { x: 10, y: 10 });
    const insideIds = useGraphStore.getState().nodes.map((n) => n.id);
    expect(insideIds).toHaveLength(3); // inner-a, inner-b, 追加した1つ

    useGraphStore.getState().exitGroup();

    const state = useGraphStore.getState();
    expect(state.scopeStack).toHaveLength(0);
    expect(state.nodes.map((n) => n.id).sort()).toEqual(['g', 'sibling']);
    const g = state.nodes.find((n) => n.id === 'g');
    expect(g).toBeDefined();
    expect((g!.data as { nodes?: Node[] }).nodes?.map((n) => n.id)).toEqual(insideIds);
  });

  it('enter/exit を跨いで Undo でき、表示中の階層もその時点へ戻る', () => {
    resetStore([makeGroupNode('g')]);
    useGraphStore.getState().addNode('testNode', { x: 0, y: 0 });
    useGraphStore.getState().enterGroup('g');
    useGraphStore.getState().addNode('testNode', { x: 0, y: 0 });
    useGraphStore.getState().exitGroup();

    // グループ内の addNode を取り消す: グループの中へ戻る(テンプレートの inner-a/inner-b だけになる)。
    useGraphStore.getState().undo();
    expect(useGraphStore.getState().scopeStack.map((f) => f.parentId)).toEqual(['g']);
    expect(useGraphStore.getState().nodes.map((n) => n.id)).toEqual(['inner-a', 'inner-b']);

    // トップレベルの addNode を取り消す: トップレベルへ戻る。
    useGraphStore.getState().undo();
    expect(useGraphStore.getState().scopeStack).toHaveLength(0);
    expect(useGraphStore.getState().nodes.map((n) => n.id)).toEqual(['g']);

    // Redo 2回で最初の Undo の直前(exitGroup 後のトップレベル)へ戻る。
    useGraphStore.getState().redo();
    useGraphStore.getState().redo();
    const state = useGraphStore.getState();
    expect(state.scopeStack).toHaveLength(0);
    expect(state.nodes).toHaveLength(2);
    const g = state.nodes.find((n) => n.id === 'g')!;
    expect((g.data as { nodes?: Node[] }).nodes).toHaveLength(3);
  });

  it('enter/exit は Undo 履歴を積まない', () => {
    resetStore([makeGroupNode('g')]);
    useGraphStore.getState().enterGroup('g');
    useGraphStore.getState().exitGroup();
    expect(useGraphStore.getState().past).toHaveLength(0);
  });

  it('exitToLevel(-1) は多段ネストでも一気にトップレベルへ戻る', () => {
    resetStore([makeGroupNode('outer')]);
    useGraphStore.getState().enterGroup('outer');
    // 中に入った状態でさらにグループノードを1つ追加し、その中にも入る。
    useGraphStore.getState().addNode('testGroupNode', { x: 0, y: 0 });
    const innerGroupId = useGraphStore.getState().nodes.find((n) => n.type === 'testGroupNode')!.id;
    useGraphStore.getState().enterGroup(innerGroupId);
    expect(useGraphStore.getState().scopeStack).toHaveLength(2);

    useGraphStore.getState().exitToLevel(-1);

    const state = useGraphStore.getState();
    expect(state.scopeStack).toHaveLength(0);
    expect(state.nodes.map((n) => n.id)).toEqual(['outer']);
  });
});

describe('graphStore の removeGroupIOSocket', () => {
  it('groupInput/groupOutput 以外のノードには何もしない', () => {
    resetStore([makeNode('a', { data: { sockets: [{ id: 'x' }] } })]);
    useGraphStore.getState().removeGroupIOSocket('a', 'x');
    const node = useGraphStore.getState().nodes.find((n) => n.id === 'a')!;
    expect((node.data as { sockets?: unknown[] }).sockets).toEqual([{ id: 'x' }]);
  });

  it('外部/内部エッジが無ければ、確認無しでそのままソケットを削除する', () => {
    const confirmMock = vi.fn();
    vi.stubGlobal('confirm', confirmMock);
    resetStore([makeGroupIONode('input', 'groupInput', [{ id: 'a' }, { id: 'b' }])]);

    useGraphStore.getState().removeGroupIOSocket('input', 'a');

    const node = useGraphStore.getState().nodes.find((n) => n.id === 'input')!;
    expect((node.data as { sockets: { id: string }[] }).sockets).toEqual([{ id: 'b' }]);
    expect(confirmMock).not.toHaveBeenCalled();
  });

  it('groupInput の場合、そのソケットを source とする現在階層の内部エッジも削除する', () => {
    resetStore(
      [makeGroupIONode('input', 'groupInput', [{ id: 'a' }]), makeNode('consumer')],
      [{ id: 'e-a', source: 'input', sourceHandle: 'a', target: 'consumer', targetHandle: 'value' }],
    );

    useGraphStore.getState().removeGroupIOSocket('input', 'a');

    expect(useGraphStore.getState().edges).toEqual([]);
  });

  it('groupOutput の場合、そのソケットを target とする現在階層の内部エッジも削除する', () => {
    resetStore(
      [makeNode('producer'), makeGroupIONode('output', 'groupOutput', [{ id: 'a' }])],
      [{ id: 'e-a', source: 'producer', sourceHandle: 'value', target: 'output', targetHandle: 'a' }],
    );

    useGraphStore.getState().removeGroupIOSocket('output', 'a');

    expect(useGraphStore.getState().edges).toEqual([]);
  });

  it('グループの中に入っている状態で1つ上の階層に外部接続が残っていれば確認ダイアログを出し、承諾すれば外部エッジも削除する', () => {
    const confirmMock = vi.fn().mockReturnValue(true);
    vi.stubGlobal('confirm', confirmMock);

    resetStore([makeGroupNode('g'), makeNode('outerSrc')]);
    useGraphStore.setState({ edges: [makeEdge('e-outer', 'outerSrc', 'g')] });
    useGraphStore.getState().enterGroup('g');
    useGraphStore.getState().addNode('groupInput', { x: 0, y: 0 });
    const inputId = useGraphStore.getState().nodes.find((n) => n.type === 'groupInput')!.id;
    // makeEdge のデフォルト handle 名 'value' に合わせて、'value' という外部ソケットを持たせる。
    useGraphStore.getState().updateNodeData(inputId, { sockets: [{ id: 'value' }] });

    useGraphStore.getState().removeGroupIOSocket(inputId, 'value');

    expect(confirmMock).toHaveBeenCalledTimes(1);
    const frame = useGraphStore.getState().scopeStack.at(-1)!;
    expect(frame.edges).toEqual([]);
    const inputNode = useGraphStore.getState().nodes.find((n) => n.id === inputId)!;
    expect((inputNode.data as { sockets: unknown[] }).sockets).toEqual([]);
  });

  it('Undo で1つ上の階層の外部エッジも復元する', () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));

    resetStore([makeGroupNode('g'), makeNode('outerSrc')]);
    useGraphStore.setState({ edges: [makeEdge('e-outer', 'outerSrc', 'g')] });
    useGraphStore.getState().enterGroup('g');
    useGraphStore.getState().addNode('groupInput', { x: 0, y: 0 });
    const inputId = useGraphStore.getState().nodes.find((n) => n.type === 'groupInput')!.id;
    useGraphStore.getState().updateNodeData(inputId, { sockets: [{ id: 'value' }] });

    useGraphStore.getState().removeGroupIOSocket(inputId, 'value');
    useGraphStore.getState().undo();

    expect(useGraphStore.getState().scopeStack.at(-1)!.edges).toEqual([makeEdge('e-outer', 'outerSrc', 'g')]);
  });

  it('確認ダイアログでキャンセルすると何も変更しない', () => {
    const confirmMock = vi.fn().mockReturnValue(false);
    vi.stubGlobal('confirm', confirmMock);

    resetStore([makeGroupNode('g'), makeNode('outerSrc')]);
    useGraphStore.setState({ edges: [makeEdge('e-outer', 'outerSrc', 'g')] });
    useGraphStore.getState().enterGroup('g');
    useGraphStore.getState().addNode('groupInput', { x: 0, y: 0 });
    const inputId = useGraphStore.getState().nodes.find((n) => n.type === 'groupInput')!.id;
    useGraphStore.getState().updateNodeData(inputId, { sockets: [{ id: 'value' }] });

    useGraphStore.getState().removeGroupIOSocket(inputId, 'value');

    expect(confirmMock).toHaveBeenCalledTimes(1);
    const frame = useGraphStore.getState().scopeStack.at(-1)!;
    expect(frame.edges).toEqual([makeEdge('e-outer', 'outerSrc', 'g')]);
    const inputNode = useGraphStore.getState().nodes.find((n) => n.id === inputId)!;
    expect((inputNode.data as { sockets: unknown[] }).sockets).toEqual([{ id: 'value' }]);
  });
});
