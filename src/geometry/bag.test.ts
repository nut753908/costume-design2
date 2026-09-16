import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildBagStrapGeometry } from './bag';
import { expectOutwardWinding } from './windingTestHelpers';

const BASE = {
  strapWidth: 0.04,
  strapThickness: 0.015,
  shoulderOffset: 0.08,
  hipOffset: 0.12,
  drop: 0.55,
} as const;

// バッグ本体(直方体)の配置はこのファイルの責務ではなくなったため、ストラップだけを検証する
// (本体側は src/nodes/definitions/boxGenerator.test.ts/translateX.test.ts/translateY.test.ts/
// translateZ.test.ts が既にカバーしている)。
describe('buildBagStrapGeometry', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildBagStrapGeometry(BASE);
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);
    expect(index!.count).toBeGreaterThan(0);

    const pos = geometry.getAttribute('position').array as Float32Array;
    expect(pos.length).toBeGreaterThan(0);
    for (let i = 0; i < pos.length; i++) {
      expect(Number.isNaN(pos[i])).toBe(false);
    }
  });

  it('drop が大きくなるほど下方向に垂れる', () => {
    const short = buildBagStrapGeometry({ ...BASE, drop: 0.2 });
    const long = buildBagStrapGeometry({ ...BASE, drop: 0.8 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.min.y).toBeLessThan(short.boundingBox!.min.y);
  });

  it('hipOffset が大きくなるほど反対側(-X方向)へ広がる', () => {
    const narrow = buildBagStrapGeometry({ ...BASE, hipOffset: 0.05 });
    const wide = buildBagStrapGeometry({ ...BASE, hipOffset: 0.3 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.min.x).toBeLessThan(narrow.boundingBox!.min.x);
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    const strapStart = new THREE.Vector3(BASE.shoulderOffset, 0, 0.05);
    const strapEnd = new THREE.Vector3(-BASE.hipOffset, -BASE.drop, 0.18);
    const strapCenter = strapStart.clone().add(strapEnd).multiplyScalar(0.5);
    expectOutwardWinding(buildBagStrapGeometry(BASE), () => strapCenter);
  });
});
