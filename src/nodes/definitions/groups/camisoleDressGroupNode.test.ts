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
  it('ワンピース本体(肩ひもを含む)とリボンの2つのメッシュを出力する', () => {
    const result = evaluate();
    expect(geometryOf(result, 0)).toBeDefined();
    expect(geometryOf(result, 1)).toBeDefined();
    expect(result.sceneOutputGeometry2).toBeUndefined();
  });

  it('裾が取り付け位置(placementY)の高さに来て、リボンは本体の高さの範囲にある', () => {
    const nodes = (getNodeType('camisoleDressGroup').createDefaultData() as { nodes: GraphNode[] }).nodes;
    const placementY = nodes.find((n) => n.id === 'placementY')!.data.value as number;
    const result = evaluate();
    const dress = geometryOf(result, 0)!;
    const bow = geometryOf(result, 1)!;
    dress.computeBoundingBox();
    bow.computeBoundingBox();
    expect(dress.boundingBox!.min.y).toBeCloseTo(placementY, 5);
    expect(bow.boundingBox!.min.y).toBeGreaterThan(dress.boundingBox!.min.y);
    expect(bow.boundingBox!.max.y).toBeLessThan(dress.boundingBox!.max.y);
  });

  it('外部ソケット color は本体の色だけを変え、リボンの色は変えない', () => {
    const before = evaluate();
    const after = evaluate({ color: { type: 'color', value: new THREE.Color('#112233') } });
    expect(colorOf(after, 0)).toBe('112233');
    expect(colorOf(after, 1)).toBe(colorOf(before, 1));
  });
});
