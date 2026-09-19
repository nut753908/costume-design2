import { getNodeType, nodeTypeRegistry } from './registry';
import { resolveNodeSockets } from './resolveNodeSockets';
import { listExposedParams } from './groupTemplate';
import type { GraphEdge, GraphNode } from './types';

export interface LayoutPosition {
  x: number;
  y: number;
}

/** 隣接する層(x)の中心間隔。テストからも参照するため export している。 */
export const COLUMN_SPACING = 340;
/** 同じ列内で隣り合うノードの間に必ず空ける余白。ノードカードの実際の高さは
 * `estimateNodeHeight()` がノードの種類ごとに見積もるため、この値は「カードの高さ」
 * ではなく純粋な隙間(マージン)だけを表す小さな定数でよい。 */
const NODE_GAP = 24;
/** ノードの種類(type)を判別できない場合(単体テストの `type: 'test'` など、
 * `nodeTypeRegistry` に登録の無い型)に使う既定の高さ。実測した中で最も高いカード
 * (フィールド数の多い bagGenerator、約246px)より余裕を持って大きい値にし、未知の
 * 種類のノードが混ざっていても重ならないようにしている。 `estimateNodeHeight()` が
 * 使えない場合の唯一のフォールバックであり、`ROW_SPACING - NODE_GAP` から逆算した
 * 値(このモジュール導入前の固定行間隔 `ROW_SPACING` と一致させ、既存のテストや
 * 未知の種類に対する挙動を変えないため)。 */
export const ROW_SPACING = 280;
const FALLBACK_NODE_HEIGHT = ROW_SPACING - NODE_GAP;

/** ノードカード内の1行(ソケット行・値表示行)の高さ、および行を持たない土台(タイトル
 * バー+パディング)の高さ。`run-costume-design2` スキルで実機のカードを実測して較正
 * した値(`.rf-node` の `offsetHeight`)。generator/material/output/group 系のノードは
 * `editor/nodeComponents/GenericNode.tsx` が入力/出力ソケットを1行ずつ描画するだけの
 * シンプルな構造で、実測値は驚くほど正確にこの線形の式(土台 + 行数 × 行高さ)に
 * 一致した(誤差1px未満、例: bagGenerator は 8入力+1出力の9行で 40 + 9*23 = 247 ≈
 * 実測246px)。 */
const CARD_BASE_HEIGHT = 40;
const CARD_ROW_HEIGHT = 23;
/** 評価値の表示行(`GenericNode.tsx` の `rf-node__value`、数値/enum型の出力ごとに1行)の高さ。
 * ソケット行より少し低く、値表示行を1つでも持つカードにはさらに末尾に少しの余白
 * (`VALUE_ROWS_TRAILING_HEIGHT`)が加わる(実測: numberMultiply は 40 + 3*23 + 22 = 131、
 * 値表示行が8個の bodyLayoutGroup は 8*20.6 + 1.4 と合う)。 */
const VALUE_ROW_HEIGHT = 20.6;
const VALUE_ROWS_TRAILING_HEIGHT = 1.4;
/** category が `'group'` のノードだけ追加で表示される「ダブルクリックで中に入る」の
 * ヒント行の高さ。 */
const CARD_GROUP_HINT_HEIGHT = 18;
/** グループの中に入っている間だけ numberInput/colorInput/enumInput のカードに追加で出る
 * 「グループに表示」チェックボックス行(`ExposeToggle.tsx`)の高さ。 */
const EXPOSE_TOGGLE_HEIGHT = 23;
/** `groupInput`/`groupOutput` の末尾の「追加」行(型セレクタ+「+ Add」ボタン)の高さ。 */
const GROUP_IO_ADD_ROW_HEIGHT = 26;
/** スライダー/カラーピッカーなど専用UIを持つ入力系ノードのうち、ノード固有設定
 * (ラベル名・min/max/step・カラーコードのテキスト欄)の行数が固定な2種は、ソケット数に
 * よらずほぼ固定の高さになる(常に出力ソケット1個だけ)。実測値そのもの。enumInput は
 * 選択肢(`rf-node__io-row`)を可変個描画するため、この固定値方式ではなく後述の
 * `ENUM_INPUT_BASE_HEIGHT` を使った式で見積もる。 */
