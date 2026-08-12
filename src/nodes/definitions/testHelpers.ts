import { expect, vi } from 'vitest';
import { getNodeType } from '../registry';

/** ジェネレーターノードの evaluate() が、data の各フィールドを取り違えずに
 * build*Geometry(や createToonMaterial 等)へそのまま渡していることを検証する。
 *
 * これらのノード定義ファイルには専用のテストが無く、evaluateGraph が例外を投げずに
 * 動く(initialGraph.test.ts)ことでしか間接的にカバーされていなかった —
 * それは「クラッシュしないか」しか見ておらず、フィールド名の取り違え
 * (例: bagWidth と bagHeight の入れ替わり)は検出できない。testData の各値を
 * 区別できる値にしてこの関数へ渡せば、そうした取り違えを検出できる。 */
export function expectGeneratorForwardsData(
  targetModule: Record<string, unknown>,
  buildFnName: string,
  nodeType: string,
  testData: Record<string, unknown>,
) {
  const spy: ReturnType<typeof vi.fn> = vi.spyOn(targetModule as Record<string, (...args: unknown[]) => unknown>, buildFnName);
  try {
    getNodeType(nodeType).evaluate({}, testData);
    expect(spy).toHaveBeenCalledWith(testData);
  } finally {
    spy.mockRestore();
  }
}
