import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildJacketGeometry } from './jacket';
import { expectOutwardWinding } from './windingTestHelpers';

function positions(geometry: THREE.BufferGeometry): Float32Array {
  return geometry.getAttribute('position').array as Float32Array;
}

describe('buildJacketGeometry', () => {
  it('妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildJacketGeometry({ shoulderRadius: 0.34, length: 0.42, hemFlare: 0.15, segments: 20 });
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);
    expect(index!.count).toBeGreaterThan(0);

    const pos = positions(geometry);
    expect(pos.length).toBeGreaterThan(0);
    for (let i = 0; i < pos.length; i++) {
      expect(Number.isNaN(pos[i])).toBe(false);
    }
  });

  it('hemFlare が大きくなるほど裾の半径が広がる', () => {
    const straight = buildJacketGeometry({ shoulderRadius: 0.34, length: 0.42, hemFlare: 0, segments: 20 });
    const flared = buildJacketGeometry({ shoulderRadius: 0.34, length: 0.42, hemFlare: 0.8, segments: 20 });

    straight.computeBoundingBox();
    flared.computeBoundingBox();

    expect(flared.boundingBox!.max.x).toBeGreaterThan(straight.boundingBox!.max.x);
  });

  it('length が長くなるほど下方向に伸びる', () => {
    const short = buildJacketGeometry({ shoulderRadius: 0.34, length: 0.3, hemFlare: 0.15, segments: 20 });
    const long = buildJacketGeometry({ shoulderRadius: 0.34, length: 0.8, hemFlare: 0.15, segments: 20 });

    short.computeBoundingBox();
    long.computeBoundingBox();

    expect(long.boundingBox!.min.y).toBeLessThan(short.boundingBox!.min.y);
  });

  it('shoulderRadius が top より大きければ、重ね着できるだけの半径になる', () => {
    const topRadius = 0.29;
    const jacket = buildJacketGeometry({ shoulderRadius: 0.34, length: 0.42, hemFlare: 0.15, segments: 20 });
    jacket.computeBoundingBox();
    expect(jacket.boundingBox!.max.x).toBeGreaterThan(topRadius);
  });

  it('segments が増えるほど頂点数が増える', () => {
    const coarse = buildJacketGeometry({ shoulderRadius: 0.34, length: 0.42, hemFlare: 0.15, segments: 8 });
    const fine = buildJacketGeometry({ shoulderRadius: 0.34, length: 0.42, hemFlare: 0.15, segments: 32 });

    expect(positions(fine).length).toBeGreaterThan(positions(coarse).length);
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    expectOutwardWinding(buildJacketGeometry({ shoulderRadius: 0.34, length: 0.42, hemFlare: 0.15, segments: 20 }));
  });
});
