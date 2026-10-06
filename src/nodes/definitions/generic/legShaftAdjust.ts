import { defineGroupNode } from '../groupNodeFactory';

/** `bodyGroupNode.ts` 用。脚の軸の長さと持ち上げ量を、下端を `trim` だけ短く(足の後ろ下から軸の下端の角が
 * はみ出すのを防ぐ)、上端を `raise` だけ伸ばして(胴体の下端との重なりを増やす)求める。
 * 下端は `raise` では動かず、上端は `trim` では動かない。
 * - `length` = `length` − `trim` + `raise`(軸の長さ)
 * - `lift` = (`trim` + `raise`) / 2(軸を持ち上げる量。上端と下端が動く量の釣り合いを取る) */
defineGroupNode({
  type: 'legShaftAdjust',
  label: 'Leg Shaft Adjust',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'length', label: 'Length', type: 'number', default: 0 },
          { id: 'trim', label: 'Trim', type: 'number', default: 0.02 },
          { id: 'raise', label: 'Raise', type: 'number', default: 0.05 },
        ],
      },
    },
    { id: 'trimmed', type: 'numberSubtract', data: {} },
    { id: 'lengthRaised', type: 'numberAdd', data: {} },
    { id: 'liftSum', type: 'numberAdd', data: {} },
    { id: 'liftHalf', type: 'numberHalf', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [
          { id: 'length', label: 'Length', type: 'number' },
          { id: 'lift', label: 'Lift', type: 'number' },
        ],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'length', target: 'trimmed', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'trim', target: 'trimmed', targetHandle: 'b' },
    { source: 'trimmed', sourceHandle: 'value', target: 'lengthRaised', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'raise', target: 'lengthRaised', targetHandle: 'b' },
    { source: 'lengthRaised', sourceHandle: 'value', target: 'output', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'trim', target: 'liftSum', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'raise', target: 'liftSum', targetHandle: 'b' },
    { source: 'liftSum', sourceHandle: 'value', target: 'liftHalf', targetHandle: 'value' },
    { source: 'liftHalf', sourceHandle: 'value', target: 'output', targetHandle: 'lift' },
  ],
});
