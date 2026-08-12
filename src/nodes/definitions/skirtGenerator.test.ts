import { describe, it } from 'vitest';
import * as skirtGeometry from '../../geometry/skirt';
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
});
