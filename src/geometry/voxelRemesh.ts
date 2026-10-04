import * as THREE from 'three';
import { edgeTable, triTable } from 'three/examples/jsm/objects/MarchingCubes.js';

export interface VoxelRemeshParams {
  /** 作り直す範囲(箱)。Y は [yMin, yMax]、X は [-xMax, xMax]、Z は制限しない。 */
  yMin: number;
  yMax: number;
  xMax: number;
  voxelSize: number;
  /** ガウスぼかしの標準偏差(ボクセル数)。 */
  sigma: number;
  /** マーチングキューブのしきい値(ぼかした占有率 0〜1)。 */
  iso: number;
  /** 箱の境目で、元の面と作り直した面を重ねる幅。 */
  overlap: number;
}

/** ボクセル数の上限(これを超える場合は voxelSize を粗くして収める)。 */
const MAX_CELLS = 6_000_000;

const CORNERS = [
  [0, 0, 0],
  [1, 0, 0],
  [1, 1, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 1],
] as const;
const EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
] as const;

/** 閉じた三角形メッシュの集合(重なり可)を Z 方向の光線の巻き数で占有グリッドにする。
 * 添字は (i * ny + j) * nz + k。 */
function occupancyGrid(
  pos: ArrayLike<number>,
  tris: ArrayLike<number>,
  x0: number,
  y0: number,
  z0: number,
  nx: number,
  ny: number,
  nz: number,
  h: number,
): Float32Array {
  const occ = new Float32Array(nx * ny * nz);
  const events: number[][] = new Array(nx * ny);
  for (let f = 0; f < tris.length; f += 3) {
    const a = tris[f] * 3;
    const b = tris[f + 1] * 3;
    const c = tris[f + 2] * 3;
    const ax = pos[a], ay = pos[a + 1], az = pos[a + 2];
    const bx = pos[b], by = pos[b + 1], bz = pos[b + 2];
    const cx = pos[c], cy = pos[c + 1], cz = pos[c + 2];
    const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    if (Math.abs(den) < 1e-14) continue;
    const winding = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax) < 0 ? 1 : -1;
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx, cx) - x0) / h));
    const i1 = Math.min(nx - 1, Math.floor((Math.max(ax, bx, cx) - x0) / h));
    const j0 = Math.max(0, Math.floor((Math.min(ay, by, cy) - y0) / h));
    const j1 = Math.min(ny - 1, Math.floor((Math.max(ay, by, cy) - y0) / h));
    for (let i = i0; i <= i1; i++) {
      const px = x0 + (i + 0.5) * h;
      for (let j = j0; j <= j1; j++) {
        const py = y0 + (j + 0.5) * h;
        const l1 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / den;
        const l2 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / den;
        const l3 = 1 - l1 - l2;
        if (l1 < 0 || l2 < 0 || l3 < 0) continue;
        (events[i * ny + j] ??= []).push(l1 * az + l2 * bz + l3 * cz, winding);
      }
    }
  }
  for (let col = 0; col < nx * ny; col++) {
    const e = events[col];
    if (!e) continue;
    const order: number[] = [];
    for (let k = 0; k < e.length; k += 2) order.push(k);
    order.sort((p, q) => e[p] - e[q]);
    let wind = 0;
    for (let n = 0; n + 1 < order.length; n++) {
      wind += e[order[n] + 1];
      if (wind <= 0) continue;
      const lo = Math.max(0, Math.ceil((e[order[n]] - z0) / h - 0.5));
      const hi = Math.min(nz - 1, Math.floor((e[order[n + 1]] - z0) / h - 0.5));
      for (let k = lo; k <= hi; k++) occ[col * nz + k] = 1;
    }
  }
  return occ;
}

