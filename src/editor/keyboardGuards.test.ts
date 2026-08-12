// @vitest-environment jsdom
//
// isEditableTextTarget は HTMLElement/HTMLInputElement など DOM グローバルに依存する。
// このリポジトリのテストは既定で DOM の無い 'node' 環境で動く(ブラウザ用テスト
// ランナーは持たない方針)ため、この1ファイルだけ上の pragma でコメントの通り
// jsdom 環境に切り替えている。他のテストファイルには影響しない。
import { describe, expect, it } from 'vitest';
import { isEditableTextTarget } from './keyboardGuards';

function el(html: string): Element {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstElementChild!;
}

describe('isEditableTextTarget', () => {
  it('null は false', () => {
    expect(isEditableTextTarget(null)).toBe(false);
  });

  it('HTMLElement ではない EventTarget(例: window)は false', () => {
    expect(isEditableTextTarget(window)).toBe(false);
  });

  it('textarea は true(ブラウザネイティブのテキスト編集Undoに譲る)', () => {
    expect(isEditableTextTarget(el('<textarea></textarea>'))).toBe(true);
  });

  it('input type="text" は true', () => {
    expect(isEditableTextTarget(el('<input type="text">'))).toBe(true);
  });

  it('input type="search" は true', () => {
    expect(isEditableTextTarget(el('<input type="search">'))).toBe(true);
  });

  it('input type="range" は false(ネイティブUndoを持たないためグラフのUndoを素通しする)', () => {
    expect(isEditableTextTarget(el('<input type="range">'))).toBe(false);
  });

  it('input type="color" は false', () => {
    expect(isEditableTextTarget(el('<input type="color">'))).toBe(false);
  });

  it('select は false', () => {
    expect(isEditableTextTarget(el('<select></select>'))).toBe(false);
  });

  it('input の type 未指定(既定の text)は true', () => {
    expect(isEditableTextTarget(el('<input>'))).toBe(true);
  });

  it('通常の div は false', () => {
    expect(isEditableTextTarget(el('<div></div>'))).toBe(false);
  });
});
