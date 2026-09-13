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

  it('useBodyScale.ts/useBodySkinColor.ts が id (BODY_NODE_ID) で読み取る body ノード、およびそこへ配線する4つのシードノードが存在する', () => {
    // body ノード自体、またはこれら4つのシードノードのいずれかが無くなっても evaluateGraph
    // は例外を投げない(単に該当ソケットが未接続扱いになるだけ)ため、上記の整合性テスト群
    // では検知できない。無くなると useBodyScale.ts/useBodySkinColor.ts が静かに
    // DEFAULT_BODY_SCALE/DEFAULT_BODY_SKIN_COLOR にフォールバックしてしまうため、id の存在
    // 自体をここで保証する。
    expect(
      ['bodyHeight', 'bodyBuild', 'bodyShoulder', 'bodySkinColor', 'body'].every((id) => nodesById.has(id)),
    ).toBe(true);
  });

  it('bodyHeight/bodyBuild/bodyShoulder/bodySkinColor が body ノードへ配線されている', () => {
    const cases: [string, string, string][] = [
      ['bodyHeight', 'value', 'height'],
      ['bodyBuild', 'value', 'build'],
      ['bodyShoulder', 'value', 'shoulder'],
      ['bodySkinColor', 'color', 'skinColor'],
    ];
    for (const [source, sourceHandle, targetHandle] of cases) {
      const edge = initialEdges.find((e) => e.target === 'body' && e.targetHandle === targetHandle);
      expect(edge?.source).toBe(source);
      expect(edge?.sourceHandle).toBe(sourceHandle);
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

  // sleeve/shoes/socks は、複数ガーメントで共有される値をトップレベルの共有ノードから
  // 再引きしている(ルート CLAUDE.md の「ボディスケールはソケットグラフを迂回して直接
  // 読み取られる」節参照)。これらのエッジが将来の再改修で静かに外れないよう、
  // 接続関係をピンポイントで検証する。
  it('topGroup.material と sleeveGroup.material がどちらも共有ノード topMaterial に接続されている', () => {
    for (const target of ['topGroup', 'sleeveGroup']) {
      const edge = initialEdges.find((e) => e.target === target && e.targetHandle === 'material');
      expect(edge?.source).toBe('topMaterial');
      expect(edge?.sourceHandle).toBe('material');
    }
  });

  it('topGroup.torsoRadius と sleeveGroup.attachRadius がどちらも共有ノード topRadiusScale に接続されている', () => {
    const topEdge = initialEdges.find((e) => e.target === 'topGroup' && e.targetHandle === 'torsoRadius');
    expect(topEdge?.source).toBe('topRadiusScale');
    expect(topEdge?.sourceHandle).toBe('value');

    const sleeveEdge = initialEdges.find((e) => e.target === 'sleeveGroup' && e.targetHandle === 'attachRadius');
    expect(sleeveEdge?.source).toBe('topRadiusScale');
    expect(sleeveEdge?.sourceHandle).toBe('value');
  });

  it('shoesGroup/socksGroup.legSpacing が pantsLegSpacing に接続されている', () => {
    for (const [target, targetHandle] of [
      ['shoesGroup', 'legSpacing'],
      ['socksGroup', 'legSpacing'],
    ]) {
      const edge = initialEdges.find((e) => e.target === target && e.targetHandle === targetHandle);
      expect(edge?.source).toBe('pantsLegSpacing');
      expect(edge?.sourceHandle).toBe('value');
    }
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
