import { useState, useMemo } from 'react';
import { Play, CheckCircle, XCircle, Info, Plus, Trash2, X } from 'lucide-react';
import { getSimulationCases, getRules, evaluateRule } from '../../data/mockService';
import { useStudioStore } from '../../hooks/useStudioStore';
import type { SimulationCase } from '../../types';

interface Props { artifactKey: string }

const SAMPLE_PAYLOADS: Record<string, object> = {
  submit_valid: {
    vehicle_order: {
      customer_id: 'cust_001',
      total_amount: 450000,
      discount_pct: 5,
      gstin: 'GSTIN123456789',
      bajaj_dealer_code: 'PUNE001',
      vehicle_model: 'Pulsar NS200',
      line_items: [{ item: 'Pulsar NS200', qty: 1, price: 450000 }],
    },
  },
  missing_gstin: {
    vehicle_order: {
      customer_id: 'cust_001',
      total_amount: 450000,
      discount_pct: 5,
      bajaj_dealer_code: 'PUNE001',
      vehicle_model: 'Pulsar NS200',
    },
  },
  high_value: {
    vehicle_order: {
      customer_id: 'cust_002',
      total_amount: 750000,
      discount_pct: 3,
      gstin: 'GSTIN987654321',
      bajaj_dealer_code: 'MUM001',
      vehicle_model: 'KTM Duke 390',
    },
  },
};

const TRIGGERS = ['BEFORE_SUBMIT', 'BEFORE_APPROVE', 'BEFORE_CREATE', 'BEFORE_EDIT'];
const EXPECTED = ['PASS', 'BLOCK', 'WARN'];

// ── New Test Case Modal ──────────────────────────────────────────────────────

interface NewCaseModalProps {
  onSave: (tc: SimulationCase) => void;
  onClose: () => void;
}

