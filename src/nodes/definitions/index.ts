// このディレクトリ配下(groups/・generic/ を含めて再帰的に、テストファイル/testHelpers/
// generatorNodeFactory/groupNodeFactory/このファイル自身を除く)の *.ts を副作用インポート
// としてすべて読み込む。各 definition は import されるだけで自身をノードタイプレジストリに
// 登録するため、新しいノードタイプを追加してもここへの追記は不要 — ファイルを置くだけで
// 自動的に登録される。
import.meta.glob(
  [
    './**/*.ts',
    '!./**/*.test.ts',
    '!./testHelpers.ts',
    '!./index.ts',
    '!./generatorNodeFactory.ts',
    '!./groupNodeFactory.ts',
  ],
  { eager: true },
);
