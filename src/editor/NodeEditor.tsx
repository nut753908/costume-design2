import { useCallback } from 'react';
import { ReactFlow, Background, Controls, type NodeTypes, type EdgeTypes, type Connection, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './nodeEditor.css';
import { useGraphStore } from '../state/graphStore';
import { getNodeType } from '../nodes/registry';
import { NumberInputNodeView } from './nodeComponents/NumberInputNode';
import { EnumInputNodeView } from './nodeComponents/EnumInputNode';
import { ColorInputNodeView } from './nodeComponents/ColorInputNode';
import { GenericNodeView } from './nodeComponents/GenericNode';
import { NodePalette } from './NodePalette';
import { DeletableEdge } from './DeletableEdge';

const nodeTypes: NodeTypes = {
  numberInput: NumberInputNodeView,
  enumInput: EnumInputNodeView,
  colorInput: ColorInputNodeView,
  numberMultiply: GenericNodeView,
  numberDisplay: GenericNodeView,
  skirtGenerator: GenericNodeView,
  topGenerator: GenericNodeView,
  sleeveGenerator: GenericNodeView,
  pantsGenerator: GenericNodeView,
  shoesGenerator: GenericNodeView,
  glovesGenerator: GenericNodeView,
  hatGenerator: GenericNodeView,
  toonMaterial: GenericNodeView,
  garmentOutput: GenericNodeView,
};

const edgeTypes: EdgeTypes = {
  default: DeletableEdge,
};

export function NodeEditor() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);

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

      return sourceSocket.type === targetSocket.type;
    },
    [nodes],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      isValidConnection={isValidConnection}
      fitView
    >
      <Background />
      <Controls />
      <NodePalette />
    </ReactFlow>
  );
}
