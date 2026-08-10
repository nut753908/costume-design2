# React + TypeScript + Vite

このテンプレートは、HMR といくつかの Oxlint ルールを備えた、Vite で React を動かすための最小構成を提供します。

現在、2つの公式プラグインが利用可能です。

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) は [Oxc](https://oxc.rs) を使用
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) は [SWC](https://swc.rs/) を使用

## React Compiler

このテンプレートでは、開発/ビルドのパフォーマンスへの影響を考慮して React Compiler は有効化されていません。有効化する場合は[このドキュメント](https://react.dev/learn/react-compiler/installation)を参照してください。

## Oxlint 設定の拡張

プロダクションアプリケーションを開発している場合は、`oxlint-tsgolint` をインストールし `.oxlintrc.json` を編集して、型を考慮した(type-aware)lint ルールを有効化することを推奨します。

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

ルールとカテゴリの全一覧は [Oxlint のルールドキュメント](https://oxc.rs/docs/guide/usage/linter/rules)を参照してください。
