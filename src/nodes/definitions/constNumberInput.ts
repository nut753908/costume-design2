import type { GraphNode } from '../types';

/** 四則演算チェーンで使う「常に一定の値を持つ `numberInput`」ノードを1つ定義するヘルパー
 * (`min`/`max`/`value` を同じ値に固定し、UI からは実質変更できない)。`numberMultiply`/
 * `numberAdd`/`numberSubtract` 等は `data.label` の編集こそできても値そのものを編集する
 * UI を持たないため、これらのノードへ渡す定数(0/1/-1、Bulge/Front Depth のような固定
 * スタイル値)をリテラルのまま `data` に隠さず、可視のノードとして配置するための慣用形
 * (`nodes/CLAUDE.md` の「グループノード」節参照)。 */
export function constNumberInput(id: string, value: number, label: string): GraphNode {
  return { id, type: 'numberInput', data: { value, min: value, max: value, step: 0.01, label } };
}
