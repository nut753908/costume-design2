import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import { EasedLatheCurve } from '../../../geometry/latheProfile';
import './latheGenerator';

const PROFILE = { type: 'curve' as const, value: new EasedLatheCurve(0.2, 0.1, 1, 'up') };

describe('latheGenerator', () => {
  it('profile を steps 分割した点列から THREE.LatheGeometry を生成する', () => {
    const result = getNodeType('latheGenerator').evaluate(
      { profile: PROFILE, segments: { type: 'number', value: 16 } },
      {},
    );
    const geometry = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    expect(geometry).toBeInstanceOf(THREE.LatheGeometry);
  });

  it('profile が未接続なら何も返さない', () => {
    const result = getNodeType('latheGenerator').evaluate({ segments: { type: 'number', value: 16 } }, {});
    expect(result.geometry).toBeUndefined();
  });

  it('segments が未接続なら data.segments(既定16)にフォールバックする', () => {
    const withDefault = getNodeType('latheGenerator').evaluate({ profile: PROFILE }, {});
    const geometry = withDefault.geometry?.type === 'geometry' ? (withDefault.geometry.value as THREE.LatheGeometry) : undefined;
    expect(geometry!.parameters.segments).toBe(16);
  });

  it('segments は3未満に丸まらないようクランプされる', () => {
    const result = getNodeType('latheGenerator').evaluate(
      { profile: PROFILE, segments: { type: 'number', value: 1 } },
      {},
    );
    const geometry = result.geometry?.type === 'geometry' ? (result.geometry.value as THREE.LatheGeometry) : undefined;
    expect(geometry!.parameters.segments).toBe(3);
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('latheGenerator').createDefaultData()).toEqual({ segments: 16, steps: 10 });
  });

  it('steps(輪郭の分割数)が点の数を決める(steps+1 個の点、頂点数は (steps+1)*(segments+1))', () => {
    const geometry = (steps: number) => {
      const result = getNodeType('latheGenerator').evaluate(
        { profile: PROFILE, segments: { type: 'number', value: 8 }, steps: { type: 'number', value: steps } },
        {},
      );
      return result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    };
    expect(geometry(4)!.getAttribute('position').count).toBe(5 * 9);
    expect(geometry(10)!.getAttribute('position').count).toBe(11 * 9);
  });
});
