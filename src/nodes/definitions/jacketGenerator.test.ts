import { describe, expect, it } from 'vitest';
import * as jacketGeometry from '../../geometry/jacket';
import { getNodeType } from '../registry';
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

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('jacketGenerator').createDefaultData()).toEqual({
      shoulderRadius: 0.34,
      length: 0.42,
      hemFlare: 0.15,
      segments: 20,
    });
  });
});
