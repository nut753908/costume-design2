import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';

/** `groupNodeFactory.ts`(転送する側)と `Garments.tsx`(描画対象を列挙する側)の両方が
 * 使う、予約キーの命名規則の唯一の真実の源。**1つのグループの中に `sceneOutput` は何個
 * 置いてもよい**(それぞれが独立したガーメント部位として描画される、例: 「上半身」と
 * 「フード」を1つのグループにまとめつつ別々のメッシュとして出す、など)。各グループは
 * 自分の内部で見つけた解決済みの geometry+material の組(直接の `sceneOutput` 由来、
 * および内部にネストした別のグループから既にバブルアップしてきたもの)を先頭から
 * 0,1,2,... と振り直して `sceneOutputGeometry<N>`/`sceneOutputMaterial<N>` という
 * キーで外部出力へ加える — 何個あるかは呼び出し側が `Object.keys()` を見て初めて分かる
 * ため、個数を別途持つ固定フィールドは無い。 */
const KEY_PREFIX_GEOMETRY = 'sceneOutputGeometry';
const KEY_PREFIX_MATERIAL = 'sceneOutputMaterial';
const GEOMETRY_KEY_PATTERN = new RegExp(`^${KEY_PREFIX_GEOMETRY}(\\d+)$`);

export function sceneOutputGeometryKey(index: number): string {
  return `${KEY_PREFIX_GEOMETRY}${index}`;
}

export function sceneOutputMaterialKey(index: number): string {
  return `${KEY_PREFIX_MATERIAL}${index}`;
}

/** 与えられたキーが `sceneOutputGeometry<N>` の形なら、そのインデックス `N` を返す
 * (`sceneOutputMaterial<N>` 側は常に同じ `N` で対になっている前提のため、探索は
 * geometry 側だけを見れば十分)。それ以外のキーなら `null`。 */
export function matchSceneOutputGeometryIndex(key: string): number | null {
  const m = GEOMETRY_KEY_PATTERN.exec(key);
  return m ? Number(m[1]) : null;
}

/** シーンへ実際に描画するための終端ノード。`groupOutput`(グループの埋め込みサブグラフの
 * 出口)と対称に、こちらは描画の出口を表す — geometry+material を受け取ってそのまま
 * 素通しするだけ。**必ず `<name>Group` の埋め込みサブグラフの中に、`groupOutput` と並べて
 * 置く**(`src/nodes/definitions/skirtGroupNode.ts` 等、既存15種のガーメント参照)。
 *
 * `groupNodeFactory.ts` の `evaluate()` が、この内部 `sceneOutput` の評価結果(geometry+
 * material の両方が揃っている場合のみ)を `sceneOutputGeometry<N>`/`sceneOutputMaterial<N>`
 * という予約キー(上記参照)へ転送し、グループ自身の外部出力に加える。`Garments.tsx` は
 * このキーの有無だけを見る(グループの静的な `outputs` には現れず、他ノードへ配線することは
 * できない — `numberDisplay` の `value` と同じパターン)。これは「型が geometry+material を
 * 持っていれば自動描画される」という暗黙の検出ではなく、「明示的にこのノードへ配線されて
 * いるか」が描画対象かどうかの仕様そのものになる(`nodes/CLAUDE.md`/`scene/CLAUDE.md` 参照)。
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
