import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';

/** `groupNodeFactory.ts`(転送する側)と `Garments.tsx`(描画対象を列挙する側)の両方が
 * 使う、予約キーの命名規則の唯一の真実の源。個数を持つ固定フィールドは無く、何個あるかは
 * 呼び出し側が `Object.keys()` を見て初めて分かる。 */
const KEY_PREFIX_GEOMETRY = 'sceneOutputGeometry';
const KEY_PREFIX_MATERIAL = 'sceneOutputMaterial';
const GEOMETRY_KEY_PATTERN = new RegExp(`^${KEY_PREFIX_GEOMETRY}(\\d+)$`);

export function sceneOutputGeometryKey(index: number): string {
  return `${KEY_PREFIX_GEOMETRY}${index}`;
}

export function sceneOutputMaterialKey(index: number): string {
  return `${KEY_PREFIX_MATERIAL}${index}`;
}

/** キーが `sceneOutputGeometry<N>` の形ならそのインデックス `N` を返す(`Material` 側は
 * 常に同じ `N` で対になる前提のため探索は geometry 側だけでよい)。それ以外は `null`。 */
export function matchSceneOutputGeometryIndex(key: string): number | null {
  const m = GEOMETRY_KEY_PATTERN.exec(key);
  return m ? Number(m[1]) : null;
}

/** シーンへ実際に描画するための終端ノード。geometry+material を受け取ってそのまま素通し
 * するだけだが、**必ず `<name>Group` の埋め込みサブグラフの中に置く**こと — トップレベルに
 * 置いても `Garments.tsx` はルートスコープのノード型を見ないため効果を持たない。
 * `groupNodeFactory.ts` の `evaluate()` がこの評価結果を上記の予約キーへ転送し、
 * `Garments.tsx` はキーの有無だけを見て描画する(型検出ではなく、配線そのものが仕様。
 * 詳細は `nodes/CLAUDE.md`/`scene/CLAUDE.md`)。 */
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
