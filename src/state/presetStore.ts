import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Node, Edge } from '@xyflow/react';

export interface Preset {
  id: string;
  name: string;
  savedAt: number;
  nodes: Node[];
  edges: Edge[];
  /** プリセットが対象とする階層。省略(または undefined)ならトップレベルのグラフ全体、
   * グループノードの型名(`bodyGroup` など)ならそのグループの内部グラフだけ。 */
  scope?: string;
  /** グループの内部グラフのプリセット(`scope` あり)を保存した時点の、元のテンプレートの構造の
   * 指紋(`nodes/groupTemplate.ts`)。読み込み時に現在のテンプレートと比べて古さを検知する。 */
  templateFingerprint?: string;
}

interface PresetState {
  presets: Preset[];
  savePreset: (name: string, nodes: Node[], edges: Edge[], scope?: string, templateFingerprint?: string) => void;
  deletePreset: (id: string) => void;
  /** Import JSON で読み込んだプリセットを既存の一覧へマージする。同名・同じ `scope` の既存は
   * id を保ったまま上書きし、それ以外は新しい id で追加する(ファイル側の id は使わない)。 */
  importPresets: (presets: Preset[]) => void;
}

function newPresetId(): string {
  return Math.random().toString(36).slice(2, 9);
}

/** 外部ファイル由来の値が Preset として扱える形かを検査する。ここでは形だけを見て、
 * nodes/edges の中身の検証(validateGraph)は読み込み時に PresetPanel が行う。 */
export function isPresetShape(value: unknown): value is Preset {
  if (typeof value !== 'object' || value === null) return false;
  const { name, nodes, edges, scope, templateFingerprint } = value as Record<string, unknown>;
  return (
    typeof name === 'string' &&
    Array.isArray(nodes) &&
    Array.isArray(edges) &&
    (scope === undefined || typeof scope === 'string') &&
    (templateFingerprint === undefined || typeof templateFingerprint === 'string')
  );
}

/** ブラウザ内で名前付きスナップショットを複数保持し、すぐに切り替えられるようにする。
 * GraphIO の JSON エクスポート/インポートにはグラフと一緒にこの一覧も含まれる。
 * 同名で保存すると、同じ階層(`scope`)の既存のプリセットを上書きする。 */
export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      presets: [],
      savePreset: (name, nodes, edges, scope, templateFingerprint) => {
        const existing = get().presets.find((p) => p.name === name && p.scope === scope);
        const preset: Preset = {
          id: existing?.id ?? newPresetId(),
          name,
          savedAt: Date.now(),
          nodes,
          edges,
          ...(scope !== undefined ? { scope } : {}),
          ...(templateFingerprint !== undefined ? { templateFingerprint } : {}),
        };
        set({
          presets: existing
            ? get().presets.map((p) => (p.id === preset.id ? preset : p))
            : [...get().presets, preset],
        });
      },
      deletePreset: (id) => set({ presets: get().presets.filter((p) => p.id !== id) }),
      importPresets: (imported) => {
        const presets = [...get().presets];
        for (const p of imported) {
          const index = presets.findIndex((q) => q.name === p.name && q.scope === p.scope);
          const preset: Preset = {
            id: index >= 0 ? presets[index].id : newPresetId(),
            name: p.name,
            savedAt: typeof p.savedAt === 'number' ? p.savedAt : Date.now(),
            nodes: p.nodes,
            edges: p.edges,
            ...(p.scope !== undefined ? { scope: p.scope } : {}),
            ...(p.templateFingerprint !== undefined ? { templateFingerprint: p.templateFingerprint } : {}),
          };
          if (index >= 0) presets[index] = preset;
          else presets.push(preset);
        }
        set({ presets });
      },
    }),
    { name: 'costume-design-presets' },
  ),
);
