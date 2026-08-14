import type { Node } from '@xyflow/react';
import { useGraphStore } from './graphStore';

export const DEFAULT_BODY_SKIN_COLOR = '#f2c9a0';

// テスト用に export している。useBodyScale.ts の readSeedNumber と同じ考え方(ノード削除時の
// フォールバック)を、colorInput ノードの hex フィールドに対して行う。
export function readSeedColor(nodes: Node[], id: string, fallback: string): string {
  const node = nodes.find((n) => n.id === id);
  return typeof node?.data.hex === 'string' ? node.data.hex : fallback;
}

/** 慣例的な id 'bodySkinColor' を持つ colorInput ノードを id で直接読み取り、汎用の
 * evaluateGraph のソケットフローを迂回する — useBodyScale.ts の bodyHeight/bodyBuild/
 * bodyShoulder と同じパターン(ルート CLAUDE.md 参照)。肌色はガーメントの geometry/material
 * 出力ではなく Body.tsx が直接使うシーン全体のパラメータであるため。ノードが存在しない
 * (ユーザーが削除した等)場合は DEFAULT_BODY_SKIN_COLOR にフォールバックする。 */
export function useBodySkinColor(): string {
  return useGraphStore((s) => readSeedColor(s.nodes, 'bodySkinColor', DEFAULT_BODY_SKIN_COLOR));
}
