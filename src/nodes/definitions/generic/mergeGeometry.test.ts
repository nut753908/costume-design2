import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import { evaluateGraph } from '../../evaluateGraph';
// evaluateGraph のテストで boxGenerator など他のノードタイプも必要なため、全ノードタイプを登録する。
import '../../definitions';

const box = (x: number) => new THREE.BoxGeometry(0.1, 0.1, 0.1).translate(x, 0, 0);
const list = (...geometries: THREE.BufferGeometry[]) => ({ type: 'geometries' as const, value: geometries });

describe('mergeGeometry', () => {
  it('geometries に集められた geometry を1つの BufferGeometry へ結合する', () => {
    const result = getNodeType('mergeGeometry').evaluate({ geometries: list(box(-0.2), box(0.2)) }, {});
    const merged = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    expect(merged).toBeDefined();
    merged!.computeBoundingBox();
    expect(merged!.boundingBox!.min.x).toBeCloseTo(-0.25, 5);
    expect(merged!.boundingBox!.max.x).toBeCloseTo(0.25, 5);
  });

  it('3つ以上でもすべて結合する', () => {
    const result = getNodeType('mergeGeometry').evaluate({ geometries: list(box(-0.2), box(0), box(0.2)) }, {});
    const merged = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    expect(merged!.getAttribute('position').count).toBe(24 * 3);
  });

  it('1つだけならそのまま返す', () => {
    const a = box(0);
    const result = getNodeType('mergeGeometry').evaluate({ geometries: list(a) }, {});
    expect(result.geometry).toEqual({ type: 'geometry', value: a });
  });

  it('何も接続されていなければ何も返さない', () => {
    expect(getNodeType('mergeGeometry').evaluate({}, {}).geometry).toBeUndefined();
  });

  it('uv の有無だけが違う geometry は、uv を外して結合する(入力の geometry は変更しない)', () => {
    const withoutUv = box(0.2);
    withoutUv.deleteAttribute('uv');
    const withUv = box(-0.2);
    const result = getNodeType('mergeGeometry').evaluate({ geometries: list(withUv, withoutUv) }, {});
    const merged = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    expect(merged!.getAttribute('position').count).toBe(48);
    expect(merged!.getAttribute('uv')).toBeUndefined();
    expect(withUv.getAttribute('uv')).toBeDefined();
  });

  it('それ以外の頂点属性/インデックスの違いで結合できない場合は、例外を投げず何も返さない', () => {
    const nonIndexed = box(0.2).toNonIndexed();
    const result = getNodeType('mergeGeometry').evaluate({ geometries: list(box(-0.2), nonIndexed) }, {});
    expect(result.geometry).toBeUndefined();
  });

  it('evaluateGraph は同じソケットへ繋がったすべてのエッジの geometry を、エッジの並び順で集めて渡す', () => {
    const results = evaluateGraph(
      [
        { id: 'a', type: 'boxGenerator', data: {} },
        { id: 'b', type: 'boxGenerator', data: {} },
        { id: 'c', type: 'boxGenerator', data: {} },
        { id: 'merge', type: 'mergeGeometry', data: {} },
      ],
      ['a', 'b', 'c'].map((source) => ({ source, sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' })),
    );
    const merged = results.get('merge')?.geometry;
    expect(merged?.type === 'geometry' ? merged.value.getAttribute('position').count : 0).toBe(24 * 3);
  });
});
