import type { GraphEdge, GraphNode } from './types';

export interface LayoutPosition {
  x: number;
  y: number;
}

/** 隣接する層(x)の中心間隔。テストからも参照するため export している。 */
export const COLUMN_SPACING = 340;
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

/** 層内の順序を安定させるための反復バリセンター(Sugiyama法)の往復回数。前→後、後→前の
 * 1往復を1イテレーションとして数える。片方向のバリセンターだけでは後続層の並びが前層の
 * 並びに影響を返せず、star型のグラフ(入力ノードが1層に大量に集まる)で線が不必要に
 * 交差・迂回しやすい。往復を重ねるほど交差・総延長は減るが効果は早期に収束するため、
 * このアプリの規模(数十〜百ノード程度)では4往復で十分。 */
const BARYCENTER_ITERATIONS = 4;

/** 層(x座標)の位置そのものを線の長さが縮む方向へ調整する反復回数。詳細は
 * `computeAutoLayout()` 内の layer バランス調整のコメントを参照。層内の順序を
 * 決める `BARYCENTER_ITERATIONS` とは最適化の軸が異なる(こちらは「どの層に
 * 属するか」、あちらは「同じ層の中で何番目か」)。 */
const LAYER_BALANCE_ITERATIONS = 4;

/** 行(y座標)の位置そのものを線の長さが縮む方向へ調整する反復回数。層バランス調整の
 * y版だが、行の並び順自体には(層とは違い)DAGの前後関係のような制約が無く、同じ
 * サブ列内で連続する行の間に `ROW_SPACING` 以上の間隔さえ保てればどの位置でもよい。 */
const ROW_BALANCE_ITERATIONS = 4;

