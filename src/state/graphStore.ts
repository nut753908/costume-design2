import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import type { EvaluatedGraph } from '../nodes/evaluateGraph';
import { getNodeType } from '../nodes/registry';

const initialNodes: Node[] = [
  // state/useBodyScale.ts で id により直接読み取られる — ボディスケールはガーメントの
  // geometry/material 出力ではなくシーン全体のパラメータであるため、エッジで何にも配線されていない。
  { id: 'bodyHeight', type: 'numberInput', position: { x: 1160, y: 20 }, data: { value: 1, min: 0.8, max: 1.25, step: 0.01, label: 'Body Height' } },
  { id: 'bodyBuild', type: 'numberInput', position: { x: 1160, y: 130 }, data: { value: 1, min: 0.8, max: 1.3, step: 0.01, label: 'Body Build' } },

  { id: 'skirtWaist', type: 'numberInput', position: { x: 40, y: 20 }, data: { value: 0.3, min: 0.15, max: 0.5, step: 0.01, label: 'Waist Radius' } },
  { id: 'skirtLength', type: 'numberInput', position: { x: 40, y: 130 }, data: { value: 0.55, min: 0.2, max: 1.0, step: 0.01, label: 'Length' } },
  { id: 'skirtFlare', type: 'numberInput', position: { x: 40, y: 240 }, data: { value: 0.7, min: 0, max: 2.5, step: 0.05, label: 'Flare' } },
  { id: 'skirtSegments', type: 'numberInput', position: { x: 40, y: 350 }, data: { value: 28, min: 8, max: 48, step: 1, label: 'Segments' } },
  { id: 'skirtGen', type: 'skirtGenerator', position: { x: 340, y: 180 }, data: {} },
  { id: 'skirtColor', type: 'colorInput', position: { x: 900, y: 20 }, data: { hex: '#d9738c', label: 'Skirt Color' } },
  { id: 'skirtMaterial', type: 'toonMaterial', position: { x: 900, y: 120 }, data: {} },
  { id: 'skirtOutput', type: 'garmentOutput', position: { x: 620, y: 180 }, data: { anchor: 'waist', offsetY: 0.03, fallbackColor: '#d9738c' } },

  { id: 'topRadius', type: 'numberInput', position: { x: 40, y: 500 }, data: { value: 0.29, min: 0.2, max: 0.4, step: 0.01, label: 'Torso Radius' } },
  { id: 'topLength', type: 'numberInput', position: { x: 40, y: 610 }, data: { value: 0.5, min: 0.2, max: 0.9, step: 0.01, label: 'Length' } },
  { id: 'topNeckline', type: 'enumInput', position: { x: 40, y: 720 }, data: { value: 'round', options: ['round', 'v', 'square'], label: 'Neckline' } },
  { id: 'topNecklineDepth', type: 'numberInput', position: { x: 40, y: 830 }, data: { value: 0.12, min: 0, max: 0.3, step: 0.01, label: 'Neckline Depth' } },
  { id: 'topGen', type: 'topGenerator', position: { x: 340, y: 650 }, data: {} },
  { id: 'topColor', type: 'colorInput', position: { x: 900, y: 500 }, data: { hex: '#5b8fa8', label: 'Top Color' } },
  { id: 'topMaterial', type: 'toonMaterial', position: { x: 900, y: 600 }, data: {} },
  { id: 'topOutput', type: 'garmentOutput', position: { x: 620, y: 650 }, data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#5b8fa8' } },

  { id: 'sleeveLength', type: 'numberInput', position: { x: 40, y: 940 }, data: { value: 0.22, min: 0, max: 0.4, step: 0.01, label: 'Sleeve Length' } },
  { id: 'sleeveRadius', type: 'numberInput', position: { x: 40, y: 1050 }, data: { value: 0.085, min: 0.05, max: 0.14, step: 0.005, label: 'Sleeve Radius' } },
  { id: 'sleeveGen', type: 'sleeveGenerator', position: { x: 340, y: 990 }, data: {} },
  { id: 'sleeveOutput', type: 'garmentOutput', position: { x: 620, y: 990 }, data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#5b8fa8' } },
];

const initialEdges: Edge[] = [
  { id: 'e-waist', source: 'skirtWaist', sourceHandle: 'value', target: 'skirtGen', targetHandle: 'waistRadius' },
  { id: 'e-length', source: 'skirtLength', sourceHandle: 'value', target: 'skirtGen', targetHandle: 'length' },
  { id: 'e-flare', source: 'skirtFlare', sourceHandle: 'value', target: 'skirtGen', targetHandle: 'flare' },
  { id: 'e-segments', source: 'skirtSegments', sourceHandle: 'value', target: 'skirtGen', targetHandle: 'segments' },
  { id: 'e-geometry', source: 'skirtGen', sourceHandle: 'geometry', target: 'skirtOutput', targetHandle: 'geometry' },
  { id: 'e-skirt-color', source: 'skirtColor', sourceHandle: 'color', target: 'skirtMaterial', targetHandle: 'color' },
  { id: 'e-skirt-material', source: 'skirtMaterial', sourceHandle: 'material', target: 'skirtOutput', targetHandle: 'material' },

  { id: 'e-top-radius', source: 'topRadius', sourceHandle: 'value', target: 'topGen', targetHandle: 'torsoRadius' },
  { id: 'e-top-length', source: 'topLength', sourceHandle: 'value', target: 'topGen', targetHandle: 'length' },
  { id: 'e-top-neckline', source: 'topNeckline', sourceHandle: 'value', target: 'topGen', targetHandle: 'necklineType' },
  { id: 'e-top-neckline-depth', source: 'topNecklineDepth', sourceHandle: 'value', target: 'topGen', targetHandle: 'necklineDepth' },
  { id: 'e-top-geometry', source: 'topGen', sourceHandle: 'geometry', target: 'topOutput', targetHandle: 'geometry' },
  { id: 'e-top-color', source: 'topColor', sourceHandle: 'color', target: 'topMaterial', targetHandle: 'color' },
  { id: 'e-top-material', source: 'topMaterial', sourceHandle: 'material', target: 'topOutput', targetHandle: 'material' },

  // Sleeve は Top の胴体半径とマテリアルを再利用する — 1つの Color/Material ノードが
  // 2つの Garment Output に供給しているため、Top を再着色すると Sleeve も一緒に再着色される。
  { id: 'e-sleeve-attach-radius', source: 'topRadius', sourceHandle: 'value', target: 'sleeveGen', targetHandle: 'attachRadius' },
  { id: 'e-sleeve-length', source: 'sleeveLength', sourceHandle: 'value', target: 'sleeveGen', targetHandle: 'sleeveLength' },
  { id: 'e-sleeve-radius', source: 'sleeveRadius', sourceHandle: 'value', target: 'sleeveGen', targetHandle: 'sleeveRadius' },
  { id: 'e-sleeve-geometry', source: 'sleeveGen', sourceHandle: 'geometry', target: 'sleeveOutput', targetHandle: 'geometry' },
  { id: 'e-sleeve-material', source: 'topMaterial', sourceHandle: 'material', target: 'sleeveOutput', targetHandle: 'material' },
];

interface GraphState {
  nodes: Node[];
  edges: Edge[];
  evaluatedResults: EvaluatedGraph | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  setEvaluatedResults: (results: EvaluatedGraph) => void;
  addNode: (type: string, position: { x: number; y: number }) => void;
}

export const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => ({
      nodes: initialNodes,
      edges: initialEdges,
      evaluatedResults: null,
      onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
      onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
      onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),
      updateNodeData: (id, data) =>
        set({
          nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
        }),
      setEvaluatedResults: (results) => set({ evaluatedResults: results }),
      addNode: (type, position) => {
        const def = getNodeType(type);
        const id = `${type}-${Math.random().toString(36).slice(2, 9)}`;
        const newNode: Node = { id, type, position, data: def.createDefaultData() };
        set({ nodes: [...get().nodes, newNode] });
      },
    }),
    {
      name: 'costume-design-graph',
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
    },
  ),
);
