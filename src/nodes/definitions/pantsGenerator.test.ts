import { describe, expect, it } from 'vitest';
import * as pantsGeometry from '../../geometry/pants';
import { getNodeType } from '../registry';
import './pantsGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('pantsGenerator', () => {
  it('data の各フィールドを取り違えずに buildPantsGeometry へ渡す', () => {
    expectGeneratorForwardsData(pantsGeometry, 'buildPantsGeometry', 'pantsGenerator', {
      waistRadius: 0.17,
      hemRadius: 0.11,
      inseam: 0.78,
      legSpacing: 0.15,
      segments: 14,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('pantsGenerator').createDefaultData()).toEqual({
      waistRadius: 0.16,
      hemRadius: 0.1,
      inseam: 0.75,
      legSpacing: 0.14,
      segments: 16,
    });
  });
});
