/**
 * Create/Edit Calculation Rule Page
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save } from 'lucide-react';
import {
  CALCULATION_TYPES, CALCULATION_TYPE_LABELS,
  ROUNDING_MODES, ROUNDING_MODE_LABELS,
  OUTPUT_EDIT_MODES,
  CALC_EXECUTION_POINTS,
} from '../../metadata/calculation-engine-definition';
import type { CalculationDefinition, CalculationType, RoundingMode, OutputEditMode, CalcExecutionPoint } from '../../metadata/calculation-engine-definition';
import { saveCalculation, getCalculationById, getCalculations } from '../../data/calculationService';

interface FormValues {
  name: string;
  description: string;
  calculationType: CalculationType;
  entityType: string;
  documentType: string;
  executionPoint: CalcExecutionPoint;
  outputField: string;
  formulaExpression: string;
  precision: number;
  roundingMode: RoundingMode;
  outputEditMode: OutputEditMode;
  sequenceOrder: number;
}

export default function CreateCalculationPage() {
  const navigate = useNavigate();
  const { calcId } = useParams();
  const existing = calcId ? getCalculationById(calcId) : undefined;
  const allCalcs = getCalculations();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: existing ? {
      name: existing.name,
      description: existing.description || '',
      calculationType: existing.calculationType,
      entityType: existing.entityType,
      documentType: existing.documentType || '',
      executionPoint: existing.executionPoint,
      outputField: existing.outputField,
      formulaExpression: existing.formulaExpression || '',
      precision: existing.precision,
      roundingMode: existing.roundingMode,
      outputEditMode: existing.outputEditMode,
      sequenceOrder: existing.sequenceOrder || 0,
    } : {
      name: '', description: '', calculationType: 'field_formula',
      entityType: '', documentType: '', executionPoint: 'on_change',
      outputField: '', formulaExpression: '', precision: 2,
      roundingMode: 'round_half_up', outputEditMode: 'read_only', sequenceOrder: 0,
    },
  });

  const [inputFields, setInputFields] = useState<string[]>(existing?.inputFields || ['']);
  const [dependsOn, setDependsOn] = useState<string[]>(existing?.dependsOn || []);
  const [saved, setSaved] = useState(false);

  const onSubmit = (data: FormValues) => {
    const calc: CalculationDefinition = {
      id: existing?.id || `calc-new-${Date.now()}`,
      ruleVersionId: existing?.ruleVersionId || `rv-new-${Date.now()}`,
      familyId: existing?.familyId || `rf-new-${Date.now()}`,
      name: data.name,
      description: data.description || undefined,
      calculationType: data.calculationType,
      entityType: data.entityType,
      documentType: data.documentType || undefined,
      executionPoint: data.executionPoint,
      inputFields: inputFields.filter(f => f.trim()),
      outputField: data.outputField,
      formulaExpression: data.formulaExpression || undefined,
      precision: data.precision,
      roundingMode: data.roundingMode,
      outputEditMode: data.outputEditMode,
      sequenceOrder: data.sequenceOrder || undefined,
      dependsOn,
      createdBy: existing?.createdBy || 'admin',
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    saveCalculation(calc);
    setSaved(true);
    setTimeout(() => navigate('/admin/studio/rule-engine/calculations'), 600);
  };

  return (
    <div className="content" style={{ padding: 24, maxWidth: 720 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/studio/rule-engine/calculations')} style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> Back to Calculations
      </button>
      <h1 style={{ fontSize: 18, margin: '0 0 20px' }}>{existing ? 'Edit Calculation' : 'Create Calculation'}</h1>
      {saved && <div style={{ padding: 10, borderRadius: 6, backgroundColor: '#D1FAE5', color: '#065F46', fontSize: 12, marginBottom: 16 }}>Calculation saved!</div>}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Name */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Name *</label>
          <input {...register('name', { required: 'Name is required' })} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          {errors.name && <p style={{ color: '#EF4444', fontSize: 11, margin: '4px 0 0' }}>{errors.name.message}</p>}
        </div>

        {/* Type + Execution Point */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Calculation Type *</label>
            <select {...register('calculationType')} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              {CALCULATION_TYPES.map(t => <option key={t} value={t}>{CALCULATION_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Execution Point *</label>
            <select {...register('executionPoint')} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              {CALC_EXECUTION_POINTS.map(ep => <option key={ep} value={ep}>{ep.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>

        {/* Entity + Document Type */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Entity Type *</label>
            <input {...register('entityType', { required: 'Required' })} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Document Type</label>
            <input {...register('documentType')} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
        </div>

        {/* Output Field + Formula */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Output Field *</label>
            <input {...register('outputField', { required: 'Required' })} placeholder="e.g. net_amount" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Formula Expression</label>
            <input {...register('formulaExpression')} placeholder="e.g. qty * unit_price" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
        </div>

        {/* Input Fields (dynamic) */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Input Fields</label>
          {inputFields.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              <input value={f} onChange={e => { const arr = [...inputFields]; arr[i] = e.target.value; setInputFields(arr); }} placeholder="Field API name" style={{ flex: 1, fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)' }} />
              <button type="button" onClick={() => setInputFields(inputFields.filter((_, j) => j !== i))} style={{ fontSize: 11, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer' }}>✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setInputFields([...inputFields, ''])} style={{ fontSize: 11, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer' }}>+ Add Input Field</button>
        </div>

        {/* Precision + Rounding */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Precision *</label>
            <input type="number" {...register('precision', { valueAsNumber: true, min: 0, max: 10 })} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Rounding Mode *</label>
            <select {...register('roundingMode')} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              {ROUNDING_MODES.map(r => <option key={r} value={r}>{ROUNDING_MODE_LABELS[r]}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Edit Mode</label>
            <select {...register('outputEditMode')} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              {OUTPUT_EDIT_MODES.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>

        {/* Dependencies */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Depends On (other calculations)</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {allCalcs.filter(c => c.id !== existing?.id).map(c => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer', padding: '3px 6px', borderRadius: 4, backgroundColor: dependsOn.includes(c.id) ? 'var(--accent-subtle)' : 'var(--bg-subtle)', border: `1px solid ${dependsOn.includes(c.id) ? 'var(--accent)' : 'var(--border)'}` }}>
                <input type="checkbox" checked={dependsOn.includes(c.id)} onChange={() => setDependsOn(prev => prev.includes(c.id) ? prev.filter(d => d !== c.id) : [...prev, c.id])} style={{ display: 'none' }} />
                {c.name}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Save size={14} /> {existing ? 'Update' : 'Create Calculation'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/studio/rule-engine/calculations')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
