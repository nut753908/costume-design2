import { useCallback, useEffect, useRef, useState, type DragEvent, type FocusEvent, type KeyboardEvent } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type NodeTypes,
  type EdgeTypes,
  type Connection,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './nodeEditor.css';
import '../nodes/definitions'; // 下の nodeTypes 導出がレジストリに依存するため、副作用インポートで登録を確実に済ませておく
import { useGraphStore, externalEdgesOrphanedByRemoval } from '../state/graphStore';
import { nodeTypeRegistry } from '../nodes/registry';
import { hasCycle } from '../nodes/evaluateGraph';
import { resolveNodeSockets } from '../nodes/resolveNodeSockets';
import { NumberInputNodeView } from './nodeComponents/NumberInputNode';
import { ColorInputNodeView } from './nodeComponents/ColorInputNode';
import { NumberDisplayNodeView } from './nodeComponents/NumberDisplayNode';
import { ColorDisplayNodeView } from './nodeComponents/ColorDisplayNode';
import { GroupInputNodeView } from './nodeComponents/GroupInputNode';
import { GroupOutputNodeView } from './nodeComponents/GroupOutputNode';
import { GenericNodeView } from './nodeComponents/GenericNode';
import { withControlClickGuard } from './nodeComponents/withControlClickGuard';
import { SocketEdge } from './SocketEdge';
import { NodePalette } from './NodePalette';
import { GraphIO } from './GraphIO';
import { PresetPanel } from './PresetPanel';
import { HistoryControls } from './HistoryControls';
import { NodeClipboard } from './NodeClipboard';
import { PaneContextMenu, type PaneContextMenuState } from './PaneContextMenu';
import { SelectionContextMenu, type SelectionContextMenuState } from './SelectionContextMenu';
import { BreadcrumbPanel } from './BreadcrumbPanel';
import { NODE_TYPE_DND_MIME, fitViewPadding } from './paletteShared';
import type { CustomCardType } from '../nodes/customCardTypes';

// 専用のカード UI を持つノード(`CUSTOM_CARD_TYPES`)以外は、レジストリに登録済みの全ノードタイプへ
// GenericNodeView を自動で割り当てる。新しいノードタイプを追加してもここへの追記が
// 不要になり、登録漏れ(=ノードが描画されない不具合)を構造的に防ぐ。
// キーは `CUSTOM_CARD_TYPES` と完全に一致させる(型で強制)。増やすときは高さの見積もりも対応させる。
const NODE_VIEW_OVERRIDES: Record<CustomCardType, NodeTypes[string]> = {
  numberInput: NumberInputNodeView,
  colorInput: ColorInputNodeView,
  numberDisplay: NumberDisplayNodeView,
  colorDisplay: ColorDisplayNodeView,
  groupInput: GroupInputNodeView,
  groupOutput: GroupOutputNodeView,
};

const nodeTypes: NodeTypes = Object.fromEntries(
  Array.from(nodeTypeRegistry.keys(), (type) => [
    type,
    withControlClickGuard(NODE_VIEW_OVERRIDES[type as CustomCardType] ?? GenericNodeView),
  ]),
);

// エッジは type を指定せずに作る(= 'default')ため、既定の描画ごと SocketEdge に差し替える。
const edgeTypes: EdgeTypes = { default: SocketEdge };

