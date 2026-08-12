import { describe, it } from 'vitest';
import * as pantsGeometry from '../../geometry/pants';
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
});
