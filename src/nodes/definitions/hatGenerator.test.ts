import { describe, expect, it } from 'vitest';
import * as hatGeometry from '../../geometry/hat';
import { getNodeType } from '../registry';
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

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('hatGenerator').createDefaultData()).toEqual({
      brimRadius: 0.2,
      crownRadius: 0.02,
      height: 0.35,
      segments: 20,
    });
  });
});
