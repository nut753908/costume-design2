import type { GraphEdge, GraphNode } from './types';

export interface LayoutPosition {
  x: number;
  y: number;
}

const COLUMN_SPACING = 340;
/** 同じ列内で連続する行の中心間隔。ノードカードの実際の高さは種類によって様々で
 * (例: `numberInput` は約84px、フィールド数の多いジェネレーターノード — 実測した中で
 * 最大の bagGenerator は8フィールド+出力で約246px)、`computeAutoLayout()` は DOM を
 * 一切見ないピュアな関数のため個々のカードの実高さを知らない。そのため、実測した中で
 * 最も高いカードより余裕を持って大きい固定値にし、どんな組み合わせで隣り合っても
 * カード同士が重ならないようにしている(小さいカードだけが並ぶ列は間延びするが、
 * 重なって配線が読めなくなるより安全)。テストからも参照するため export している。 */
export const ROW_SPACING = 280;
/** 1層あたりの最大行数。このアプリのグラフは入力ノード(numberInput 等)が大量に
 * layer 0 へ集まる星型に近い形になりやすく、折り返さずに1列に積むと極端に縦長(かつ
 * 横に極端に狭い)レイアウトになり、fitView した際にほぼ読めないほど拡大されてしまう。
 * この行数を超えたら同じ層の中で次のサブ列へ折り返し、全体の縦横比を穏やかに保つ。 */
const MAX_ROWS_PER_COLUMN = 14;

/** ノードグラフを、入力から出力へ向かうトポロジカルな層(最長経路)に沿って整列させた
 * 新しい位置を返す。各層内の順序は、1つ前の層にある接続元ノードの平均順位
 * (バリセンター)で決め、`MAX_ROWS_PER_COLUMN` を超える層はサブ列に折り返す。
 * circular な接続は評価不能だが(evaluateGraph は例外を投げる)、整列ボタンは
 * グラフの実行可能性を問わずいつでも安全に使えるべきなので、循環に巻き込まれた
 * ノードは layer 0 にフォールバックし、決して例外を投げない。 */
export function computeAutoLayout(nodes: GraphNode[], edges: GraphEdge[]): Map<string, LayoutPosition> {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    dependents.set(node.id, []);
    predecessors.set(node.id, []);
  }
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    dependents.get(edge.source)!.push(edge.target);
    predecessors.get(edge.target)!.push(edge.source);
  }

  const layer = new Map<string, number>();
  const queue: string[] = nodes.filter((n) => inDegree.get(n.id) === 0).map((n) => n.id);
  for (const id of queue) layer.set(id, 0);

  while (queue.length > 0) {
    const id = queue.shift()!;
    const currentLayer = layer.get(id) ?? 0;
    for (const dep of dependents.get(id) ?? []) {
      if (currentLayer + 1 > (layer.get(dep) ?? 0)) layer.set(dep, currentLayer + 1);
      const remaining = (inDegree.get(dep) ?? 0) - 1;
      inDegree.set(dep, remaining);
      if (remaining === 0) queue.push(dep);
    }
  }
  // 循環に巻き込まれて一度もキューに乗らなかったノードは layer 0 として扱う。
  for (const node of nodes) {
    if (!layer.has(node.id)) layer.set(node.id, 0);
  }

  const maxLayer = nodes.length === 0 ? 0 : Math.max(...Array.from(layer.values()));
  const nodesByLayer: string[][] = Array.from({ length: maxLayer + 1 }, () => []);
  for (const node of nodes) {
    nodesByLayer[layer.get(node.id)!].push(node.id);
  }

  // row は層内での順位(0始まりの連番)。次の層のバリセンター計算にも使うため、
  // サブ列への折り返しとは独立した「連続した順位」として保持する。
  const row = new Map<string, number>();
  for (const ids of nodesByLayer) {
    const ordered = [...ids].sort((a, b) => barycenter(a, ids, predecessors, row) - barycenter(b, ids, predecessors, row));
    ordered.forEach((id, index) => row.set(id, index));
  }

  // 層ごとに必要なサブ列数(MAX_ROWS_PER_COLUMN 行で折り返す)を数え、層の基準x座標を
  // 積み上げて求める。前の層が折り返して複数列を使っていれば、その分だけ次の層は右にずれる。
  const subColsForLayer = nodesByLayer.map((ids) => Math.max(1, Math.ceil(ids.length / MAX_ROWS_PER_COLUMN)));
  const baseX: number[] = [];
  let accumulatedX = 0;
  for (let l = 0; l <= maxLayer; l++) {
    baseX[l] = accumulatedX;
    accumulatedX += subColsForLayer[l] * COLUMN_SPACING;
  }

  const positions = new Map<string, LayoutPosition>();
  for (const node of nodes) {
    const l = layer.get(node.id)!;
    const rank = row.get(node.id)!;
    positions.set(node.id, {
      x: baseX[l] + Math.floor(rank / MAX_ROWS_PER_COLUMN) * COLUMN_SPACING,
      y: (rank % MAX_ROWS_PER_COLUMN) * ROW_SPACING,
    });
  }
  return positions;
}

/** 接続元ノード(既に行位置が確定済みの前の層)の平均行位置。接続元が無いノードは、
 * 同じ層内での元の並び順を安定した既定順として使う。 */
function barycenter(
  id: string,
  layerIds: string[],
  predecessors: Map<string, string[]>,
  row: Map<string, number>,
): number {
  const rows = (predecessors.get(id) ?? []).map((p) => row.get(p)).filter((r): r is number => r !== undefined);
  if (rows.length > 0) return rows.reduce((sum, r) => sum + r, 0) / rows.length;
  return layerIds.indexOf(id);
}
