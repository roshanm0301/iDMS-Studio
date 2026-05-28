/**
 * Approval Engine Page — Approval Policies list
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Plus } from 'lucide-react';
import { getApprovalPolicies } from '../../data/workflowService';
import { APPROVAL_TYPE_LABELS } from '../../metadata/approval-engine-definition';

export default function ApprovalEnginePage() {
  const navigate = useNavigate();
  const policies = useMemo(() => getApprovalPolicies(), []);

  return (
    <div className="content" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={20} />
            Approval Policies
          </h1>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 13 }}>
            {policies.length} policies configured
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/studio/rule-engine/approvals/new')}>
          <Plus size={14} /> New Approval Policy
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Policy Name</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Module</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Type</th>
            <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Steps</th>
            <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Maker-Checker</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {policies.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate(`/admin/studio/rule-engine/approvals/${p.id}/edit`)}>
              <td style={{ padding: '10px 12px', fontWeight: 500 }}>{p.name}</td>
              <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{p.module}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--bg-subtle)' }}>
                  {APPROVAL_TYPE_LABELS[p.approvalType]}
                </span>
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'center' }}>{p.steps.length}</td>
              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                {p.makerCheckerEnforced ? '✓' : '—'}
              </td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{
                  fontSize: 11, padding: '2px 6px', borderRadius: 4,
                  backgroundColor: p.status === 'published' ? '#D1FAE5' : '#FEF3C7',
                  color: p.status === 'published' ? '#065F46' : '#92400E',
                }}>
                  {p.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
