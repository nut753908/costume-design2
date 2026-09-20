import type { GraphNode } from '../types';

/** 四則演算チェーンで使う定数の `numberInput`(値 `value` だけを持つ、他の `numberInput`
 * と同じ数値入力欄で編集できるノード)を1つ定義するヘルパー。`numberMultiply`/
 * `numberAdd`/`numberSubtract` 等は値そのものを編集する UI を持たないため、これらの
 * ノードへ渡す定数(0/1/-1、Bulge/Front Depth のような固定スタイル値)をリテラルのまま
 * `data` に隠さず、可視のノードとして配置するための慣用形
 * (`nodes/CLAUDE.md` の「グループノード」節参照)。 */
export function constNumberInput(id: string, value: number): GraphNode {
  return { id, type: 'numberInput', data: { value } };
}