const BESPOKE_NODE_HEIGHTS: Record<string, number> = {
  numberInput: 127,
  colorInput: 90,
};
/** enumInput の選択肢が0個だった場合に相当する高さへの外挿値(実測: 選択肢3個で153px、
 * 5個で199px、傾き23pxは CARD_ROW_HEIGHT と一致したため、切片だけを定数として持つ)。 */
const ENUM_INPUT_BASE_HEIGHT = 84;
/** グループノードのカード上に並ぶ露出パラメータ(`ExposedParams.tsx`)1行あたりの高さ(行間の
 * gap 3px を含む)。`run-costume-design2` スキルで実カードの `.rf-node__exposed` を実測して較正した
 * 値(number: 52+3、color: 43+3。全体には下端の余白 4px と gap の差の 1px が加わる)。enumInput は
 * color と同じ高さで近似している。 */
const EXPOSED_NUMBER_ROW_HEIGHT = 55;
const EXPOSED_OTHER_ROW_HEIGHT = 47;

function exposedParamsHeight(type: string, data: unknown): number {
  const params = listExposedParams(type, (data as Record<string, unknown>) ?? {});
  if (params.length === 0) return 0;
  return params.reduce((sum, p) => sum + (p.type === 'numberInput' ? EXPOSED_NUMBER_ROW_HEIGHT : EXPOSED_OTHER_ROW_HEIGHT), 1);
}

/** `data.label` で独自の名前が付けられた generator 系ノード(今のところ
 * numberAdd/numberMultiply/numberSubtract のみ、`NodeTitleBar.tsx` の `rf-node__type-subtitle`
 * 参照)がタイトルの下に追加で表示する、元の type 名(例: "numberAdd")のサブタイトル行が
 * 占める高さ。`run-costume-design2` スキルで bodyLayoutGroup 内の numberAdd ノード
 * (rows=4: a/b/value(出力ソケット行)/value(数値表示行)、`shoulderYCalc`)の実測
 * offsetHeight=145px から逆算して較正した値(145 = 40 + 4*23 + 13、誤差0px)。 */
const TYPE_NAME_SUBTITLE_HEIGHT = 15;

/** ノードカードの高さを、DOM を一切見ずにノードの種類(type)と入出力ソケット数から
 * 見積もる。`computeAutoLayout()` はピュア関数のまま保ちたいが、`ROW_SPACING` 1本の
 * 固定値では小さいノード(numberInput 約84px)も大きいノード(bagGenerator 約246px)も
 * 同じ間隔で並べることになり、間延びしすぎる問題があった(詳細は Git 履歴参照)。
 *
 * - `BESPOKE_NODE_HEIGHTS` に載っている専用UI系はその固定値を返す。
 * - `enumInput` は選択肢数だけ可変(`ENUM_INPUT_BASE_HEIGHT + 選択肢数 * CARD_ROW_HEIGHT`)。
 * - `groupInput`/`groupOutput` は `editor/nodeComponents/` の専用UI(ソケットごとの
 *   行 + 末尾の追加行)を持ち、`GenericNode.tsx` の行とは構造が異なるが、行の高さは
 *   同じ `CARD_ROW_HEIGHT` で近似し、追加行の分だけ余分に足す。
 * - それ以外(generator/material/output/group)は `GenericNode.tsx` の描画に対応する
 *   `CARD_BASE_HEIGHT + 行数 * CARD_ROW_HEIGHT` (+ category が `'group'` なら
 *   `CARD_GROUP_HINT_HEIGHT`)。行数は `resolveNodeSockets()` の入力+出力の合計に、
 *   数値/enum型の出力ソケットの分だけ加える — `GenericNode.tsx` は評価結果のうち
 *   数値/enum型の出力を「ソケット行」とは別にもう一度「値表示行」として描画する
 *   ため(例: numberMultiply の "Value" 出力はソケット行1つ+値表示行1つ、値表示行の高さは
 *   ソケット行とは異なる、`VALUE_ROW_HEIGHT` 参照)。
 * - numberInput/colorInput/enumInput は、グループの中に入っている間(`inGroup`)だけ
 *   「グループに表示」チェックボックス行(`EXPOSE_TOGGLE_HEIGHT`)が加わる。
 *   `garmentPlacement`(geometry)も静的な `outputs` として宣言されているため
 *   (`src/nodes/CLAUDE.md` の「グループノード」節参照)、個別の特殊扱いは不要で、
 *   この一般式にそのまま乗る。
 * - `nodeTypeRegistry` に登録の無い種類(単体テストの `type: 'test'` など)は
 *   `FALLBACK_NODE_HEIGHT` を返す。
 *
 * テストからも直接検証できるよう export している。 */
