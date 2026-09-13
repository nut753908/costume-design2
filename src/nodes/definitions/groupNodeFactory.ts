import { registerNodeType } from '../registry';
import { evaluateGraph } from '../evaluateGraph';
import { computeAutoLayout } from '../autoLayout';
import type { GraphEdge, GraphNode, GroupInternalEdge, GroupInternalNode, SocketDef, SocketValue } from '../types';
import type { GroupIOSocket } from './groupIOSocket';

export interface GroupNodeConfig {
  type: string;
  label: string;
  /** `type: 'groupInput'` ノード(Blender の Group Input ノード相当)を含めると、その
   *  `data.sockets` がこのグループノードが外部に見せる入力ソケット一覧になる。
   *  他ガーメントと共有される値(`bodyBuild` など)が無いガーメントでは省略でき、その場合
   *  外部から見た入力ソケットは0個になる(hat/bag/necktie/glasses の実例を参照)。
   *  `type: 'groupOutput'` ノード(Blender の Group Output ノード相当)は必須 —
   *  グループ本体の出力は、この内部ノードに実際に配線された値だけがそのまま外部出力になる
   *  (通常は `garmentPlacement` 型ノードの geometry と、`toonMaterial` 型ノードなどの
   *  material の2つを配線する。anchor/offsetY は `garmentPlacement` 型ノードが内部で消費して
   *  ジオメトリの頂点座標へ焼き込むため、`groupOutput` の外まで出ることはない —
   *  `garmentPlacement.ts` 参照)。「どのノードが終端か」を設定値として隠し持つのではなく、
   *  Group Input と対称に、キャンバス上で見える配線そのものが仕様になる。 */
  internalNodes: GraphNode[];
  internalEdges: GraphEdge[];
}

/** グループノードインスタンスの `data` の形。`nodes`/`edges` はインスタンスごとに独立した
 * コピーで、`createDefaultData()` が `config.internalNodes`/`internalEdges` の
 * structuredClone として生成する。パレットから同じ型を複数回追加しても各インスタンスは
 * 互いに影響しない。
 *
 * `initialGraph.ts` に含まれる既存インスタンス(このデータモデル導入前に作られた
 * `data: {}`)は `nodes`/`edges` を持たないため、`evaluate()` は各キーごとに
 * `config.internalNodes`/`internalEdges` へフォールバックする — つまり
 * `initialGraph.ts` 側の移行は不要。 */
export interface GroupNodeData extends Record<string, unknown> {
  nodes?: GroupInternalNode[];
  edges?: GroupInternalEdge[];
}

function toSocketDefs(sockets: GroupIOSocket[] | undefined): SocketDef[] {
  return (sockets ?? []).map((s) => ({ id: s.id, label: s.label, type: s.type }));
}

/** テンプレート(`config.internalNodes`)を、キャンバス上で描画・編集できる独立した
 * コピーへ実体化する。位置は `nodes/autoLayout.ts` の `computeAutoLayout()`(Arrange
 * ボタンが使うのと同じ関数)で自動算出するため、`GroupNodeConfig.internalNodes` に
 * position を持たせる必要がない。 */
function materializeInternalNodes(config: GroupNodeConfig): GroupInternalNode[] {
  const positions = computeAutoLayout(config.internalNodes, config.internalEdges);
  return config.internalNodes.map((node) => ({
    ...structuredClone(node),
    position: positions.get(node.id) ?? { x: 0, y: 0 },
  }));
}

function materializeInternalEdges(config: GroupNodeConfig): GroupInternalEdge[] {
  return config.internalEdges.map((edge) => ({
    ...structuredClone(edge),
    // 1つの入力ソケットには常に最大1本(state/CLAUDE.md 参照)というこのアプリの規約により、
    // target+targetHandle の組は埋め込みサブグラフ内で一意になる。
    id: `${edge.target}.${edge.targetHandle}`,
  }));
}

/**
 * 複数の既存ノード(numberMultiply/generator/toonMaterial/enumInput/numberInput/
 * garmentPlacement 等)を1つの埋め込みサブグラフとして内包し、外部には限られた入出力ソケットだけを見せる
 * 「グループノード」を定義する。外部インターフェース(入出力ソケット構成)は Blender の
 * Geometry Nodes と同じく、埋め込みサブグラフ内に置く専用ノード `groupInput`/`groupOutput`
 * (`nodes/definitions/groupInput.ts`/`groupOutput.ts`)そのものが定義する — 中に入って
 * その2ノードにソケットを増減・配線するだけで、外部から見えるハンドルが増減する。
 * 内部配線・外部ソケット構成はノードインスタンスごとに独立してキャンバス上で編集できる
 * (`editor/GenericNode.tsx` のダブルクリックで中に入るUI、詳細は nodes/CLAUDE.md 参照)。
 *
 * evaluate() は外部から渡された入力値を埋め込みサブグラフ内の `groupInput` ノードへ
 * 一時的に注入してから evaluateGraph() を再帰的に呼び、`groupOutput` ノードの評価結果を
 * そのまま外部出力として返すだけ。
 */
export function defineGroupNode(config: GroupNodeConfig): void {
  const templateInputNode = config.internalNodes.find((n) => n.type === 'groupInput');
  const templateOutputNode = config.internalNodes.find((n) => n.type === 'groupOutput');
  if (!templateOutputNode) {
    throw new Error(`defineGroupNode("${config.type}"): internalNodes must include a 'groupOutput' node (geometry/material must be wired through it)`);
  }

  const staticInputs = toSocketDefs((templateInputNode?.data as { sockets?: GroupIOSocket[] } | undefined)?.sockets);
  const staticOutputs = toSocketDefs((templateOutputNode.data as { sockets?: GroupIOSocket[] } | undefined)?.sockets);

  registerNodeType<GroupNodeData>({
    type: config.type,
    label: config.label,
    category: 'group',
    // インスタンスが data.nodes を持たない場合(まだ中に入って編集されていない、または
    // initialGraph.ts 由来)のベースライン/フォールバック。実効的なソケット一覧は
    // 常に resolveNodeSockets() 経由で解決すること。
    inputs: staticInputs,
    outputs: staticOutputs,
    createDefaultData: () => ({
      nodes: materializeInternalNodes(config),
      edges: materializeInternalEdges(config),
    }),
    evaluate: (inputs, data): Record<string, SocketValue> => {
      const internalNodes = data.nodes ?? config.internalNodes;
      const internalEdges = data.edges ?? config.internalEdges;

      // groupInput ノードへ、外部から渡された値を評価のたびに一時注入する(data として
      // 永続化されるわけではない、この evaluateGraph() 呼び出し1回限りのパッチ)。
      // 未接続の外部ソケットは inputs に現れないため、groupInput.evaluate() 側で
      // 各ソケット自身の default にフォールバックする。
      const patchedNodes = internalNodes.map((node) =>
        node.type === 'groupInput' ? { ...node, data: { ...node.data, injected: inputs } } : node,
      );

      const internalResults = evaluateGraph(patchedNodes, internalEdges);

      // groupOutput ノードに実際に配線された値だけが、そのまま外部出力になる
      // (通常は garmentPlacement の geometry と toonMaterial などの material の2つを配線する)。
      // インスタンス側でこのノードが削除されていれば、フォールバックにより単に外部出力が
      // 空になるだけで、他ノード削除時と同じ挙動。
      const outputNode = internalNodes.find((n) => n.type === 'groupOutput');
      return outputNode ? (internalResults.get(outputNode.id) ?? {}) : {};
    },
  });
}
