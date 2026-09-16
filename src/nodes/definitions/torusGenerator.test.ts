import { describe, expect, it } from 'vitest';
import * as primitives from '../../geometry/primitives';
import { getNodeType } from '../registry';
import './torusGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('torusGenerator', () => {
  it('data の各フィールドを取り違えずに buildTorusGeometry へ渡す(radial/tubularSegmentsは固定値)', () => {
    expectGeneratorForwardsData(primitives, 'buildTorusGeometry', 'torusGenerator', {
      radius: 0.12,
      tube: 0.025,
      radialSegments: 8,
      tubularSegments: 16,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('torusGenerator').createDefaultData()).toEqual({ radius: 0.1, tube: 0.02 });
  });
});
