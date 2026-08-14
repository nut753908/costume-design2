import { describe, expect, it } from 'vitest';
import * as skirtGeometry from '../../geometry/skirt';
import { getNodeType } from '../registry';
import './skirtGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('skirtGenerator', () => {
  it('data の各フィールドを取り違えずに buildSkirtGeometry へ渡す', () => {
    expectGeneratorForwardsData(skirtGeometry, 'buildSkirtGeometry', 'skirtGenerator', {
      waistRadius: 0.31,
      length: 0.62,
      flare: 0.93,
      segments: 20,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('skirtGenerator').createDefaultData()).toEqual({
      waistRadius: 0.34,
      length: 0.5,
      flare: 0.6,
      segments: 24,
    });
  });
});
