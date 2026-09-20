import { getNodeType } from './registry';
import type { GraphEdge, GraphNode } from './types';

/** グループノードのテンプレート(`defineGroupNode()` の `internalNodes`/`internalEdges`)の
 * 「構造」の指紋。ノードの id と型、エッジ、`groupInput`/`groupOutput` のソケット構成だけから
 * 計算し、パラメータの値・座標は含めない — 構造(配線・ノード構成)を変えたときだけ
 * 変わる。編集済みのグループインスタンスやプリセットは、実体化した時点の指紋を保存しておき、
 * 現在のテンプレートの指紋と比べることで「テンプレートが更新されて古くなった」ことを
 * 検知する(`isGroupInstanceStale()`)。 */
export function fingerprintGroupStructure(nodes: GraphNode[], edges: GraphEdge[]): string {
  const nodeParts = nodes.map((n) => {
    const sockets = (n.data as { sockets?: { id: string; type: string }[] }).sockets;
    const socketPart =
      (n.type === 'groupInput' || n.type === 'groupOutput') && Array.isArray(sockets)
        ? `[${sockets.map((s) => `${s.id}:${s.type}`).sort().join(',')}]`
        : '';
    return `${n.id}:${n.type}${socketPart}`;
  });
  const edgeParts = edges.map((e) => `${e.source}.${e.sourceHandle ?? ''}>${e.target}.${e.targetHandle ?? ''}`);
  const text = [...nodeParts.sort(), '--', ...edgeParts.sort()].join('\n');

  // FNV-1a 32bit。改ざん耐性は不要で、構造の変化を検知できれば十分。
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const templateFingerprints = new Map<string, string>();

/** `defineGroupNode()` が登録時に呼ぶ。 */
export function registerGroupTemplateFingerprint(type: string, fingerprint: string): void {
  templateFingerprints.set(type, fingerprint);
}

export function getGroupTemplateFingerprint(type: string): string | undefined {
  return templateFingerprints.get(type);
}

interface GroupInstanceData {
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  templateFingerprint?: string;
}

/** 編集済み(実体化済み)のグループインスタンスの内部構造が、現在のテンプレートと食い違って
 * いるか。実体化前(`data.nodes` が無く、テンプレートへフォールバックして評価される)は常に
 * 最新なので false。指紋を持たない(この機能より前に実体化された)インスタンスは、内部構造そのものの
 * 指紋で比較する。 */
export function isGroupInstanceStale(type: string, data: GroupInstanceData): boolean {
  if (!data.nodes) return false;
  const current = getGroupTemplateFingerprint(type);
  if (current === undefined) return false;
  const stored = data.templateFingerprint ?? fingerprintGroupStructure(data.nodes, data.edges ?? []);
  return stored !== current;
}

const VALUE_KEY_BY_INPUT_TYPE: Record<string, string> = {
  numberInput: 'value',
  colorInput: 'hex',
};

/** 現在のテンプレートを読み込み直し、古い内部グラフ(`oldNodes`)にあった同じ id・同じ型の
 * `numberInput`/`colorInput` の値だけを引き継ぐ。構造(配線・ノード構成)や
 * min/max は最新のテンプレートのものになる。対応するノードが無くなった値は捨てる。 */
export function migrateGroupToTemplate(
  type: string,
  oldNodes: GraphNode[],
): { nodes: GraphNode[]; edges: GraphEdge[]; templateFingerprint: string | undefined } {
  const template = getNodeType(type).createDefaultData() as {
    nodes: GraphNode[];
    edges: GraphEdge[];
    templateFingerprint?: string;
  };
  const oldById = new Map(oldNodes.map((n) => [n.id, n]));
  const nodes = template.nodes.map((node) => {
    const key = VALUE_KEY_BY_INPUT_TYPE[node.type];
    const old = oldById.get(node.id);
    if (!key || !old || old.type !== node.type || old.data[key] === undefined) return node;
    return { ...node, data: { ...node.data, [key]: old.data[key] } };
  });
  return { nodes, edges: template.edges, templateFingerprint: template.templateFingerprint };
}
