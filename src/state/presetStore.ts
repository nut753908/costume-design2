import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Node, Edge } from '@xyflow/react';

export interface Preset {
  id: string;
  name: string;
  savedAt: number;
  nodes: Node[];
  edges: Edge[];
}

interface PresetState {
  presets: Preset[];
  savePreset: (name: string, nodes: Node[], edges: Edge[]) => void;
  deletePreset: (id: string) => void;
}

/** GraphIO の JSON エクスポート/インポート(ファイル単位の共有・バックアップ)とは別に、
 * ブラウザ内で名前付きスナップショットを複数保持し、すぐに切り替えられるようにする。
 * 同名で保存すると既存のプリセットを上書きする。 */
export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      presets: [],
      savePreset: (name, nodes, edges) => {
        const existing = get().presets.find((p) => p.name === name);
        const preset: Preset = {
          id: existing?.id ?? Math.random().toString(36).slice(2, 9),
          name,
          savedAt: Date.now(),
          nodes,
          edges,
        };
        set({
          presets: existing
            ? get().presets.map((p) => (p.id === preset.id ? preset : p))
            : [...get().presets, preset],
        });
      },
      deletePreset: (id) => set({ presets: get().presets.filter((p) => p.id !== id) }),
    }),
    { name: 'costume-design-presets' },
  ),
);
