import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { literalGroupInputValue, type GroupIOSocket } from './groupIOSocket';

/** Blender の Geometry Nodes における「Group Output」ノード相当。`data.sockets` が動的な
 * 入力ソケット一覧になり、グループ本体が外部に見せる出力ソケットもここから導出される
 * (`resolveNodeSockets.ts`/`groupNodeFactory.ts` 参照)。グループ本体の出力はすべて、この
 * ノードに実際に配線された値だけになる — ガーメントの取り付け位置(`placement` の `y`)のように、
 * 内部で消費してジオメトリへ焼き込む値は、ここまで配線しない限り外へは出ない
 * (詳細は `nodes/CLAUDE.md` の「グループノード」節)。 */
export interface GroupOutputData extends Record<string, unknown> {
  sockets: GroupIOSocket[];
}

registerNodeType<GroupOutputData>({
  type: 'groupOutput',
  label: 'Group Output',
  category: 'group-io',
  inputs: [],
  outputs: [],
  createDefaultData: () => ({ sockets: [] }),
  // 配線された各入力ソケットの値をそのまま素通しする — groupNodeFactory.ts の evaluate() が
  // このノードの評価結果を「追加の外部出力」としてそのまま転送する。何も配線されていない
  // number/color のソケットは、そのソケット自身のデフォルト値を出力する。
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const result = { ...inputs };
    for (const socket of data.sockets ?? []) {
      if (result[socket.id] !== undefined) continue;
      const literal = literalGroupInputValue(socket);
      if (literal !== undefined) result[socket.id] = literal;
    }
    return result;
  },
});
