import { describe, expect, it } from 'vitest';
import * as necktieGeometry from '../../../geometry/necktie';
import { getNodeType } from '../../registry';
import './necktieGenerator';
import { expectGeneratorForwardsData } from '../testHelpers';

describe('necktieGenerator', () => {
  it('data の各フィールドを取り違えずに buildNecktieGeometry へ渡す', () => {
    expectGeneratorForwardsData(necktieGeometry, 'buildNecktieGeometry', 'necktieGenerator', {
      knotWidth: 0.052,
      knotHeight: 0.043,
      knotThickness: 0.028,
      bladeTopWidth: 0.038,
      bladeBottomWidth: 0.063,
      bladeThickness: 0.009,
      bladeLength: 0.44,
      frontDepth: 0.33,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('necktieGenerator').createDefaultData()).toEqual({
      knotWidth: 0.05,
      knotHeight: 0.04,
      knotThickness: 0.025,
      bladeTopWidth: 0.035,
      bladeBottomWidth: 0.06,
      bladeThickness: 0.008,
      bladeLength: 0.4,
      frontDepth: 0.3,
    });
  });
});
