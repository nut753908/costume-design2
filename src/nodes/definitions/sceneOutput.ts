import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';

/** シーンへ実際に描画するための終端ノード。`groupOutput`(グループの埋め込みサブグラフの
 * 出口)と対称に、こちらは描画の出口を表す — geometry+material を受け取ってそのまま
 * 素通しするだけ。置き場所は2通りある:
 *
 * 1. **トップレベルに置く**(`src/state/initialGraph.ts` の `<name>Output` がこれ)。
 *    `Garments.tsx` はこのノードタイプへ実際に配線されているものだけを描画対象にする。
 * 2. **`<name>Group` の埋め込みサブグラフの中(`groupOutput` と並べて)に置く**。
 *    `groupNodeFactory.ts` の `evaluate()` が、この内部 `sceneOutput` の評価結果
 *    (geometry+material の両方が揃っている場合のみ)を `sceneOutputGeometry`/
 *    `sceneOutputMaterial` という予約キーへ転送し、グループ自身の外部出力に加える。
 *    `Garments.tsx` はこの2キーの有無だけを見る(グループの静的な `outputs` には現れず、
 *    他ノードへ配線することはできない — `numberDisplay` の `value` と同じパターン)。
 *
 * どちらの経路も「型が geometry+material を持っていれば自動描画される」という暗黙の検出
 * ではなく、「明示的にこのノードへ配線されているか」が描画対象かどうかの仕様そのものになる
 * 点は同じ(`nodes/CLAUDE.md`/`scene/CLAUDE.md` 参照)。各 `<name>Group` ノード自体の
 * 通常の評価結果にも geometry+material は既に含まれているが(グループ内部の `groupOutput`
 * からそのまま転送されるため)、`Garments.tsx` はそれだけでは描画対象にしない。 */
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
