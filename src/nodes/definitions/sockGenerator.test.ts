import { describe, expect, it } from 'vitest';
import * as socksGeometry from '../../geometry/socks';
import { getNodeType } from '../registry';
import './sockGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('sockGenerator', () => {
  it('data の各フィールドを取り違えずに buildSockGeometry へ渡す', () => {
    expectGeneratorForwardsData(socksGeometry, 'buildSockGeometry', 'sockGenerator', {
      ankleRadius: 0.11,
      calfRadius: 0.12,
      height: 0.25,
      segments: 14,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('sockGenerator').createDefaultData()).toEqual({
      ankleRadius: 0.09,
      calfRadius: 0.105,
      height: 0.22,
      segments: 16,
    });
  });
});
