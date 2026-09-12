import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import type { GroupIOSocket } from './groupIOSocket';

/** Blender の Geometry Nodes における「Group Output」ノード相当。グループの埋め込み
 * サブグラフ内に置く特殊ノードで、`data.sockets` が動的な入力ソケット一覧そのものになる
 * (`resolveNodeSockets.ts` が `type === 'groupOutput'` を特別扱いする)。グループノード本体
 * (`category: 'group'`)が外部に見せる追加の出力ソケット一覧も、この内部ノードの
 * `data.sockets` から導出される(`groupNodeFactory.ts` 参照)。
 *
 * 内部の `garmentOutput` 相当ノード(`config.terminalNodeId`)が geometry/material の
 * ような主要な出力を担うのとは別に、他ガーメントから再引きされる値を配線するために使う —
 * 任意の内部ノードの出力にワイヤーを繋ぐだけで、その値がグループの外へ追加公開される。
 * 現在この用途で使っている実例は無い(かつて topGroup が sleeve のためだけの覗き穴として
 * 使っていたが、「本来共有すべき値が一方のグループに閉じ込められている」という設計上の
 * 問題があったため、`src/state/initialGraph.ts` 側のトップレベル共有ノードへ引き上げる形に
 * 改めた — `nodes/CLAUDE.md` の「グループノード」節、`topGroupNode.ts`/`sleeveGroupNode.ts`
 * 参照)。 */
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
