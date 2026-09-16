import { describe, expect, it } from 'vitest';
import * as shoesGeometry from '../../geometry/shoes';
import { getNodeType } from '../registry';
import './shoeGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('shoeGenerator', () => {
  it('data の各フィールドを取り違えずに buildShoeGeometry へ渡す', () => {
    expectGeneratorForwardsData(shoesGeometry, 'buildShoeGeometry', 'shoeGenerator', {
      soleRadius: 0.15,
      cuffRadius: 0.12,
      height: 0.14,
      toeLength: 1.7,
      segments: 14,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('shoeGenerator').createDefaultData()).toEqual({
      soleRadius: 0.13,
      cuffRadius: 0.1,
      height: 0.12,
      toeLength: 1.5,
      segments: 16,
    });
  });
});
