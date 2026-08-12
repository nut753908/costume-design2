import { describe, it } from 'vitest';
import * as sleeveGeometry from '../../geometry/sleeve';
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
});
