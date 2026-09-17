import { describe, expect, it } from 'vitest';
import * as primitives from '../../../geometry/primitives';
import { getNodeType } from '../../registry';
import './sphereGenerator';
import { expectGeneratorForwardsData } from '../testHelpers';

describe('sphereGenerator', () => {
  it('data の各フィールドを取り違えずに buildSphereGeometry へ渡す(width/heightSegmentsは固定値)', () => {
    expectGeneratorForwardsData(primitives, 'buildSphereGeometry', 'sphereGenerator', {
      radius: 0.19,
      widthSegments: 20,
      heightSegments: 16,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('sphereGenerator').createDefaultData()).toEqual({ radius: 0.16 });
  });
});
