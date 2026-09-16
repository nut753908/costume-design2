import { describe, expect, it } from 'vitest';
import * as primitives from '../../geometry/primitives';
import { getNodeType } from '../registry';
import './capsuleGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('capsuleGenerator', () => {
  it('data の各フィールドを取り違えずに buildCapsuleGeometry へ渡す(cap/radialSegmentsは固定値)', () => {
    expectGeneratorForwardsData(primitives, 'buildCapsuleGeometry', 'capsuleGenerator', {
      radius: 0.31,
      length: 0.62,
      capSegments: 4,
      radialSegments: 16,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('capsuleGenerator').createDefaultData()).toEqual({ radius: 0.26, length: 0.55 });
  });
});
