import { describe, it } from 'vitest';
import * as beltGeometry from '../../geometry/belt';
import './beltGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('beltGenerator', () => {
  it('data の各フィールドを取り違えずに buildBeltGeometry へ渡す', () => {
    expectGeneratorForwardsData(beltGeometry, 'buildBeltGeometry', 'beltGenerator', {
      radius: 0.31,
      thickness: 0.06,
      bulge: 1.21,
      segments: 18,
    });
  });
});
