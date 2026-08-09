import { useCallback } from 'react';
import { ReactFlow, Background, Controls, type NodeTypes, type Connection, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './nodeEditor.css';
import { useGraphStore } from '../state/graphStore';
import { getNodeType } from '../nodes/registry';
import { NumberInputNodeView } from './nodeComponents/NumberInputNode';
import { EnumInputNodeView } from './nodeComponents/EnumInputNode';
import { ColorInputNodeView } from './nodeComponents/ColorInputNode';
import { GenericNodeView } from './nodeComponents/GenericNode';
import { NodePalette } from './NodePalette';

const nodeTypes: NodeTypes = {
  numberInput: NumberInputNodeView,
  enumInput: EnumInputNodeView,
  colorInput: ColorInputNodeView,
  numberMultiply: GenericNodeView,
  numberDisplay: GenericNodeView,
  skirtGenerator: GenericNodeView,
  topGenerator: GenericNodeView,
  sleeveGenerator: GenericNodeView,
  toonMaterial: GenericNodeView,
  garmentOutput: GenericNodeView,
};

export function NodeEditor() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);

  // Only allow connections between sockets of the same declared type (number/color/enum/
  // geometry/material), mirroring how Geometry Nodes rejects mismatched socket connections.
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
      isValidConnection={isValidConnection}
      fitView
    >
      <Background />
      <Controls />
      <NodePalette />
    </ReactFlow>
  );
}
