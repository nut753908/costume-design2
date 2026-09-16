import { describe, expect, it } from 'vitest';
import * as glassesGeometry from '../../geometry/glasses';
import { getNodeType } from '../registry';
import './glassesFrameGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('glassesFrameGenerator', () => {
  it('data の各フィールドを取り違えずに buildGlassesFrameGeometry へ渡す', () => {
    expectGeneratorForwardsData(glassesGeometry, 'buildGlassesFrameGeometry', 'glassesFrameGenerator', {
      lensRadius: 0.041,
      bridgeThickness: 0.011,
      lensSpacing: 0.052,
      templeLength: 0.13,
      templeThickness: 0.007,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('glassesFrameGenerator').createDefaultData()).toEqual({
      lensRadius: 0.045,
      bridgeThickness: 0.01,
      lensSpacing: 0.055,
      templeLength: 0.12,
      templeThickness: 0.006,
    });
  });
});