function NodeEditorInner() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);
  const addNode = useGraphStore((s) => s.addNode);
  // 深さだけでなく経路で区別する: Undo/Redo では同じ深さのまま別のグループの中へ移りうる。
  const scopePath = useGraphStore((s) => s.scopeStack.map((f) => f.parentId).join('/'));
  const { screenToFlowPosition, fitView } = useReactFlow();

  // 表示する階層が変わるたびに、新しいスコープのノード群が画面内に収まるよう
  // fitView し直す(fitView props は初回マウント時にしか効かないため)。
  useEffect(() => {
    requestAnimationFrame(() => fitView({ padding: fitViewPadding(), duration: 300 }));
  }, [scopePath, fitView]);

  // <ReactFlow> 自体は階層が変わっても(enterGroup/exitGroup・階層を跨ぐ Undo/Redo)アンマウントされず、nodes/edges の
  // props だけが丸ごと差し替わる(state/CLAUDE.md の「グループの中に入る」節参照)。
  // すべてのグループの groupInput/groupOutput ノードは慣例的に id 'input'/'output' を
  // 使う(nodes/CLAUDE.md 参照)ため、多段ネスト(例: bodyGroup の中の bodyDimensionsGroup)
  // では props 差し替えの前後で同じ id 'input' のノードを React が「同一要素の更新」と
  // 誤認しうる。実際に発生した不具合として、Body Dimensions グループへ一度入って出て、
  // 再度入り直すと(bodyGroup 自身の 'input' → bodyDimensionsGroup の 'input' → …と
  // 同じ id が複数回入れ替わった後)、Group Input ノードの出力から伸びるはずのエッジが
  // ストア上のデータ(evaluateGraph・Export JSON では正しい)とは無関係に描画されなくなる、
  // という React Flow 側のハンドル計測キャッシュの取り違えが起きていた。`key={scopePath}`
  // を <ReactFlow> に付けてスコープが変わるたびに強制的にアンマウント→再マウントさせることで、
  // 内部キャッシュを毎回まっさらな状態から作り直させ、この取り違えを避けている
  // (NodePalette の検索文字列などスコープを跨いで保持する意味の無い軽量な子コンポーネントの
  // ローカル state がリセットされる副作用はあるが、実害はない)。
  const [menuState, setMenuState] = useState<PaneContextMenuState | null>(null);
  const [selectionMenuState, setSelectionMenuState] = useState<SelectionContextMenuState | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectOnly = useCallback(
    (target: { kind: 'node' | 'edge'; id: string }) => {
      onNodesChange(nodes.map((n) => ({ id: n.id, type: 'select', selected: target.kind === 'node' && n.id === target.id })));
      onEdgesChange(edges.map((e) => ({ id: e.id, type: 'select', selected: target.kind === 'edge' && e.id === target.id })));
    },
    [nodes, edges, onNodesChange, onEdgesChange],
  );

  // 右クリックしたノード/エッジが既に選択されていればその選択全体を対象にし、
  // 選択されていなければそれ単体だけを選択し直す(Blender などと同じ挙動)。
  // target を省略すると(範囲選択の枠の右クリック)今の選択をそのまま対象にする。
  // onNodeContextMenu などの右クリックと handleKeyDown(Shift+F10 等でのキーボード起動)から使う。
  const openSelectionMenu = useCallback(
    (x: number, y: number, target?: { kind: 'node' | 'edge'; id: string }) => {
      const isSelected =
        target?.kind === 'node'
          ? nodes.find((n) => n.id === target.id)?.selected
          : edges.find((e) => e.id === target?.id)?.selected;
      if (target && !isSelected) selectOnly(target);
      setMenuState(null);
      setSelectionMenuState({ x, y, edgeOnly: target?.kind === 'edge' });
    },
    [nodes, edges, selectOnly],
  );

  // Tab キーでノード(またはカード内の入力欄など)へフォーカスが移ったら、クリックと同じくそのノード単体を選択する。
  // Shift+Tab ではノード本体より先にカード内の最後の欄へ入るため、ノード本体へのフォーカスだけでは足りない。
  // マウスのクリックでもフォーカスは移るため直前のキーが Tab のときに限る — でないと複数選択が潰れたり、
  // カード上の欄の操作でノードを選択してしまう(入力欄は :focus-visible がマウスでも付くため判定に使えない)。
  const tabbingRef = useRef(false);
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      tabbingRef.current = event.key === 'Tab';
    };
    const onPointerDown = () => {
      tabbingRef.current = false;
    };
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, []);
  const handleFocus = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (!tabbingRef.current) return;
      const nodeId = (event.target as HTMLElement).closest<HTMLElement>('.react-flow__node')?.dataset.id;
      if (nodeId && !nodes.find((n) => n.id === nodeId)?.selected) selectOnly({ kind: 'node', id: nodeId });
    },
    [nodes, selectOnly],
  );

  // マウスなしでもノードの右クリックメニュー(複製/コピー/削除)を開けるようにする。
  // フォーカスがノード上にある状態で ContextMenu キー(または Shift+F10)を押すと、
  // ブラウザが本来ネイティブの contextmenu イベントを合成する場合もあるが、確実性のため
  // ここで明示的にハンドリングする。ペイン背景自体は React Flow の既定では Tab で
  // フォーカスできないため、パレット等の既存の代替経路があるペイン用メニューは対象外。
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const isMenuKey = event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');
      if (!isMenuKey) return;

      const nodeEl = (event.target as HTMLElement).closest<HTMLElement>('.react-flow__node');
      const nodeId = nodeEl?.dataset.id;
      if (!nodeEl || !nodeId) return;

      event.preventDefault();
      const rect = nodeEl.getBoundingClientRect();
      openSelectionMenu(rect.left + rect.width / 2, rect.top + rect.height / 2, { kind: 'node', id: nodeId });
    },
    [openSelectionMenu],
  );

  // 宣言された型(number/color/geometry/material)が同じソケット同士の接続のみを許可する。
  // Geometry Nodes が型の合わないソケット接続を拒否するのと同じ挙動。
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      if (connection.source === connection.target) return false;

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return false;

      const sourceSocket = resolveNodeSockets(sourceNode.type ?? '', sourceNode.data).outputs.find(
        (s) => s.id === connection.sourceHandle,
      );
      const targetSocket = resolveNodeSockets(targetNode.type ?? '', targetNode.data).inputs.find(
        (s) => s.id === connection.targetHandle,
      );
      if (!sourceSocket || !targetSocket) return false;
      if (sourceSocket.type !== targetSocket.type) return false;

      // この接続を加えた結果グラフが循環してしまうなら拒否する。循環したまま
      // onConnect が走ると次の描画で evaluateGraph() が GraphCycleError を投げ、
      // どこにも try/catch が無いため白画面クラッシュに直結する — 事前に弾く。
      return !hasCycle(nodes, [
        ...edges,
        { source: connection.source, target: connection.target },
      ]);
    },
    [nodes, edges],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData(NODE_TYPE_DND_MIME);
      if (!type) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNode(type, position);
    },
    [addNode, screenToFlowPosition],
  );

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }} onKeyDown={handleKeyDown} onFocus={handleFocus}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        deleteKeyCode={['Backspace', 'Delete']}
        // Group Input/Output を削除すると1つ上の階層の外部ソケットも消えるため、そこへの接続が
        // あれば(ソケットの「×」ボタンと同じく)確認してから消す。外部エッジの削除は onNodesChange。
        onBeforeDelete={async ({ nodes: removing }) => {
          const orphans = externalEdgesOrphanedByRemoval(useGraphStore.getState(), new Set(removing.map((n) => n.id)));
          return (
            orphans.length === 0 ||
            confirm(`グループの外から${orphans.length}本接続されている入出力が無くなります。削除すると接続も切れます。よろしいですか?`)
          );
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        isValidConnection={isValidConnection}
        onPaneContextMenu={(event) => {
          event.preventDefault();
          setSelectionMenuState(null);
          setMenuState({ x: event.clientX, y: event.clientY });
        }}
        onNodeContextMenu={(event, node) => {
          event.preventDefault();
          openSelectionMenu(event.clientX, event.clientY, { kind: 'node', id: node.id });
        }}
        onEdgeContextMenu={(event, edge) => {
          event.preventDefault();
          openSelectionMenu(event.clientX, event.clientY, { kind: 'edge', id: edge.id });
        }}
        onSelectionContextMenu={(event) => {
          event.preventDefault();
          openSelectionMenu(event.clientX, event.clientY);
        }}
        onPaneClick={() => {
          setMenuState(null);
          setSelectionMenuState(null);
        }}
        onMoveStart={() => {
          setMenuState(null);
          setSelectionMenuState(null);
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        fitViewOptions={{ padding: fitViewPadding() }}
        minZoom={0.1}
        key={scopePath}
      >
        <Background />
        <Controls fitViewOptions={{ padding: fitViewPadding() }} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor="#fdfaf4"
          nodeStrokeColor="#333"
          maskColor="#fdfaf4b3"
          style={{ width: 150, height: 110 }}
        />
        <Panel position="top-left" className="panel-stack panel-stack--left">
          <BreadcrumbPanel />
          <NodePalette />
        </Panel>
        <Panel position="top-right" className="panel-stack panel-stack--right">
          <GraphIO />
          <HistoryControls />
        </Panel>
        <PresetPanel />
        <PaneContextMenu state={menuState} onClose={() => setMenuState(null)} boundsRef={wrapperRef} />
        <SelectionContextMenu state={selectionMenuState} onClose={() => setSelectionMenuState(null)} boundsRef={wrapperRef} />
        <NodeClipboard />
      </ReactFlow>
    </div>
  );
}

export function NodeEditor() {
  return (
    <ReactFlowProvider>
      <NodeEditorInner />
    </ReactFlowProvider>
  );
}
