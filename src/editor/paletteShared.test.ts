// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_COLLAPSED_SECTIONS, loadCollapsedSections, saveCollapsedSections } from './paletteShared';

afterEach(() => {
  localStorage.clear();
});

describe('パレットの折りたたみ状態', () => {
  it('保存が無ければ既定の見出しだけが折りたたまれている', () => {
    expect([...loadCollapsedSections()].sort()).toEqual([...DEFAULT_COLLAPSED_SECTIONS].sort());
  });

  it('保存した状態を読み戻せる(全て開いた状態も保存できる)', () => {
    saveCollapsedSections(new Set(['math', 'garment']));
    expect([...loadCollapsedSections()].sort()).toEqual(['garment', 'math']);
    saveCollapsedSections(new Set());
    expect(loadCollapsedSections().size).toBe(0);
  });

  it('保存内容が壊れていれば既定値にフォールバックする', () => {
    localStorage.setItem('costume-design-palette-collapsed', '{not json');
    expect([...loadCollapsedSections()].sort()).toEqual([...DEFAULT_COLLAPSED_SECTIONS].sort());
    localStorage.setItem('costume-design-palette-collapsed', '{"a":1}');
    expect([...loadCollapsedSections()].sort()).toEqual([...DEFAULT_COLLAPSED_SECTIONS].sort());
  });
});
