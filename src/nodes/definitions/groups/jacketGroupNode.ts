import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale, latheBody } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** jacketShoulderScale(numberMultiply)+profile(easedLatheCurve)+gen(latheGenerator)+
 * jacketMaterial(toonMaterial)+placement(garmentPlacement)+
 * sceneOut(sceneOutput)の8ノード(+裾半径を求める `flaredRadius`)を1枚にまとめたグループノード。
 * Shoulder Radius/Length/Hem Flare/Segments は他のガーメントと共有されない単独
 * パラメータのため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 * Body Build(半径スケーリング用)と Anchor Y(取り付け位置、ルートの
 * `bodyLayout` 共有ノードから配線される shoulderY)は外部ソケットのまま。
 *
 * `skirtGroupNode.ts` と全く同じ理由・同じ形で、プロファイル生成を `easedLatheCurve`→
 * `latheGenerator` へ、裾半径(`hemRadius = shoulderRadius * (1 + Math.max(0, hemFlare))`)を
 * `hemRadiusCalc`(`flaredRadius`、`nodes/definitions/generic/flaredRadius.ts`)へ展開している。 */
const output = garmentOutput({ offsetY: 0, geometry: 'gen' });

const scale = bodyBuildScale(0.34);
const lathe = latheBody({ genId: 'gen', direction: 'down', steps: 10, startRadius: 'scale', endRadius: 'hemRadiusCalc', distance: 0.42, segments: 20 });

defineGroupNode({
  type: 'jacketGroup',
  label: 'Jacket',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          anchorYSocket,
          colorSocket('#4a5c3e'),
        ],
      },
    },
    ...scale.nodes,
    { id: 'hemRadiusCalc', type: 'flaredRadius', data: { flare: 0.15 } },
    ...lathe.nodes,
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    { source: 'scale', sourceHandle: 'value', target: 'hemRadiusCalc', targetHandle: 'radius' },
    ...lathe.edges,
    ...output.edges,
  ],
});
