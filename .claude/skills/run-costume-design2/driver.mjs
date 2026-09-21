#!/usr/bin/env node
// costume-design2 をヘッドレス Chromium で起動・操作するドライバ。
// 依存(playwright-core)はこのスキルディレクトリ専用(`npm install` 済み、プロジェクト本体の
// package.json には追加しない)。Chromium 本体は ~/.cache/ms-playwright に別途必要(README参照)。
//
// 使い方: node driver.mjs
// dev サーバーが localhost:5173 で応答していなければこのスクリプトが `npm run dev` を起動し、
// 終了時に自分が起動した場合のみ停止する(既に起動していたサーバーは触らない)。
// スクリーンショットは ./screenshots/ に出力する。

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEV_URL, ensureDevServer, launchBrowser } from './lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = path.join(__dirname, 'screenshots');

mkdirSync(SHOT_DIR, { recursive: true });

async function main() {
  const devServer = await ensureDevServer();
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

    await page.goto(DEV_URL, { waitUntil: 'load' });
    await page.waitForSelector('.react-flow__node[data-id="skirtGroup"]', { timeout: 15000 });
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(1500); // 3Dシーンの初期描画を待つ

    await page.screenshot({ path: path.join(SHOT_DIR, '01_initial.png') });
    console.log('OK: 初期画面のスクリーンショットを撮影 (screenshots/01_initial.png)');

    // OrbitControls でカメラを操作 → frameloop="demand" でも再描画されることの確認
    const canvasBox = await page.locator('canvas').boundingBox();
    await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      canvasBox.x + canvasBox.width / 2 + 150,
      canvasBox.y + canvasBox.height / 2 - 60,
      { steps: 10 },
    );
    await page.mouse.up();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOT_DIR, '02_after_orbit.png') });
    console.log('OK: カメラ操作後のスクリーンショットを撮影 (screenshots/02_after_orbit.png)');

    // skirt の生パラメータ(`scale` の Value 入力欄)は skirtGroup の
    // internalNodes に埋め込まれているため、中に入ってから操作する(nodes/CLAUDE.md の「グループノード」節参照)。
    // 実ポインタでの click() ではなく、「中に入る」ボタンへ直接 click を実行する
    // ("Gotchas" の number/color input と同じ考え方) — グラフが育つと `computeAutoLayout()`
    // の出力(ノード数・全体の高さ)が変わって初期ズーム/パンも変わるため、この固定
    // ビューポート(1600x1000)では NodePalette パネル(左上の固定オーバーレイ)の下に
    // skirtGroup が重なることがあり、実ポインタクリックだと座標上は最前面のパネルへ吸われて
    // タイムアウトする。要素へ直接 dispatch すればこの重なりに影響されない。
    await page.locator('.react-flow__node[data-id="skirtGroup"] button[aria-label="グループの中に入る"]').evaluate((el) => el.click());
    await page.waitForSelector('.react-flow__node[data-id="scale"]', { timeout: 5000 });

    // `scale`(numberMultiply)の Value 入力欄(未接続の数値入力ソケットの欄)を高頻度 input で連続操作 → 間引き & ジオメトリ追従の確認
    const waistInput = page.locator('.react-flow__node[data-id="scale"] input[type="number"]');
    await waistInput.evaluate((el) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      for (const v of [0.32, 0.36, 0.4, 0.44, 0.48, 0.5]) {
        setter.call(el, String(v));
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(SHOT_DIR, '03_after_number_input.png') });
    console.log('OK: 数値入力欄の操作後のスクリーンショットを撮影 (screenshots/03_after_number_input.png)');

    // トップレベルへ戻り、skirtGroup カードの未接続の Color 入力欄(外部ソケット `color`)の色変更を確認する
    // (色は `color` から `material` へ配線される。`Group Input` 上では色のデフォルト値は編集できない)。
    await page.getByRole('button', { name: 'トップレベル' }).click();
    await page.waitForTimeout(200);
    await page.locator('.react-flow__node[data-id="skirtGroup"] input[type="color"]').evaluate((el) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, '#22cc55');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(SHOT_DIR, '04_after_color_change.png') });
    console.log('OK: 色変更後のスクリーンショットを撮影 (screenshots/04_after_color_change.png)');

    if (consoleErrors.length > 0) {
      console.error('NG: コンソールエラーを検出しました:');
      for (const e of consoleErrors) console.error('  - ' + e);
      process.exitCode = 1;
    } else {
      console.log('OK: コンソールエラーなし');
    }
  } finally {
    await browser.close();
    devServer.stop();
  }
}

main().catch((err) => {
  console.error('DRIVER_FAILED:', err);
  process.exit(1);
});
