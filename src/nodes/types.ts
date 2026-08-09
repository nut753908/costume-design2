import type * as THREE from 'three';

export type SocketType = 'number' | 'color' | 'enum' | 'geometry' | 'material';

export type SocketValue =
  | { type: 'number'; value: number }
  | { type: 'color'; value: THREE.Color }
  | { type: 'enum'; value: string }
  | { type: 'geometry'; value: THREE.BufferGeometry }
  | { type: 'material'; value: THREE.Material };

export interface SocketDef {
  id: string;
  label: string;
  type: SocketType;
}

export type NodeCategory = 'input' | 'generator' | 'material' | 'output';

export interface NodeTypeDefinition<TData = Record<string, unknown>> {
  type: string;
  label: string;
  category: NodeCategory;
  inputs: SocketDef[];
  outputs: SocketDef[];
  evaluate: (inputs: Record<string, SocketValue>, data: TData) => Record<string, SocketValue>;
}

/** Minimal shape evaluateGraph needs from a node — decoupled from React Flow's own Node<T> type
 * so the evaluator (and its tests) don't depend on the UI library. */
export interface GraphNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

/** Minimal shape evaluateGraph needs from an edge — decoupled from React Flow's own Edge type. */
export interface GraphEdge {
  source: string;
  sourceHandle: string | null | undefined;
  target: string;
  targetHandle: string | null | undefined;
}