export function estimateNodeHeight(type: string, data: unknown, inGroup = false): number {
  const exposeToggle = inGroup ? EXPOSE_TOGGLE_HEIGHT : 0;
  const bespoke = BESPOKE_NODE_HEIGHTS[type];
  if (bespoke !== undefined) return bespoke + exposeToggle;

  if (type === 'enumInput') {
    const options = (data as { options?: unknown[] } | undefined)?.options ?? [];
    return ENUM_INPUT_BASE_HEIGHT + options.length * CARD_ROW_HEIGHT + exposeToggle;
  }

  if (type === 'groupInput' || type === 'groupOutput') {
    const sockets = (data as { sockets?: unknown[] } | undefined)?.sockets ?? [];
    return CARD_BASE_HEIGHT + sockets.length * CARD_ROW_HEIGHT + GROUP_IO_ADD_ROW_HEIGHT;
  }

  if (!nodeTypeRegistry.has(type)) return FALLBACK_NODE_HEIGHT;

  const def = getNodeType(type);
  const { inputs, outputs } = resolveNodeSockets(type, (data as Record<string, unknown>) ?? {});
  const valueRows = outputs.filter((o) => o.type === 'number' || o.type === 'enum').length;
  const socketRows = inputs.length + outputs.length;
  const hasTypeNameSubtitle = (data as { label?: string } | undefined)?.label !== undefined;
  return Math.round(
    CARD_BASE_HEIGHT +
      socketRows * CARD_ROW_HEIGHT +
      (valueRows > 0 ? valueRows * VALUE_ROW_HEIGHT + VALUE_ROWS_TRAILING_HEIGHT : 0) +
      (def.category === 'group' ? CARD_GROUP_HINT_HEIGHT + exposedParamsHeight(type, data) : 0) +
      (hasTypeNameSubtitle ? TYPE_NAME_SUBTITLE_HEIGHT : 0),
  );
}

/** ソケット `socketId` が、そのノードの中で描画される行の何番目か(0=先頭)を、
 * 全行数に対する割合(0以上1未満)で返す。`GenericNode.tsx` は入力ソケットを先に、
 * その後に出力ソケットを描画するため、`direction: 'output'` のソケットは入力の行数ぶん
 * 後ろにずれる。バリセンターで「同じ1つの接続先/接続元だけを持つノード同士」を
 * 並べ替える際に、その接続先/接続元の中での実際のソケット行の並びに合わせるために使う
 * (`computeAutoLayout()` 内のバリセンターのコメント参照)。専用UIを持つ入力系ノードや
 * `nodeTypeRegistry` に登録の無い種類など、行の並びが明確でない場合は 0(優先順位を
 * つけない)を返す。テストからも直接検証できるよう export している。 */
