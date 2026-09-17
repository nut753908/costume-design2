import { describe, expect, it } from 'vitest';
import * as bagGeometry from '../../../geometry/bag';
import { getNodeType } from '../../registry';
import './bagStrapGenerator';
import { expectGeneratorForwardsData } from '../testHelpers';

describe('bagStrapGenerator', () => {
  it('data の各フィールドを取り違えずに buildBagStrapGeometry へ渡す', () => {
    expectGeneratorForwardsData(bagGeometry, 'buildBagStrapGeometry', 'bagStrapGenerator', {
      strapWidth: 0.041,
      strapThickness: 0.017,
      shoulderOffset: 0.09,
      hipOffset: 0.28,
      drop: 0.58,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('bagStrapGenerator').createDefaultData()).toEqual({
      strapWidth: 0.04,
      strapThickness: 0.015,
      shoulderOffset: 0.08,
      hipOffset: 0.26,
      drop: 0.55,
    });
  });
});
