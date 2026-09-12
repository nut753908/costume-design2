#!/usr/bin/env node
// costume-design2 をヘッドレス Chromium で起動・操作するドライバ。
// 依存(playwright-core)はこのスキルディレクトリ専用(`npm install` 済み、プロジェクト本体の
// package.json には追加しない)。Chromium 本体は ~/.cache/ms-playwright に別途必要(README参照)。
//
// 使い方: node driver.mjs
// dev サーバーが localhost:5173 で応答していなければこのスクリプトが `npm run dev` を起動し、
// 終了時に自分が起動した場合のみ停止する(既に起動していたサーバーは触らない)。
// スクリーンショットは ./screenshots/ に出力する。

import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const SHOT_DIR = path.join(__dirname, 'screenshots');
const DEV_URL = 'http://localhost:5173';
const EXEC_PATH = path.join(process.env.HOME, '.cache/ms-playwright/chromium-1234/chrome-linux64/chrome');

mkdirSync(SHOT_DIR, { recursive: true });

async function isServerUp() {
  try {
    const res = await fetch(DEV_URL);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerUp()) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  let devServer = null;
  const alreadyUp = await isServerUp();
  if (!alreadyUp) {
    console.log('dev server が起動していないので `npm run dev` を起動します...');
    devServer = spawn('npm', ['run', 'dev'], { cwd: PROJECT_ROOT, stdio: 'ignore', detached: true });
    const up = await waitForServer(30000);
    if (!up) throw new Error('dev server が30秒以内に応答しませんでした');
  } else {
    console.log('既存の dev server (localhost:5173) を使用します');
  }

  if (!existsSync(EXEC_PATH)) {
    throw new Error(
      `Chromium 実行ファイルが見つかりません: ${EXEC_PATH}\n` +
        `未取得の場合は次で取得してください: npx playwright-core install chromium`,
    );
  }

  const browser = await chromium.launch({
    executablePath: EXEC_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

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

    // skirt の生パラメータ(waistRadiusIn/colorIn)は skirtGroup の internalNodes に
    // 埋め込まれているため、中に入ってから操作する(nodes/CLAUDE.md の「グループノード」節参照)。
    await page.locator('.react-flow__node[data-id="skirtGroup"] .rf-node').dblclick();
    await page.waitForSelector('.react-flow__node[data-id="waistRadiusIn"]', { timeout: 5000 });

    // numberInput ノード(waistRadiusIn)を高頻度 input で連続操作 → 間引き & ジオメトリ追従の確認
    const waistInput = page.locator('.react-flow__node[data-id="waistRadiusIn"] input[type="range"]');
    await waistInput.evaluate((el) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      for (const v of [0.32, 0.36, 0.4, 0.44, 0.48, 0.5]) {
        setter.call(el, String(v));
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(SHOT_DIR, '03_after_slider_drag.png') });
    console.log('OK: スライダー操作後のスクリーンショットを撮影 (screenshots/03_after_slider_drag.png)');

    // colorInput ノード(colorIn)の色変更確認(同じく skirtGroup の中)
    await page.locator('.react-flow__node[data-id="colorIn"] input[type="color"]').evaluate((el) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, '#22cc55');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(200);

    // トップレベルへ戻ってから最終スクリーンショットを撮る(3Dシーンはスコープに関わらず
    // rootEvaluatedResults を見るため、中にいる間の変更もすでに反映されている)。
    await page.getByRole('button', { name: 'トップレベル' }).click();
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
    if (devServer) {
      console.log('このスクリプトが起動した dev server を停止します');
      process.kill(-devServer.pid, 'SIGTERM');
    }
  }
}

main().catch((err) => {
  console.error('DRIVER_FAILED:', err);
  process.exit(1);
});
