import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// mirrorPair はグループノードで、埋め込みサブグラフが groupInput/groupOutput/
// translateX/mirrorX/mergeGeometry を参照するため、単独インポートではなく全ノードタイプを登録する。
import '../../definitions';

describe('mirrorPair', () => {
  it('offset だけ離れた左右2つのコピーを1つのジオメトリにまとめる', () => {
    const geometry = new THREE.BoxGeometry(0.16, 0.6, 0.16);
    const result = getNodeType('mirrorPair').evaluate(
      { geometry: { type: 'geometry', value: geometry }, offset: { type: 'number', value: 0.2 } },
      {},
    );
    const merged = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    merged!.computeBoundingBox();
    expect(merged!.boundingBox!.max.x).toBeCloseTo(0.2 + 0.08, 5);
    expect(merged!.boundingBox!.min.x).toBeCloseTo(-(0.2 + 0.08), 5);
  });

  it('offset が広がるほど左右の間隔が広がる', () => {
    const build = () => new THREE.BoxGeometry(0.16, 0.6, 0.16);
    const narrow = getNodeType('mirrorPair').evaluate(
      { geometry: { type: 'geometry', value: build() }, offset: { type: 'number', value: 0.15 } },
      {},
    );
    const wide = getNodeType('mirrorPair').evaluate(
      { geometry: { type: 'geometry', value: build() }, offset: { type: 'number', value: 0.3 } },
      {},
    );
    const narrowGeom = narrow.geometry?.type === 'geometry' ? narrow.geometry.value : undefined;
    const wideGeom = wide.geometry?.type === 'geometry' ? wide.geometry.value : undefined;
    narrowGeom!.computeBoundingBox();
    wideGeom!.computeBoundingBox();
    expect(wideGeom!.boundingBox!.max.x).toBeGreaterThan(narrowGeom!.boundingBox!.max.x);
  });

  it('元の geometry を変更しない(独立したコピーを平行移動する)', () => {
    const geometry = new THREE.BoxGeometry(0.16, 0.6, 0.16);
    geometry.computeBoundingBox();
    const originalMaxX = geometry.boundingBox!.max.x;
    getNodeType('mirrorPair').evaluate(
      { geometry: { type: 'geometry', value: geometry }, offset: { type: 'number', value: 0.2 } },
      {},
    );
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.max.x).toBeCloseTo(originalMaxX, 5);
  });

  it('X=0 について非対称な形状は、-側が鏡像になる', () => {
    // X=-0.1〜0.3 に張り出す箱。offset=1 なら +側は 0.9〜1.3、-側は鏡像の -1.3〜-0.9。
    const geometry = new THREE.BoxGeometry(0.4, 0.6, 0.16).translate(0.1, 0, 0);
    const result = getNodeType('mirrorPair').evaluate(
      { geometry: { type: 'geometry', value: geometry }, offset: { type: 'number', value: 1 } },
      {},
    );
    const merged = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    merged!.computeBoundingBox();
    expect(merged!.boundingBox!.max.x).toBeCloseTo(1.3, 5);
    expect(merged!.boundingBox!.min.x).toBeCloseTo(-1.3, 5);
  });

  it('geometry が未接続なら何も返さない', () => {
    const result = getNodeType('mirrorPair').evaluate({ offset: { type: 'number', value: 0.2 } }, {});
    expect(result.geometry).toBeUndefined();
  });

  it('offset が未接続なら0にフォールバックする(左右が重なる)', () => {
    const geometry = new THREE.BoxGeometry(0.16, 0.6, 0.16);
    const result = getNodeType('mirrorPair').evaluate({ geometry: { type: 'geometry', value: geometry } }, {});
    const merged = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    merged!.computeBoundingBox();
    expect(merged!.boundingBox!.max.x).toBeCloseTo(0.08, 5);
  });
});