/** 3軸の分離ガウスぼかし。グリッドの外は 0 とみなす。 */
function gaussianBlur(src: Float32Array, nx: number, ny: number, nz: number, sigma: number): Float32Array {
  const r = Math.ceil(sigma * 3);
  const ker = new Float32Array(2 * r + 1);
  let sum = 0;
  for (let d = -r; d <= r; d++) {
    ker[d + r] = Math.exp(-(d * d) / (2 * sigma * sigma));
    sum += ker[d + r];
  }
  for (let d = 0; d < ker.length; d++) ker[d] /= sum;
  const dims = [nx, ny, nz];
  const strides = [ny * nz, nz, 1];
  let a: Float32Array = src;
  let b: Float32Array = new Float32Array(src.length);
  for (let axis = 0; axis < 3; axis++) {
    const n = dims[axis];
    const st = strides[axis];
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        for (let k = 0; k < nz; k++) {
          const p = axis === 0 ? i : axis === 1 ? j : k;
          const base = (i * ny + j) * nz + k;
          let acc = 0;
          const lo = Math.max(-r, -p);
          const hi = Math.min(r, n - 1 - p);
          for (let d = lo; d <= hi; d++) acc += ker[d + r] * a[base + d * st];
          b[base] = acc;
        }
      }
    }
    [a, b] = [b, a];
  }
  return a;
}

const _ab = new THREE.Vector3();
const _ap = new THREE.Vector3();
const _t = new THREE.Triangle();
const _closest = new THREE.Vector3();

/** 作り直した面の頂点のうち、箱の縁に近いものを、元の面上の最近点へ寄せる(縁で `weight` = 1、
 * 縁から離れるほど 0)。ぼかしによる数 mm のずれが、境目の段差・ひげになるのを防ぐ。 */
function snapToOriginal(
  newPos: number[],
  pos: ArrayLike<number>,
  tris: ArrayLike<number>,
  params: VoxelRemeshParams,
): void {
  const m = params.overlap;
  const ramp = 2 * m;
  const cell = Math.max(m, 0.01);
  const reach = cell;
  const buckets = new Map<string, number[]>();
  const keyOf = (i: number, j: number, k: number) => `${i},${j},${k}`;
  const margin = m + ramp + reach;
  for (let f = 0; f < tris.length; f += 3) {
    const a = tris[f] * 3, b = tris[f + 1] * 3, c = tris[f + 2] * 3;
    const ys = [pos[a + 1], pos[b + 1], pos[c + 1]];
    if (Math.max(...ys) < params.yMin - margin || Math.min(...ys) > params.yMax + margin) continue;
    const xs = [pos[a], pos[b], pos[c]];
    if (Math.min(...xs) > params.xMax + margin || Math.max(...xs) < -params.xMax - margin) continue;
    const zs = [pos[a + 2], pos[b + 2], pos[c + 2]];
    const i0 = Math.floor((Math.min(...xs) - reach) / cell), i1 = Math.floor((Math.max(...xs) + reach) / cell);
    const j0 = Math.floor((Math.min(...ys) - reach) / cell), j1 = Math.floor((Math.max(...ys) + reach) / cell);
    const k0 = Math.floor((Math.min(...zs) - reach) / cell), k1 = Math.floor((Math.max(...zs) + reach) / cell);
    for (let i = i0; i <= i1; i++)
      for (let j = j0; j <= j1; j++)
        for (let k = k0; k <= k1; k++) {
          const key = keyOf(i, j, k);
          const list = buckets.get(key);
          if (list) list.push(f);
          else buckets.set(key, [f]);
        }
  }
  for (let v = 0; v < newPos.length; v += 3) {
    const x = newPos[v], y = newPos[v + 1], z = newPos[v + 2];
    const depth = Math.min(y - params.yMin, params.yMax - y, params.xMax - Math.abs(x));
    if (depth >= m + ramp) continue;
    const list = buckets.get(keyOf(Math.floor(x / cell), Math.floor(y / cell), Math.floor(z / cell)));
    if (!list) continue;
    let best = reach * reach;
    let found = false;
    for (const f of list) {
      const a = tris[f] * 3, b = tris[f + 1] * 3, c = tris[f + 2] * 3;
      _t.a.set(pos[a], pos[a + 1], pos[a + 2]);
      _t.b.set(pos[b], pos[b + 1], pos[b + 2]);
      _t.c.set(pos[c], pos[c + 1], pos[c + 2]);
      _t.closestPointToPoint(_ap.set(x, y, z), _ab);
      const d = _ab.distanceToSquared(_ap);
      if (d < best) {
        best = d;
        _closest.copy(_ab);
        found = true;
      }
    }
    if (!found) continue;
    const u = Math.min(1, Math.max(0, (depth - m) / ramp));
    const w = depth <= m ? 1 : 1 - u * u * (3 - 2 * u);
    newPos[v] = x + w * (_closest.x - x);
    newPos[v + 1] = y + w * (_closest.y - y);
    newPos[v + 2] = z + w * (_closest.z - z);
  }
}

