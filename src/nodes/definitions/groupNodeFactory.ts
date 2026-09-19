import { registerNodeType } from '../registry';
import { evaluateGraph, type EvaluatedGraph } from '../evaluateGraph';
import { computeAutoLayout } from '../autoLayout';
import type { GraphEdge, GraphNode, GroupInternalEdge, GroupInternalNode, SocketDef, SocketValue } from '../types';
import type { GroupIOSocket } from './groupIOSocket';
import { fingerprintGroupStructure, registerGroupTemplateFingerprint } from '../groupTemplate';
import { matchSceneOutputGeometryIndex, sceneOutputGeometryKey, sceneOutputMaterialKey } from './generic/sceneOutput';

export interface GroupNodeConfig {
  type: string;
  label: string;
  /** `type: 'groupInput'`/`type: 'groupOutput'` ノードはどちらも省略可 — 省略すると
   *  外部から見た入出力ソケットはそれぞれ0個になる(既存15種のガーメントは `groupOutput`
   *  を全て省略している。描画は `sceneOutput` が別途担うため出番が無い)。 */
  internalNodes: GraphNode[];
  internalEdges: GraphEdge[];
}

/** グループノードインスタンスの `data` の形。`nodes`/`edges` はインスタンスごとに独立した
 * コピーで、`createDefaultData()` が `config.internalNodes`/`internalEdges` の
 * structuredClone として生成する。`data: {}`(`nodes`/`edges` 未設定)のインスタンスに
 * 対しては `evaluate()` が各キーごとに `config.internalNodes`/`internalEdges` へ
 * フォールバックする。 */
export interface GroupNodeData extends Record<string, unknown> {
  nodes?: GroupInternalNode[];
  edges?: GroupInternalEdge[];
  /** 実体化した時点のテンプレートの構造の指紋(`nodes/groupTemplate.ts` 参照)。 */
  templateFingerprint?: string;
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
 * すべて探す。`internalNodes` を先頭から見た順に並べる(優先順位を隠し持たない)。
 * 1つのノードから見つかる形は2通り: (1) `type === 'sceneOutput'` のノード自身、
 * (2) それ以外の任意のノード(典型的にはネストしたグループノードインスタンス)で、評価結果が
 * すでに `sceneOutputGeometry<N>`/`sceneOutputMaterial<N>` を持つ場合。この2つ目の
 * ケースがあるおかげで、多段ネストでも各階層の `evaluate()` が同じこの関数を呼ぶだけで
 * 自然に外側まで転送される — 特別な再帰処理は不要。 */
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
 * 複数の既存ノードを1つの埋め込みサブグラフとして内包し、外部には限られた入出力ソケット
 * だけを見せる「グループノード」を定義する。外部インターフェースは埋め込みサブグラフ内の
 * `groupInput`/`groupOutput` ノード自身が定義し、内部配線・ソケット構成はインスタンスごとに
 * 独立して編集できる(詳細・編集UXは `nodes/CLAUDE.md` の「グループノード」節参照)。
 */
export function defineGroupNode(config: GroupNodeConfig): void {
  const templateFingerprint = fingerprintGroupStructure(config.internalNodes, config.internalEdges);
  registerGroupTemplateFingerprint(config.type, templateFingerprint);

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
      templateFingerprint,
    }),
    evaluate: (inputs, data): Record<string, SocketValue> => {
      const internalNodes = data.nodes ?? config.internalNodes;
      const internalEdges = data.edges ?? config.internalEdges;

      // groupInput ノードへ、外部から渡された値を評価のたびに一時注入する(data として
      // 永続化されない、この evaluateGraph() 呼び出し1回限りのパッチ)。
      const patchedNodes = internalNodes.map((node) =>
        node.type === 'groupInput' ? { ...node, data: { ...node.data, injected: inputs } } : node,
      );

      const internalResults = evaluateGraph(patchedNodes, internalEdges);

      // groupOutput ノードに実際に配線された値だけが、そのまま外部出力になる。
      const outputNode = internalNodes.find((n) => n.type === 'groupOutput');
      const forwarded = outputNode ? { ...(internalResults.get(outputNode.id) ?? {}) } : {};

      // 内部の sceneOutput(任意、1つのグループの中に何個あってもよい)が実際に
      // geometry+material を受け取っているものを、予約キーで 0 から振り直して外部出力へ
      // 転送する。このキーは静的な `outputs` には含まれず、他ノードへ配線できない
      // (`Garments.tsx` 専用チャンネル、`nodes/CLAUDE.md`/`scene/CLAUDE.md` 参照)。
      findResolvedSceneOutputs(internalNodes, internalResults).forEach(({ geometry, material }, index) => {
        forwarded[sceneOutputGeometryKey(index)] = geometry;
        forwarded[sceneOutputMaterialKey(index)] = material;
      });

      return forwarded;
    },
  });
}
