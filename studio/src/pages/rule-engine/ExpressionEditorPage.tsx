/**
 * Expression Editor Page
 *
 * Provides tabbed view for Condition Builder and Formula Builder.
 * Linked from Rule Detail page via conditionRef/expressionRef.
 */
import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Filter, Calculator, Save, CheckCircle2 } from 'lucide-react';
import ConditionBuilder from '../../components/rule-engine/ConditionBuilder';
import FormulaBuilder from '../../components/rule-engine/FormulaBuilder';
import {
  getConditionById,
  getFormulaById,
  getFieldsForEntity,
  saveCondition,
  saveFormula,
} from '../../data/expressionService';
import {
  validateConditionTree,
  validateFormulaDefinition,
} from '../../metadata/expression-engine-definition';
import type { ConditionGroup, ConditionTree, FormulaDefinition } from '../../metadata/expression-engine-definition';

export default function ExpressionEditorPage() {
  const { expressionId } = useParams<{ expressionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const mode = searchParams.get('mode') ?? 'condition'; // 'condition' | 'formula'
  const entityType = searchParams.get('entity') ?? 'sale_invoice';
  const readOnly = searchParams.get('readonly') === 'true';

  const fields = useMemo(() => getFieldsForEntity(entityType), [entityType]);

  // Load existing or create new
  const [condition, setCondition] = useState<ConditionTree>(() => {
    if (mode === 'condition' && expressionId) {
      return getConditionById(expressionId) ?? createEmptyCondition(entityType);
    }
    return createEmptyCondition(entityType);
  });

  const [formula, setFormula] = useState<FormulaDefinition>(() => {
    if (mode === 'formula' && expressionId) {
      return getFormulaById(expressionId) ?? createEmptyFormula(entityType);
    }
    return createEmptyFormula(entityType);
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveCondition = () => {
    const result = validateConditionTree(condition);
    if (!result.valid) {
      setError(result.issues.map(i => i.message).join('; '));
      return;
    }
    saveCondition(condition);
    setSaved(true);
    setError(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveFormula = () => {
    const result = validateFormulaDefinition(formula);
    if (!result.valid) {
      setError(result.issues.map(i => i.message).join('; '));
      return;
    }
    saveFormula(formula);
    setSaved(true);
    setError(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGroupChange = (group: ConditionGroup) => {
    setCondition({ ...condition, rootGroup: group });
  };

  return (
    <div className="content" style={{ padding: 24, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>
        <h1 style={{ fontSize: 18, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {mode === 'condition' ? <Filter size={18} /> : <Calculator size={18} />}
          {mode === 'condition' ? 'Condition Builder' : 'Formula Builder'}
        </h1>
        {readOnly && (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: '#F3F4F6', color: '#6B7280' }}>
            Read-only
          </span>
        )}
        {!readOnly && (
          <button
            className="btn btn-primary btn-sm"
            onClick={mode === 'condition' ? handleSaveCondition : handleSaveFormula}
            style={{ marginLeft: 'auto' }}
          >
            <Save size={12} /> Save
          </button>
        )}
        {saved && (
          <span style={{ color: '#10b981', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={14} /> Saved
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '8px 12px', borderRadius: 6, backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: 12, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Builder */}
      {mode === 'condition' ? (
        <ConditionBuilder
          group={condition.rootGroup}
          fields={fields}
          readOnly={readOnly}
          onChange={handleGroupChange}
        />
      ) : (
        <FormulaBuilder
          formula={formula}
          fields={fields}
          readOnly={readOnly}
          onChange={setFormula}
        />
      )}
    </div>
  );
}

function createEmptyCondition(entityType: string): ConditionTree {
  return {
    id: '',
    entityType,
    rootGroup: { id: 'grp-root', logic: 'AND', conditions: [], groups: [] },
  };
}

function createEmptyFormula(entityType: string): FormulaDefinition {
  return {
    id: '',
    expression: '',
    tokens: [],
    outputType: 'number',
    entityType,
    fieldBindings: [],
  };
}
