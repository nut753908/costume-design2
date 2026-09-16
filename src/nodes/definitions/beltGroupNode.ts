import { defineGroupNode } from './groupNodeFactory';

/** beltRadiusScale(numberMultiply)+material(toonMaterial)+offsetYIn(numberInput)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)に加え、山なりのバックル部分の
 * プロファイル生成を可視のノードグラフへ展開した十数ノードを1枚にまとめたグループノード。
 * Radius/Thickness/Bulge/Segments/Color は他のガーメントと共有されない単独パラメータのため、
 * 外側の numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。
 * Body Build(半径スケーリング用)と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される waistY)は外部ソケットのまま(`nodes/CLAUDE.md` の「グループノード」節参照)。
 *
 * 旧 `buildBeltGeometry()`(`geometry/belt.ts`)は、waist アンカー(上端、radius)から下端
 * (radius)まで、中間で bulge 倍に膨らむ帯状の回転体を、上半分・下半分それぞれの
 * `buildEasedLatheProfile()` の結果を連結して作っていた。この「プロファイルを2回呼んで
 * 連結する」処理自体も、他のガーメントの `easedLatheProfile`→`latheGenerator` と同じ理由で
 * 可視のノードグラフへ展開している:
 *   - `bulgeRadiusCalc`(`numberMultiply`、`radius(スケール後) × bulge`)
 *   - `halfCalc`(`numberMultiply`、`thickness × 0.5`)
 *   - `lowerProfile`(`easedLatheProfile`、`bulgeRadius → radius` を `half` の距離でイージング)
 *   - `negatedHalf`(`numberSubtract`、`0 - half`)
 *   - `lowerShifted`(`translatePointsY`、`lowerProfile` を `negatedHalf` ぶんY方向にシフト
 *     — 旧コードの `for (const p of lower) p.y -= half;` に相当)
 *   - `lowerSliced`(`slicePoints`、`dropEnd=1` で末尾の1点(`upperProfile` の始点と重複する
 *     接続点)を間引く — 旧コードの `lower.slice(0, -1)` に相当)
 *   - `upperProfile`(`easedLatheProfile`、`radius → bulgeRadius` を `half` の距離で
 *     イージング)
 *   - `combined`(`concatPoints`、`lowerSliced` + `upperProfile` を連結)
 *   - `gen`(`latheGenerator`、`combined` の points を Lathe 化)
 * `zeroIn`/`halfIn`/`oneIn` は `bodyLayoutGroupNode.ts` の `halfIn`/`feetYIn` と同じ「常に
 * 一定の値を持つ `numberInput`」のイディオム。
 *
 * `nodes/definitions/beltGenerator.ts`(旧 `gen`、`buildBeltGeometry()` をそのまま呼ぶ
 * ブラックボックス)自体は削除していない — `scarfGroupNode.ts` が首元の輪を
 * `bulge=1.05` 固定でネストして再利用しているため(`geometry/CLAUDE.md` 参照)、belt 自身の
 * 内部実装がこのように展開されているかどうかとは独立して、既存の完成ノードを「値を1回
 * 呼ぶだけの部品」として使い続けている。 */
defineGroupNode({
  type: 'beltGroup',
  label: 'Belt',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          { id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'radiusIn', type: 'numberInput', data: { value: 0.32, min: 0.2, max: 0.45, step: 0.01, label: 'Radius' } },
    { id: 'thicknessIn', type: 'numberInput', data: { value: 0.05, min: 0.02, max: 0.12, step: 0.005, label: 'Thickness' } },
    { id: 'bulgeIn', type: 'numberInput', data: { value: 1.15, min: 1, max: 1.5, step: 0.01, label: 'Bulge' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 24, min: 8, max: 48, step: 1, label: 'Segments' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#3a2e26', label: 'Belt Color' } },
    { id: 'zeroIn', type: 'numberInput', data: { value: 0, min: 0, max: 0, step: 0.01, label: 'Zero' } },
    { id: 'halfIn', type: 'numberInput', data: { value: 0.5, min: 0.5, max: 0.5, step: 0.01, label: 'Half' } },
    { id: 'oneIn', type: 'numberInput', data: { value: 1, min: 1, max: 1, step: 0.01, label: 'One' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'bulgeRadiusCalc', type: 'numberMultiply', data: { label: 'Bulge Radius' } },
    { id: 'halfCalc', type: 'numberMultiply', data: { label: 'Thickness × Half' } },
    { id: 'negatedHalf', type: 'numberSubtract', data: { label: 'Negated Half' } },
    { id: 'lowerProfile', type: 'easedLatheProfile', data: { direction: 'down', steps: 6 } },
    { id: 'lowerShifted', type: 'translatePointsY', data: {} },
    { id: 'lowerSliced', type: 'slicePoints', data: {} },
    { id: 'upperProfile', type: 'easedLatheProfile', data: { direction: 'down', steps: 6 } },
    { id: 'combined', type: 'concatPoints', data: {} },
    { id: 'gen', type: 'latheGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'offsetYIn', type: 'numberInput', data: { value: 0, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'radiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },

    { source: 'scale', sourceHandle: 'value', target: 'bulgeRadiusCalc', targetHandle: 'value' },
    { source: 'bulgeIn', sourceHandle: 'value', target: 'bulgeRadiusCalc', targetHandle: 'factor' },
    { source: 'thicknessIn', sourceHandle: 'value', target: 'halfCalc', targetHandle: 'value' },
    { source: 'halfIn', sourceHandle: 'value', target: 'halfCalc', targetHandle: 'factor' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'negatedHalf', targetHandle: 'a' },
    { source: 'halfCalc', sourceHandle: 'value', target: 'negatedHalf', targetHandle: 'b' },

    { source: 'bulgeRadiusCalc', sourceHandle: 'value', target: 'lowerProfile', targetHandle: 'startRadius' },
    { source: 'scale', sourceHandle: 'value', target: 'lowerProfile', targetHandle: 'endRadius' },
    { source: 'halfCalc', sourceHandle: 'value', target: 'lowerProfile', targetHandle: 'distance' },
    { source: 'lowerProfile', sourceHandle: 'points', target: 'lowerShifted', targetHandle: 'points' },
    { source: 'negatedHalf', sourceHandle: 'value', target: 'lowerShifted', targetHandle: 'y' },
    { source: 'lowerShifted', sourceHandle: 'points', target: 'lowerSliced', targetHandle: 'points' },
    { source: 'oneIn', sourceHandle: 'value', target: 'lowerSliced', targetHandle: 'dropEnd' },

    { source: 'scale', sourceHandle: 'value', target: 'upperProfile', targetHandle: 'startRadius' },
    { source: 'bulgeRadiusCalc', sourceHandle: 'value', target: 'upperProfile', targetHandle: 'endRadius' },
    { source: 'halfCalc', sourceHandle: 'value', target: 'upperProfile', targetHandle: 'distance' },

    { source: 'lowerSliced', sourceHandle: 'points', target: 'combined', targetHandle: 'pointsA' },
    { source: 'upperProfile', sourceHandle: 'points', target: 'combined', targetHandle: 'pointsB' },
    { source: 'combined', sourceHandle: 'points', target: 'gen', targetHandle: 'points' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'gen', targetHandle: 'segments' },

    { source: 'gen', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
    { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
  ],
});
