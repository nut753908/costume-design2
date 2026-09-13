import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';

/** シーンへ実際に描画するための終端ノード。`groupOutput`(グループの埋め込みサブグラフの
 * 出口)と対称に、こちらは描画の出口を表す — geometry+material を受け取ってそのまま
 * 素通しするだけ。**必ず `<name>Group` の埋め込みサブグラフの中に、`groupOutput` と並べて
 * 置く**(`src/nodes/definitions/skirtGroupNode.ts` 等、既存15種のガーメント参照)。
 *
 * `groupNodeFactory.ts` の `evaluate()` が、この内部 `sceneOutput` の評価結果(geometry+
 * material の両方が揃っている場合のみ)を `sceneOutputGeometry`/`sceneOutputMaterial` という
 * 予約キーへ転送し、グループ自身の外部出力に加える。`Garments.tsx` はこの2キーの有無だけを
 * 見る(グループの静的な `outputs` には現れず、他ノードへ配線することはできない —
 * `numberDisplay` の `value` と同じパターン)。これは「型が geometry+material を持っていれば
 * 自動描画される」という暗黙の検出ではなく、「明示的にこのノードへ配線されているか」が
 * 描画対象かどうかの仕様そのものになる(`nodes/CLAUDE.md`/`scene/CLAUDE.md` 参照)。
 * `groupOutput` 自身の `geometry`/`material` ソケット(グループ間で値を再利用したい場合の
 * 汎用ソケット、現在は既定では未使用)にどんな値があっても、それだけでは描画対象にはならない
 * — `Garments.tsx` は `groupOutput` 経由の通常出力を一切見ず、この `sceneOutput` 経由の
 * 予約キーだけを見るため。
 *
 * トップレベル(グループの外)に置いても、`Garments.tsx` はルートスコープのノード型を見ないため
 * 効果を持たない(かつてはトップレベル配置もサポートしていたが、`sceneOutput` の置き場所を
 * 「グループの内部」1箇所に統一し、描画の根拠を単純化した)。 */
registerNodeType({
  type: 'sceneOutput',
  label: 'Scene Output',
  category: 'output',
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'material', label: 'Material', type: 'material' },
  ],
  outputs: [],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => inputs,
});
