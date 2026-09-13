import { registerNodeType } from '../registry';
import { evaluateGraph, type EvaluatedGraph } from '../evaluateGraph';
import { computeAutoLayout } from '../autoLayout';
import type { GraphEdge, GraphNode, GroupInternalEdge, GroupInternalNode, SocketDef, SocketValue } from '../types';
import type { GroupIOSocket } from './groupIOSocket';
import { matchSceneOutputGeometryIndex, sceneOutputGeometryKey, sceneOutputMaterialKey } from './sceneOutput';

export interface GroupNodeConfig {
  type: string;
  label: string;
  /** `type: 'groupInput'` ノード(Blender の Group Input ノード相当)を含めると、その
   *  `data.sockets` がこのグループノードが外部に見せる入力ソケット一覧になる。
   *  他ガーメントと共有される値(`bodyBuild` など)が無いガーメントでは省略でき、その場合
   *  外部から見た入力ソケットは0個になる(hat/bag/necktie/glasses の実例を参照)。
   *  `type: 'groupOutput'` ノード(Blender の Group Output ノード相当)も同様に省略可 —
   *  他ガーメントへ再公開したい値(geometry/material 以外の値、下記「値が複数グループで
   *  共有される場合」参照)が無ければ省略でき、その場合外部から見た出力ソケットは0個になる
   *  (既存15種のガーメントはすべて省略している — 描画は下記 `sceneOutput` が別途担うため、
   *  `groupOutput` の出番が無い)。含めた場合、グループ本体のこの出力は、この内部ノードに
   *  実際に配線された値だけがそのまま外部出力になる。「どのノードが終端か」を設定値として
   *  隠し持つのではなく、Group Input と対称に、キャンバス上で見える配線そのものが仕様になる。 */
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

/** 埋め込みサブグラフの中から、実際に描画対象として解決済みの geometry+material の組を
 * すべて探す。`internalNodes` を先頭から見た順に並べる(`groupOutput` を探すのと同じ
 * 「決定的な探索」で、優先順位を隠し持たない)。1つのノードから見つかる形は2通り:
 *
 * 1. `type === 'sceneOutput'` のノード自身 — その評価結果は素通しされた `geometry`/
 *    `material`(sceneOutput 自身の入力ソケット名)を持つ。**1つのグループの中に
 *    `sceneOutput` は何個あってもよい**ため、1つ見つけても探索は続ける。
 * 2. それ以外の任意のノード(典型的には、内部に自分自身の `sceneOutput` を持つネストした
 *    グループノードインスタンス)— その評価結果がすでに `sceneOutputGeometry<N>`/
 *    `sceneOutputMaterial<N>`(このグループがさらに1つ内側から転送してきた予約キー、
 *    `nodes/definitions/sceneOutput.ts` 参照)を1組以上持っていれば、そのすべてを採用する
 *    (ネストしたグループ自身が複数の `sceneOutput` を持っていた場合も、ここですべて拾う)。
 *
 * この2つ目のケースがあるおかげで、`sceneOutput` を持つグループが別のグループの内部に
 * 埋め込まれていても(多段ネスト)、各階層の `evaluate()` が同じこの関数を呼ぶだけで
 * 自然に何階層でも外側まで転送される — 特別な再帰処理は不要。 */
function findResolvedSceneOutputs(
  internalNodes: GraphNode[],
  internalResults: EvaluatedGraph,
): { geometry: SocketValue; material: SocketValue }[] {
  const found: { geometry: SocketValue; material: SocketValue }[] = [];

  for (const node of internalNodes) {
    const result = internalResults.get(node.id);
    if (!result) continue;

    if (node.type === 'sceneOutput') {
      if (result.geometry?.type === 'geometry' && result.material?.type === 'material') {
        found.push({ geometry: result.geometry, material: result.material });
      }
      continue;
    }

    for (const key of Object.keys(result)) {
      const index = matchSceneOutputGeometryIndex(key);
      if (index === null) continue;
      const geometry = result[sceneOutputGeometryKey(index)];
      const material = result[sceneOutputMaterialKey(index)];
      if (geometry?.type === 'geometry' && material?.type === 'material') {
        found.push({ geometry, material });
      }
    }
  }

  return found;
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
 * そのまま外部出力として返すだけ(`groupInput` と同じく `groupOutput` も省略可 — 省略時は
 * 外部出力0個の空オブジェクトになる)。
 */
export function defineGroupNode(config: GroupNodeConfig): void {
  const templateInputNode = config.internalNodes.find((n) => n.type === 'groupInput');
  const templateOutputNode = config.internalNodes.find((n) => n.type === 'groupOutput');

  const staticInputs = toSocketDefs((templateInputNode?.data as { sockets?: GroupIOSocket[] } | undefined)?.sockets);
  const staticOutputs = toSocketDefs((templateOutputNode?.data as { sockets?: GroupIOSocket[] } | undefined)?.sockets);

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
      const forwarded = outputNode ? { ...(internalResults.get(outputNode.id) ?? {}) } : {};

      // 埋め込みサブグラフの中の `sceneOutput`(nodes/definitions/sceneOutput.ts)ノード
      // (任意、groupOutput と違って必須ではなく、1つのグループの中に何個あってもよい)が
      // 実際に geometry+material を受け取っているものを、`sceneOutputGeometry<N>`/
      // `sceneOutputMaterial<N>` という予約キーで 0 から振り直してこのグループ自身の
      // 外部出力へ転送する。`groupOutput` が転送する通常の `geometry`/`material`(グループ間で
      // 再利用するための汎用ソケット)とは別の、Garments.tsx だけが読む専用チャンネル —
      // この予約キーはグループの静的な `outputs` には含まれず(numberDisplay の `value` と
      // 同じパターン)、他ノードへ配線することはできない。これにより「グループの中に
      // sceneOutput を置いて配線する」というキャンバス上で見える操作だけが、「明示的な配線が
      // 仕様」という原則の下で描画対象になる(nodes/CLAUDE.md/scene/CLAUDE.md 参照)。
      // `findResolvedSceneOutputs()` は直接の `sceneOutput` だけでなく、内部にネストした別の
      // グループノード(その内部ですでに解決済みの予約キーを持つ)も見つけるため、この転送は
      // 各階層で同じロジックが繰り返されるだけで、多段ネストにも自然に対応する。
      findResolvedSceneOutputs(internalNodes, internalResults).forEach(({ geometry, material }, index) => {
        forwarded[sceneOutputGeometryKey(index)] = geometry;
        forwarded[sceneOutputMaterialKey(index)] = material;
      });

      return forwarded;
    },
  });
}
