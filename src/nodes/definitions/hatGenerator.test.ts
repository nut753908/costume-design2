import { describe, it } from 'vitest';
import * as hatGeometry from '../../geometry/hat';
import './hatGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('hatGenerator', () => {
  it('data の各フィールドを取り違えずに buildHatGeometry へ渡す', () => {
    expectGeneratorForwardsData(hatGeometry, 'buildHatGeometry', 'hatGenerator', {
      brimRadius: 0.23,
      crownRadius: 0.03,
      height: 0.31,
      segments: 16,
    });
  });
});
