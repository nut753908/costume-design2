import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import type { GroupIOSocket } from './groupIOSocket';

/** Blender の Geometry Nodes における「Group Output」ノード相当。`data.sockets` が動的な
 * 入力ソケット一覧になり、グループ本体が外部に見せる出力ソケットもここから導出される
 * (`resolveNodeSockets.ts`/`groupNodeFactory.ts` 参照)。グループ本体の出力はすべて、この
 * ノードに実際に配線された値だけになる — `anchorY`/`offsetY` のように `garmentPlacement`
 * が内部で消費してジオメトリへ焼き込む値は、ここまで配線しない限り外へは出ない
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
  // このノードの評価結果を「追加の外部出力」としてそのまま転送する。
  evaluate: (inputs): Record<string, SocketValue> => inputs,
});
