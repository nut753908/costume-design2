/** 複数接続できる入力ソケット(`SocketDef.multiple`)の寸法。Blender の Join Geometry と同じく
 * 縦長のカプセル形で描き、繋いだエッジは結合順(エッジ配列の並び順)に上から1本ずつずらして刺す。
 * カードの見た目(`editor/`)と Arrange の高さの見積もり(`autoLayout.ts`)で共有する。 */

/** 隣り合うエッジの刺さる位置の間隔(px)。 */
export const MULTI_SOCKET_SLOT = 10;
/** ソケットの幅(React Flow のハンドルの既定の大きさに合わせる)。 */
export const MULTI_SOCKET_WIDTH = 6;
/** 未接続・1本でもカプセル形と分かるよう、2本分の高さを最小にする。 */
const MIN_SLOTS = 2;

/** 接続本数 `count` のときのカプセルの高さ(px)。 */
export function multiSocketHeight(count: number): number {
  return (Math.max(count, MIN_SLOTS) - 1) * MULTI_SOCKET_SLOT + MULTI_SOCKET_WIDTH;
}

/** 接続本数 `count` のとき、ソケット行が通常の行より高くなる分(px)。2本までは通常の行に収まる。 */
export function multiSocketRowExtra(count: number): number {
  return (Math.max(count, MIN_SLOTS) - MIN_SLOTS) * MULTI_SOCKET_SLOT;
}

/** `count` 本のうち `index` 番目(0=先頭)のエッジが刺さる位置の、ソケット中心からの縦のずれ(px)。 */
export function multiSocketSlotOffset(index: number, count: number): number {
  return (index - (count - 1) / 2) * MULTI_SOCKET_SLOT;
}
