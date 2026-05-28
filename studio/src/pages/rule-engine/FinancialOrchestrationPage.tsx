/**
 * Financial Orchestration Page — Execution Sequence Visualizer
 */
import { FINANCIAL_EXECUTION_STEPS, EXECUTION_MODE_LABELS } from '../../metadata/financial-orchestration-definition';
import type { ExecutionMode } from '../../metadata/financial-orchestration-definition';
import { useState } from 'react';
import { Workflow, Info } from 'lucide-react';

const ENGINE_COLORS: Record<string, string> = {
  validation: '#DBEAFE',
  calculation: '#D1FAE5',
  charge: '#FEF3C7',
  tax: '#FCE7F3',
  approval: '#EDE9FE',
  accounting: '#CFFAFE',
  transaction_service: '#FEE2E2',
  workflow: '#E0E7FF',
  audit: '#F3F4F6',
};

export default function FinancialOrchestrationPage() {
  const [mode, setMode] = useState<ExecutionMode>('preview');

  return (
    <div className="content" style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Workflow size={20} />
          Financial Execution Orchestration
        </h1>
        <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 13 }}>
          17-step deterministic execution sequence for financial transactions
        </p>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['preview', 'final_save', 'post_commit'] as ExecutionMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: m === mode ? 600 : 400,
              backgroundColor: m === mode ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
              border: `1px solid ${m === mode ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer',
            }}
          >
            {EXECUTION_MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Info box */}
      <div style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle)', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Info size={14} style={{ marginTop: 2, flexShrink: 0, color: 'var(--muted)' }} />
        <p style={{ fontSize: 12, margin: 0, color: 'var(--muted)' }}>
          {mode === 'preview' && 'Preview Mode executes rules without committing. Used for UI preview, simulation, and draft calculation.'}
          {mode === 'final_save' && 'Final-Save Mode revalidates mandatory rules before commit. Produces transaction-ready snapshots.'}
          {mode === 'post_commit' && 'Post-Commit Mode triggers asynchronous accounting handoff, notifications, and workflow events.'}
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {FINANCIAL_EXECUTION_STEPS.map(step => {
          const skipped = mode === 'preview' && step.id === 'transaction_commit';
          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 6,
                backgroundColor: skipped ? '#F9FAFB' : ENGINE_COLORS[step.engine] || '#F3F4F6',
                opacity: skipped ? 0.5 : 1,
                border: '1px solid transparent',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, width: 24, textAlign: 'center', color: 'var(--muted)' }}>{step.step}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{step.name}</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.05)', textTransform: 'capitalize' }}>
                {step.engine.replace(/_/g, ' ')}
              </span>
              {skipped && <span style={{ fontSize: 10, color: '#EF4444' }}>Skipped in Preview</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
