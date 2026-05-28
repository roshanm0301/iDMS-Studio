/**
 * Workflow Simulation Page — Test workflow and approval paths without side effects
 *
 * Implements: WFS-SIM-001 through WFS-SIM-006
 */
import { useState, useMemo } from 'react';
import { FlaskConical, Play, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { getWorkflows, getWorkflowVersion } from '../../data/workflowService';
import { NODE_TYPE_LABELS } from '../../metadata/workflow-engine-definition';

interface SimulationStep {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: 'passed' | 'failed' | 'skipped';
  detail: string;
}

function runSimulation(workflowId: string): SimulationStep[] {
  const version = getWorkflowVersion(workflowId);
  if (!version) return [];
  // Simple simulation: traverse edges from start
  const steps: SimulationStep[] = [];
  const adjacency = new Map<string, string[]>();
  for (const e of version.edges) {
    if (!adjacency.has(e.fromNodeId)) adjacency.set(e.fromNodeId, []);
    adjacency.get(e.fromNodeId)!.push(e.toNodeId);
  }
  const nodeMap = new Map(version.nodes.map(n => [n.id, n]));
  const startNode = version.nodes.find(n => n.nodeType === 'start');
  if (!startNode) return [];

  const visited = new Set<string>();
  const queue = [startNode.id];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    const node = nodeMap.get(cur);
    if (node) {
      steps.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.nodeType,
        status: 'passed',
        detail: `${NODE_TYPE_LABELS[node.nodeType]} executed successfully (simulated)`,
      });
    }
    for (const next of adjacency.get(cur) || []) queue.push(next);
  }
  return steps;
}

export default function WorkflowSimulationPage() {
  const workflows = useMemo(() => getWorkflows({ category: undefined }), []);
  const [selectedId, setSelectedId] = useState(() => getWorkflows({})[0]?.id || '');
  const [results, setResults] = useState<SimulationStep[] | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = () => {
    setRunning(true);
    // Simulate async
    setTimeout(() => {
      setResults(runSimulation(selectedId));
      setRunning(false);
    }, 500);
  };

  return (
    <div className="content" style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FlaskConical size={20} />
          Workflow & Approval Simulation
        </h1>
        <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 13 }}>
          Test workflow paths and approval routing without side effects
        </p>
      </div>

      {/* Setup */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <select
          value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); setResults(null); }}
          style={{ fontSize: 12, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}
        >
          {workflows.map(w => (
            <option key={w.id} value={w.id}>{w.name} ({w.status})</option>
          ))}
        </select>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleRun}
          disabled={running}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Play size={14} /> {running ? 'Running…' : 'Run Simulation'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div>
          <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 500 }}>
            Simulation Result — {results.length} steps executed
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {results.map((step, i) => (
              <div
                key={step.nodeId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 6,
                  backgroundColor: step.status === 'passed' ? '#F0FDF4' : step.status === 'failed' ? '#FEF2F2' : '#F9FAFB',
                  border: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--muted)', width: 20, textAlign: 'center' }}>{i + 1}</span>
                {step.status === 'passed' && <CheckCircle2 size={14} color="#22C55E" />}
                {step.status === 'failed' && <XCircle size={14} color="#EF4444" />}
                {step.status === 'skipped' && <AlertTriangle size={14} color="#F59E0B" />}
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{step.nodeName}</span>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.05)' }}>
                  {NODE_TYPE_LABELS[step.nodeType as keyof typeof NODE_TYPE_LABELS] || step.nodeType}
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{step.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!results && !running && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 13 }}>
          Select a workflow and click "Run Simulation" to test execution paths.
        </div>
      )}
    </div>
  );
}
