import { describe, expect, it } from 'vitest';
import * as beltGeometry from '../../geometry/belt';
import { getNodeType } from '../registry';
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

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('beltGenerator').createDefaultData()).toEqual({
      radius: 0.32,
      thickness: 0.05,
      bulge: 1.15,
      segments: 24,
    });
  });
});
