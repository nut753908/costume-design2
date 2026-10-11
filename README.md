# costume-design2

> **開発を中止しました。** このリポジトリは今後更新されません。コードは MIT ライセンスのもとで自由に利用できます。

ノードグラフ(Blender の Geometry Nodes 風)で3Dコスチュームをデザインする Web アプリ。フォトリアルな3Dではなく、フラットなトゥーンシェーディングのイラスト調でレンダリングします。ボディも全ガーメント(衣装)も外部の3Dモデルを読み込まず、すべてコード上で手続き的に生成します。

スタック: React + react-three-fiber (Three.js) + React Flow (`@xyflow/react`)、状態管理は zustand。バックエンドは無く、完全にクライアントサイドで動作し、グラフの状態は localStorage に永続化されます。

デモ: https://nut753908.github.io/costume-design2/

## セットアップと実行

```bash
npm install
npm run dev
```

その他のコマンド(ビルド・テスト・lint など)は `package.json` の `scripts` を参照してください。

## アーキテクチャ

設計意図・各モジュールの詳細・既知の落とし穴は [`CLAUDE.md`](./CLAUDE.md) にまとまっています(`src/*/CLAUDE.md` にモジュールごとの詳細もあります)。このプロジェクトで作業する際はまずそちらを参照してください。
