import { useCallback, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type EdgeTypes,
  type Connection,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './nodeEditor.css';
import { useGraphStore } from '../state/graphStore';
import { getNodeType } from '../nodes/registry';
import { hasCycle } from '../nodes/evaluateGraph';
import { NumberInputNodeView } from './nodeComponents/NumberInputNode';
import { EnumInputNodeView } from './nodeComponents/EnumInputNode';
import { ColorInputNodeView } from './nodeComponents/ColorInputNode';
import { GenericNodeView } from './nodeComponents/GenericNode';
import { NodePalette } from './NodePalette';
import { DeletableEdge } from './DeletableEdge';
import { GraphIO } from './GraphIO';
import { PresetPanel } from './PresetPanel';
import { HistoryControls } from './HistoryControls';
import { NodeClipboard } from './NodeClipboard';
import { ContextMenu, type ContextMenuState } from './ContextMenu';
import { NodeContextMenu, type NodeContextMenuState } from './NodeContextMenu';
import { NODE_TYPE_DND_MIME } from './paletteShared';

const nodeTypes: NodeTypes = {
  numberInput: NumberInputNodeView,
  enumInput: EnumInputNodeView,
  colorInput: ColorInputNodeView,
  numberMultiply: GenericNodeView,
  numberDisplay: GenericNodeView,
  skirtGenerator: GenericNodeView,
  topGenerator: GenericNodeView,
  dressGenerator: GenericNodeView,
  bagGenerator: GenericNodeView,
  necktieGenerator: GenericNodeView,
  glassesGenerator: GenericNodeView,
  sleeveGenerator: GenericNodeView,
  pantsGenerator: GenericNodeView,
  shoesGenerator: GenericNodeView,
  glovesGenerator: GenericNodeView,
  hatGenerator: GenericNodeView,
  beltGenerator: GenericNodeView,
  scarfGenerator: GenericNodeView,
  jacketGenerator: GenericNodeView,
  socksGenerator: GenericNodeView,
  toonMaterial: GenericNodeView,
  garmentOutput: GenericNodeView,
};

const edgeTypes: EdgeTypes = {
  default: DeletableEdge,
};

function NodeEditorInner() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);
  const addNode = useGraphStore((s) => s.addNode);
  const { screenToFlowPosition } = useReactFlow();
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

  // 宣言された型(number/color/enum/geometry/material)が同じソケット同士の接続のみを許可する。
  // Geometry Nodes が型の合わないソケット接続を拒否するのと同じ挙動。
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      if (connection.source === connection.target) return false;

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return false;

      const sourceSocket = getNodeType(sourceNode.type ?? '').outputs.find(
        (s) => s.id === connection.sourceHandle,
      );
      const targetSocket = getNodeType(targetNode.type ?? '').inputs.find(
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
      >
        <Background />
        <Controls />
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
        <HistoryControls />
        <GraphIO />
        <PresetPanel />
        <ContextMenu state={menuState} onClose={() => setMenuState(null)} />
        <NodeContextMenu state={nodeMenuState} onClose={() => setNodeMenuState(null)} />
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
