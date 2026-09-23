import { useCallback, useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
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
import { useGraphStore } from '../state/graphStore';
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
import { withSocketClickGuard } from './nodeComponents/withSocketClickGuard';
import { SocketEdge } from './SocketEdge';
import { NodePalette } from './NodePalette';
import { GraphIO } from './GraphIO';
import { PresetPanel } from './PresetPanel';
import { HistoryControls } from './HistoryControls';
import { NodeClipboard } from './NodeClipboard';
import { ContextMenu, type ContextMenuState } from './ContextMenu';
import { NodeContextMenu, type NodeContextMenuState } from './NodeContextMenu';
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
    withSocketClickGuard(NODE_VIEW_OVERRIDES[type as CustomCardType] ?? GenericNodeView),
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
  const [menuState, setMenuState] = useState<ContextMenuState | null>(null);
  const [nodeMenuState, setNodeMenuState] = useState<NodeContextMenuState | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 右クリックしたノードが既存の複数選択に含まれていればその選択全体を対象にし、
  // 含まれていなければそのノード単体だけを選択し直す(Blender などと同じ挙動)。
  // onNodeContextMenu(右クリック)と handleKeyDown(Shift+F10 等でのキーボード起動)の両方から使う。
  const openNodeMenu = useCallback(
    (nodeId: string, x: number, y: number) => {
      const isPartOfSelection =
        (nodes.find((n) => n.id === nodeId)?.selected ?? false) && nodes.some((n) => n.selected);
      if (!isPartOfSelection) {
        onNodesChange(nodes.map((n) => ({ id: n.id, type: 'select', selected: n.id === nodeId })));
      }
      setMenuState(null);
      setNodeMenuState({ x, y });
    },
    [nodes, onNodesChange],
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
      openNodeMenu(nodeId, rect.left + rect.width / 2, rect.top + rect.height / 2);
    },
    [openNodeMenu],
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
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }} onKeyDown={handleKeyDown}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        deleteKeyCode={['Backspace', 'Delete']}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        isValidConnection={isValidConnection}
        onPaneContextMenu={(event) => {
          event.preventDefault();
          setNodeMenuState(null);
          setMenuState({ x: event.clientX, y: event.clientY });
        }}
        onNodeContextMenu={(event, node) => {
          event.preventDefault();
          openNodeMenu(node.id, event.clientX, event.clientY);
        }}
        onPaneClick={() => {
          setMenuState(null);
          setNodeMenuState(null);
        }}
        onMoveStart={() => {
          setMenuState(null);
          setNodeMenuState(null);
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
        <NodePalette />
        <Panel position="top-center" className="top-panel-stack">
          <HistoryControls />
          <BreadcrumbPanel />
        </Panel>
        <GraphIO />
        <PresetPanel />
        <ContextMenu state={menuState} onClose={() => setMenuState(null)} boundsRef={wrapperRef} />
        <NodeContextMenu state={nodeMenuState} onClose={() => setNodeMenuState(null)} boundsRef={wrapperRef} />
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
