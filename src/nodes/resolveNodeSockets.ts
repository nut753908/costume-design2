import { getNodeType } from './registry';
import type { SocketDef } from './types';

/** `groupInput`/`groupOutput` ノードの `data.sockets`、および group-category ノードが
 * 内部に持つそれらの `data.sockets` に許容する最小限の形。
 * `nodes/definitions/groupIOSocket.ts` の `GroupIOSocket` はこのスーパーセットだが、
 * 依存の向きを `definitions/` → `registry.ts` のまま保つため、ここではその型を import しない。 */
interface RawSocket {
  id: string;
  label: string;
  type: SocketDef['type'];
}

interface GroupInternalNodeLike {
  type: string;
  data: Record<string, unknown>;
}

function toSocketDefs(raw: unknown): SocketDef[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return (raw as RawSocket[]).map((s) => ({ id: s.id, label: s.label, type: s.type }));
}

/** ノードの実効的な入出力ソケット一覧を返す。3通りの動的解決を型の静的な `inputs`/
 * `outputs` より優先する(`nodes/CLAUDE.md` の「グループノード」節参照):
 *
 * - `type === 'groupInput'`: `data.sockets` がそのまま動的な**出力**ソケット一覧になる
 *   (Blender の Group Input ノード相当)。
 * - `type === 'groupOutput'`: `data.sockets` がそのまま動的な**入力**ソケット一覧になる
 *   (Blender の Group Output ノード相当)。
 * - `category === 'group'`(グループノード本体)かつ `data.nodes`(埋め込みサブグラフが
 *   実体化済み)がある場合: その中の `groupInput`/`groupOutput` ノードの `data.sockets` を
 *   そのまま外部から見た入力/出力ソケット一覧として転送する。埋め込みサブグラフが
 *   まだ実体化されていない(`data: {}` の初期状態、または `initialGraph.json` 由来の
 *   旧インスタンス)場合や、該当する内部ノードが無い場合は型の静的な `inputs`/`outputs`
 *   (`defineGroupNode()` が登録時に埋め込みサブグラフのテンプレートから導出したもの)
 *   にフォールバックする。 */
export function resolveNodeSockets(
  type: string,
  data: Record<string, unknown>,
): { inputs: SocketDef[]; outputs: SocketDef[] } {
  if (type === 'groupInput') return { inputs: [], outputs: toSocketDefs(data.sockets) ?? [] };
  if (type === 'groupOutput') return { inputs: toSocketDefs(data.sockets) ?? [], outputs: [] };

  const def = getNodeType(type);

  if (def.category === 'group') {
    const internalNodes = data.nodes as GroupInternalNodeLike[] | undefined;
    if (internalNodes) {
      const inputNode = internalNodes.find((n) => n.type === 'groupInput');
      const outputNode = internalNodes.find((n) => n.type === 'groupOutput');
      return {
        inputs: (inputNode && toSocketDefs(inputNode.data.sockets)) ?? def.inputs,
        outputs: (outputNode && toSocketDefs(outputNode.data.sockets)) ?? def.outputs,
      };
    }
  }

  return { inputs: def.inputs, outputs: def.outputs };
}
