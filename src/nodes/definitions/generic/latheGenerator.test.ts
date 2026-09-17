import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './latheGenerator';

const POINTS = [new THREE.Vector2(0.1, 0), new THREE.Vector2(0.2, 0.5), new THREE.Vector2(0, 1)];

describe('latheGenerator', () => {
  it('points から THREE.LatheGeometry を生成する', () => {
    const result = getNodeType('latheGenerator').evaluate(
      { points: { type: 'points', value: POINTS }, segments: { type: 'number', value: 16 } },
      {},
    );
    const geometry = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    expect(geometry).toBeInstanceOf(THREE.LatheGeometry);
  });

  it('points が未接続なら何も返さない', () => {
    const result = getNodeType('latheGenerator').evaluate({ segments: { type: 'number', value: 16 } }, {});
    expect(result.geometry).toBeUndefined();
  });

  it('segments が未接続なら data.segments(既定16)にフォールバックする', () => {
    const withDefault = getNodeType('latheGenerator').evaluate({ points: { type: 'points', value: POINTS } }, {});
    const geometry = withDefault.geometry?.type === 'geometry' ? (withDefault.geometry.value as THREE.LatheGeometry) : undefined;
    expect(geometry!.parameters.segments).toBe(16);
  });

  it('segments は3未満に丸まらないようクランプされる', () => {
    const result = getNodeType('latheGenerator').evaluate(
      { points: { type: 'points', value: POINTS }, segments: { type: 'number', value: 1 } },
      {},
    );
    const geometry = result.geometry?.type === 'geometry' ? (result.geometry.value as THREE.LatheGeometry) : undefined;
    expect(geometry!.parameters.segments).toBe(3);
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('latheGenerator').createDefaultData()).toEqual({ segments: 16 });
  });
});