/** ノードグラフを、入力から出力へ向かうトポロジカルな層に沿って整列させた新しい位置を
 * 返す。層の割り当ては、最長経路による最速位置(earliest)と、出力側から遡った最長経路
 * による最遅位置(latest)の両方を求め、その間に余裕(slack)があるノードを接続元・
 * 接続先の層の中央値に近づけて線を短くする(`LAYER_BALANCE_ITERATIONS` 参照、厳密な
 * ネットワークシンプレックス法ほど最適ではないが、循環を含むグラフでも逆向きの辺を
 * 作らないシンプルな反復法)。各層内の順序は、隣接層(前層/後層)にある接続先ノードの
 * 平均順位(バリセンター)を前→後・後→前と交互に何度か往復して収束させて決め
 * (`BARYCENTER_ITERATIONS` 参照)、`MAX_ROWS_PER_COLUMN` を超える層はサブ列に折り返す。
 * さらにその順序(同じサブ列内での連続した並び)を保ったまま、実際の y 座標も接続元・
 * 接続先ノードの y 座標の中央値に近づけて縦方向の線も短くする(`ROW_BALANCE_ITERATIONS`
 * 参照。バリセンターは「同じ層の中で何番目か」という順位だけを最適化するのに対し、
 * こちらは順位を保ったまま実際の座標値を動かす点が異なる)。
 * circular な接続は評価不能だが(evaluateGraph は例外を投げる)、整列ボタンは
 * グラフの実行可能性を問わずいつでも安全に使えるべきなので、循環に巻き込まれた
 * ノードは layer 0 にフォールバックし(層バランス調整の対象からも除外され)、決して
 * 例外を投げない。 */
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

  const earliestLayer = new Map<string, number>();
  const topoOrder: string[] = [];
  const queue: string[] = nodes.filter((n) => inDegree.get(n.id) === 0).map((n) => n.id);
  for (const id of queue) earliestLayer.set(id, 0);

  while (queue.length > 0) {
    const id = queue.shift()!;
    topoOrder.push(id);
    const currentLayer = earliestLayer.get(id) ?? 0;
    for (const dep of dependents.get(id) ?? []) {
      if (currentLayer + 1 > (earliestLayer.get(dep) ?? 0)) earliestLayer.set(dep, currentLayer + 1);
      const remaining = (inDegree.get(dep) ?? 0) - 1;
      inDegree.set(dep, remaining);
      if (remaining === 0) queue.push(dep);
    }
  }
  // 循環に巻き込まれて一度もキューに乗らなかったノードは layer 0 として扱う(トポロジカル
  // 順序が定義できないため、以降の層バランス調整の対象からも外す)。
  for (const node of nodes) {
    if (!earliestLayer.has(node.id)) earliestLayer.set(node.id, 0);
  }

  const maxLayer = nodes.length === 0 ? 0 : Math.max(...Array.from(earliestLayer.values()));

  // 出力側から遡った最長経路で、各ノードを線を伸ばさずに右へずらせる限界(latestLayer)を
  // 求める。トポロジカル順序の逆向きに、後続ノード(dependents)の latestLayer の最小値-1
  // として決める。後続の無いノードは maxLayer までずらせる。
  const inTopoOrder = new Set(topoOrder);
  const latestLayer = new Map<string, number>();
  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const id = topoOrder[i];
    const succs = (dependents.get(id) ?? []).filter((s) => inTopoOrder.has(s));
    latestLayer.set(id, succs.length > 0 ? Math.min(...succs.map((s) => latestLayer.get(s)!)) - 1 : maxLayer);
  }
  for (const node of nodes) {
    if (!latestLayer.has(node.id)) latestLayer.set(node.id, earliestLayer.get(node.id)!); // 循環ノードは余裕無し
  }

  // layer が最終的な層。earliestLayer(最速位置)を初期値とし、[現在の接続元より後,
  // latestLayer(現在の接続先より前)] の範囲内で、接続元・接続先の層の中央値に近づける。
  // 前→後・後→前と往復するたびに調整結果が隣接ノードへ伝播するため、複数回繰り返す
  // (`LAYER_BALANCE_ITERATIONS`)。範囲外に出さない clamp があるため、循環を除けば
  // 何度繰り返しても DAG として不正な(接続先が接続元より前になる)配置にはならない。
  const layer = new Map(earliestLayer);
  const median = (values: number[]): number => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  };
  const clamp = (value: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, value));
  for (let iter = 0; iter < LAYER_BALANCE_ITERATIONS; iter++) {
    for (const id of topoOrder) {
      const preds = (predecessors.get(id) ?? []).filter((p) => inTopoOrder.has(p));
      if (preds.length === 0) continue; // 接続元が無ければ右へ動かす理由が無い
      const succs = (dependents.get(id) ?? []).filter((s) => inTopoOrder.has(s));
      const lowerBound = Math.max(...preds.map((p) => layer.get(p)!)) + 1;
      const desired = median([...preds, ...succs].map((n) => layer.get(n)!));
      layer.set(id, clamp(Math.round(desired), lowerBound, latestLayer.get(id)!));
    }
    for (let i = topoOrder.length - 1; i >= 0; i--) {
      const id = topoOrder[i];
      const succs = (dependents.get(id) ?? []).filter((s) => inTopoOrder.has(s));
      if (succs.length === 0) continue; // 接続先が無ければ左へ動かす理由が無い
      const preds = (predecessors.get(id) ?? []).filter((p) => inTopoOrder.has(p));
      const lowerBound = preds.length > 0 ? Math.max(...preds.map((p) => layer.get(p)!)) + 1 : 0;
      const upperBound = Math.min(...succs.map((s) => layer.get(s)!)) - 1;
      const desired = median([...preds, ...succs].map((n) => layer.get(n)!));
      layer.set(id, clamp(Math.round(desired), lowerBound, upperBound));
    }
  }

  const nodesByLayer: string[][] = Array.from({ length: maxLayer + 1 }, () => []);
  for (const node of nodes) {
    nodesByLayer[layer.get(node.id)!].push(node.id);
  }

  // layerOrder は層ごとのノード順序(ミュータブル)。row はそこから引いた「層内での順位」
  // (0始まりの連番)で、次の層/前の層のバリセンター計算にも使うため、サブ列への折り返し
  // とは独立した「連続した順位」として保持する。
  const layerOrder: string[][] = nodesByLayer.map((ids) => [...ids]);
  const row = new Map<string, number>();
  const refreshRows = () => {
    for (const ids of layerOrder) ids.forEach((id, index) => row.set(id, index));
  };
  refreshRows();

  // Sugiyama法の反復バリセンター: 前→後(predecessors 参照)、後→前(dependents 参照)の
  // 並び替えを交互に繰り返し、隣接層の順序と整合するまで収束させる。
  const sweep = (neighborsOf: Map<string, string[]>, layers: number[]) => {
    for (const l of layers) {
      const ids = layerOrder[l];
      const keyed = ids.map((id, index) => {
        const neighborRows = (neighborsOf.get(id) ?? [])
          .map((n) => row.get(n))
          .filter((r): r is number => r !== undefined);
        // 隣接層に接続が無いノードは、その場で安定させるため現在の順位をそのままキーにする。
        const key = neighborRows.length > 0 ? neighborRows.reduce((sum, r) => sum + r, 0) / neighborRows.length : index;
        return { id, key };
      });
      keyed.sort((a, b) => a.key - b.key);
      layerOrder[l] = keyed.map((k) => k.id);
      refreshRows();
    }
  };
  const forwardLayers = Array.from({ length: maxLayer }, (_, i) => i + 1); // 1..maxLayer
  const backwardLayers = Array.from({ length: maxLayer }, (_, i) => maxLayer - 1 - i); // maxLayer-1..0
  for (let iter = 0; iter < BARYCENTER_ITERATIONS; iter++) {
    sweep(predecessors, forwardLayers);
    sweep(dependents, backwardLayers);
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

  // columnGroups は「同じサブ列」(MAX_ROWS_PER_COLUMN 行で折り返した1本の縦の列)ごとの
  // ノード列で、layerOrder を MAX_ROWS_PER_COLUMN 個ずつに区切ったもの。バリセンターで
  // 決めた並び順(このグループ内でのインデックス)は変えず、実際の y 座標だけを接続元・
  // 接続先の y に近づけて調整する。
  const columnGroups: string[][] = [];
  for (const ids of layerOrder) {
    for (let i = 0; i < ids.length; i += MAX_ROWS_PER_COLUMN) {
      columnGroups.push(ids.slice(i, i + MAX_ROWS_PER_COLUMN));
    }
  }
  // 目標値(desired)は、この後何度も反復して変わっていく rowY 自身ではなく、最初の
  // ランクに基づく固定値(initialRowY)から常に計算する。もし互いに更新し合う rowY を
  // 目標値にすると、隣接ノード同士が「相手が動いた分だけさらに動く」を繰り返して値が
  // 際限なく増えていく(発散する)ことがある(実際に初期プリセットで踏んだ不具合)。
  // 目標値を固定することで、rowY は常に有限な範囲(initialRowY の最小値〜最大値付近)
  // に収まることが保証される。
  const initialRowY = new Map<string, number>();
  for (const group of columnGroups) {
    group.forEach((id, i) => initialRowY.set(id, i * ROW_SPACING));
  }
  const rowY = new Map(initialRowY);
  const desiredY = (id: string): number => {
    const neighbors = [...(predecessors.get(id) ?? []), ...(dependents.get(id) ?? [])];
    return neighbors.length > 0 ? median(neighbors.map((n) => initialRowY.get(n)!)) : initialRowY.get(id)!;
  };
  for (let iter = 0; iter < ROW_BALANCE_ITERATIONS; iter++) {
    // 上から下へ: 直前のノードとの間隔(ROW_SPACING 以上)だけを守りながら、目標値に近づける。
    for (const group of columnGroups) {
      for (let i = 0; i < group.length; i++) {
        const id = group[i];
        const lowerBound = i === 0 ? 0 : rowY.get(group[i - 1])! + ROW_SPACING;
        rowY.set(id, Math.max(lowerBound, Math.round(desiredY(id))));
      }
    }
    // 下から上へ: 同様に前後のノードとの間隔を守りながら目標値に近づけることで、
    // 上のパスで必要以上に下へ押し出された分を詰め直す。
    for (const group of columnGroups) {
      for (let i = group.length - 1; i >= 0; i--) {
        const id = group[i];
        const lowerBound = i === 0 ? 0 : rowY.get(group[i - 1])! + ROW_SPACING;
        const upperBound = i === group.length - 1 ? Infinity : rowY.get(group[i + 1])! - ROW_SPACING;
        rowY.set(id, clamp(Math.round(desiredY(id)), lowerBound, upperBound));
      }
    }
  }

  const positions = new Map<string, LayoutPosition>();
  for (const node of nodes) {
    const l = layer.get(node.id)!;
    const rank = row.get(node.id)!;
    positions.set(node.id, {
      x: baseX[l] + Math.floor(rank / MAX_ROWS_PER_COLUMN) * COLUMN_SPACING,
      y: rowY.get(node.id)!,
    });
  }
  return positions;
}
