// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NodeTitleBar } from './NodeTitleBar';

describe('NodeTitleBar', () => {
  afterEach(cleanup);

  it('onRename が無ければダブルクリックしても編集欄は出ない', () => {
    render(<NodeTitleBar id="n" label="Skirt" />);
    fireEvent.doubleClick(screen.getByText('Skirt'));
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('ダブルクリックで編集し、Enter で前後の空白を除いた名前を確定する', () => {
    const onRename = vi.fn();
    render(<NodeTitleBar id="n" label="Group" onRename={onRename} />);
    fireEvent.doubleClick(screen.getByText('Group'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: ' Cape ' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onRename).toHaveBeenCalledWith('Cape');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('Esc で取り消し、変更していなければフォーカスを外しても何も呼ばない', () => {
    const onRename = vi.fn();
    render(<NodeTitleBar id="n" label="Group" onRename={onRename} />);
    fireEvent.doubleClick(screen.getByText('Group'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Cape' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(screen.getByText('Group')).toBeTruthy();

    fireEvent.doubleClick(screen.getByText('Group'));
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onRename).not.toHaveBeenCalled();
  });
});
