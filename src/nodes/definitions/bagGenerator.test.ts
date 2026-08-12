import { describe, it } from 'vitest';
import * as bagGeometry from '../../geometry/bag';
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
});
