import { describe, expect, it } from 'vitest';
import * as glovesGeometry from '../../geometry/gloves';
import { getNodeType } from '../registry';
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

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('glovesGenerator').createDefaultData()).toEqual({
      wristRadius: 0.08,
      handRadius: 0.09,
      length: 0.14,
      armSpacing: 0.34,
      segments: 12,
    });
  });
});
