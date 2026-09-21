import { beforeEach, describe, expect, it } from 'vitest';
import type { SocketValue } from '../nodes/types';
import { getNodeType } from '../nodes/registry';
import '../nodes/definitions';
import { isMeshVisible, listSceneOutputs, sceneMeshKey, sceneMeshKeys, useViewStore } from './viewStore';

const view = () => useViewStore.getState();

describe('viewStore', () => {
  beforeEach(() => view().reset());

  it('何も設定していなければすべて表示される', () => {
    expect(isMeshVisible(view(), 'a:0')).toBe(true);
  });

  it('toggleHidden で非表示になり、もう一度で再表示される', () => {
    view().toggleHidden(['a:0']);
    expect(isMeshVisible(view(), 'a:0')).toBe(false);
    expect(isMeshVisible(view(), 'b:0')).toBe(true);
    view().toggleHidden(['a:0']);
    expect(isMeshVisible(view(), 'a:0')).toBe(true);
  });

  it('複数キーは、一部だけ非表示ならすべて非表示に揃え、すべて非表示なら再表示する', () => {
    view().toggleHidden(['a:0']);
    view().toggleHidden(['a:0', 'a:1']);
    expect(isMeshVisible(view(), 'a:0')).toBe(false);
    expect(isMeshVisible(view(), 'a:1')).toBe(false);
    view().toggleHidden(['a:0', 'a:1']);
    expect(isMeshVisible(view(), 'a:0')).toBe(true);
    expect(isMeshVisible(view(), 'a:1')).toBe(true);
  });

  it('toggleSolo で対象だけが表示され、別の対象を選ぶと入れ替わり、同じ対象をもう一度選ぶと解除される', () => {
    view().toggleSolo(['a:0']);
    expect(isMeshVisible(view(), 'a:0')).toBe(true);
    expect(isMeshVisible(view(), 'b:0')).toBe(false);
    view().toggleSolo(['b:0']);
    expect(isMeshVisible(view(), 'a:0')).toBe(false);
    expect(isMeshVisible(view(), 'b:0')).toBe(true);
    view().toggleSolo(['b:0']);
    expect(isMeshVisible(view(), 'a:0')).toBe(true);
  });

  it('単独表示は非表示より優先される', () => {
    view().toggleHidden(['a:0']);
    view().toggleSolo(['a:0']);
    expect(isMeshVisible(view(), 'a:0')).toBe(true);
    expect(isMeshVisible(view(), 'b:0')).toBe(false);
  });

  it('sceneMeshKeys は sceneOutputGeometry<N> 予約キーだけからメッシュ識別子を作る', () => {
    const geometry = { type: 'number', value: 0 } as const;
    expect(
      sceneMeshKeys('g', { sceneOutputGeometry0: geometry, sceneOutputMaterial0: geometry, sceneOutputGeometry1: geometry, value: geometry }),
    ).toEqual([sceneMeshKey('g', 0), sceneMeshKey('g', 1)]);
    expect(sceneMeshKeys('g', undefined)).toEqual([]);
  });

  it('listSceneOutputs はトップレベルのノード順に、描画されているメッシュだけを一覧する', () => {
    const geometry = { type: 'number', value: 0 } as const;
    const results = new Map<string, Record<string, SocketValue>>([
      ['b', { sceneOutputGeometry0: geometry, sceneOutputMaterial0: geometry }],
      ['a', { sceneOutputGeometry0: geometry, sceneOutputGeometry1: geometry }],
      ['c', { value: geometry }],
    ]);
    const nodes = [
      { id: 'a', type: 'topGroup', data: {} },
      { id: 'b', type: 'skirtGroup', data: { label: 'ignored' } },
      { id: 'c', type: 'numberInput', data: {} },
    ];
    expect(listSceneOutputs(nodes, results)).toEqual([
      { key: 'a:0', nodeId: 'a', label: 'Top #0' },
      { key: 'a:1', nodeId: 'a', label: 'Top #1' },
      { key: 'b:0', nodeId: 'b', label: getNodeType('skirtGroup').label },
    ]);
    expect(listSceneOutputs(nodes, null)).toEqual([]);
  });
});
