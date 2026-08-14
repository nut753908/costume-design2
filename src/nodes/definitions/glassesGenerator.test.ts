import { describe, expect, it } from 'vitest';
import * as glassesGeometry from '../../geometry/glasses';
import { getNodeType } from '../registry';
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

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('glassesGenerator').createDefaultData()).toEqual({
      lensRadius: 0.045,
      frameThickness: 0.008,
      lensSpacing: 0.055,
      bridgeThickness: 0.01,
      templeLength: 0.12,
      templeThickness: 0.006,
    });
  });
});
