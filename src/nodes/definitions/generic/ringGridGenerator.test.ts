import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getNodeType } from '../../registry';
import { expectOutwardWinding } from '../../../geometry/windingTestHelpers';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });
const SEGMENTS = 16;
const STEPS = 8;

/** easedLatheProfile と同じ下→上の順の点列(半径 startRadius → endRadius、y は 0 から -length)。 */
function profile(startRadius: number, endRadius: number, length: number): THREE.Vector2[] {
  const points = getNodeType('easedLatheProfile').evaluate(
    { startRadius: num(startRadius), endRadius: num(endRadius), distance: num(length) },
    { direction: 'down', steps: STEPS },
  ).points;
  if (points?.type !== 'points') throw new Error('points が出力されていない');
  return points.value;
}

function build(necklineType: string, necklineDepth: number, points = profile(0.3, 0.3, 0.5)): THREE.BufferGeometry {
  const result = getNodeType('ringGridGenerator').evaluate(
    {
      points: { type: 'points', value: points },
      segments: num(SEGMENTS),
      necklineType: { type: 'enum', value: necklineType },
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
  it('points が未接続なら何も出力しない', () => {
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

  it('どのネックラインタイプでも necklineDepth が深くなるほど最上段リングの前面が下がる', () => {
    for (const type of ['round', 'v', 'square']) {
      expect(topRowMinY(build(type, 0.3))).toBeLessThan(topRowMinY(build(type, 0.02)));
    }
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
