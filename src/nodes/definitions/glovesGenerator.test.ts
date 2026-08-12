import { describe, it } from 'vitest';
import * as glovesGeometry from '../../geometry/gloves';
import './glovesGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('glovesGenerator', () => {
  it('data の各フィールドを取り違えずに buildGlovesGeometry へ渡す', () => {
    expectGeneratorForwardsData(glovesGeometry, 'buildGlovesGeometry', 'glovesGenerator', {
      wristRadius: 0.071,
      handRadius: 0.082,
      length: 0.15,
      armSpacing: 0.31,
      segments: 10,
    });
  });
});
