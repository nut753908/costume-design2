import { describe, expect, it } from 'vitest';
import '../nodes/definitions';
import { getNodeType } from '../nodes/registry';
import { resolveNodeSockets } from '../nodes/resolveNodeSockets';
import { evaluateGraph } from '../nodes/evaluateGraph';
import { initialEdges, initialNodes } from './initialGraph';

// initialGraph.ts の initialNodes/initialEdges は、ノードID・ソケットIDを文字列リテラルで
// 何百箇所も手で組み上げた巨大なデータであり、型システムでは「そのノードタイプに実在する
// ソケットか」「参照先ノードが実在するか」までは検証できない。ガーメントを追加/配線し直す
// たびにタイポで壊れていないかをこのテストで自動検知する。

describe('initialNodes/initialEdges(デフォルトグラフ)の整合性', () => {
  const nodesById = new Map(initialNodes.map((n) => [n.id, n]));

  it('bodyGroup、bodyLayout が存在する', () => {
    // これらのノードのいずれかが無くなっても evaluateGraph は例外を投げない(単に該当
    // ソケットが未接続扱いになるだけ)ため、下記の整合性テスト群では検知できない。無くなると
    // Body/各ガーメントが静かにデフォルト寸法・原点付近の位置にフォールバックしてしまうため、
    // id の存在自体をここで保証する。肌色は bodyGroup の外部ソケット `color` の既定値として
    // 持つため、ここには現れない(bodyGroupNode.test.ts 参照)。
    expect(['bodyLayout', 'bodyGroup'].every((id) => nodesById.has(id))).toBe(true);
  });

  it('bodyLayout が計算済みの配置Y座標を bodyGroup へ配線している(寸法は bodyGroup 内部の固定値)', () => {
    const layoutSockets = ['legCenterY', 'waistY', 'headCenterY', 'armCenterY'];
    for (const socket of layoutSockets) {
      const edge = initialEdges.find((e) => e.target === 'bodyGroup' && e.targetHandle === socket);
      expect(edge?.source).toBe('bodyLayout');
      expect(edge?.sourceHandle).toBe(socket);
    }
  });

  it('ノードidに重複が無い', () => {
    const counts = new Map<string, number>();
    for (const n of initialNodes) counts.set(n.id, (counts.get(n.id) ?? 0) + 1);
    const duplicates = [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id);
    expect(duplicates).toEqual([]);
  });

  it('エッジidに重複が無い', () => {
    const counts = new Map<string, number>();
    for (const e of initialEdges) counts.set(e.id, (counts.get(e.id) ?? 0) + 1);
    const duplicates = [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id);
    expect(duplicates).toEqual([]);
  });

  it('すべてのエッジが実在するノードを参照している', () => {
    const missing = initialEdges
      .flatMap((e) => [
        !nodesById.has(e.source) ? `${e.id}: missing source '${e.source}'` : null,
        !nodesById.has(e.target) ? `${e.id}: missing target '${e.target}'` : null,
      ])
      .filter((m): m is string => m !== null);
    expect(missing).toEqual([]);
  });

  it('すべてのエッジのソケットidが、接続先ノードタイプの入出力ソケットと一致する', () => {
    const problems: string[] = [];
    for (const e of initialEdges) {
      const source = nodesById.get(e.source);
      const target = nodesById.get(e.target);
      if (source?.type) {
        const outputs = resolveNodeSockets(source.type, source.data).outputs;
        if (!outputs.some((s) => s.id === e.sourceHandle)) {
          problems.push(`${e.id}: ${source.type} has no output '${e.sourceHandle}'`);
        }
      }
      if (target?.type) {
        const inputs = resolveNodeSockets(target.type, target.data).inputs;
        if (!inputs.some((s) => s.id === e.targetHandle)) {
          problems.push(`${e.id}: ${target.type} has no input '${e.targetHandle}'`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('すべてのノードのtypeが登録済みのノードタイプである', () => {
    const unknown = initialNodes.filter((n) => !n.type || !isRegistered(n.type)).map((n) => n.id);
    expect(unknown).toEqual([]);
  });

  it('evaluateGraph が例外を投げずに評価できる(循環や未知タイプが無い)', () => {
    const graphNodes = initialNodes.map((n) => ({ id: n.id, type: n.type ?? '', data: n.data }));
    const graphEdges = initialEdges.map((e) => ({
      source: e.source,
      sourceHandle: e.sourceHandle,
      target: e.target,
      targetHandle: e.targetHandle,
    }));
    expect(() => evaluateGraph(graphNodes, graphEdges)).not.toThrow();
  });
});

// evaluateGraph.ts のノード単位メモ化キャッシュ(nodes/CLAUDE.md の「ノードグラフエンジン」節
// 参照)が、実際のデフォルトグラフの上でも意図どおりに
// 効くことを検証する — 合成テストの小さなグラフ(evaluateGraph.test.ts)だけでなく、実際に
// 「1つの値を動かすと無関係なグループは再評価されない」が成立していることの
// 回帰テスト。
describe('initialNodes/initialEdges でのノード単位メモ化', () => {
  // evaluateGraph() が要求する GraphNode[]/GraphEdge[] へ変換する(上の「evaluateGraph が
  // 例外を投げずに評価できる」テストと同じ変換)。
  const graphNodes = initialNodes.map((n) => ({ id: n.id, type: n.type ?? '', data: n.data }));
  const graphEdges = initialEdges.map((e) => ({
    source: e.source,
    sourceHandle: e.sourceHandle,
    target: e.target,
    targetHandle: e.targetHandle,
  }));

  it('無関係なトップレベルノード(bodyGroup)の data だけを差し替えても、bodyLayout の結果は同じ参照のまま再利用される', () => {
    const before = evaluateGraph(graphNodes, graphEdges);
    const changedNodes = graphNodes.map((n) =>
      n.id === 'bodyGroup' ? { ...n, data: { ...n.data, memo: 'changed' } } : n,
    );
    const after = evaluateGraph(changedNodes, graphEdges);

    expect(after.get('bodyLayout')).toBe(before.get('bodyLayout'));
  });

  it('bodyLayout の feetY を変えると、依存する bodyGroup は再評価されて結果が変わる', () => {
    const before = evaluateGraph(graphNodes, graphEdges);
    const changedNodes = graphNodes.map((n) => (n.id === 'bodyLayout' ? { ...n, data: { ...n.data, feetY: 0.3 } } : n));
    const after = evaluateGraph(changedNodes, graphEdges);

    expect(after.get('bodyGroup')?.sceneOutputGeometry0).not.toBe(before.get('bodyGroup')?.sceneOutputGeometry0);
  });
});

function isRegistered(type: string): boolean {
  try {
    getNodeType(type);
    return true;
  } catch {
    return false;
  }
}
