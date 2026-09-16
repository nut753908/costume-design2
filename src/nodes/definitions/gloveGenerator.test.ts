import { describe, expect, it } from 'vitest';
import * as glovesGeometry from '../../geometry/gloves';
import { getNodeType } from '../registry';
import './gloveGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('gloveGenerator', () => {
  it('data の各フィールドを取り違えずに buildGloveGeometry へ渡す', () => {
    expectGeneratorForwardsData(glovesGeometry, 'buildGloveGeometry', 'gloveGenerator', {
      wristRadius: 0.071,
      handRadius: 0.082,
      length: 0.15,
      segments: 10,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('gloveGenerator').createDefaultData()).toEqual({
      wristRadius: 0.08,
      handRadius: 0.09,
      length: 0.14,
      segments: 12,
    });
  });
});
