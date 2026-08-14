import { describe, expect, it } from 'vitest';
import * as sleeveGeometry from '../../geometry/sleeve';
import { getNodeType } from '../registry';
import './sleeveGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('sleeveGenerator', () => {
  it('data の各フィールドを取り違えずに buildSleeveGeometry へ渡す(segmentsは固定値12)', () => {
    expectGeneratorForwardsData(sleeveGeometry, 'buildSleeveGeometry', 'sleeveGenerator', {
      attachRadius: 0.31,
      sleeveRadius: 0.095,
      sleeveLength: 0.25,
      segments: 12,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('sleeveGenerator').createDefaultData()).toEqual({
      attachRadius: 0.29,
      sleeveRadius: 0.085,
      sleeveLength: 0.22,
    });
  });
});
