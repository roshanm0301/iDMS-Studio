/**
 * Create/Edit Tax Rule Page
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save } from 'lucide-react';
import {
  TAX_REGIMES, TAX_REGIME_LABELS,
  TAX_TREATMENTS, TAX_TREATMENT_LABELS,
} from '../../metadata/tax-rules-definition';
import type { TaxRegime, TaxTreatment, TaxRuleDefinition } from '../../metadata/tax-rules-definition';
import { getTaxRuleById, getTaxGroups, saveTaxRule } from '../../data/taxService';

interface FormValues {
  name: string;
  regime: TaxRegime;
  entityType: string;
  outputTaxGroupId: string;
  outputTreatment: TaxTreatment;
  priority: number;
  displayCondition: string;
  isDefault: boolean;
  effectiveFrom: string;
}

export default function CreateTaxRulePage() {
  const navigate = useNavigate();
  const { ruleId } = useParams();
  const existing = ruleId ? getTaxRuleById(ruleId) : undefined;
  const groups = getTaxGroups();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: existing ? {
      name: existing.name,
      regime: existing.regime,
      entityType: existing.entityType,
      outputTaxGroupId: existing.outputTaxGroupId,
      outputTreatment: existing.outputTreatment,
      priority: existing.priority,
      displayCondition: existing.displayCondition || '',
      isDefault: existing.isDefault || false,
      effectiveFrom: existing.effectiveFrom || '',
    } : {
      name: '', regime: 'gst', entityType: '', outputTaxGroupId: groups[0]?.id || '',
      outputTreatment: 'taxable', priority: 10, displayCondition: '',
      isDefault: false, effectiveFrom: '',
    },
  });

  const selectedRegime = watch('regime');
  const filteredGroups = groups.filter(g => g.regime === selectedRegime);
  const [saved, setSaved] = useState(false);

  const onSubmit = (data: FormValues) => {
    const rule: TaxRuleDefinition = {
      id: existing?.id || `tr-new-${Date.now()}`,
      ruleVersionId: existing?.ruleVersionId || `rv-new-${Date.now()}`,
      familyId: existing?.familyId || `rf-new-${Date.now()}`,
      name: data.name,
      regime: data.regime,
      entityType: data.entityType,
      outputTaxGroupId: data.outputTaxGroupId,
      outputTreatment: data.outputTreatment,
      priority: data.priority,
      displayCondition: data.displayCondition || undefined,
      isDefault: data.isDefault,
      effectiveFrom: data.effectiveFrom || undefined,
      createdBy: 'admin',
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    saveTaxRule(rule);
    setSaved(true);
    setTimeout(() => navigate('/admin/studio/rule-engine/tax'), 600);
  };

  return (
    <div className="content" style={{ padding: 24, maxWidth: 720 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/studio/rule-engine/tax')} style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> Back to Tax Rules
      </button>
      <h1 style={{ fontSize: 18, margin: '0 0 20px' }}>{existing ? 'Edit Tax Rule' : 'Create Tax Rule'}</h1>
      {saved && <div style={{ padding: 10, borderRadius: 6, backgroundColor: '#D1FAE5', color: '#065F46', fontSize: 12, marginBottom: 16 }}>Tax rule saved!</div>}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Name */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Rule Name *</label>
          <input {...register('name', { required: 'Rule name is required' })} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          {errors.name && <p style={{ color: '#EF4444', fontSize: 11, margin: '4px 0 0' }}>{errors.name.message}</p>}
        </div>

        {/* Regime + Entity */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Tax Regime *</label>
            <select {...register('regime')} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              {TAX_REGIMES.map(r => <option key={r} value={r}>{TAX_REGIME_LABELS[r]}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Entity Type *</label>
            <input {...register('entityType', { required: 'Required' })} placeholder="e.g. sale_invoice" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
            {errors.entityType && <p style={{ color: '#EF4444', fontSize: 11, margin: '4px 0 0' }}>{errors.entityType.message}</p>}
          </div>
        </div>

        {/* Tax Group + Treatment */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Output Tax Group *</label>
            <select {...register('outputTaxGroupId', { required: true })} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              {filteredGroups.length > 0 ? filteredGroups.map(g => (
                <option key={g.id} value={g.id}>{g.displayName}</option>
              )) : groups.map(g => (
                <option key={g.id} value={g.id}>{g.displayName}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Output Treatment *</label>
            <select {...register('outputTreatment')} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              {TAX_TREATMENTS.map(t => <option key={t} value={t}>{TAX_TREATMENT_LABELS[t]}</option>)}
            </select>
          </div>
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
          <input {...register('displayCondition')} placeholder="Readable condition text for listing" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
        </div>

        {/* Flags */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
          <input type="checkbox" {...register('isDefault')} />
          Mark as Default Rule (applies when no other condition matches)
        </label>

        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Save size={14} /> {existing ? 'Update' : 'Create Tax Rule'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/studio/rule-engine/tax')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
