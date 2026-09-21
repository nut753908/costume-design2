// driver.mjs / check-card-heights.mjs が共有する、dev サーバーとヘッドレス Chromium の起動処理。
// 依存(playwright-core)はこのスキルディレクトリ専用(`npm install` 済み)。

import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(__dirname, '../../..');
export const DEV_URL = 'http://localhost:5173';
const EXEC_PATH = path.join(process.env.HOME, '.cache/ms-playwright/chromium-1234/chrome-linux64/chrome');

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

/** localhost:5173 が応答していなければ `npm run dev` を起動する。`stop()` は、この関数が起動した
 * サーバーだけを止める(既に起動していたサーバーは触らない)。 */
export async function ensureDevServer() {
  if (await isServerUp()) {
    console.log('既存の dev server (localhost:5173) を使用します');
    return { stop() {} };
  }
  console.log('dev server が起動していないので `npm run dev` を起動します...');
  const child = spawn('npm', ['run', 'dev'], { cwd: PROJECT_ROOT, stdio: 'ignore', detached: true });
  if (!(await waitForServer(30000))) throw new Error('dev server が30秒以内に応答しませんでした');
  return {
    stop() {
      console.log('このスクリプトが起動した dev server を停止します');
      process.kill(-child.pid, 'SIGTERM');
    },
  };
}

export async function launchBrowser() {
  if (!existsSync(EXEC_PATH)) {
    throw new Error(
      `Chromium 実行ファイルが見つかりません: ${EXEC_PATH}\n` +
        `未取得の場合は次で取得してください: npx playwright-core install chromium`,
    );
  }
  return chromium.launch({ executablePath: EXEC_PATH, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
}
