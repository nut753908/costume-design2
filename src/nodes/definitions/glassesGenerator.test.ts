import { describe, it } from 'vitest';
import * as glassesGeometry from '../../geometry/glasses';
import './glassesGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('glassesGenerator', () => {
  it('data の各フィールドを取り違えずに buildGlassesGeometry へ渡す', () => {
    expectGeneratorForwardsData(glassesGeometry, 'buildGlassesGeometry', 'glassesGenerator', {
      lensRadius: 0.041,
      frameThickness: 0.009,
      lensSpacing: 0.052,
      bridgeThickness: 0.011,
      templeLength: 0.13,
      templeThickness: 0.007,
    });
  });
});
