import { beforeEach, describe, expect, it } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import { usePresetStore } from './presetStore';

function resetStore() {
  usePresetStore.setState({ presets: [] });
}

beforeEach(() => {
  resetStore();
});

const nodesA: Node[] = [{ id: 'a', type: 'testNode', position: { x: 0, y: 0 }, data: {} }];
const nodesB: Node[] = [{ id: 'b', type: 'testNode', position: { x: 0, y: 0 }, data: {} }];
const edges: Edge[] = [];

describe('presetStore', () => {
  it('savePreset は新しいプリセットを追加する', () => {
    usePresetStore.getState().savePreset('foo', nodesA, edges);

    const { presets } = usePresetStore.getState();
    expect(presets).toHaveLength(1);
    expect(presets[0].name).toBe('foo');
    expect(presets[0].nodes).toEqual(nodesA);
  });

  it('同名で保存すると、id を保ったまま内容を上書きする', () => {
    usePresetStore.getState().savePreset('foo', nodesA, edges);
    const originalId = usePresetStore.getState().presets[0].id;

    usePresetStore.getState().savePreset('foo', nodesB, edges);

    const { presets } = usePresetStore.getState();
    expect(presets).toHaveLength(1);
    expect(presets[0].id).toBe(originalId);
    expect(presets[0].nodes).toEqual(nodesB);
  });

  it('複数プリセットが存在する状態で1件だけ上書きしても、他のプリセットは変化しない', () => {
    usePresetStore.getState().savePreset('foo', nodesA, edges);
    usePresetStore.getState().savePreset('bar', nodesB, edges);
    const barBefore = usePresetStore.getState().presets.find((p) => p.name === 'bar');

    usePresetStore.getState().savePreset('foo', nodesB, edges);

    const { presets } = usePresetStore.getState();
    expect(presets).toHaveLength(2);
    expect(presets.find((p) => p.name === 'bar')).toEqual(barBefore);
    expect(presets.find((p) => p.name === 'foo')?.nodes).toEqual(nodesB);
  });

  it('異なる名前で保存すると、別のプリセットとして追加される', () => {
    usePresetStore.getState().savePreset('foo', nodesA, edges);
    usePresetStore.getState().savePreset('bar', nodesB, edges);

    const { presets } = usePresetStore.getState();
    expect(presets).toHaveLength(2);
    expect(presets.map((p) => p.name).sort()).toEqual(['bar', 'foo']);
    expect(new Set(presets.map((p) => p.id)).size).toBe(2);
  });

  it('deletePreset は指定した id のプリセットだけを取り除く', () => {
    usePresetStore.getState().savePreset('foo', nodesA, edges);
    usePresetStore.getState().savePreset('bar', nodesB, edges);
    const [first, second] = usePresetStore.getState().presets;

    usePresetStore.getState().deletePreset(first.id);

    const { presets } = usePresetStore.getState();
    expect(presets).toHaveLength(1);
    expect(presets[0].id).toBe(second.id);
  });

  it('存在しない id を deletePreset しても何も起きない', () => {
    usePresetStore.getState().savePreset('foo', nodesA, edges);
    usePresetStore.getState().deletePreset('does-not-exist');

    expect(usePresetStore.getState().presets).toHaveLength(1);
  });

  it('同名でも scope が違えば別のプリセットとして保存され、scope が同じなら上書きされる', () => {
    usePresetStore.getState().savePreset('foo', nodesA, edges);
    usePresetStore.getState().savePreset('foo', nodesB, edges, 'skirtGroup');
    expect(usePresetStore.getState().presets).toHaveLength(2);

    usePresetStore.getState().savePreset('foo', nodesA, edges, 'skirtGroup');
    const { presets } = usePresetStore.getState();
    expect(presets).toHaveLength(2);
    expect(presets.find((p) => p.scope === 'skirtGroup')?.nodes).toEqual(nodesA);
    expect(presets.find((p) => p.scope === undefined)?.scope).toBeUndefined();
  });
});
