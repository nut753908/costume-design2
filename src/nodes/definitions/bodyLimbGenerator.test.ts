import { describe, expect, it } from 'vitest';
import * as bodyParts from '../../geometry/bodyParts';
import { getNodeType } from '../registry';
import './bodyLimbGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('bodyLimbGenerator', () => {
  it('data の各フィールドを取り違えずに buildLimbPairGeometry へ渡す', () => {
    expectGeneratorForwardsData(bodyParts, 'buildLimbPairGeometry', 'bodyLimbGenerator', {
      radius: 0.09,
      length: 0.58,
      spacing: 0.17,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('bodyLimbGenerator').createDefaultData()).toEqual({ radius: 0.1, length: 0.6, spacing: 0.2 });
  });
});
