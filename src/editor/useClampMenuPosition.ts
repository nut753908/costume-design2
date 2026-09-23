import { useLayoutEffect, useState, type RefObject } from 'react';

const BOUNDS_MARGIN = 8;

export interface MenuPosition {
  x: number;
  y: number;
}

/** メニューをクリック座標にそのまま置くと、ノードエディタの枠(`boundsRef`、通常は
 * `NodeEditor.tsx` の外側ラッパー)の端に近い位置で開いた場合に、メニュー自身の描画範囲が
 * その枠からはみ出す(`.context-menu` の `max-height` は自身の高さを制限するだけで、
 * クリック座標を起点にした `left`/`top` 自体は補正しない)。下端は枠がビューポート下端と
 * 一致するため `body { overflow: hidden }`(`index.css`)で見えなくなり、右端は枠の外側
 * (隣の3Dプレビュー側)へはみ出して重なる。開いた直後に実際の描画サイズを測って
 * `boundsRef` の矩形内に収まる位置を返す(`PaneContextMenu`/`SelectionContextMenu` で共有)。
 *
 * `raw` が変わった(メニューが新しく開いた)ことをレンダー中に検知したら `clamped` を
 * 同期的に `raw` へ戻す(React 公式の「レンダー中に state を補正する」パターン — この
 * コンポーネント自身は `state` が null/非null で行き来してもアンマウントされないため
 * `useState` の初期値は最初の1回しか効かず、`useLayoutEffect` の中で `setClamped(raw)` する
 * だけだと、その回の描画では `clamped` がまだ古い値のままでメニュー自体が描画されず
 * `menuRef.current` が存在しない、という1コマ分のズレが起きる)。この補正で確定した
 * `raw` の位置が実際に DOM へコミットされた後、依存配列を付けない `useLayoutEffect`
 * (＝毎コミット後に実行される)で実際の描画サイズを測り、`boundsRef` の矩形をはみ出す分
 * だけ内側へ補正する。依存配列に `clamped` 自身を含めているため、この `setClamped` が
 * effect を再度走らせるが、補正後は測定結果が矩形内に収まるため2回目以降は無処理になり
 * 無限ループしない(収束する不動点)。ペイントより前に同期的に差し替わるので、はみ出た
 * 状態が一瞬でも見えることは無い。 */
export function useClampMenuPosition(
  menuRef: RefObject<HTMLElement | null>,
  boundsRef: RefObject<HTMLElement | null>,
  raw: MenuPosition | null,
): MenuPosition | null {
  const [prevRaw, setPrevRaw] = useState(raw);
  const [clamped, setClamped] = useState(raw);

  if (raw !== prevRaw) {
    setPrevRaw(raw);
    setClamped(raw);
  }

  useLayoutEffect(() => {
    const el = menuRef.current;
    const bounds = boundsRef.current;
    if (!raw || !el || !bounds) return;

    const rect = el.getBoundingClientRect();
    const boundsRect = bounds.getBoundingClientRect();
    const overflowX = rect.right - (boundsRect.right - BOUNDS_MARGIN);
    const overflowY = rect.bottom - (boundsRect.bottom - BOUNDS_MARGIN);
    if (overflowX <= 0 && overflowY <= 0) return;
    setClamped({
      x: overflowX > 0 ? Math.max(boundsRect.left + BOUNDS_MARGIN, raw.x - overflowX) : raw.x,
      y: overflowY > 0 ? Math.max(boundsRect.top + BOUNDS_MARGIN, raw.y - overflowY) : raw.y,
    });
  }, [raw, clamped, menuRef, boundsRef]);

  return clamped;
}
