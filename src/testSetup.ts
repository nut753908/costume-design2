import { beforeEach } from 'vitest';
import { resetNodeEvalCacheForTests } from './nodes/evaluateGraph';

// evaluateGraph.ts のノード単位メモ化キャッシュ(nodes/CLAUDE.md 参照)はモジュールレベルで
// 永続するため、同じ node.data 参照(多くはノード型定義ファイル内のモジュール定数)を
// 複数の it() ブロックにまたがって評価するテストでは、前のテストの結果がキャッシュヒットと
// して紛れ込みうる(spy の呼び出し回数を検証するテストで実際に顕在化した)。全テストの前に
// キャッシュを空にし、テストどうしを独立させる。
beforeEach(() => {
  resetNodeEvalCacheForTests();
});
