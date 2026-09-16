import { describe, expect, it } from 'vitest';
import * as pantsGeometry from '../../geometry/pants';
import { getNodeType } from '../registry';
import './pantsLegGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('pantsLegGenerator', () => {
  it('data の各フィールドを取り違えずに buildPantsLegGeometry へ渡す', () => {
    expectGeneratorForwardsData(pantsGeometry, 'buildPantsLegGeometry', 'pantsLegGenerator', {
      waistRadius: 0.17,
      hemRadius: 0.11,
      inseam: 0.78,
      segments: 14,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('pantsLegGenerator').createDefaultData()).toEqual({
      waistRadius: 0.16,
      hemRadius: 0.1,
      inseam: 0.75,
      segments: 16,
    });
  });
});