/** 箱の中だけをボクセル化→ガウスぼかし→マーチングキューブで作り直し、箱の外は元の面のまま残す
 * (境目は `overlap` だけ両方の面を重ねる)。重ね合わせたプリミティブの継ぎ目・とがりを、
 * 1枚のなめらかな面にするためのもの。 */
export function voxelRemesh(geometry: THREE.BufferGeometry, params: VoxelRemeshParams): THREE.BufferGeometry {
  const posAttr = geometry.getAttribute('position');
  if (!posAttr || params.yMax <= params.yMin || params.xMax <= 0) return geometry.clone();
  const pos = posAttr.array as ArrayLike<number>;
  const nVerts = posAttr.count;
  let tris: ArrayLike<number>;
  if (geometry.index) tris = geometry.index.array;
  else tris = Uint32Array.from({ length: nVerts }, (_, i) => i);

  let h = params.voxelSize;
  const sigma = Math.max(params.sigma, 0.1);
  let pad = params.overlap + Math.ceil(sigma * 3 + 2) * h;
  // 範囲(箱+余白)と、その中にある三角形の Z の範囲
  const bx0 = -params.xMax - pad;
  const bx1 = params.xMax + pad;
  const by0 = params.yMin - pad;
  const by1 = params.yMax + pad;
  let zLo = Infinity;
  let zHi = -Infinity;
  for (let i = 0; i < nVerts; i++) {
    const x = pos[3 * i], y = pos[3 * i + 1];
    if (x < bx0 || x > bx1 || y < by0 || y > by1) continue;
    zLo = Math.min(zLo, pos[3 * i + 2]);
    zHi = Math.max(zHi, pos[3 * i + 2]);
  }
  if (zLo > zHi) return geometry.clone();
  const sizeOf = (hh: number) => {
    const p = params.overlap + Math.ceil(sigma * 3 + 2) * hh;
    return [
      Math.ceil((2 * (params.xMax + p)) / hh),
      Math.ceil((params.yMax - params.yMin + 2 * p) / hh),
      Math.ceil((zHi - zLo + 2 * p) / hh),
      p,
    ] as const;
  };
  let [nx, ny, nz, p] = sizeOf(h);
  while (nx * ny * nz > MAX_CELLS) {
    h *= 1.25;
    [nx, ny, nz, p] = sizeOf(h);
  }
  pad = p;
  const x0 = -params.xMax - pad;
  const y0 = params.yMin - pad;
  const z0 = zLo - pad;

  const occ = occupancyGrid(pos, tris, x0, y0, z0, nx, ny, nz, h);
  const field = gaussianBlur(occ, nx, ny, nz, sigma);

  // マーチングキューブ(箱の中のセルだけ)。
  const iso = params.iso;
  const newPos: number[] = [];
  const newIdx: number[] = [];
  const vertexOf = new Map<number, number>();
  const vid = new Int32Array(12);
  const val = new Float32Array(8);
  const inI0 = Math.max(0, Math.floor((-params.xMax - x0) / h));
  const inI1 = Math.min(nx - 2, Math.ceil((params.xMax - x0) / h));
  const inJ0 = Math.max(0, Math.floor((params.yMin - y0) / h));
  const inJ1 = Math.min(ny - 2, Math.ceil((params.yMax - y0) / h));
  for (let i = inI0; i <= inI1; i++) {
    for (let j = inJ0; j <= inJ1; j++) {
      for (let k = 0; k < nz - 1; k++) {
        let cube = 0;
        for (let c = 0; c < 8; c++) {
          const [di, dj, dk] = CORNERS[c];
          val[c] = field[((i + di) * ny + (j + dj)) * nz + (k + dk)];
          // 三角形の表は「値がしきい値より小さい角」を基準にした向きなので、占有率が高い側(内側)が外向きになる。
          if (val[c] < iso) cube |= 1 << c;
        }
        const em = edgeTable[cube];
        if (!em) continue;
        for (let e = 0; e < 12; e++) {
          if (!(em & (1 << e))) continue;
          const [c0, c1] = EDGES[e];
          const a = CORNERS[c0];
          const b = CORNERS[c1];
          const key =
            ((i * 2 + a[0] + b[0]) * (2 * ny) + (j * 2 + a[1] + b[1])) * (2 * nz) + (k * 2 + a[2] + b[2]);
          let id = vertexOf.get(key);
          if (id === undefined) {
            const t = (iso - val[c0]) / (val[c1] - val[c0]);
            newPos.push(
              x0 + h * (i + a[0] + t * (b[0] - a[0]) + 0.5),
              y0 + h * (j + a[1] + t * (b[1] - a[1]) + 0.5),
              z0 + h * (k + a[2] + t * (b[2] - a[2]) + 0.5),
            );
            id = newPos.length / 3 - 1;
            vertexOf.set(key, id);
          }
          vid[e] = id;
        }
        for (let n = 0; triTable[cube * 16 + n] !== -1; n += 3) {
          newIdx.push(vid[triTable[cube * 16 + n]], vid[triTable[cube * 16 + n + 1]], vid[triTable[cube * 16 + n + 2]]);
        }
      }
    }
  }
  snapToOriginal(newPos, pos, tris, params);

  // 元の面(内側のコアを除く)+作り直した面(外側の箱の中)を1つにまとめる。
  const m = params.overlap;
  const outPos: number[] = Array.from(pos as ArrayLike<number>).slice(0, nVerts * 3);
  const outIdx: number[] = [];
  for (let f = 0; f < tris.length; f += 3) {
    const a = tris[f] * 3, b = tris[f + 1] * 3, c = tris[f + 2] * 3;
    const cx = (pos[a] + pos[b] + pos[c]) / 3;
    const cy = (pos[a + 1] + pos[b + 1] + pos[c + 1]) / 3;
    const core = cy >= params.yMin + m && cy <= params.yMax - m && Math.abs(cx) <= params.xMax - m;
    if (!core) outIdx.push(tris[f], tris[f + 1], tris[f + 2]);
  }
  for (const v of newPos) outPos.push(v);
  for (let f = 0; f < newIdx.length; f += 3) {
    const a = newIdx[f] * 3, b = newIdx[f + 1] * 3, c = newIdx[f + 2] * 3;
    const cx = (newPos[a] + newPos[b] + newPos[c]) / 3;
    const cy = (newPos[a + 1] + newPos[b + 1] + newPos[c + 1]) / 3;
    if (cy < params.yMin || cy > params.yMax || Math.abs(cx) > params.xMax) continue;
    const base = nVerts;
    outIdx.push(base + newIdx[f], base + newIdx[f + 1], base + newIdx[f + 2]);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(outPos, 3));
  out.setIndex(outIdx);
  out.computeVertexNormals();
  return out;
}
