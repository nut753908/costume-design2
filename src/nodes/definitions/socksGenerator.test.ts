import { describe, it } from 'vitest';
import * as socksGeometry from '../../geometry/socks';
import './socksGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('socksGenerator', () => {
  it('data の各フィールドを取り違えずに buildSocksGeometry へ渡す', () => {
    expectGeneratorForwardsData(socksGeometry, 'buildSocksGeometry', 'socksGenerator', {
      ankleRadius: 0.11,
      calfRadius: 0.12,
      height: 0.25,
      legSpacing: 0.15,
      segments: 14,
    });
  });
});
