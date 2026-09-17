import { describe, expect, it } from 'vitest';
import * as primitives from '../../../geometry/primitives';
import { getNodeType } from '../../registry';
import './cylinderGenerator';
import { expectGeneratorForwardsData } from '../testHelpers';

describe('cylinderGenerator', () => {
  it('data の各フィールドを取り違えずに buildCylinderGeometry へ渡す(radialSegmentsは固定値)', () => {
    expectGeneratorForwardsData(primitives, 'buildCylinderGeometry', 'cylinderGenerator', {
      radiusTop: 0.09,
      radiusBottom: 0.076,
      height: 0.58,
      radialSegments: 12,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('cylinderGenerator').createDefaultData()).toEqual({
      radiusTop: 0.1,
      radiusBottom: 0.1,
      height: 0.6,
    });
  });
});
