import { describe, expect, it } from 'vitest';
import type * as THREE from 'three';
import { getNodeType } from '../../registry';
import { expectOutwardWinding } from '../../../geometry/windingTestHelpers';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

function band(radius: number, thickness: number, bulge: number, segments: number): THREE.BufferGeometry {
  const result = getNodeType('bulgedBand').evaluate(
    { radius: num(radius), thickness: num(thickness), bulge: num(bulge), segments: num(segments) },
    {},
  );
  if (result.geometry?.type !== 'geometry') throw new Error('geometry が出力されていない');
  return result.geometry.value;
}

describe('bulgedBand', () => {
  it('妥当で退化していないジオメトリを生成する', () => {
    const geometry = band(0.32, 0.06, 1.15, 24);
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);
    expect(index!.count).toBeGreaterThan(0);
    const pos = geometry.getAttribute('position').array as Float32Array;
    for (let i = 0; i < pos.length; i++) expect(Number.isNaN(pos[i])).toBe(false);
  });

  it('プロファイル13点(6ステップ×2の継ぎ目を除く) × (segments+1) の頂点を持つ', () => {
    expect(band(0.32, 0.06, 1.15, 24).getAttribute('position').count).toBe(13 * 25);
  });

  it('上端(y=0)から下端(y=-thickness)まで積み上がり、中間で radius × bulge まで膨らむ', () => {
    const geometry = band(0.32, 0.06, 1.15, 24);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.max.y).toBeCloseTo(0, 5);
    expect(geometry.boundingBox!.min.y).toBeCloseTo(-0.06, 5);
    expect(geometry.boundingBox!.max.x).toBeCloseTo(0.32 * 1.15, 5);
  });

  it('bulge が大きくなるほど中間の膨らみが外側に広がる', () => {
    const flat = band(0.32, 0.06, 1.0, 24);
    const bulged = band(0.32, 0.06, 1.4, 24);
    flat.computeBoundingBox();
    bulged.computeBoundingBox();
    expect(bulged.boundingBox!.max.x).toBeGreaterThan(flat.boundingBox!.max.x);
  });

  it('segments が増えるほど頂点数が増える', () => {
    const coarse = band(0.32, 0.06, 1.15, 8);
    const fine = band(0.32, 0.06, 1.15, 32);
    expect(fine.getAttribute('position').count).toBeGreaterThan(coarse.getAttribute('position').count);
  });

  it('全面が外向きの巻き順になっている(手前の面がカリングで消えるのを防ぐ)', () => {
    expectOutwardWinding(band(0.32, 0.06, 1.15, 24));
  });
});
