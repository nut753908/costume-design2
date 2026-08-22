// このディレクトリの *.ts (テストファイル/testHelpers/generatorNodeFactory/groupNodeFactory/
// このファイル自身を除く)を副作用インポートとしてすべて読み込む。各 definition は import
// されるだけで自身をノードタイプレジストリに登録するため、新しいノードタイプを追加しても
// ここへの追記は不要 — ファイルを置くだけで自動的に登録される。
import.meta.glob(
  [
    './*.ts',
    '!./*.test.ts',
    '!./testHelpers.ts',
    '!./index.ts',
    '!./generatorNodeFactory.ts',
    '!./groupNodeFactory.ts',
  ],
  { eager: true },
);
