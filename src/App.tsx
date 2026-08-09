import './nodes/definitions';
import { NodeEditor } from './editor/NodeEditor';
import { Scene } from './scene/Scene';
import { useEvaluatedGraph } from './state/useEvaluatedGraph';

function App() {
  const { evaluationCount } = useEvaluatedGraph();

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div style={{ width: '45%', height: '100%', borderRight: '1px solid #ccc' }}>
        <NodeEditor />
      </div>
      <div style={{ width: '55%', height: '100%', position: 'relative' }}>
        <Scene />
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 12,
            fontFamily: 'ui-monospace, Consolas, monospace',
            fontSize: 11,
            opacity: 0.5,
          }}
        >
          evaluations: {evaluationCount}
        </div>
      </div>
    </div>
  );
}

export default App;
