import { Component, type ReactNode } from 'react';
import { GRAPH_STORAGE_KEY } from './state/graphStore';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** グラフの循環やlocalStorage破損などでレンダー中に例外が投げられた場合の最後の砦。
 * これが無いと React はコンポーネントツリー全体をアンマウントして白画面になり、
 * ユーザーに復旧手段が一切残らない(壊れた状態が既にlocalStorageに永続化済みなら
 * リロードしても同じ場所で再クラッシュする)。 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Unhandled error while rendering the graph:', error);
  }

  handleReset = () => {
    localStorage.removeItem(GRAPH_STORAGE_KEY);
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{ padding: 32, fontFamily: 'sans-serif', maxWidth: 560, margin: '48px auto', lineHeight: 1.6 }}>
        <h1 style={{ fontSize: 20 }}>エラーが発生しました</h1>
        <p>グラフの評価中に問題が発生しました:</p>
        <pre style={{ background: '#f5f0e8', padding: 12, overflowX: 'auto', fontSize: 13 }}>{error.message}</pre>
        <p>
          保存されているグラフの状態が壊れている可能性があります(例: ノード同士が循環して接続されている)。
          リセットすると保存内容は失われますが、アプリを再び使えるようになります。
        </p>
        <button type="button" onClick={this.handleReset}>
          グラフをリセットして再読み込み
        </button>
      </div>
    );
  }
}
