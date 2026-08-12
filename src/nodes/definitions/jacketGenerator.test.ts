import { describe, it } from 'vitest';
import * as jacketGeometry from '../../geometry/jacket';
import './jacketGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('jacketGenerator', () => {
  it('data の各フィールドを取り違えずに buildJacketGeometry へ渡す', () => {
    expectGeneratorForwardsData(jacketGeometry, 'buildJacketGeometry', 'jacketGenerator', {
      shoulderRadius: 0.37,
      length: 0.46,
      hemFlare: 0.19,
      segments: 22,
    });
  });
});
