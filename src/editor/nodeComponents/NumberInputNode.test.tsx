// @vitest-environment jsdom
//
// NumberInputNodeView(useState + useThrottledNodeDataUpdate + useGraphStore の購読)は
// React コンポーネントなので、実際にレンダーして入力を発火させて検証する。
// DOM が要るため、このファイルだけ jsdom に切り替える(selectors.test.ts と同じ方針)。
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Node } from '@xyflow/react';
import { useGraphStore } from '../../state/graphStore';
import { NumberInputNodeView } from './NumberInputNode';

// Handle は ReactFlowProvider/ノード文脈を要求するため、このテストでは描画しない。
vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Right: 'right' },
}));

const NODE_ID = 'n';

function setNode(data: Record<string, unknown>) {
  const node: Node = { id: NODE_ID, type: 'numberInput', position: { x: 0, y: 0 }, data };
  useGraphStore.getState().loadGraph([node], []);
}

/** store のノードの data を購読して NumberInputNodeView に渡す(React Flow が行う props 供給の代わり)。 */
function Harness() {
  const data = useGraphStore((s) => s.nodes.find((n) => n.id === NODE_ID)!.data);
  const props = { id: NODE_ID, data } as unknown as ComponentProps<typeof NumberInputNodeView>;
  return <NumberInputNodeView {...props} />;
}

const storedValue = () => useGraphStore.getState().nodes[0].data.value;
const input = () => screen.getByRole('spinbutton') as HTMLInputElement;

// updateNodeData は requestAnimationFrame で間引かれるため、fake timers で1フレーム進める。
const flushFrame = () => act(() => void vi.advanceTimersByTime(20));
const type = (raw: string) => {
  fireEvent.change(input(), { target: { value: raw } });
  flushFrame();
};

describe('NumberInputNodeView', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    useGraphStore.setState({ nodes: [], edges: [] });
  });

  it('数値入力欄が1つだけあり、スライダーや min/max/step の入力欄は無い', () => {
    setNode({ value: 0.3, min: 0.15, max: 0.5, step: 0.01 });
    render(<Harness />);
    expect(screen.getAllByRole('spinbutton')).toHaveLength(1);
    expect(screen.queryByRole('slider')).toBeNull();
    expect(input().value).toBe('0.3');
    expect(input().min).toBe('0.15');
    expect(input().max).toBe('0.5');
    expect(input().step).toBe('0.01');
  });

  it('入力した数値を store へ反映する', () => {
    setNode({ value: 0.3, min: 0.15, max: 0.5, step: 0.01 });
    render(<Harness />);
    type('0.4');
    expect(storedValue()).toBe(0.4);
  });

  it('範囲外の値は [min, max] に収めて store へ反映する', () => {
    setNode({ value: 0.3, min: 0.15, max: 0.5, step: 0.01 });
    render(<Harness />);
    type('9');
    expect(storedValue()).toBe(0.5);
    type('-3');
    expect(storedValue()).toBe(0.15);
  });

  it('空文字や数値にならない入力では store を更新せず、blur で store の値に戻す', () => {
    setNode({ value: 0.3, min: 0.15, max: 0.5, step: 0.01 });
    render(<Harness />);
    type('');
    expect(storedValue()).toBe(0.3);
    expect(input().value).toBe('');
    fireEvent.blur(input());
    expect(input().value).toBe('0.3');

    type('abc');
    expect(storedValue()).toBe(0.3);
  });

  it('min=max の固定値(constNumberInput)は入力しても値が変わらない', () => {
    setNode({ value: 2, min: 2, max: 2, step: 0.01 });
    render(<Harness />);
    type('5');
    expect(storedValue()).toBe(2);
    fireEvent.blur(input());
    expect(input().value).toBe('2');
  });

  it('外部要因(undo/redo・プリセット読み込みなど)で data.value が変わると入力欄に反映する', () => {
    setNode({ value: 0.3, min: 0.15, max: 0.5, step: 0.01 });
    render(<Harness />);
    act(() => useGraphStore.getState().updateNodeData(NODE_ID, { value: 0.45 }));
    expect(input().value).toBe('0.45');
  });
});