export function socketRowFraction(type: string, data: unknown, socketId: string | null | undefined, direction: 'input' | 'output'): number {
  if (socketId == null) return 0;
  if (type in BESPOKE_NODE_HEIGHTS) return 0;
  if (type === 'enumInput') return 0;
  if (type === 'groupInput' || type === 'groupOutput') return 0;
  if (!nodeTypeRegistry.has(type)) return 0;

  const { inputs, outputs } = resolveNodeSockets(type, (data as Record<string, unknown>) ?? {});
  const total = inputs.length + outputs.length;
  if (total === 0) return 0;
  const list = direction === 'input' ? inputs : outputs;
  const localIndex = list.findIndex((s) => s.id === socketId);
  if (localIndex < 0) return 0;
  const index = direction === 'input' ? localIndex : inputs.length + localIndex;
  return index / total;
}
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

/** 目標値(desired)の列を、非減少になるよう詰め直す(Pool Adjacent Violators Algorithm)。
 * 「非減少」という制約の下で目標値との誤差二乗和を最小にする配置を求める、数学的に
 * 証明された古典的アルゴリズム。前の値を下回っている(=非減少に違反している)区間を
 * 1つのブロックとして併合し、その平均値に置き換える処理を繰り返すだけで解が求まり、
 * 層バランス調整のような反復回数の調整や発散のリスクが無い。行(y座標)バランス調整
 * (`computeAutoLayout()` 内)で、「同じサブ列内での並び順」を保ったまま各ノードを
 * 目標値へできるだけ近づけるために使う。テストからも直接検証できるよう export している。 */
export function isotonicRegression(values: number[]): number[] {
  const blockSum: number[] = [];
  const blockCount: number[] = [];
  for (const v of values) {
    let sum = v;
    let count = 1;
    while (blockSum.length > 0 && blockSum[blockSum.length - 1] / blockCount[blockCount.length - 1] > sum / count) {
      sum += blockSum.pop()!;
      count += blockCount.pop()!;
    }
    blockSum.push(sum);
    blockCount.push(count);
  }
  const result: number[] = [];
  for (let i = 0; i < blockSum.length; i++) {
    const avg = blockSum[i] / blockCount[i];
    for (let j = 0; j < blockCount[i]; j++) result.push(avg);
  }
  return result;
}

/** ノードグラフを、入力から出力へ向かうトポロジカルな層に沿って整列させた新しい位置を
 * 返す。層の割り当ては、最長経路による最速位置(earliest)と、出力側から遡った最長経路
 * による最遅位置(latest)の両方を求め、その間に余裕(slack)があるノードを接続元・
 * 接続先の層の中央値に近づけて線を短くする(`LAYER_BALANCE_ITERATIONS` 参照、厳密な
 * ネットワークシンプレックス法ほど最適ではないが、循環を含むグラフでも逆向きの辺を
 * 作らないシンプルな反復法)。各層内の順序は、隣接層(前層/後層)にある接続先ノードの
 * 平均順位(バリセンター)を前→後・後→前と交互に何度か往復して収束させて決め
 * (`BARYCENTER_ITERATIONS` 参照)、`MAX_ROWS_PER_COLUMN` を超える層はサブ列に折り返す。
 * さらにその順序(同じサブ列内での連続した並び)を保ったまま、実際の y 座標も接続元・
 * 接続先ノードの y 座標の中央値へできるだけ近づけて縦方向の線も短くする
 * (`isotonicRegression` 参照。バリセンターは「同じ層の中で何番目か」という順位だけを
 * 最適化するのに対し、こちらは順位を保ったまま実際の座標値を動かす点が異なる)。行間隔は
 * `estimateNodeHeight()` がノードの種類ごとに見積もる実際のカードの高さ+`NODE_GAP` を
 * 使うため、小さいノードは詰めて配置され、無駄な余白が出にくい。
 * circular な接続は評価不能だが(evaluateGraph は例外を投げる)、整列ボタンは
 * グラフの実行可能性を問わずいつでも安全に使えるべきなので、循環に巻き込まれた
 * ノードは layer 0 にフォールバックし(層バランス調整の対象からも除外され)、決して
 * 例外を投げない。 */
