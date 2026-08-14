import { describe, expect, it } from 'vitest';
import * as bagGeometry from '../../geometry/bag';
import { getNodeType } from '../registry';
import './bagGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('bagGenerator', () => {
  it('data の各フィールドを取り違えずに buildBagGeometry へ渡す', () => {
    expectGeneratorForwardsData(bagGeometry, 'buildBagGeometry', 'bagGenerator', {
      strapWidth: 0.041,
      strapThickness: 0.017,
      shoulderOffset: 0.09,
      hipOffset: 0.28,
      drop: 0.58,
      bagWidth: 0.18,
      bagHeight: 0.16,
      bagDepth: 0.09,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('bagGenerator').createDefaultData()).toEqual({
      strapWidth: 0.04,
      strapThickness: 0.015,
      shoulderOffset: 0.08,
      hipOffset: 0.26,
      drop: 0.55,
      bagWidth: 0.16,
      bagHeight: 0.14,
      bagDepth: 0.08,
    });
  });
});
