import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import { expectOutwardWinding } from '../../../geometry/windingTestHelpers';
import './mirrorX';

describe('mirrorX', () => {
  it('geometry を X=0 に対して鏡像反転する', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1).translate(2, 0, 0);
    const result = getNodeType('mirrorX').evaluate({ geometry: { type: 'geometry', value: geometry } }, {});
    const mirrored = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    mirrored!.computeBoundingBox();
    expect(mirrored!.boundingBox!.min.x).toBeCloseTo(-2.5);
    expect(mirrored!.boundingBox!.max.x).toBeCloseTo(-1.5);
  });

  it('反転後も巻き順が外向きのまま(元の geometry も変更しない)', () => {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 12, 1, true).translate(2, 0, 0);
    const result = getNodeType('mirrorX').evaluate({ geometry: { type: 'geometry', value: geometry } }, {});
    const mirrored = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    expectOutwardWinding(mirrored!, (c) => new THREE.Vector3(-2, c.y, 0));
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.min.x).toBeCloseTo(1.5);
  });

  it('インデックス無しの geometry でも巻き順が外向きのまま', () => {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 12, 1, true).translate(2, 0, 0).toNonIndexed();
    const result = getNodeType('mirrorX').evaluate({ geometry: { type: 'geometry', value: geometry } }, {});
    const mirrored = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    expect(mirrored!.getIndex()).toBeNull();
    // インデックス無しは三角形ごとの頂点順を index 相当として検証する。
    const indexed = mirrored!.clone();
    indexed.setIndex([...Array(indexed.getAttribute('position').count).keys()]);
    expectOutwardWinding(indexed, (c) => new THREE.Vector3(-2, c.y, 0));
  });

  it('geometry が未接続なら何も返さない', () => {
    expect(getNodeType('mirrorX').evaluate({}, {}).geometry).toBeUndefined();
  });
});
