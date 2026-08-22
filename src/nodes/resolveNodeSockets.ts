import { getNodeType } from './registry';
import type { SocketDef } from './types';

/** `data.exposedInputs`/`exposedOutputs`(グループノードインスタンスが持つ動的な
 * ソケット一覧)に許容する最小限の形。`nodes/definitions/groupNodeFactory.ts` の
 * `GroupInputSpec`/`GroupOutputSpec` はこれのスーパーセットだが、依存の向きを
 * `definitions/` → `registry.ts` のまま保つため、ここではその型を import しない。 */
interface ExposableSocket {
  id: string;
  label: string;
  type: SocketDef['type'];
}

function toSocketDefs(raw: unknown): SocketDef[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return (raw as ExposableSocket[]).map((s) => ({ id: s.id, label: s.label, type: s.type }));
}

/** ノードの実効的な入出力ソケット一覧を返す。グループノードインスタンスが
 * `data.exposedInputs`/`exposedOutputs` を持っていればそれを優先し(内部の未接続
 * ソケットをその場で外部ソケットとして公開/非公開にできる、インスタンスごとに独立した
 * 動的なソケット構成)、無ければ型定義の静的な `inputs`/`outputs` にフォールバックする
 * (グループノード以外の全ノードタイプ、および `data` がまだ実体化されていない
 * グループノードインスタンスはこちらを通る)。 */
export function resolveNodeSockets(
  type: string,
  data: Record<string, unknown>,
): { inputs: SocketDef[]; outputs: SocketDef[] } {
  const def = getNodeType(type);
  return {
    inputs: toSocketDefs(data.exposedInputs) ?? def.inputs,
    outputs: toSocketDefs(data.exposedOutputs) ?? def.outputs,
  };
}
