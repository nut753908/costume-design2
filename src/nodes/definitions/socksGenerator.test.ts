import { describe, expect, it } from 'vitest';
import * as socksGeometry from '../../geometry/socks';
import { getNodeType } from '../registry';
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

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('socksGenerator').createDefaultData()).toEqual({
      ankleRadius: 0.09,
      calfRadius: 0.105,
      height: 0.22,
      legSpacing: 0.14,
      segments: 16,
    });
  });
});
