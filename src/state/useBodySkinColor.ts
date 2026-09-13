import { useGraphStore } from './graphStore';
import { BODY_NODE_ID } from '../nodes/definitions/body';
import type { EvaluatedGraph } from '../nodes/evaluateGraph';

export const DEFAULT_BODY_SKIN_COLOR = '#f2c9a0';

// テスト用に export している。id 'body' の Body ノード(nodes/definitions/body.ts)の
// 評価結果から skinColor ソケットの値を hex 文字列として読み取る(SocketValue の 'color' 型は
// 実行時 THREE.Color を持つため、Body.tsx の createToonMaterial() が受け取れる hex 文字列へ
// ここで変換する)。useBodyScale.ts の readBodyNumber と同じ考え方でフォールバックする。
export function readBodyColor(results: EvaluatedGraph | null, socketId: string, fallback: string): string {
  const socketValue = results?.get(BODY_NODE_ID)?.[socketId];
  return socketValue?.type === 'color' ? `#${socketValue.value.getHexString()}` : fallback;
}

/** Body(3Dモデル本体)の肌色を、`rootEvaluatedResults` 上の id 'body' ノード
 * (nodes/definitions/body.ts、BODY_NODE_ID)の評価結果から読み取る。`useBodyScale.ts` と同じ
 * パターン(ルート CLAUDE.md 参照)— `bodySkinColor`(慣例的な id を持つ colorInput ノード)
 * から Body ノードへ実際にワイヤーで配線されており、ソケットグラフを迂回してノードを id で
 * 直接読んでいた以前の実装と異なり、キャンバス上で接続先が見える。Body ノード自体が
 * 削除されている場合は DEFAULT_BODY_SKIN_COLOR にフォールバックする。 */
export function useBodySkinColor(): string {
  return useGraphStore((s) => readBodyColor(s.rootEvaluatedResults, 'skinColor', DEFAULT_BODY_SKIN_COLOR));
}
