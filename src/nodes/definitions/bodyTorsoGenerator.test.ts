import { describe, expect, it } from 'vitest';
import * as bodyParts from '../../geometry/bodyParts';
import { getNodeType } from '../registry';
import './bodyTorsoGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('bodyTorsoGenerator', () => {
  it('data の各フィールドを取り違えずに buildTorsoGeometry へ渡す', () => {
    expectGeneratorForwardsData(bodyParts, 'buildTorsoGeometry', 'bodyTorsoGenerator', {
      radius: 0.31,
      length: 0.62,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('bodyTorsoGenerator').createDefaultData()).toEqual({ radius: 0.26, length: 0.55 });
  });
});
