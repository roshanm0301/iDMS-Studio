/**
 * Create/Edit Charge/Discount Rule Page
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import {
  CHARGE_CATEGORIES, CHARGE_CATEGORY_LABELS,
  CALCULATION_METHODS, CALCULATION_METHOD_LABELS,
  TAX_TIMINGS, TAX_TIMING_LABELS,
  CONFLICT_STRATEGIES, CONFLICT_STRATEGY_LABELS,
} from '../../metadata/charge-discount-definition';
import type { ChargeCategory, CalculationMethod, TaxTiming, ConflictStrategy, ChargeRuleVersion, SlabTier } from '../../metadata/charge-discount-definition';
import { saveChargeRule, getChargeRuleById, getChargeMasters } from '../../data/chargeService';

interface FormValues {
  chargeMasterId: string;
  calculationMethod: CalculationMethod;
  fixedAmount: number;
  percentage: number;
  formulaExpression: string;
  taxTiming: TaxTiming;
  conflictStrategy: ConflictStrategy;
  scope: 'header' | 'line';
  priority: number;
  effectiveFrom: string;
  effectiveTo: string;
}

export default function CreateChargeRulePage() {
  const navigate = useNavigate();
  const { ruleId } = useParams();
  const existing = ruleId ? getChargeRuleById(ruleId) : undefined;
  const masters = getChargeMasters();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: existing ? {
      chargeMasterId: existing.chargeMasterId,
      calculationMethod: existing.calculationMethod,
      fixedAmount: existing.fixedAmount || 0,
      percentage: existing.percentage || 0,
      formulaExpression: existing.formulaExpression || '',
      taxTiming: existing.taxTiming,
      conflictStrategy: existing.conflictStrategy,
      scope: existing.scope,
      priority: existing.priority,
      effectiveFrom: existing.effectiveFrom || '',
      effectiveTo: existing.effectiveTo || '',
    } : {
      chargeMasterId: masters[0]?.id || '', calculationMethod: 'percentage',
      fixedAmount: 0, percentage: 0, formulaExpression: '',
      taxTiming: 'pre_tax', conflictStrategy: 'first_match', scope: 'line',
      priority: 10, effectiveFrom: '', effectiveTo: '',
    },
  });

  const method = watch('calculationMethod');
  const [slabs, setSlabs] = useState<SlabTier[]>(existing?.slabs || []);
  const [saved, setSaved] = useState(false);

  const addSlab = () => setSlabs([...slabs, { fromValue: 0, toValue: null, value: 0, calculationMethod: 'percentage' }]);
  const removeSlab = (i: number) => setSlabs(slabs.filter((_, j) => j !== i));
  const updateSlab = (i: number, field: keyof SlabTier, val: number | string | null) => {
    const arr = [...slabs];
    (arr[i] as any)[field] = field === 'calculationMethod' ? val : (val === '' || val === null ? null : Number(val));
    setSlabs(arr);
  };

  const onSubmit = (data: FormValues) => {
    const rule: ChargeRuleVersion = {
      id: existing?.id || `cr-new-${Date.now()}`,
      ruleVersionId: existing?.ruleVersionId || `rv-new-${Date.now()}`,
      familyId: existing?.familyId || `rf-new-${Date.now()}`,
      chargeMasterId: data.chargeMasterId,
      entityType: existing?.entityType || 'generic',
      scope: data.scope,
      calculationMethod: data.calculationMethod,
      fixedAmount: data.calculationMethod === 'fixed_amount' ? data.fixedAmount : undefined,
      percentage: data.calculationMethod === 'percentage' ? data.percentage : undefined,
      formulaExpression: data.calculationMethod === 'formula' ? data.formulaExpression : undefined,
      slabs: data.calculationMethod === 'slab_tier' ? slabs : undefined,
      taxTiming: data.taxTiming,
      taxability: existing?.taxability || 'taxable',
      conflictStrategy: data.conflictStrategy,
      priority: data.priority,
      sequence: existing?.sequence ?? 1,
      deviationPolicy: existing?.deviationPolicy || { editable: false, deviationType: 'none', requireReason: false },
      precision: existing?.precision ?? 2,
      roundingMode: existing?.roundingMode || 'round_half_up',
      effectiveFrom: data.effectiveFrom || undefined,
      effectiveTo: data.effectiveTo || undefined,
      createdBy: 'admin',
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    saveChargeRule(rule);
    setSaved(true);
    setTimeout(() => navigate('/admin/studio/rule-engine/charges'), 600);
  };

  return (
    <div className="content" style={{ padding: 24, maxWidth: 720 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/studio/rule-engine/charges')} style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> Back to Charges
      </button>
      <h1 style={{ fontSize: 18, margin: '0 0 20px' }}>{existing ? 'Edit Charge Rule' : 'Create Charge Rule'}</h1>
      {saved && <div style={{ padding: 10, borderRadius: 6, backgroundColor: '#D1FAE5', color: '#065F46', fontSize: 12, marginBottom: 16 }}>Rule saved!</div>}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Charge Master */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Charge Master *</label>
          <select {...register('chargeMasterId', { required: true })} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
            {masters.map(m => <option key={m.id} value={m.id}>{m.displayName}</option>)}
          </select>
        </div>

        {/* Method + Scope + Priority */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Calculation Method *</label>
            <select {...register('calculationMethod')} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              {CALCULATION_METHODS.map(m => <option key={m} value={m}>{CALCULATION_METHOD_LABELS[m]}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Scope *</label>
            <select {...register('scope')} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              <option value="line">Line</option>
              <option value="header">Header</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Priority</label>
            <input type="number" {...register('priority', { valueAsNumber: true })} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
        </div>

        {/* Method-specific fields */}
        {method === 'fixed_amount' && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Fixed Amount *</label>
            <input type="number" step="0.01" {...register('fixedAmount', { valueAsNumber: true })} style={{ width: 200, fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
        )}
        {method === 'percentage' && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Percentage *</label>
            <input type="number" step="0.01" {...register('percentage', { valueAsNumber: true })} style={{ width: 200, fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
        )}
        {method === 'formula' && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Formula Expression *</label>
            <input {...register('formulaExpression')} placeholder="e.g. base_amount * 0.05" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
        )}
        {method === 'slab_tier' && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Slab Tiers</label>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', marginBottom: 8 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: 4, textAlign: 'left' }}>From</th>
                <th style={{ padding: 4, textAlign: 'left' }}>To</th>
                <th style={{ padding: 4, textAlign: 'left' }}>Value</th>
                <th style={{ padding: 4, textAlign: 'left' }}>Type</th>
                <th style={{ padding: 4, width: 30 }}></th>
              </tr></thead>
              <tbody>
                {slabs.map((s, i) => (
                  <tr key={i}>
                    <td style={{ padding: 2 }}><input type="number" value={s.fromValue} onChange={e => updateSlab(i, 'fromValue', e.target.value)} style={{ width: 70, fontSize: 11, padding: '4px 6px', borderRadius: 4, border: '1px solid var(--border)' }} /></td>
                    <td style={{ padding: 2 }}><input type="number" value={s.toValue ?? ''} onChange={e => updateSlab(i, 'toValue', e.target.value === '' ? null : e.target.value)} style={{ width: 70, fontSize: 11, padding: '4px 6px', borderRadius: 4, border: '1px solid var(--border)' }} /></td>
                    <td style={{ padding: 2 }}><input type="number" step="0.01" value={s.value} onChange={e => updateSlab(i, 'value', e.target.value)} style={{ width: 70, fontSize: 11, padding: '4px 6px', borderRadius: 4, border: '1px solid var(--border)' }} /></td>
                    <td style={{ padding: 2 }}>
                      <select value={s.calculationMethod} onChange={e => updateSlab(i, 'calculationMethod', e.target.value)} style={{ fontSize: 11, padding: '4px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                        <option value="percentage">%</option>
                        <option value="fixed_amount">Fixed</option>
                      </select>
                    </td>
                    <td style={{ padding: 2 }}><button type="button" onClick={() => removeSlab(i)} style={{ border: 'none', cursor: 'pointer', background: 'none' }}><Trash2 size={12} color="#EF4444" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={addSlab} style={{ fontSize: 11, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={12} /> Add Slab</button>
          </div>
        )}

        {/* Tax Timing + Conflict Strategy */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Tax Timing *</label>
            <select {...register('taxTiming')} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              {TAX_TIMINGS.map(t => <option key={t} value={t}>{TAX_TIMING_LABELS[t]}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Conflict Strategy</label>
            <select {...register('conflictStrategy')} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              {CONFLICT_STRATEGIES.map(s => <option key={s} value={s}>{CONFLICT_STRATEGY_LABELS[s]}</option>)}
            </select>
          </div>
        </div>

        {/* Effective Dates */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Effective From</label>
            <input type="date" {...register('effectiveFrom')} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Effective To</label>
            <input type="date" {...register('effectiveTo')} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Save size={14} /> {existing ? 'Update' : 'Create Rule'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/studio/rule-engine/charges')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
