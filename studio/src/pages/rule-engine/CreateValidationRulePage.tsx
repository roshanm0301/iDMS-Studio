/**
 * Create/Edit Validation Rule Page
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save } from 'lucide-react';
import {
  VALIDATION_CATEGORIES,
  VALIDATION_CATEGORY_LABELS,
  EXECUTION_POINTS,
  EXECUTION_POINT_LABELS,
  VALIDATION_SEVERITIES,
  SEVERITY_LABELS,
} from '../../metadata/validation-engine-definition';
import type { ValidationRuleConfig, ValidationCategory, ExecutionPoint, ValidationSeverity } from '../../metadata/validation-engine-definition';
import { saveValidationRule, getValidationRuleById } from '../../data/validationService';

interface FormValues {
  category: ValidationCategory;
  severity: ValidationSeverity;
  entityType: string;
  documentType: string;
  messageTemplate: string;
  remediationHint: string;
  nonOverridable: boolean;
  allowSeverityDowngrade: boolean;
  fieldRef: string;
  lineRef: string;
  sourceRef: string;
}

export default function CreateValidationRulePage() {
  const navigate = useNavigate();
  const { ruleId } = useParams();
  const existing = ruleId ? getValidationRuleById(ruleId) : undefined;

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: existing ? {
      category: existing.category,
      severity: existing.severity,
      entityType: existing.entityType || '',
      documentType: existing.documentType || '',
      messageTemplate: existing.messageTemplate,
      remediationHint: existing.remediationHint || '',
      nonOverridable: existing.nonOverridable || false,
      allowSeverityDowngrade: existing.allowSeverityDowngrade || false,
      fieldRef: existing.fieldRef || '',
      lineRef: existing.lineRef || '',
      sourceRef: existing.sourceRef || '',
    } : {
      category: 'field_mandatory',
      severity: 'block',
      entityType: '',
      documentType: '',
      messageTemplate: '',
      remediationHint: '',
      nonOverridable: false,
      allowSeverityDowngrade: false,
      fieldRef: '',
      lineRef: '',
      sourceRef: '',
    },
  });

  const [execPoints, setExecPoints] = useState<ExecutionPoint[]>(existing?.executionPoints || ['on_save']);
  const [saved, setSaved] = useState(false);

  const toggleExecPoint = (point: ExecutionPoint) => {
    setExecPoints(prev =>
      prev.includes(point) ? prev.filter(p => p !== point) : [...prev, point],
    );
  };

  const onSubmit = (data: FormValues) => {
    const rule: ValidationRuleConfig = {
      // eslint-disable-next-line react-hooks/purity
      id: existing?.id || `vrc-${Date.now()}`,
      // eslint-disable-next-line react-hooks/purity
      ruleVersionId: existing?.ruleVersionId || `rv-new-${Date.now()}`,
      // eslint-disable-next-line react-hooks/purity
      familyId: existing?.familyId || `rf-new-${Date.now()}`,
      category: data.category,
      executionPoints: execPoints,
      severity: data.severity,
      entityType: data.entityType,
      documentType: data.documentType || undefined,
      messageTemplate: data.messageTemplate,
      remediationHint: data.remediationHint || undefined,
      nonOverridable: data.nonOverridable,
      allowSeverityDowngrade: data.allowSeverityDowngrade,
      fieldRef: data.fieldRef || undefined,
      lineRef: data.lineRef || undefined,
      sourceRef: data.sourceRef || undefined,
      createdBy: 'admin',
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    saveValidationRule(rule);
    setSaved(true);
    setTimeout(() => navigate('/admin/studio/rule-engine/validations'), 600);
  };

  return (
    <div className="content" style={{ padding: 24, maxWidth: 720 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/studio/rule-engine/validations')} style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> Back to Validations
      </button>

      <h1 style={{ fontSize: 18, margin: '0 0 20px' }}>
        {existing ? 'Edit Validation Rule' : 'Create Validation Rule'}
      </h1>

      {saved && <div style={{ padding: 10, borderRadius: 6, backgroundColor: '#D1FAE5', color: '#065F46', fontSize: 12, marginBottom: 16 }}>Rule saved successfully!</div>}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Category */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Category *</label>
          <select {...register('category', { required: true })} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
            {VALIDATION_CATEGORIES.map(c => <option key={c} value={c}>{VALIDATION_CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>

        {/* Severity */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Severity *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {VALIDATION_SEVERITIES.map(s => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                <input type="radio" value={s} {...register('severity', { required: true })} />
                {SEVERITY_LABELS[s]}
              </label>
            ))}
          </div>
        </div>

        {/* Execution Points */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Execution Points *</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EXECUTION_POINTS.map(ep => (
              <label key={ep} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', padding: '4px 8px', borderRadius: 4, backgroundColor: execPoints.includes(ep) ? 'var(--accent-subtle)' : 'var(--bg-subtle)', border: `1px solid ${execPoints.includes(ep) ? 'var(--accent)' : 'var(--border)'}` }}>
                <input type="checkbox" checked={execPoints.includes(ep)} onChange={() => toggleExecPoint(ep)} style={{ display: 'none' }} />
                {EXECUTION_POINT_LABELS[ep]}
              </label>
            ))}
          </div>
          {execPoints.length === 0 && <p style={{ color: '#EF4444', fontSize: 11, margin: '4px 0 0' }}>Select at least one execution point</p>}
        </div>

        {/* Entity + Document Type */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Entity Type *</label>
            <input {...register('entityType', { required: 'Entity type is required' })} placeholder="e.g. sale_invoice" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
            {errors.entityType && <p style={{ color: '#EF4444', fontSize: 11, margin: '4px 0 0' }}>{errors.entityType.message}</p>}
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Document Type</label>
            <input {...register('documentType')} placeholder="e.g. sale_invoice" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
        </div>

        {/* Message Template */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Message Template *</label>
          <textarea {...register('messageTemplate', { required: 'Message template is required' })} placeholder="Use {{field_name}} for dynamic values" rows={3} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', resize: 'vertical' }} />
          {errors.messageTemplate && <p style={{ color: '#EF4444', fontSize: 11, margin: '4px 0 0' }}>{errors.messageTemplate.message}</p>}
        </div>

        {/* Remediation Hint */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Remediation Hint</label>
          <input {...register('remediationHint')} placeholder="Guidance for the user to fix the issue" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
        </div>

        {/* References */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Field Ref</label>
            <input {...register('fieldRef')} placeholder="Field API name" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Line Ref</label>
            <input {...register('lineRef')} placeholder="Line item ref" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Source Ref</label>
            <input {...register('sourceRef')} placeholder="Source doc ref" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
        </div>

        {/* Flags */}
        <div style={{ display: 'flex', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" {...register('nonOverridable')} />
            Non-Overridable
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" {...register('allowSeverityDowngrade')} />
            Allow Severity Downgrade
          </label>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={execPoints.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Save size={14} /> {existing ? 'Update Rule' : 'Create Rule'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/studio/rule-engine/validations')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
