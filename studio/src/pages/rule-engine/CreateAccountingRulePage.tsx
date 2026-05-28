/**
 * Create/Edit Accounting Rule Page
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import {
  ACCOUNTING_EVENTS, ACCOUNTING_EVENT_LABELS,
  SUB_LEDGER_TYPES,
} from '../../metadata/accounting-rules-definition';
import type { AccountingEvent, AccountingRuleDefinition } from '../../metadata/accounting-rules-definition';
import { getAccountingRuleById, getPostingTemplates, saveAccountingRule } from '../../data/accountingService';

interface FormValues {
  name: string;
  entityType: string;
  event: AccountingEvent;
  postingTemplateId: string;
  displayCondition: string;
  priority: number;
  effectiveFrom: string;
}

export default function CreateAccountingRulePage() {
  const navigate = useNavigate();
  const { ruleId } = useParams();
  const existing = ruleId ? getAccountingRuleById(ruleId) : undefined;
  const templates = getPostingTemplates();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: existing ? {
      name: existing.name,
      entityType: existing.entityType,
      event: existing.event,
      postingTemplateId: existing.postingTemplateId,
      displayCondition: existing.displayCondition || '',
      priority: existing.priority,
      effectiveFrom: existing.effectiveFrom || '',
    } : {
      name: '', entityType: '', event: 'sale_invoice_created',
      postingTemplateId: templates[0]?.id || '', displayCondition: '', priority: 10, effectiveFrom: '',
    },
  });

  const [saved, setSaved] = useState(false);

  const onSubmit = (data: FormValues) => {
    const rule: AccountingRuleDefinition = {
      id: existing?.id || `acr-new-${Date.now()}`,
      ruleVersionId: existing?.ruleVersionId || `rv-new-${Date.now()}`,
      familyId: existing?.familyId || `rf-new-${Date.now()}`,
      name: data.name,
      entityType: data.entityType,
      event: data.event,
      postingTemplateId: data.postingTemplateId,
      displayCondition: data.displayCondition || undefined,
      priority: data.priority,
      effectiveFrom: data.effectiveFrom || undefined,
      createdBy: 'admin',
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    saveAccountingRule(rule);
    setSaved(true);
    setTimeout(() => navigate('/admin/studio/rule-engine/accounting'), 600);
  };

  return (
    <div className="content" style={{ padding: 24, maxWidth: 720 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/studio/rule-engine/accounting')} style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> Back to Accounting Rules
      </button>
      <h1 style={{ fontSize: 18, margin: '0 0 20px' }}>{existing ? 'Edit Accounting Rule' : 'Create Accounting Rule'}</h1>
      {saved && <div style={{ padding: 10, borderRadius: 6, backgroundColor: '#D1FAE5', color: '#065F46', fontSize: 12, marginBottom: 16 }}>Rule saved!</div>}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Name */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Rule Name *</label>
          <input {...register('name', { required: 'Rule name is required' })} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          {errors.name && <p style={{ color: '#EF4444', fontSize: 11, margin: '4px 0 0' }}>{errors.name.message}</p>}
        </div>

        {/* Entity + Event */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Entity Type *</label>
            <input {...register('entityType', { required: 'Required' })} placeholder="e.g. sale_invoice" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
            {errors.entityType && <p style={{ color: '#EF4444', fontSize: 11, margin: '4px 0 0' }}>{errors.entityType.message}</p>}
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Transaction Event *</label>
            <select {...register('event')} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              {ACCOUNTING_EVENTS.map(e => <option key={e} value={e}>{ACCOUNTING_EVENT_LABELS[e]}</option>)}
            </select>
          </div>
        </div>

        {/* Posting Template */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Posting Template *</label>
          <select {...register('postingTemplateId', { required: true })} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
            {templates.map(t => <option key={t.id} value={t.id}>{t.displayName} ({t.lines.length} lines)</option>)}
          </select>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>Template defines posting line structure (debit/credit roles, GL accounts, sub-ledger requirements)</p>
        </div>

        {/* Priority + Effective Date */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Priority</label>
            <input type="number" {...register('priority', { valueAsNumber: true })} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Effective From</label>
            <input type="date" {...register('effectiveFrom')} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
        </div>

        {/* Display Condition */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Display Condition</label>
          <input {...register('displayCondition')} placeholder="Readable condition for listing" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Save size={14} /> {existing ? 'Update' : 'Create Rule'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/studio/rule-engine/accounting')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
