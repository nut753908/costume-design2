import { describe, expect, it } from 'vitest';
import * as scarfGeometry from '../../geometry/scarf';
import { getNodeType } from '../registry';
import './scarfGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('scarfGenerator', () => {
  it('data の各フィールドを取り違えずに buildScarfGeometry へ渡す', () => {
    expectGeneratorForwardsData(scarfGeometry, 'buildScarfGeometry', 'scarfGenerator', {
      neckRadius: 0.21,
      bandThickness: 0.06,
      tailWidth: 0.11,
      tailLength: 0.38,
      segments: 18,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('scarfGenerator').createDefaultData()).toEqual({
      neckRadius: 0.19,
      bandThickness: 0.05,
      tailWidth: 0.09,
      tailLength: 0.35,
      segments: 20,
    });
  });
});
