import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { literalGroupInputValue, type GroupIOSocket } from './groupIOSocket';

/** Blender の Geometry Nodes における「Group Input」ノード相当。グループの埋め込み
 * サブグラフ内に置く特殊ノードで、`data.sockets` が動的な出力ソケット一覧そのものになる
 * (`resolveNodeSockets.ts` が `type === 'groupInput'` を特別扱いする)。グループノード本体
 * (`category: 'group'`)が外部に見せる入力ソケット一覧も、この内部ノードの `data.sockets`
 * から導出される(`groupNodeFactory.ts` 参照)。 */
export interface GroupInputData extends Record<string, unknown> {
  sockets: GroupIOSocket[];
  /** `groupNodeFactory.ts` の `evaluate()` が、外部から渡された値をここへ評価のたびに
   * 一時的に注入する(`data` として永続化されるわけではない)。未接続のソケットは
   * ここに現れないため、各ソケット自身の `default` にフォールバックする。 */
  injected?: Record<string, SocketValue>;
}

registerNodeType<GroupInputData>({
  type: 'groupInput',
  label: 'Group Input',
  category: 'group-io',
  // 実効的な入出力は常に resolveNodeSockets() 経由で data.sockets から解決するため、
  // ここは空のままでよい(グループノード本体の登録時フォールバックにも使われない —
  // フォールバックには config.internalNodes 側の groupInput ノードの data.sockets を使う)。
  inputs: [],
  outputs: [],
  createDefaultData: () => ({ sockets: [] }),
  evaluate: (_inputs, data): Record<string, SocketValue> => {
    const result: Record<string, SocketValue> = {};
    for (const socket of data.sockets) {
      const value = data.injected?.[socket.id] ?? literalGroupInputValue(socket);
      if (value !== undefined) result[socket.id] = value;
    }
    return result;
  },
});
