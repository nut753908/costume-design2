import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import type { GroupIOSocket } from './groupIOSocket';

/** Blender の Geometry Nodes における「Group Output」ノード相当。グループの埋め込み
 * サブグラフ内に置く特殊ノードで、`data.sockets` が動的な入力ソケット一覧そのものになる
 * (`resolveNodeSockets.ts` が `type === 'groupOutput'` を特別扱いする)。グループノード本体
 * (`category: 'group'`)が外部に見せる出力ソケット一覧も、この内部ノードの `data.sockets`
 * から導出される(`groupNodeFactory.ts` 参照)。
 *
 * `groupInput` と対称に、グループ本体の出力はすべてこのノードに実際に配線された値だけになる
 * (`defineGroupNode()` は internalNodes にこのノードを含めることを必須としている)。
 * 通常は内部の `garmentPlacement` 型ノードの geometry(取り付け位置を焼き込み済み)と、
 * `toonMaterial` 型ノードなどの material の2つだけをここへ配線する。anchor/offsetY
 * (`enumInput`/`numberInput` から `garmentPlacement` へ配線される値)は `garmentPlacement.ts`
 * が内部で消費してジオメトリの頂点座標へ焼き込むため、この `groupOutput` の外まで
 * 出ることはない(Blender で位置が
 * ノードツリーの外側にあるオブジェクトのトランスフォームとして扱われ、Group Output の
 * ソケットには現れないのと同じ考え方 — `garmentPlacement.ts`/`nodes/CLAUDE.md` の
 * 「グループノード」節参照)。
 * (以前は `config.terminalNodeId` が指すノードの評価結果を宣言の有無に関わらず丸ごと転送する
 * 仕組みだったが、「グループの中で何が起きているか設定を読まないと分からない」という問題が
 * あったため廃止し、Group Input と同じ「配線が仕様そのもの」という形に統一した)。geometry/
 * material 以外にも、他ガーメントから再引きされたい値をここへ追加で配線すれば、その値も
 * グループの外へ公開される(かつて topGroup が sleeve のためだけの覗き穴としてこの用途で
 * 使っていたが、「本来共有すべき値が一方のグループに閉じ込められている」という設計上の問題が
 * あったため、`src/state/initialGraph.ts` 側のトップレベル共有ノードへ引き上げる形に改めた —
 * `nodes/CLAUDE.md` の「グループノード」節、`topGroupNode.ts`/`sleeveGroupNode.ts` 参照)。 */
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