export function computeAutoLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: { inGroup?: boolean } = {},
): Map<string, LayoutPosition> {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const nodeHeight = new Map(nodes.map((n) => [n.id, estimateNodeHeight(n.type, n.data, options.inGroup)]));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();
  // id から見て、隣接ノード n が「n の中の何番目のソケット行」で繋がっているかを引く
  // ためのテーブル(バリセンターで使う、下記参照)。n が接続先(dependent)なら n の
  // 入力ソケット、n が接続元(predecessor)なら n の出力ソケットの行を指す。
  const neighborSocket = new Map<string, Map<string, { handle: string | null | undefined; direction: 'input' | 'output' }>>();
  const setNeighborSocket = (id: string, neighborId: string, handle: string | null | undefined, direction: 'input' | 'output') => {
    if (!neighborSocket.has(id)) neighborSocket.set(id, new Map());
    neighborSocket.get(id)!.set(neighborId, { handle, direction });
  };

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
    setNeighborSocket(edge.target, edge.source, edge.sourceHandle, 'output');
    setNeighborSocket(edge.source, edge.target, edge.targetHandle, 'input');
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
        const neighborIds = neighborsOf.get(id) ?? [];
        const neighborRows = neighborIds.map((n) => row.get(n)).filter((r): r is number => r !== undefined);
        // 隣接層に接続が無いノードは、その場で安定させるため現在の順位をそのままキーにする。
        let key = neighborRows.length > 0 ? neighborRows.reduce((sum, r) => sum + r, 0) / neighborRows.length : index;
        // 接続先/接続元がただ1つだけの場合、その1つの中での実際のソケット行の並びに
        // 合わせて同順位内をさらに並べ替える(例: A,B,C が同じ1つのノード N だけに
        // それぞれ別のソケットで繋がっている場合、N の中でのソケットの並び順どおりに
        // 隣接させる)。複数の接続先/接続元を持つノードは、平均順位だけでは
        // どのソケットを優先すべきか決められないため対象外(0〜1未満の小数を
        // そのまま順位に加えるだけなので、複数隣接ノードによる平均順位の大小関係は
        // 変えない)。
        if (neighborIds.length === 1) {
          const neighborId = neighborIds[0];
          const socket = neighborSocket.get(id)?.get(neighborId);
          const neighborNode = socket && nodeById.get(neighborId);
          if (socket && neighborNode) key += socketRowFraction(neighborNode.type, neighborNode.data, socket.handle, socket.direction);
        }
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

  // 弱連結成分(辺の向きを無視してノードをグループ分けしたもの)ごとに ID を振る。
  // 異なる成分の間には辺が1本も無い以上、desiredY(接続元・接続先の y の中央値)は
  // 常に同じ成分内のノードしか参照しない。孤立ノード(接続が1本も無いノード)は
  // それ自身が要素数1の成分にすぎない — 一般化すると「他とつながっていない成分は、
  // 本体の成分の位置調整を妨げないよう分けて並べる」という話になる。
  const componentId = new Map<string, number>();
  let nextComponentId = 0;
  for (const node of nodes) {
    if (componentId.has(node.id)) continue;
    const id = nextComponentId++;
    const stack = [node.id];
    componentId.set(node.id, id);
    while (stack.length > 0) {
      const cur = stack.pop()!;
      for (const n of [...(predecessors.get(cur) ?? []), ...(dependents.get(cur) ?? [])]) {
        if (!componentId.has(n)) {
          componentId.set(n, id);
          stack.push(n);
        }
      }
    }
  }
  const componentSize = new Map<number, number>();
  for (const c of componentId.values()) componentSize.set(c, (componentSize.get(c) ?? 0) + 1);
  // 最も大きい成分を「本体」とみなし、各層の中で常に先頭に来るようにする(それ以外の
  // 成分は登場順のまま本体の後ろへ回る)。孤立ノードのケースだと、バリセンターが接続の
  // 無いノードを「その場で安定」させるだけで先頭に残ることがあり、そのままだと同じ列の
  // 中で本体側のノードより手前に来てしまい、後ろのノードが行バランス調整で自分の目標値
  // (接続元・接続先の y)へ近づきたくても、この位置に足止めされる。成分内部の相対順序は
  // どの成分についても変えない安定した並べ替え。
  const [primaryComponentId] = [...componentSize.entries()].sort((a, b) => b[1] - a[1])[0] ?? [0];
  for (let l = 0; l <= maxLayer; l++) {
    const buckets = new Map<number, string[]>();
    const order: number[] = [];
    for (const id of layerOrder[l]) {
      const c = componentId.get(id)!;
      if (!buckets.has(c)) {
        buckets.set(c, []);
        order.push(c);
      }
      buckets.get(c)!.push(id);
    }
    const orderedComponents = [primaryComponentId, ...order.filter((c) => c !== primaryComponentId)];
    layerOrder[l] = orderedComponents.flatMap((c) => buckets.get(c) ?? []);
  }
  refreshRows();

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
  // stepAfter(id) は「id の直後に次のノードを置くとしたら、その上端は id の上端から
  // 最低何px下でなければならないか」(= id 自身の高さ + 余白)。ノードごとに高さが
  // 違うため、後続の isotonicRegression 用の変換(下記)は ROW_SPACING のような
  // 一定値ではなく、この累積和を使う。
  const stepAfter = (id: string) => nodeHeight.get(id)! + NODE_GAP;
  // 各ノードの「累積オフセット」= そのランの先頭からの高さ+余白の累積和。ランの先頭
  // ノードは 0。isotonicRegression 用の変換・逆変換の両方でこれを使う。
  const cumulativeOffsetsOf = (run: string[]): number[] => {
    const offsets = [0];
    for (let i = 1; i < run.length; i++) offsets.push(offsets[i - 1] + stepAfter(run[i - 1]));
    return offsets;
  };

  // 最初のランクに基づく固定値(initialRowY)。同じ成分内であっても、相手がまだ一度も
  // 配置されていない(rowY に無い)場合のフォールバック参照先として使う。
  const initialRowY = new Map<string, number>();
  for (const group of columnGroups) {
    const offsets = cumulativeOffsetsOf(group);
    group.forEach((id, i) => initialRowY.set(id, offsets[i]));
  }
  // 目標値(desired)は、既に配置済み(rowY にある)なら隣接ノードの現在値、まだ未配置
  // なら initialRowY にフォールバックして計算する。columnGroups を層の並び順(0→末尾)
  // に1回だけ処理するため、後ろの層のノードは前の層の隣接ノードの「実際に最適化された
  // 後の位置」を見て自分の目標値を決められる(例: A,B → C で A,B が同じ層でお互いに
  // 引っ張り合って本来の位置から動いた場合でも、C はその移動後の位置を見て自分の位置を
  // 決められる)。逆に前の層のノードは、まだ配置されていない後ろの層の隣接ノードについては
  // initialRowY にフォールバックする(例: A,B 自身は C の最終位置を見られない)ため、
  // 情報は一方向にしか伝わらない。双方向に反復させる(後ろの層の結果を前の層へも
  // 反映させる)設計も試したが、往復のたびに振動して特定の反復回数の偶奇に結果が
  // 依存してしまう(発散はしないが、収束もしない)ことが分かったため、単純な一方向
  // 1パスに留めている。
  const rowY = new Map<string, number>();
  const neighborY = (id: string): number => rowY.get(id) ?? initialRowY.get(id)!;
  const desiredY = (id: string): number => {
    const neighbors = [...(predecessors.get(id) ?? []), ...(dependents.get(id) ?? [])];
    return neighbors.length > 0 ? median(neighbors.map((n) => neighborY(n))) : initialRowY.get(id)!;
  };
  const fitColumnGroup = (group: string[]) => {
    // 成分をまたいで isotonicRegression に混ぜない。異なる成分の間には辺が無いため
    // 目標値は互いに無関係で、同じ数列に混ぜて詰めると片方の(もう片方とは無関係な)
    // 目標値にもう片方が引きずられてしまう。並び順は既に成分ごとにひとかたまりに
    // なっている(上記の並べ替え参照)ので、componentId が変わる箇所で区切るだけで
    // 連続した区間(ラン)に分けられる。各ランは独立に isotonicRegression で詰め、
    // 前のランのすぐ下から順に積む(孤立ノードはランの要素数が1になるだけで、
    // 同じロジックで自然に扱える)。
    const runs: string[][] = [];
    for (const id of group) {
      const last = runs[runs.length - 1];
      if (last && componentId.get(last[0]) === componentId.get(id)) last.push(id);
      else runs.push([id]);
    }

    let cursor = 0; // 直前のランの最後のノードの下端(y + 高さ)
    runs.forEach((run, runIndex) => {
      // 「直前のノードの下端より NODE_GAP 以上下」という制約は、各ノードの目標値から
      // ラン内での累積オフセット(stepAfter の累積和)をあらかじめ差し引いておけば
      // 「非減少」という制約に帰着できる(差し引いた分は最後に戻す)。
      // isotonicRegression で目標値に最も近い配置を求める。
      const offsets = cumulativeOffsetsOf(run);
      const adjusted = run.map((id, i) => desiredY(id) - offsets[i]);
      const fitted = isotonicRegression(adjusted);
      const y = fitted.map((v, i) => Math.round(v) + offsets[i]);
      for (let i = 1; i < y.length; i++) y[i] = Math.max(y[i], y[i - 1] + stepAfter(run[i - 1])); // 丸め誤差の保険

      if (runIndex === 0) {
        // 先頭のラン(本体の成分)は従来通り、負の値にだけならないようずらす。
        if (y[0] < 0) {
          const offset = -y[0];
          for (let i = 0; i < y.length; i++) y[i] += offset;
        }
      } else {
        // 2番目以降のラン(本体とは無関係な成分)は、前のランと重ならない限り
        // そのままの位置(自分自身の目標値に基づく配置)を使う。同じ成分が複数の層に
        // またがる場合、層(=列)ごとに前のランの終端はバラバラなので、毎回無条件に
        // 「前のランのすぐ下」へ揃えてしまうと、層をまたいだその成分内部での相対的な
        // 位置関係(例: 層0の接続元と層1の接続先の相対距離)が崩れてしまう。前のランと
        // 重なるときだけ、重ならなくなる最小限の量だけ下へずらす。
        const shift = Math.max(0, cursor + NODE_GAP - y[0]);
        for (let i = 0; i < y.length; i++) y[i] += shift;
      }
      run.forEach((id, i) => rowY.set(id, y[i]));
      cursor = y[y.length - 1] + nodeHeight.get(run[run.length - 1])!;
    });
  };
  for (const group of columnGroups) fitColumnGroup(group);
  // 保険: 各列の先頭ランは負の値にならないよう個別にずらしているため通常は不要だが、
  // 万一 y=0 を下回るノードがあればグラフ全体を平行移動して打ち消す(ノード同士の
  // 相対距離には影響しない)。
  if (rowY.size > 0) {
    const minY = Math.min(...rowY.values());
    if (minY !== 0) for (const id of rowY.keys()) rowY.set(id, rowY.get(id)! - minY);
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
