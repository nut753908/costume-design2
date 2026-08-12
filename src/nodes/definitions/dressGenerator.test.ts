import { describe, it } from 'vitest';
import * as dressGeometry from '../../geometry/dress';
import './dressGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('dressGenerator', () => {
  it('data の各フィールドを取り違えずに buildDressGeometry へ渡す(angle/heightSegmentsは固定値)', () => {
    expectGeneratorForwardsData(dressGeometry, 'buildDressGeometry', 'dressGenerator', {
      torsoRadius: 0.31,
      hemRadius: 0.58,
      length: 0.93,
      necklineType: 'square',
      necklineDepth: 0.15,
      angleSegments: 24,
      heightSegments: 14,
    });
  });
});
