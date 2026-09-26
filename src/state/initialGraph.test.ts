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

  it('bodyGroup、bodyDimensions/bodyLayout、およびそこへ配線するシードノードが存在する', () => {
    // これらのノードのいずれかが無くなっても evaluateGraph は例外を投げない(単に該当
    // ソケットが未接続扱いになるだけ)ため、下記の整合性テスト群では検知できない。無くなると
    // Body/各ガーメントが静かにデフォルト寸法・原点付近の位置にフォールバックしてしまうため、
    // id の存在自体をここで保証する。肌色は bodyGroup の外部ソケット `color` の既定値として
    // 持つため、ここには現れない(bodyGroupNode.test.ts 参照)。Body Height/
    // Body Shoulder は bodyDimensions からしか参照されない単独パラメータのため、この階層には
    // 現れず bodyDimensionsGroup 内部の numberInput として持つ(bodyDimensionsGroupNode.test.ts
    // 参照)。
    expect(['bodyBuild', 'bodyDimensions', 'bodyLayout', 'bodyGroup'].every((id) => nodesById.has(id))).toBe(true);
  });

  it('bodyBuild が bodyDimensions へ配線されている', () => {
    const edge = initialEdges.find((e) => e.target === 'bodyDimensions' && e.targetHandle === 'buildScale');
    expect(edge?.source).toBe('bodyBuild');
    expect(edge?.sourceHandle).toBe('value');
  });

  it('bodyDimensions/bodyLayout が計算済みの値を bodyGroup へ配線している(bodyGroup 自身は寸法を計算しない)', () => {
    const dimsSockets = ['legHeight', 'legRadius', 'legSpacing', 'torsoLength', 'torsoRadius', 'headRadius', 'armLength', 'armRadius', 'shoulderSpacing'];
    for (const socket of dimsSockets) {
      const edge = initialEdges.find((e) => e.target === 'bodyGroup' && e.targetHandle === socket);
      expect(edge?.source).toBe('bodyDimensions');
      expect(edge?.sourceHandle).toBe(socket);
    }
    const layoutSockets = ['legCenterY', 'torsoCenterY', 'headCenterY', 'armCenterY'];
    for (const socket of layoutSockets) {
      const edge = initialEdges.find((e) => e.target === 'bodyGroup' && e.targetHandle === socket);
      expect(edge?.source).toBe('bodyLayout');
      expect(edge?.sourceHandle).toBe(socket);
    }
  });

  // どのアンカーを使うかは bodyLayout のどの出力を anchorY へ配線するかというグラフ上の
  // 配線そのものが仕様(garmentPlacement.ts のコメント参照)。各ガーメントが正しい
  // アンカー候補に繋がっているかをピンポイントで検証する。
  it('各ガーメントの anchorY が bodyLayout の正しいアンカー候補に接続されている', () => {
    const expected: [string, string][] = [
      ['skirtGroup', 'waistY'],
      ['pantsGroup', 'waistY'],
      ['beltGroup', 'waistY'],
      ['dressGroup', 'shoulderY'],
      ['necktieGroup', 'shoulderY'],
      ['bagGroup', 'shoulderY'],
      ['jacketGroup', 'shoulderY'],
      ['topGroup', 'shoulderY'],
      ['scarfGroup', 'shoulderY'],
      ['socksGroup', 'feetY'],
      ['shoesGroup', 'feetY'],
      ['glovesGroup', 'wristY'],
      ['hatGroup', 'headCenterY'],
      ['glassesGroup', 'headCenterY'],
    ];
    for (const [target, sourceHandle] of expected) {
      const edge = initialEdges.find((e) => e.target === target && e.targetHandle === 'anchorY');
      expect(edge?.source).toBe('bodyLayout');
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

  // pants/shoes/socks の脚の間隔が bodyGroup の脚と食い違うと、Body Build を変えたときに体だけ
  // 脚が広がる。このエッジが静かに外れないよう、接続関係をピンポイントで検証する。
  it('glovesGroup.armSpacing が bodyGroup の腕と同じ bodyDimensions.shoulderSpacing に接続されている', () => {
    const edge = initialEdges.find((e) => e.target === 'glovesGroup' && e.targetHandle === 'armSpacing');
    expect(edge?.source).toBe('bodyDimensions');
    expect(edge?.sourceHandle).toBe('shoulderSpacing');
  });

  // ガーメントの「体に触れる半径」は体の半径(胴体/脚/腕)に倍率を掛けて求めるため、配線が外れると
  // 体型を変えても服だけ元の大きさのまま残る。
  it.each([
    ['skirtGroup', 'torsoRadius'],
    ['beltGroup', 'torsoRadius'],
    ['dressGroup', 'torsoRadius'],
    ['topGroup', 'torsoRadius'],
    ['topGroup', 'armRadius'],
    ['jacketGroup', 'torsoRadius'],
    ['scarfGroup', 'torsoRadius'],
    ['necktieGroup', 'torsoRadius'],
    ['bagGroup', 'torsoRadius'],
    ['pantsGroup', 'torsoRadius'],
    ['pantsGroup', 'legRadius'],
    ['shoesGroup', 'legRadius'],
    ['socksGroup', 'legRadius'],
    ['glovesGroup', 'armRadius'],
  ])('%s.%s が bodyDimensions の同名の出力に接続されている', (target, handle) => {
    const edge = initialEdges.find((e) => e.target === target && e.targetHandle === handle);
    expect(edge?.source).toBe('bodyDimensions');
    expect(edge?.sourceHandle).toBe(handle);
  });

  it('hatGroup/glassesGroup.headRadius が bodyGroup の頭と同じ bodyDimensions.headRadius に接続されている', () => {
    for (const target of ['hatGroup', 'glassesGroup']) {
      const edge = initialEdges.find((e) => e.target === target && e.targetHandle === 'headRadius');
      expect(edge?.source).toBe('bodyDimensions');
      expect(edge?.sourceHandle).toBe('headRadius');
    }
  });

  it('pantsGroup/shoesGroup/socksGroup.legSpacing が bodyGroup と同じ bodyDimensions.legSpacing に接続されている', () => {
    for (const target of ['pantsGroup', 'shoesGroup', 'socksGroup']) {
      const edge = initialEdges.find((e) => e.target === target && e.targetHandle === 'legSpacing');
      expect(edge?.source).toBe('bodyDimensions');
      expect(edge?.sourceHandle).toBe('legSpacing');
    }
  });
});

// evaluateGraph.ts のノード単位メモ化キャッシュ(nodes/CLAUDE.md の「ノードグラフエンジン」節
// 参照)が、この15グループ・数百ノードからなる実際のデフォルトグラフの上でも意図どおりに
// 効くことを検証する — 合成テストの小さなグラフ(evaluateGraph.test.ts)だけでなく、実際に
// 「1つのスライダーを動かすと無関係なグループは再評価されない」が成立していることの
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

  it('無関係なトップレベルノード(hatGroup)の data だけを差し替えても、skirtGroup の描画結果は同じ参照のまま再利用される', () => {
    const before = evaluateGraph(graphNodes, graphEdges);
    const changedNodes = graphNodes.map((n) =>
      n.id === 'hatGroup' ? { ...n, data: { ...n.data, memo: 'changed' } } : n,
    );
    const after = evaluateGraph(changedNodes, graphEdges);

    expect(after.get('skirtGroup')?.sceneOutputGeometry0).toBe(before.get('skirtGroup')?.sceneOutputGeometry0);
    expect(after.get('skirtGroup')?.sceneOutputMaterial0).toBe(before.get('skirtGroup')?.sceneOutputMaterial0);
  });

  it('変更した bodyBuild に依存する pantsGroup は、正しく再評価されて結果が変わる', () => {
    const before = evaluateGraph(graphNodes, graphEdges);
    const changedNodes = graphNodes.map((n) =>
      n.id === 'bodyBuild' ? { ...n, data: { ...n.data, value: 1.2 } } : n,
    );
    const after = evaluateGraph(changedNodes, graphEdges);

    expect(after.get('pantsGroup')?.sceneOutputGeometry0).not.toBe(before.get('pantsGroup')?.sceneOutputGeometry0);
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
