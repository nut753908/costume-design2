import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { FunctionCurve } from '../../../geometry/functionCurve';
import { EasedLatheCurve } from '../../../geometry/latheProfile';
import { getNodeType } from '../../registry';
import { expectOutwardWinding } from '../../../geometry/windingTestHelpers';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });
const SEGMENTS = 16;
const STEPS = 8;

/** `easedLatheCurve` の `Curve Down` と同じ、下→上の順に進む曲線(半径 startRadius → endRadius、y は 0 から -length)。 */
function profile(startRadius: number, endRadius: number, length: number): THREE.Curve<THREE.Vector2> {
  return new EasedLatheCurve(startRadius, endRadius, length, 'down');
}

/** ネックラインの落ち込み量の曲線(x=角度を0〜1に正規化した値、y=重み)。形は `necklineShapes` グループと同じ。 */
const SHAPES = {
  round: new FunctionCurve((t) => 1 - t * t),
  v: new FunctionCurve((t) => 1 - t),
  square: new FunctionCurve(() => 1),
};

function build(
  necklineShape: keyof typeof SHAPES | null,
  necklineDepth: number,
  curve = profile(0.3, 0.3, 0.5),
): THREE.BufferGeometry {
  const result = getNodeType('ringGridGenerator').evaluate(
    {
      profile: { type: 'curve', value: curve },
      steps: num(STEPS),
      segments: num(SEGMENTS),
      ...(necklineShape ? { necklineWeights: { type: 'curve' as const, value: SHAPES[necklineShape] } } : {}),
      necklineDepth: num(necklineDepth),
    },
    {},
  );
  if (result.geometry?.type !== 'geometry') throw new Error('geometry が出力されていない');
  return result.geometry.value;
}

function topRowMinY(geometry: THREE.BufferGeometry): number {
  const pos = geometry.getAttribute('position').array as Float32Array;
  let min = Infinity;
  for (let i = 0; i < SEGMENTS + 1; i++) min = Math.min(min, pos[i * 3 + 1]);
  return min;
}

describe('ringGridGenerator', () => {
  it('profile が未接続なら何も出力しない', () => {
    expect(getNodeType('ringGridGenerator').evaluate({}, getNodeType('ringGridGenerator').createDefaultData())).toEqual({});
  });

  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = build('round', 0.15);
    expect(geometry.getIndex()!.count % 3).toBe(0);
    expect(geometry.getIndex()!.count).toBeGreaterThan(0);
    const pos = geometry.getAttribute('position').array as Float32Array;
    for (let i = 0; i < pos.length; i++) expect(Number.isNaN(pos[i])).toBe(false);
  });

  it('リンググリッドの寸法(segments+1)×(steps+1)の頂点数になる', () => {
    expect(build('round', 0.15).getAttribute('position').count).toBe((SEGMENTS + 1) * (STEPS + 1));
  });

  it('最上段の半径は start、最下段の半径は end(プロファイルの上下が肩/裾になる)', () => {
    const geometry = build('round', 0, profile(0.3, 0.55, 0.9));
    const pos = geometry.getAttribute('position').array as Float32Array;
    const radiusAt = (vertex: number) => Math.hypot(pos[vertex * 3], pos[vertex * 3 + 2]);
    expect(radiusAt(0)).toBeCloseTo(0.3, 5);
    expect(radiusAt(STEPS * (SEGMENTS + 1))).toBeCloseTo(0.55, 5);
    expect(pos[1]).toBeCloseTo(0, 5);
    expect(pos[(STEPS * (SEGMENTS + 1)) * 3 + 1]).toBeCloseTo(-0.9, 5);
  });

  it('ネックラインの曲線が未接続なら necklineDepth があっても彫り込まない', () => {
    expect(topRowMinY(build(null, 0.3))).toBeCloseTo(0, 6);
  });

  it('曲線の形で最上段の落ち込み方が変わる(正面は同じ深さ、正面から離れると v < round < square)', () => {
    const topRowY = (shape: keyof typeof SHAPES, col: number) => {
      const pos = build(shape, 0.3).getAttribute('position').array as Float32Array;
      return pos[col * 3 + 1];
    };
    // SEGMENTS=16 のとき col 2 は正面から 45°(half-width 90° の 0.5)。
    expect(topRowY('v', 0)).toBeCloseTo(topRowY('square', 0), 6);
    expect(topRowY('v', 2)).toBeGreaterThan(topRowY('round', 2));
    expect(topRowY('round', 2)).toBeGreaterThan(topRowY('square', 2));
  });

  it('どのネックラインタイプでも necklineDepth が深くなるほど最上段リングの前面が下がる', () => {
    for (const type of ['round', 'v', 'square'] as const) {
      expect(topRowMinY(build(type, 0.3))).toBeLessThan(topRowMinY(build(type, 0.02)));
    }
  });

  it('上へ細くなる(肩の丸みのある)プロファイルでも、行の間隔より深く彫り込んだ正面の各列は上下が折り返さない', () => {
    // 半径 0.1(首)→ 0.3(胸)、行の間隔 0.5 / 8 ≈ 0.06 より深い 0.2 を彫り込む。
    const geometry = build('square', 0.2, profile(0.1, 0.3, 0.5));
    const pos = geometry.getAttribute('position');
    const frontCol = 0; // 角度 0 = 正面(z 方向)
    for (let row = 0; row < STEPS; row++) {
      const upper = row * (SEGMENTS + 1) + frontCol;
      const lower = upper + SEGMENTS + 1;
      expect(pos.getY(upper)).toBeGreaterThanOrEqual(pos.getY(lower) - 1e-9);
    }
    // 彫り込みの線(最上段から 0.2 下)より上の行は線上に寄せられ、半径はその高さのプロファイルの半径になる。
    expect(pos.getY(frontCol)).toBeCloseTo(-0.2, 5);
    expect(pos.getZ(frontCol)).toBeGreaterThan(0.1);
    expect(pos.getZ(frontCol)).toBeLessThan(0.3);
  });

  it('裾(最下段の行)は necklineDepth の影響を受けない', () => {
    const shallow = build('v', 0.02).getAttribute('position').array as Float32Array;
    const deep = build('v', 0.3).getAttribute('position').array as Float32Array;
    for (let i = shallow.length - (SEGMENTS + 1) * 3; i < shallow.length; i++) {
      expect(deep[i]).toBeCloseTo(shallow[i], 6);
    }
  });

  it('全面が外向きの巻き順になっている(ネックラインの彫り込みが無い単純な壁で検証)', () => {
    expectOutwardWinding(build('round', 0));
    expectOutwardWinding(build('round', 0, profile(0.3, 0.55, 0.9)));
  });
});
