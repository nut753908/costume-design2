import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// vitest/config の defineConfig は Vite の設定型に test フィールドを追加しただけの上位互換
// なので、vite build/vite dev には一切影響しない。
export default defineConfig({
  // GitHub Pages のサブパス(https://<user>.github.io/costume-design2/)で配信するため。
  base: '/costume-design2/',
  plugins: [react()],
  test: {
    // evaluateGraph.ts のノード単位メモ化キャッシュ(nodes/CLAUDE.md 参照)をテストごとに
    // リセットする(src/testSetup.ts 参照)。
    setupFiles: ['./src/testSetup.ts'],
  },
})