function NewCaseModal({ onSave, onClose }: NewCaseModalProps) {
  const [label, setLabel] = useState('');
  const [trigger, setTrigger] = useState('BEFORE_SUBMIT');
  const [expected, setExpected] = useState('PASS');
  const [payloadText, setPayloadText] = useState('{\n  \n}');
  const [payloadError, setPayloadError] = useState('');

  function handleSave() {
    if (!label.trim()) return;
    let payload: any = {};
    try {
      payload = JSON.parse(payloadText);
      setPayloadError('');
    } catch {
      setPayloadError('Invalid JSON — please fix the payload before saving.');
      return;
    }
    const tc: SimulationCase = {
      case_id: `case_new_${Date.now()}`,
      label: label.trim(),
      entity_type: 'vehicle_order',
      trigger,
      payload,
      session: { role: 'TENANT_ADMIN', tenant: 'bajaj', node: 'default' },
      expected_result: expected as SimulationCase['expected_result'],
      status: 'not_run',
    };
    onSave(tc);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--panel)', borderRadius: 'var(--radius-lg)',
        width: 520, boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>New Test Case</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>Define a simulation scenario</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Label */}
          <div>
            <label className="form-label">Case Label <span style={{ color: 'var(--red)' }}>*</span></label>
            <input
              className="form-input"
              placeholder="e.g. Submit with missing GSTIN"
              value={label}
              onChange={e => setLabel(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Trigger */}
            <div>
              <label className="form-label">Trigger</label>
              <select className="form-select" value={trigger} onChange={e => setTrigger(e.target.value)}>
                {TRIGGERS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            {/* Expected result */}
            <div>
              <label className="form-label">Expected Result</label>
              <select className="form-select" value={expected} onChange={e => setExpected(e.target.value)}>
                {EXPECTED.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {/* Payload */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>Command Payload (JSON)</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {Object.keys(SAMPLE_PAYLOADS).map(k => (
                  <button key={k} className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11 }}
                    onClick={() => { setPayloadText(JSON.stringify(SAMPLE_PAYLOADS[k], null, 2)); setPayloadError(''); }}>
                    {k.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              style={{
                width: '100%', height: 140, padding: '10px 12px',
                fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7,
                background: 'var(--bg-sunken)', border: `1px solid ${payloadError ? 'var(--red)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', color: 'var(--text)',
                resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              }}
              value={payloadText}
              onChange={e => { setPayloadText(e.target.value); if (payloadError) setPayloadError(''); }}
              spellCheck={false}
            />
            {payloadError && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{payloadError}</div>}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!label.trim()}>
            Save Test Case
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main SimulationTab ───────────────────────────────────────────────────────

export default function SimulationTab({ artifactKey }: Props) {
  const { scope, showToast, savedTestCases, saveTestCase, deleteTestCase } = useStudioStore();
  const seedCases = getSimulationCases();
  const rules = getRules();

  const [selectedCase, setSelectedCase] = useState<SimulationCase | null>(null);
  const [payloadText, setPayloadText] = useState('{}');
  const [result, setResult] = useState<null | { steps: { step: string; status: 'pass' | 'fail' | 'info'; detail: string }[]; matched: boolean }>(null);
  const [running, setRunning] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  // Merge seed cases + store cases (store wins on same case_id)
  const allCases = useMemo(() => {
    const local = savedTestCases[artifactKey] ?? [];
    const localIds = new Set(local.map(c => c.case_id));
    return [...local, ...seedCases.filter(c => !localIds.has(c.case_id))];
  }, [savedTestCases, artifactKey, seedCases]);

  const runSimulation = () => {
    setRunning(true);
    setTimeout(() => {
      let payload: any = {};
      try { payload = JSON.parse(payloadText); } catch {}
      const steps = rules.map(rule => {
        const ev = evaluateRule(rule, payload);
        return {
          step: `Rule: ${(rule as any).rule_name || rule.rule_id}`,
          status: (ev.matched ? (rule.action_type === 'BLOCK' ? 'fail' : 'pass') : 'pass') as 'pass' | 'fail' | 'info',
          detail: ev.matched
            ? `${rule.action_type}: ${(rule as any).message || 'Action triggered'}`
            : 'Condition not met — skipped',
        };
      });
      const blocked = steps.some(s => s.status === 'fail');
      setResult({ steps, matched: !blocked });
      setRunning(false);
      showToast(blocked ? 'Simulation: BLOCK triggered' : 'Simulation: Command would succeed', blocked ? 'error' : 'success');
    }, 800);
  };

  const loadPreset = (key: string) => {
    setPayloadText(JSON.stringify(SAMPLE_PAYLOADS[key] || {}, null, 2));
    setResult(null);
  };

  function handleSaveNewCase(tc: SimulationCase) {
    saveTestCase(artifactKey, tc);
    setSelectedCase(tc);
    setPayloadText(JSON.stringify(tc.payload, null, 2));
    setResult(null);
    setShowNewModal(false);
  }

  function handleDeleteCase(caseId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const isLocal = (savedTestCases[artifactKey] ?? []).some(c => c.case_id === caseId);
    if (!isLocal) { showToast('Seed test cases cannot be deleted', 'info'); return; }
    deleteTestCase(artifactKey, caseId);
    if (selectedCase?.case_id === caseId) { setSelectedCase(null); setResult(null); }
  }

  return (
    <>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* Left: case list */}
        <div style={{ width: 280, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="panel-header">
            <span className="panel-title">Test Cases</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowNewModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={13} /> New
            </button>
          </div>
          <div className="panel-body">
            {allCases.length === 0 && (
              <div className="empty" style={{ padding: 32 }}>
                <p className="empty-title" style={{ fontSize: 13 }}>No test cases yet</p>
                <p className="empty-desc">Create a test case to simulate rule evaluation.</p>
              </div>
            )}
            {allCases.map(c => {
              const isLocal = (savedTestCases[artifactKey] ?? []).some(lc => lc.case_id === c.case_id);
              return (
                <div
                  key={c.case_id}
                  className="release-card"
                  style={{
                    background: selectedCase?.case_id === c.case_id ? 'var(--selected)' : undefined,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSelectedCase(c);
                    setPayloadText(JSON.stringify(c.payload, null, 2));
                    setResult(null);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, flex: 1, marginRight: 8 }}>
                      {c.label}
                      {isLocal && <span className="chip draft" style={{ marginLeft: 6, fontSize: 10 }}>new</span>}
                    </div>
                    {isLocal && (
                      <button className="btn btn-ghost btn-sm" style={{ padding: '2px 4px', opacity: 0.5 }}
                        onClick={e => handleDeleteCase(c.case_id, e)} title="Delete test case">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <span className={`tag ${c.status === 'pass' ? 'green' : c.status === 'fail' ? 'red' : ''}`}>
                      {c.status === 'pass' ? '✓ Pass' : c.status === 'fail' ? '✗ Fail' : '— Not run'}
                    </span>

                    <span className="muted text-xs">{c.trigger}</span>
                  </div>
                  <div className="muted text-xs" style={{ marginTop: 4 }}>
                    Expected: <strong>{c.expected_result}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: payload editor + result */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Scope bar */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elev)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="muted text-xs">Role:</span>
            <span className="tag">{scope.role_name}</span>
            <span className="muted text-xs">Node:</span>
            <span className="tag">{scope.node_label}</span>
            <span className="muted text-xs">Command:</span>
            <select className="form-select" style={{ width: 160 }}>
              {TRIGGERS.map(t => <option key={t}>{t}</option>)}
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="muted text-xs">Load preset:</span>
              {Object.keys(SAMPLE_PAYLOADS).map(k => (
                <button key={k} className="btn btn-ghost btn-sm" onClick={() => loadPreset(k)}>
                  {k.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
            {/* Payload editor */}
            <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="panel-header">
                <span className="panel-title">Command Payload (JSON)</span>
                {selectedCase && <span className="muted text-xs">from: {selectedCase.label}</span>}
              </div>
              <textarea
                style={{
                  flex: 1, padding: 16, fontFamily: 'var(--font-mono)', fontSize: 12,
                  background: 'var(--bg-sunken)', border: 'none', resize: 'none',
                  color: 'var(--text)', outline: 'none', lineHeight: 1.8,
                }}
                value={payloadText}
                onChange={e => { setPayloadText(e.target.value); setResult(null); }}
                spellCheck={false}
              />
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={runSimulation} disabled={running}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Play size={13} /> {running ? 'Running…' : 'Run Simulation'}
                </button>
              </div>
            </div>

            {/* Results */}
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="panel-header">
                <span className="panel-title">Evaluation Result</span>
                {result && (
                  <span className={`tag ${result.matched ? 'green' : 'red'}`}>
                    {result.matched ? '✓ Command allowed' : '✗ Command blocked'}
                  </span>
                )}
              </div>
              <div className="panel-body">
                {!result && (
                  <div className="empty" style={{ padding: 40 }}>
                    <Play size={24} className="empty-icon" />
                    <p className="empty-title">Run simulation</p>
                    <p className="empty-desc">Enter a payload and click "Run Simulation" to see rule evaluation results.</p>
                  </div>
                )}
                {result && result.steps.map((step, i) => (
                  <div key={i} className="sim-step">
                    <div className={`sim-step-icon ${step.status}`}>
                      {step.status === 'pass' ? <CheckCircle size={12} /> : step.status === 'fail' ? <XCircle size={12} /> : <Info size={12} />}
                    </div>
                    <div>
                      <div className="sim-step-label">{step.step}</div>
                      <div className="sim-step-detail">{step.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNewModal && (
        <NewCaseModal
          onSave={handleSaveNewCase}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </>
  );
}
