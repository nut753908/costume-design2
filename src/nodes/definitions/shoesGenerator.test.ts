import { describe, it } from 'vitest';
import * as shoesGeometry from '../../geometry/shoes';
import './shoesGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('shoesGenerator', () => {
  it('data の各フィールドを取り違えずに buildShoesGeometry へ渡す', () => {
    expectGeneratorForwardsData(shoesGeometry, 'buildShoesGeometry', 'shoesGenerator', {
      soleRadius: 0.15,
      cuffRadius: 0.12,
      height: 0.14,
      toeLength: 1.7,
      legSpacing: 0.16,
      segments: 14,
    });
  });
});
