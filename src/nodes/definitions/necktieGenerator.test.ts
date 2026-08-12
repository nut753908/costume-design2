import { describe, it } from 'vitest';
import * as necktieGeometry from '../../geometry/necktie';
import './necktieGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

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
    });
  });
});
