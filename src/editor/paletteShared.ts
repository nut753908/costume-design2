import type { PaletteSection } from '../nodes/types';

/** ノードパレットの見出しの表示名。 */
export const SECTION_LABELS: Record<PaletteSection, string> = {
  input: 'Inputs',
  math: 'Math',
  primitive: 'Primitives',
  'geometry-op': 'Geometry Ops',
  curve: 'Curves',
  garment: 'Garments & Body',
  'group-part': 'Group Parts',
  group: 'Group',
  material: 'Materials',
  output: 'Outputs',
};

/** パレットからキャンバスへのドラッグ&ドロップで、ノードタイプを運ぶための dataTransfer MIME タイプ。 */
export const NODE_TYPE_DND_MIME = 'application/costume-design-node-type';

/** `fitView()`/`fitViewOptions` に渡す共通の padding。`NodePalette`(幅は実測200px前後)は画面座標に
 * 固定表示されるため、割合だけのパディングだと、`computeAutoLayout()` が列0(キャンバス左端)に置く
 * 入次数0のノード(`groupInput` など)がパレットの下に隠れる。左側だけ固定px、他3辺は割合にする。
 * 呼び出しのたびに新しいオブジェクトを返す。 */
export function fitViewPadding(): { left: `${number}px`; top: number; right: number; bottom: number } {
  return { left: '260px', top: 0.2, right: 0.2, bottom: 0.2 };
}

/** パレットの見出しの折りたたみ状態を保存する localStorage のキー(表示の好みだけを持つ、閲覧者ごとの設定)。 */
const COLLAPSED_STORAGE_KEY = 'costume-design-palette-collapsed';

/** 保存された設定が無いときに、最初から折りたたんでおく見出し(数が多く、日常的には使わないもの)。 */
export const DEFAULT_COLLAPSED_SECTIONS: readonly PaletteSection[] = ['geometry-op', 'curve', 'group-part'];

/** 折りたたんでいる見出しを読み込む。保存が無い・壊れている・localStorage が使えないときは既定値。 */
export function loadCollapsedSections(): Set<PaletteSection> {
  try {
    const raw = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'string')) return new Set(parsed as PaletteSection[]);
    }
  } catch {
    // localStorage が使えない/壊れているときは既定値にフォールバックする
  }
  return new Set(DEFAULT_COLLAPSED_SECTIONS);
}

export function saveCollapsedSections(collapsed: ReadonlySet<PaletteSection>): void {
  try {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify([...collapsed]));
  } catch {
    // 保存できなくても、その回の表示には影響しない
  }
}
