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
  /** このノードタイプの新規追加インスタンスのための、まっさらな初期 `data` — 追加のたびに
   * 一度だけ呼ばれる(インスタンス間で共有/変更されることはない)。 */
  createDefaultData: () => TData;
  evaluate: (inputs: Record<string, SocketValue>, data: TData) => Record<string, SocketValue>;
}

/** evaluateGraph がノードに対して必要とする最小限の形 — React Flow 自身の Node<T> 型から
 * 切り離すことで、evaluator(とそのテスト)が UI ライブラリに依存しないようにする。 */
export interface GraphNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

/** evaluateGraph がエッジに対して必要とする最小限の形 — React Flow 自身の Edge 型から切り離したもの。 */
export interface GraphEdge {
  source: string;
  sourceHandle: string | null | undefined;
  target: string;
  targetHandle: string | null | undefined;
}
