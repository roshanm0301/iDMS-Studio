/**
 * Create/Edit Approval Policy Page
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import {
  APPROVAL_TYPES, APPROVAL_TYPE_LABELS,
  APPROVER_RESOLVER_TYPES,
  APPROVAL_ACTIONS,
} from '../../metadata/approval-engine-definition';
import type { ApprovalType, ApprovalAction, ApproverResolverType, ApprovalStep, ApprovalPolicy } from '../../metadata/approval-engine-definition';
import { getApprovalPolicyById, saveApprovalPolicy } from '../../data/workflowService';

interface FormValues {
  code: string;
  name: string;
  description: string;
  module: string;
  documentType: string;
  triggerEvent: string;
  approvalType: ApprovalType;
  makerCheckerEnforced: boolean;
}

const DEFAULT_STEP: ApprovalStep = {
  stepOrder: 1,
  resolverType: 'reporting_manager',
  allowedActions: ['approve', 'reject'],
  requireRemarks: ['reject'],
  slaHours: 24,
  escalateOnBreach: false,
};

export default function CreateApprovalPolicyPage() {
  const navigate = useNavigate();
  const { policyId } = useParams();
  const existing = policyId ? getApprovalPolicyById(policyId) : undefined;

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: existing ? {
      code: existing.code,
      name: existing.name,
      description: existing.description || '',
      module: existing.module,
      documentType: existing.documentType,
      triggerEvent: existing.triggerEvent,
      approvalType: existing.approvalType,
      makerCheckerEnforced: existing.makerCheckerEnforced,
    } : {
      code: '', name: '', description: '', module: '', documentType: '',
      triggerEvent: 'on_submit', approvalType: 'single_approver', makerCheckerEnforced: true,
    },
  });

  const [steps, setSteps] = useState<ApprovalStep[]>(existing?.steps || [{ ...DEFAULT_STEP }]);
  const [saved, setSaved] = useState(false);

  const addStep = () => setSteps([...steps, { ...DEFAULT_STEP, stepOrder: steps.length + 1 }]);
  const removeStep = (i: number) => setSteps(steps.filter((_, j) => j !== i).map((s, j) => ({ ...s, stepOrder: j + 1 })));

  const updateStepResolver = (i: number, resolver: ApproverResolverType) => {
    const arr = [...steps];
    arr[i] = { ...arr[i], resolverType: resolver };
    setSteps(arr);
  };

  const updateStepSLA = (i: number, hours: number) => {
    const arr = [...steps];
    arr[i] = { ...arr[i], slaHours: hours };
    setSteps(arr);
  };

  const toggleStepAction = (i: number, action: ApprovalAction) => {
    const arr = [...steps];
    const current = arr[i].allowedActions;
    arr[i] = {
      ...arr[i],
      allowedActions: current.includes(action) ? current.filter(a => a !== action) : [...current, action],
    };
    setSteps(arr);
  };

  const toggleEscalation = (i: number) => {
    const arr = [...steps];
    arr[i] = { ...arr[i], escalateOnBreach: !arr[i].escalateOnBreach };
    setSteps(arr);
  };

  const onSubmit = (data: FormValues) => {
    const policy: ApprovalPolicy = {
      id: existing?.id || `ap-new-${Date.now()}`,
      code: data.code,
      name: data.name,
      description: data.description || undefined,
      module: data.module,
      documentType: data.documentType,
      triggerEvent: data.triggerEvent,
      approvalType: data.approvalType,
      makerCheckerEnforced: data.makerCheckerEnforced,
      steps,
      status: 'draft',
      version: existing ? existing.version + 1 : 1,
      createdBy: 'admin',
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    saveApprovalPolicy(policy);
    setSaved(true);
    setTimeout(() => navigate('/admin/studio/rule-engine/approvals'), 600);
  };

  return (
    <div className="content" style={{ padding: 24, maxWidth: 780 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/studio/rule-engine/approvals')} style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> Back to Approval Policies
      </button>
      <h1 style={{ fontSize: 18, margin: '0 0 20px' }}>{existing ? 'Edit Approval Policy' : 'Create Approval Policy'}</h1>
      {saved && <div style={{ padding: 10, borderRadius: 6, backgroundColor: '#D1FAE5', color: '#065F46', fontSize: 12, marginBottom: 16 }}>Policy saved!</div>}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Code + Name */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Policy Code *</label>
            <input {...register('code', { required: 'Required' })} placeholder="e.g. SI_AMT_APPROVAL" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
            {errors.code && <p style={{ color: '#EF4444', fontSize: 11, margin: '4px 0 0' }}>{errors.code.message}</p>}
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Policy Name *</label>
            <input {...register('name', { required: 'Required' })} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
            {errors.name && <p style={{ color: '#EF4444', fontSize: 11, margin: '4px 0 0' }}>{errors.name.message}</p>}
          </div>
        </div>

        {/* Module + Document Type + Trigger */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Module *</label>
            <input {...register('module', { required: 'Required' })} placeholder="e.g. sales" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Document Type *</label>
            <input {...register('documentType', { required: 'Required' })} placeholder="e.g. sale_invoice" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Trigger Event</label>
            <input {...register('triggerEvent')} placeholder="on_submit" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
        </div>

        {/* Approval Type + Maker Checker */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Approval Type *</label>
            <select {...register('approvalType')} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              {APPROVAL_TYPES.map(t => <option key={t} value={t}>{APPROVAL_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', paddingBottom: 8 }}>
            <input type="checkbox" {...register('makerCheckerEnforced')} />
            Maker-Checker Enforced
          </label>
        </div>

        {/* Approval Steps */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 8 }}>Approval Steps</label>
          {steps.map((step, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8, backgroundColor: 'var(--bg-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Step {step.stepOrder}</span>
                {steps.length > 1 && (
                  <button type="button" onClick={() => removeStep(i)} style={{ border: 'none', cursor: 'pointer', background: 'none' }}><Trash2 size={14} color="#EF4444" /></button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 150px' }}>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 2 }}>Resolver</label>
                  <select value={step.resolverType} onChange={e => updateStepResolver(i, e.target.value as ApproverResolverType)} style={{ width: '100%', fontSize: 11, padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
                    {APPROVER_RESOLVER_TYPES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div style={{ flex: '0 0 80px' }}>
                  <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 2 }}>SLA (hrs)</label>
                  <input type="number" value={step.slaHours || ''} onChange={e => updateStepSLA(i, Number(e.target.value))} style={{ width: '100%', fontSize: 11, padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border)' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-end', gap: 4, fontSize: 11, cursor: 'pointer', paddingBottom: 6 }}>
                  <input type="checkbox" checked={step.escalateOnBreach} onChange={() => toggleEscalation(i)} />
                  Escalate on breach
                </label>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Allowed Actions</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {APPROVAL_ACTIONS.map(action => (
                    <label key={action} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, cursor: 'pointer', padding: '2px 6px', borderRadius: 4, backgroundColor: step.allowedActions.includes(action) ? 'var(--accent-subtle)' : 'transparent', border: `1px solid ${step.allowedActions.includes(action) ? 'var(--accent)' : 'var(--border)'}` }}>
                      <input type="checkbox" checked={step.allowedActions.includes(action)} onChange={() => toggleStepAction(i, action)} style={{ display: 'none' }} />
                      {action.replace(/_/g, ' ')}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addStep} style={{ fontSize: 11, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={12} /> Add Step
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Save size={14} /> {existing ? 'Update Policy' : 'Create Policy'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/studio/rule-engine/approvals')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
