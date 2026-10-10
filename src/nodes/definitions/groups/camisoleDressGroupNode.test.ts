import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import type { GraphNode } from '../../types';
import '../../definitions';

const evaluate = (inputs: Parameters<ReturnType<typeof getNodeType>['evaluate']>[0] = {}) =>
  getNodeType('camisoleDressGroup').evaluate(inputs, {});
const geometryOf = (result: ReturnType<typeof evaluate>, index: number) => {
  const value = result[`sceneOutputGeometry${index}`];
  return value?.type === 'geometry' ? value.value : undefined;
};
const colorOf = (result: ReturnType<typeof evaluate>, index: number) => {
  const value = result[`sceneOutputMaterial${index}`];
  return value?.type === 'material' ? (value.value as THREE.MeshToonMaterial).color.getHexString() : undefined;
};

describe('camisoleDressGroup', () => {
  it('ワンピース本体(肩ひもを含む)・リボン・リボンの羽の後ろの層の3つのメッシュを出力する', () => {
    const result = evaluate();
    expect(geometryOf(result, 0)).toBeDefined();
    expect(geometryOf(result, 1)).toBeDefined();
    expect(geometryOf(result, 2)).toBeDefined();
    expect(result.sceneOutputGeometry3).toBeUndefined();
  });

  it('取り付け位置(placementY)を変えると、すべてのメッシュが同じだけ上下する', () => {
    const data = getNodeType('camisoleDressGroup').createDefaultData() as { nodes: GraphNode[] };
    const placementY = data.nodes.find((n) => n.id === 'placementY')!.data.value as number;
    const raised = {
      ...data,
      nodes: data.nodes.map((n) => (n.id === 'placementY' ? { ...n, data: { value: placementY + 0.1 } } : n)),
    };
    const minYs = (result: ReturnType<typeof evaluate>) =>
      [0, 1, 2].map((index) => {
        const geometry = geometryOf(result, index)!;
        geometry.computeBoundingBox();
        return geometry.boundingBox!.min.y;
      });
    const before = minYs(getNodeType('camisoleDressGroup').evaluate({}, data));
    const after = minYs(getNodeType('camisoleDressGroup').evaluate({}, raised));
    after.forEach((y, index) => expect(y - before[index]).toBeCloseTo(0.1, 5));
  });

  it('リボンの2つの層は本体の高さの範囲にある', () => {
    const result = evaluate();
    const dress = geometryOf(result, 0)!;
    dress.computeBoundingBox();
    for (const index of [1, 2]) {
      const part = geometryOf(result, index)!;
      part.computeBoundingBox();
      expect(part.boundingBox!.min.y).toBeGreaterThan(dress.boundingBox!.min.y);
      expect(part.boundingBox!.max.y).toBeLessThan(dress.boundingBox!.max.y);
    }
  });

  it('外部ソケット color は本体の色だけを変え、リボンの色は変えない。羽の後ろの層は前の層より暗い', () => {
    const before = evaluate();
    const after = evaluate({ color: { type: 'color', value: new THREE.Color('#112233') } });
    expect(colorOf(after, 0)).toBe('112233');
    expect(colorOf(after, 1)).toBe(colorOf(before, 1));
    expect(colorOf(after, 2)).toBe(colorOf(before, 2));
    const lightness = (hex: string) => new THREE.Color(`#${hex}`).getHSL({ h: 0, s: 0, l: 0 }).l;
    expect(lightness(colorOf(before, 2)!)).toBeLessThan(lightness(colorOf(before, 1)!));
  });

  it('本体は裾の内側が見えるよう両面を描き、リボンは表面だけ', () => {
    const result = evaluate();
    const sideOf = (index: number) => {
      const value = result[`sceneOutputMaterial${index}`];
      return value?.type === 'material' ? value.value.side : undefined;
    };
    expect(sideOf(0)).toBe(THREE.DoubleSide);
    expect(sideOf(1)).toBe(THREE.FrontSide);
    expect(sideOf(2)).toBe(THREE.FrontSide);
  });
});
