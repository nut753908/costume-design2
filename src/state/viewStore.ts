import { create } from 'zustand';
import type { GraphNode, SocketValue } from '../nodes/types';
import type { EvaluatedGraph } from '../nodes/evaluateGraph';
import { nodeDisplayLabel } from '../nodes/registry';
import { matchSceneOutputGeometryIndex } from '../nodes/definitions/generic/sceneOutput';

/** 3Dビューに描画される1つのメッシュ(= `Garments.tsx` がマウントする1つの `ToonMesh`)の識別子。
 * 表示/非表示・単独表示の単位で、`<グループのノードid>:<そのグループ内の sceneOutput の通し番号>`。 */
export function sceneMeshKey(nodeId: string, index: number): string {
  return `${nodeId}:${index}`;
}

/** ノードの評価結果に含まれる `sceneOutputGeometry<N>` 予約キーから、そのノードが描画する
 * メッシュの識別子を列挙する。 */
export function sceneMeshKeys(nodeId: string, result: Record<string, SocketValue> | undefined): string[] {
  if (!result) return [];
  return Object.keys(result).flatMap((key) => {
    const index = matchSceneOutputGeometryIndex(key);
    return index === null ? [] : [sceneMeshKey(nodeId, index)];
  });
}

interface ViewState {
  hidden: ReadonlySet<string>;
  /** 空でなければ、ここに含まれるメッシュだけを表示する(`hidden` より優先)。 */
  solo: ReadonlySet<string>;
  /** `keys` がすべて非表示なら再表示、そうでなければすべて非表示にする。 */
  toggleHidden: (keys: string[]) => void;
  /** `keys` だけを単独表示にする。すでにちょうどそれだけが単独表示なら解除する。 */
  toggleSolo: (keys: string[]) => void;
  reset: () => void;
}

/** 3Dビューの見え方だけを決める UI 状態。グラフの `data` ではなく別ストアに持つので、
 * 永続化・Undo/Redo・Export/プリセットの対象にならない(設計の仕様ではなく確認用の表示設定)。 */
export const useViewStore = create<ViewState>((set) => ({
  hidden: new Set(),
  solo: new Set(),
  toggleHidden: (keys) =>
    set((s) => {
      const next = new Set(s.hidden);
      if (keys.every((k) => next.has(k))) keys.forEach((k) => next.delete(k));
      else keys.forEach((k) => next.add(k));
      return { hidden: next };
    }),
  toggleSolo: (keys) =>
    set((s) => {
      const same = s.solo.size === keys.length && keys.every((k) => s.solo.has(k));
      return { solo: same ? new Set() : new Set(keys) };
    }),
  reset: () => set({ hidden: new Set(), solo: new Set() }),
}));

export function isMeshVisible(view: Pick<ViewState, 'hidden' | 'solo'>, key: string): boolean {
  return view.solo.size > 0 ? view.solo.has(key) : !view.hidden.has(key);
}

export interface SceneOutputRow {
  key: string;
  nodeId: string;
  label: string;
}

/** 3Dビューに描画されているメッシュ(`sceneOutput`)を、トップレベルのノード順に一覧にする。
 * ラベルはノードの表示名(`nodeDisplayLabel()`)で、1つのノードが複数のメッシュを持つ場合だけ
 * 通し番号を添える。 */
export function listSceneOutputs(nodes: GraphNode[], results: EvaluatedGraph | null): SceneOutputRow[] {
  if (!results) return [];
  return nodes.flatMap((node) => {
    const keys = sceneMeshKeys(node.id, results.get(node.id));
    const base = nodeDisplayLabel(node.type, node.data);
    return keys.map((key, i) => ({
      key,
      nodeId: node.id,
      label: keys.length > 1 ? `${base} #${i}` : base,
    }));
  });
}
