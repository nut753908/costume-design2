import type * as THREE from 'three';

export type SocketType = 'number' | 'color' | 'geometry' | 'material' | 'points';

export type SocketValue =
  | { type: 'number'; value: number }
  | { type: 'color'; value: THREE.Color }
  | { type: 'geometry'; value: THREE.BufferGeometry }
  | { type: 'material'; value: THREE.Material }
  | { type: 'points'; value: THREE.Vector2[] }
  /** 複数接続できる入力ソケット(`SocketDef.multiple`)へ、接続されたすべての geometry を
   * 配線順に集めて渡すための値。ソケット自身の型は `geometry` のまま。 */
  | { type: 'geometries'; value: THREE.BufferGeometry[] };

export interface SocketDef {
  id: string;
  label: string;
  type: SocketType;
  /** 入力ソケットにだけ意味を持つ。true なら同じソケットへ複数のエッジを接続でき(他の入力
   * ソケットは最大1本、`state/graphStore.ts` の `onConnect` 参照)、`evaluate()` には接続された
   * 値がエッジの並び順で集められて渡される。現在は `geometry` 型の `mergeGeometry` だけが使い、
   * 渡される値は `{ type: 'geometries' }`。1本も接続されていなければ入力に現れない。 */
  multiple?: boolean;
  /** 入力ソケットにだけ意味を持つ、未接続時のリテラルな値。`number` は数値、`color` は hex 文字列。
   * 指定があれば(`number`/`color` のみ)、ノードカード上のこのソケットの行に入力欄が出る。値は
   * ノードの `data[socket.id]` に保持され(未設定なら `default`)、未接続の入力として `evaluate()` へ渡される。 */
  default?: number | string;
}

export type NodeCategory =
  | 'input'
  | 'math'
  | 'primitive'
  | 'geometry-op'
  | 'points'
  | 'material'
  | 'output'
  | 'group'
  | 'group-io';

/** パレット/コンテキストメニューの見出し。`NodeCategory` のうち `group` だけは機能に使われる
 * (`resolveNodeSockets`/`enterGroup`/「→」ボタン)ため分割せず、`paletteSection`(表示専用)で
 * `garment`(ガーメントと Body 関連)と `group-part`(部品・補助)に振り分ける。 */
export type PaletteSection = Exclude<NodeCategory, 'group'> | 'garment' | 'group-part';

export interface NodeTypeDefinition<TData = Record<string, unknown>> {
  type: string;
  label: string;
  category: NodeCategory;
  /** `category: 'group'` のときだけ意味を持つ、パレットでの振り分け先(省略時は `group-part`)。 */
  paletteSection?: 'garment' | 'group-part';
  inputs: SocketDef[];
  outputs: SocketDef[];
  /** このノードタイプの新しいインスタンスを追加するたびに一度だけ呼ばれる、
   * まっさらな初期 `data`(インスタンス間で共有/変更されることはない)。 */
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

/** グループノード(nodes/definitions/groupNodeFactory.ts)の埋め込みサブグラフをキャンバス上に
 * 描画・編集できるようにするための、position を持つ GraphNode/GraphEdge の拡張。
 * `@xyflow/react` の Node/Edge はこれらのスーパーセットなので、editor/state レイヤー側は
 * 追加のキャスト無しにこれらを Node[]/Edge[] として扱える(nodes/ レイヤーは
 * `@xyflow/react` に依存しない、という既存原則を保つため、ここでは import しない)。 */
export interface GroupInternalNode extends GraphNode {
  position: { x: number; y: number };
}

export interface GroupInternalEdge extends GraphEdge {
  id: string;
}
