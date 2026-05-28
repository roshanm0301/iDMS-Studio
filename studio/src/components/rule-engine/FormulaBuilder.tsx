/**
 * Formula Builder Component — FORM-BLD-001 through FORM-BLD-012
 *
 * Provides:
 * - Formula input with field/function autocomplete
 * - Field insertion from entity schema
 * - Syntax validation on change
 * - Output type display
 * - Test execution with sample payload
 * - Read-only mode for published versions
 */
import { useState, useMemo } from 'react';
import {
  Play, AlertTriangle, CheckCircle2, Plus, Variable, FunctionSquare,
} from 'lucide-react';
import type {
  FormulaDefinition,
  FormulaToken,
  ExpressionDataType,
} from '../../metadata/expression-engine-definition';
import {
  APPROVED_FUNCTIONS,
  validateFormulaDefinition,
} from '../../metadata/expression-engine-definition';
import { tokenizeFormula, evaluateFormula } from '../../engine/expression-parser';
import type { SchemaField } from '../../data/expressionService';

// ═══════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════
interface FormulaBuilderProps {
  formula: FormulaDefinition;
  fields: SchemaField[];
  readOnly?: boolean;
  onChange: (formula: FormulaDefinition) => void;
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════
export default function FormulaBuilder({ formula, fields, readOnly, onChange }: FormulaBuilderProps) {
  const [testPayload, setTestPayload] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; value: unknown; error?: string } | null>(null);
  const [showFunctions, setShowFunctions] = useState(false);
  const [showFields, setShowFields] = useState(false);

  // Validate on every change
  const validation = useMemo(() => validateFormulaDefinition(formula), [formula]);

  const handleExpressionChange = (expression: string) => {
    if (readOnly) return;
    const tokens = tokenizeFormula(expression);
    // Auto-resolve field bindings
    const fieldBindings = tokens
      .filter(t => t.type === 'field')
      .map(t => {
        const field = fields.find(f => f.fieldApiName === t.value || f.fieldId === t.fieldId);
        return field
          ? { fieldId: field.fieldId, fieldApiName: field.fieldApiName, displayLabel: field.displayLabel, dataType: field.dataType, entityType: field.entityType, isRequired: field.isRequired }
          : { fieldId: t.fieldId ?? t.value, fieldApiName: t.value, displayLabel: t.value, dataType: 'number' as ExpressionDataType, entityType: formula.entityType };
      });

    onChange({
      ...formula,
      expression,
      tokens,
      fieldBindings,
    });
  };

  const insertField = (field: SchemaField) => {
    if (readOnly) return;
    const newExpr = formula.expression
      ? `${formula.expression} ${field.fieldApiName}`
      : field.fieldApiName;
    handleExpressionChange(newExpr);
    setShowFields(false);
  };

  const insertFunction = (funcName: string) => {
    if (readOnly) return;
    const newExpr = formula.expression
      ? `${formula.expression} ${funcName}()`
      : `${funcName}()`;
    handleExpressionChange(newExpr);
    setShowFunctions(false);
  };

  const runTest = () => {
    try {
      const payload = testPayload.trim() ? JSON.parse(testPayload) : {};
      const result = evaluateFormula(formula, payload);
      setTestResult({
        success: result.success,
        value: result.value,
        error: result.error?.message,
      });
    } catch (e: unknown) {
      setTestResult({
        success: false,
        value: null,
        error: e instanceof Error ? e.message : 'Invalid JSON payload',
      });
    }
  };

  return (
    <div className="formula-builder" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {!readOnly && (
          <>
            <div style={{ position: 'relative' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowFields(!showFields)}>
                <Variable size={12} /> Fields
              </button>
              {showFields && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    zIndex: 20,
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 8,
                    maxHeight: 200,
                    overflowY: 'auto',
                    width: 240,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  {fields.map(f => (
                    <div
                      key={f.fieldId}
                      onClick={() => insertField(f)}
                      style={{
                        padding: '4px 8px',
                        cursor: 'pointer',
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ fontWeight: 500 }}>{f.displayLabel}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 11 }}>{f.fieldApiName} · {f.dataType}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowFunctions(!showFunctions)}>
                <FunctionSquare size={12} /> Functions
              </button>
              {showFunctions && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    zIndex: 20,
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 8,
                    maxHeight: 200,
                    overflowY: 'auto',
                    width: 280,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  {APPROVED_FUNCTIONS.map(fn => (
                    <div
                      key={fn.name}
                      onClick={() => insertFunction(fn.name)}
                      style={{
                        padding: '4px 8px',
                        cursor: 'pointer',
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ fontWeight: 500 }}>{fn.name}({fn.examples[0]?.match(/\((.+)\)/)?.[1] ?? '...'})</div>
                      <div style={{ color: 'var(--muted)', fontSize: 11 }}>{fn.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Output:</span>
          <span style={{ fontSize: 11, fontWeight: 500, backgroundColor: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: 4 }}>
            {formula.outputType}
          </span>
        </div>
      </div>

      {/* Expression input */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={formula.expression}
          onChange={(e) => handleExpressionChange(e.target.value)}
          readOnly={readOnly}
          placeholder="Enter formula... e.g. ordered_qty - already_invoiced_qty"
          rows={3}
          style={{
            width: '100%',
            fontFamily: 'monospace',
            fontSize: 13,
            padding: '8px 12px',
            borderRadius: 6,
            border: `1px solid ${validation.valid ? 'var(--border)' : '#ef4444'}`,
            backgroundColor: readOnly ? 'var(--bg-subtle)' : 'var(--bg)',
            resize: 'vertical',
          }}
        />
        {/* Validation indicator */}
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          {formula.expression && (
            validation.valid
              ? <CheckCircle2 size={14} color="#10b981" />
              : <AlertTriangle size={14} color="#ef4444" />
          )}
        </div>
      </div>

      {/* Validation errors */}
      {!validation.valid && (
        <div style={{ fontSize: 11, color: '#ef4444' }}>
          {validation.issues.filter(i => i.severity === 'error').map((i, idx) => (
            <div key={idx}>• {i.message}</div>
          ))}
        </div>
      )}

      {/* Field bindings */}
      {formula.fieldBindings.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
          <strong>Fields used:</strong>{' '}
          {formula.fieldBindings.map(b => b.displayLabel).join(', ')}
        </div>
      )}

      {/* Test execution — FORM-BLD-010 */}
      {!readOnly && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Test Execution</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              placeholder='{"ordered_qty": 100, "already_invoiced_qty": 30}'
              rows={2}
              style={{
                flex: 1,
                fontFamily: 'monospace',
                fontSize: 11,
                padding: '6px 8px',
                borderRadius: 4,
                border: '1px solid var(--border)',
              }}
            />
            <button className="btn btn-primary btn-sm" onClick={runTest} disabled={!validation.valid}>
              <Play size={12} /> Run
            </button>
          </div>
          {testResult && (
            <div style={{ marginTop: 6, fontSize: 12, padding: '6px 8px', borderRadius: 4, backgroundColor: testResult.success ? '#D1FAE5' : '#FEE2E2' }}>
              {testResult.success
                ? <span><strong>Result:</strong> {String(testResult.value)}</span>
                : <span style={{ color: '#991B1B' }}><strong>Error:</strong> {testResult.error}</span>
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}
