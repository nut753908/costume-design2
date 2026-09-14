import { describe, expect, it } from 'vitest';
import * as bodyParts from '../../geometry/bodyParts';
import { getNodeType } from '../registry';
import './bodyHeadGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('bodyHeadGenerator', () => {
  it('data の各フィールドを取り違えずに buildHeadGeometry へ渡す', () => {
    expectGeneratorForwardsData(bodyParts, 'buildHeadGeometry', 'bodyHeadGenerator', { radius: 0.19 });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('bodyHeadGenerator').createDefaultData()).toEqual({ radius: 0.16 });
  });
});
