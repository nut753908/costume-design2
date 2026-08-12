import { describe, it } from 'vitest';
import * as scarfGeometry from '../../geometry/scarf';
import './scarfGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('scarfGenerator', () => {
  it('data の各フィールドを取り違えずに buildScarfGeometry へ渡す', () => {
    expectGeneratorForwardsData(scarfGeometry, 'buildScarfGeometry', 'scarfGenerator', {
      neckRadius: 0.21,
      bandThickness: 0.06,
      tailWidth: 0.11,
      tailLength: 0.38,
      segments: 18,
    });
  });
});
