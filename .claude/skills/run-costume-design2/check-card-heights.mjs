#!/usr/bin/env node
// ノードカードの実機の高さと、`src/nodes/autoLayout.ts` の `estimateNodeHeight()` の見積もりを比べる。
// カードの見た目(CSS や `editor/nodeComponents/*.tsx`)を変えたら実行して、ずれを検知する。
//
// 使い方: node check-card-heights.mjs
// レジストリに登録された全ノードタイプを1つずつキャンバスに置いて測るので、新しいノードタイプは
// 追加するだけで自動的に対象になる。許容範囲(TOLERANCE_PX)を超えたずれがあれば非ゼロで終了する。
//
// dev サーバーは `/src/...` を ES モジュールとして配信するため、ページ内から動的 import で
// アプリと同じストア/レジストリを直接操作できる(アプリ側のコードに手を入れる必要は無い)。

import { ensureDevServer, launchBrowser, DEV_URL } from './lib.mjs';

const TOLERANCE_PX = 2;

async function main() {
  const devServer = await ensureDevServer();
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(DEV_URL, { waitUntil: 'load' });
    await page.waitForSelector('.react-flow__node', { timeout: 15000 });

    const rows = await page.evaluate(async () => {
      const { useGraphStore } = await import('/src/state/graphStore.ts');
      const { nodeTypeRegistry } = await import('/src/nodes/registry.ts');
      const { estimateNodeHeight } = await import('/src/nodes/autoLayout.ts');
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const socket = (i) => ({ id: `s${i}`, label: `S${i}`, type: 'number', default: 0 });

      // 1. 登録済みの全タイプを既定の状態で置く。
      const nodes = [...nodeTypeRegistry.keys()].map((type, i) => ({
        id: `all:${type}`,
        type,
        position: { x: (i % 8) * 420, y: Math.floor(i / 8) * 400 },
        data: nodeTypeRegistry.get(type).createDefaultData(),
        label: type,
      }));
      // 2. 状態によって高さが変わりうるケースを追加する(ソケット数、配線の有無)。
      const extraY = (Math.floor(nodes.length / 8) + 1) * 400;
      const extras = [
        ['groupInput', { sockets: [] }, 'groupInput(ソケット0個)'],
        ['groupInput', { sockets: [socket(1)] }, 'groupInput(ソケット1個)'],
        ['groupInput', { sockets: [socket(1), socket(2), socket(3)] }, 'groupInput(ソケット3個)'],
        ['groupOutput', { sockets: [] }, 'groupOutput(ソケット0個)'],
        ['groupOutput', { sockets: [socket(1), socket(2)] }, 'groupOutput(ソケット2個)'],
        ['numberMultiply', {}, 'numberMultiply(未配線)'],
        ['numberMultiply', {}, 'numberMultiply(配線済み)'],
        ['mergeGeometry', {}, 'mergeGeometry(4本)'],
      ].map(([type, data, label], i) => ({ id: `extra:${i}`, type, data, label, position: { x: i * 420, y: extraY } }));
      const wired = extras.find((n) => n.label === 'numberMultiply(配線済み)');
      const source = { id: 'extra:source', type: 'numberInput', data: { value: 2 }, label: 'numberInput(配線元)', position: { x: 0, y: extraY + 400 } };
      // 複数接続できる入力ソケットは接続本数で高さが変わる。geometry の出力を持つ mergeGeometry を配線元にする。
      const merged = extras.find((n) => n.label === 'mergeGeometry(4本)');
      const geometrySources = [0, 1, 2, 3].map((i) => ({
        id: `extra:geometry-source:${i}`,
        type: 'mergeGeometry',
        data: {},
        label: `mergeGeometry(配線元${i})`,
        position: { x: 420 + i * 420, y: extraY + 400 },
      }));
      const all = [...nodes, ...extras, source, ...geometrySources];
      const edges = [
        ...['value', 'factor'].map((handle) => ({
          id: `wire:${handle}`,
          source: source.id,
          sourceHandle: 'value',
          target: wired.id,
          targetHandle: handle,
        })),
        ...geometrySources.map((g) => ({
          id: `wire:${g.id}`,
          source: g.id,
          sourceHandle: 'geometry',
          target: merged.id,
          targetHandle: 'geometries',
        })),
      ];
      // computeAutoLayout() と同じく、ノードごとの入力ソケット別の接続本数を見積もりに渡す。
      const inputCounts = (nodeId) => {
        const counts = new Map();
        for (const e of edges) if (e.target === nodeId) counts.set(e.targetHandle, (counts.get(e.targetHandle) ?? 0) + 1);
        return counts;
      };

      useGraphStore.getState().loadGraph(
        all.map(({ label: _label, ...n }) => n),
        edges,
      );
      await sleep(2000);
      return all.map((n) => {
        const el = document.querySelector(`.react-flow__node[data-id="${n.id}"] .rf-node`);
        return { label: n.label, measured: el ? el.offsetHeight : null, estimated: estimateNodeHeight(n.type, n.data, inputCounts(n.id)) };
      });
    });

    const bad = rows.filter((r) => r.measured === null || Math.abs(r.measured - r.estimated) > TOLERANCE_PX);
    console.log(`測定: ${rows.length} 件(許容 ±${TOLERANCE_PX}px)`);
    if (bad.length === 0) {
      console.log('OK: すべて見積もりと一致しました');
      return;
    }
    console.error(`NG: ${bad.length} 件がずれています(実測 - 見積もり):`);
    for (const r of bad) {
      const diff = r.measured === null ? '未描画' : String(r.measured - r.estimated);
      console.error(`  ${r.label.padEnd(34)} 実測=${String(r.measured).padStart(4)} 見積=${String(r.estimated).padStart(4)} 差=${diff}`);
    }
    console.error('→ `src/nodes/autoLayout.ts` の高さ定数を、実測に合わせて直してください。');
    process.exitCode = 1;
  } finally {
    await browser.close();
    devServer.stop();
  }
}

main().catch((err) => {
  console.error('CHECK_FAILED:', err);
  process.exit(1);
});
