/**
 * Expression & Condition Engine — Unit Tests
 *
 * Tests for: condition validation, formula validation, tokenizer,
 * condition evaluation, formula evaluation, operator type filtering
 */
import { describe, it, expect } from 'vitest';
import {
  validateConditionTree,
  validateFormulaDefinition,
  OPERATORS_BY_TYPE,
  EXPRESSION_LIMITS,
  conditionToReadable,
} from '../../metadata/expression-engine-definition';
import type {
  ConditionTree,
  ConditionGroup,
  ConditionNode,
  FormulaDefinition,
} from '../../metadata/expression-engine-definition';
import {
  tokenizeFormula,
  evaluateConditionGroup,
  evaluateFormula,
} from '../../engine/expression-parser';

// ═══════════════════════════════════════════════════════════════
// Condition Tree Validation — COND-BLD-009
// ═══════════════════════════════════════════════════════════════
describe('validateConditionTree', () => {
  const makeTree = (rootGroup: ConditionGroup): ConditionTree => ({
    id: 'test-tree',
    rootGroup,
    entityType: 'sale_invoice',
  });

  it('rejects tree with no root group', () => {
    const result = validateConditionTree({ id: 't', entityType: 'x', rootGroup: undefined as any });
    expect(result.valid).toBe(false);
    expect(result.issues[0].code).toBe('NO_ROOT_GROUP');
  });

  it('rejects empty group', () => {
    const tree = makeTree({ id: 'g1', logic: 'AND', conditions: [], groups: [] });
    const result = validateConditionTree(tree);
    expect(result.valid).toBe(false);
    expect(result.issues[0].code).toBe('EMPTY_GROUP');
  });

  it('validates valid condition', () => {
    const tree = makeTree({
      id: 'g1',
      logic: 'AND',
      conditions: [{
        id: 'c1',
        fieldId: 'f1',
        fieldApiName: 'customer_id',
        fieldLabel: 'Customer',
        dataType: 'lookup',
        operator: 'is_not_blank',
      }],
      groups: [],
    });
    const result = validateConditionTree(tree);
    expect(result.valid).toBe(true);
  });

  it('rejects missing field', () => {
    const tree = makeTree({
      id: 'g1',
      logic: 'AND',
      conditions: [{
        id: 'c1',
        fieldId: '',
        fieldApiName: '',
        fieldLabel: '',
        dataType: 'string',
        operator: 'equals',
        value: 'test',
      }],
      groups: [],
    });
    const result = validateConditionTree(tree);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.code === 'FIELD_REQUIRED')).toBe(true);
  });

  it('rejects invalid operator for type', () => {
    const tree = makeTree({
      id: 'g1',
      logic: 'AND',
      conditions: [{
        id: 'c1',
        fieldId: 'f1',
        fieldApiName: 'is_active',
        fieldLabel: 'Active',
        dataType: 'boolean',
        operator: 'contains', // not valid for boolean
        value: true,
      }],
      groups: [],
    });
    const result = validateConditionTree(tree);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.code === 'INVALID_OPERATOR_FOR_TYPE')).toBe(true);
  });

  it('rejects missing value for non-blank operators', () => {
    const tree = makeTree({
      id: 'g1',
      logic: 'AND',
      conditions: [{
        id: 'c1',
        fieldId: 'f1',
        fieldApiName: 'amount',
        fieldLabel: 'Amount',
        dataType: 'number',
        operator: 'greater_than',
        // no value
      }],
      groups: [],
    });
    const result = validateConditionTree(tree);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.code === 'VALUE_REQUIRED')).toBe(true);
  });

  it('rejects between without valueTo', () => {
    const tree = makeTree({
      id: 'g1',
      logic: 'AND',
      conditions: [{
        id: 'c1',
        fieldId: 'f1',
        fieldApiName: 'amount',
        fieldLabel: 'Amount',
        dataType: 'number',
        operator: 'between',
        value: 10,
        // no valueTo
      }],
      groups: [],
    });
    const result = validateConditionTree(tree);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.code === 'VALUE_TO_REQUIRED')).toBe(true);
  });

  it('rejects nesting beyond max depth', () => {
    let group: ConditionGroup = {
      id: 'g-deep',
      logic: 'AND',
      conditions: [{ id: 'c1', fieldId: 'f1', fieldApiName: 'x', fieldLabel: 'X', dataType: 'string', operator: 'is_not_blank' }],
      groups: [],
    };
    // Nest beyond limit
    for (let i = 0; i < EXPRESSION_LIMITS.maxConditionDepth + 2; i++) {
      group = { id: `g${i}`, logic: 'AND', conditions: [], groups: [group] };
    }
    const tree = makeTree(group);
    const result = validateConditionTree(tree);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.code === 'MAX_DEPTH_EXCEEDED')).toBe(true);
  });

  it('rejects empty valueList for in_list operator', () => {
    const tree = makeTree({
      id: 'g1',
      logic: 'AND',
      conditions: [{
        id: 'c1',
        fieldId: 'f1',
        fieldApiName: 'status',
        fieldLabel: 'Status',
        dataType: 'enum',
        operator: 'in_list',
        valueList: [],
      }],
      groups: [],
    });
    const result = validateConditionTree(tree);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.code === 'VALUE_LIST_REQUIRED')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// Formula Validation — FORM-BLD-006
// ═══════════════════════════════════════════════════════════════
describe('validateFormulaDefinition', () => {
  const makeFormula = (overrides: Partial<FormulaDefinition>): FormulaDefinition => ({
    id: 'test-formula',
    expression: 'qty - used',
    tokens: [
      { type: 'field', value: 'qty', fieldId: 'f1' },
      { type: 'operator', value: '-' },
      { type: 'field', value: 'used', fieldId: 'f2' },
    ],
    outputType: 'number',
    entityType: 'sale_invoice',
    fieldBindings: [
      { fieldId: 'f1', fieldApiName: 'qty', displayLabel: 'Qty', dataType: 'number', entityType: 'sale_invoice' },
      { fieldId: 'f2', fieldApiName: 'used', displayLabel: 'Used', dataType: 'number', entityType: 'sale_invoice' },
    ],
    ...overrides,
  });

  it('validates a correct formula', () => {
    const result = validateFormulaDefinition(makeFormula({}));
    expect(result.valid).toBe(true);
  });

  it('rejects empty formula', () => {
    const result = validateFormulaDefinition(makeFormula({ expression: '' }));
    expect(result.valid).toBe(false);
    expect(result.issues[0].code).toBe('FORMULA_EMPTY');
  });

  it('rejects formula exceeding max length', () => {
    const result = validateFormulaDefinition(makeFormula({ expression: 'a'.repeat(501) }));
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.code === 'FORMULA_TOO_LONG')).toBe(true);
  });

  it('rejects unapproved function', () => {
    const result = validateFormulaDefinition(makeFormula({
      expression: 'evil(x)',
      tokens: [
        { type: 'function', value: 'evil', functionName: 'evil' },
        { type: 'open_paren', value: '(' },
        { type: 'field', value: 'x', fieldId: 'f1' },
        { type: 'close_paren', value: ')' },
      ],
    }));
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.code === 'UNAPPROVED_FUNCTION')).toBe(true);
  });

  it('rejects unmatched parentheses', () => {
    const result = validateFormulaDefinition(makeFormula({
      expression: '(qty - used',
      tokens: [
        { type: 'open_paren', value: '(' },
        { type: 'field', value: 'qty', fieldId: 'f1' },
        { type: 'operator', value: '-' },
        { type: 'field', value: 'used', fieldId: 'f2' },
      ],
    }));
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.code === 'UNCLOSED_PAREN')).toBe(true);
  });

  it('rejects unbound field', () => {
    const result = validateFormulaDefinition(makeFormula({
      tokens: [
        { type: 'field', value: 'unknown_field', fieldId: 'f-unknown' },
      ],
      fieldBindings: [],
    }));
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.code === 'UNBOUND_FIELD')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// Tokenizer — FORM-BLD-011
// ═══════════════════════════════════════════════════════════════
describe('tokenizeFormula', () => {
  it('tokenizes simple arithmetic', () => {
    const tokens = tokenizeFormula('qty - used');
    expect(tokens).toHaveLength(3);
    expect(tokens[0]).toMatchObject({ type: 'field', value: 'qty' });
    expect(tokens[1]).toMatchObject({ type: 'operator', value: '-' });
    expect(tokens[2]).toMatchObject({ type: 'field', value: 'used' });
  });

  it('tokenizes function call', () => {
    const tokens = tokenizeFormula('round(amount, 2)');
    expect(tokens[0]).toMatchObject({ type: 'function', value: 'round' });
    expect(tokens[1]).toMatchObject({ type: 'open_paren', value: '(' });
    expect(tokens[2]).toMatchObject({ type: 'field', value: 'amount' });
    expect(tokens[3]).toMatchObject({ type: 'comma', value: ',' });
    expect(tokens[4]).toMatchObject({ type: 'number', value: '2' });
    expect(tokens[5]).toMatchObject({ type: 'close_paren', value: ')' });
  });

  it('tokenizes negative numbers', () => {
    const tokens = tokenizeFormula('-5 + qty');
    expect(tokens[0]).toMatchObject({ type: 'number', value: '-5' });
    expect(tokens[1]).toMatchObject({ type: 'operator', value: '+' });
    expect(tokens[2]).toMatchObject({ type: 'field', value: 'qty' });
  });

  it('tokenizes parenthesized expressions', () => {
    const tokens = tokenizeFormula('(a + b) * c');
    expect(tokens.map(t => t.value)).toEqual(['(', 'a', '+', 'b', ')', '*', 'c']);
  });

  it('tokenizes nested function calls', () => {
    const tokens = tokenizeFormula('round(percentage(base, rate), 2)');
    expect(tokens[0]).toMatchObject({ type: 'function', value: 'round' });
    expect(tokens[2]).toMatchObject({ type: 'function', value: 'percentage' });
  });
});

// ═══════════════════════════════════════════════════════════════
// Condition Evaluation — EXP-RUN-001
// ═══════════════════════════════════════════════════════════════
describe('evaluateConditionGroup', () => {
  it('evaluates simple AND group — all true', () => {
    const group: ConditionGroup = {
      id: 'g1',
      logic: 'AND',
      conditions: [
        { id: 'c1', fieldId: 'f1', fieldApiName: 'amount', fieldLabel: 'Amount', dataType: 'number', operator: 'greater_than', value: 50 },
        { id: 'c2', fieldId: 'f2', fieldApiName: 'status', fieldLabel: 'Status', dataType: 'string', operator: 'equals', value: 'active' },
      ],
      groups: [],
    };
    const result = evaluateConditionGroup(group, { amount: 100, status: 'active' });
    expect(result.success).toBe(true);
    expect(result.value).toBe(true);
  });

  it('evaluates AND group — one false', () => {
    const group: ConditionGroup = {
      id: 'g1',
      logic: 'AND',
      conditions: [
        { id: 'c1', fieldId: 'f1', fieldApiName: 'amount', fieldLabel: 'Amount', dataType: 'number', operator: 'greater_than', value: 50 },
        { id: 'c2', fieldId: 'f2', fieldApiName: 'status', fieldLabel: 'Status', dataType: 'string', operator: 'equals', value: 'active' },
      ],
      groups: [],
    };
    const result = evaluateConditionGroup(group, { amount: 100, status: 'inactive' });
    expect(result.success).toBe(true);
    expect(result.value).toBe(false);
  });

  it('evaluates OR group — one true', () => {
    const group: ConditionGroup = {
      id: 'g1',
      logic: 'OR',
      conditions: [
        { id: 'c1', fieldId: 'f1', fieldApiName: 'amount', fieldLabel: 'Amount', dataType: 'money', operator: 'greater_than', value: 100000 },
        { id: 'c2', fieldId: 'f2', fieldApiName: 'discount', fieldLabel: 'Discount', dataType: 'number', operator: 'greater_than', value: 5 },
      ],
      groups: [],
    };
    const result = evaluateConditionGroup(group, { amount: 50000, discount: 10 });
    expect(result.success).toBe(true);
    expect(result.value).toBe(true);
  });

  it('fails in strict mode when field missing', () => {
    const group: ConditionGroup = {
      id: 'g1',
      logic: 'AND',
      conditions: [
        { id: 'c1', fieldId: 'f1', fieldApiName: 'missing_field', fieldLabel: 'Missing', dataType: 'number', operator: 'equals', value: 1 },
      ],
      groups: [],
    };
    const result = evaluateConditionGroup(group, {}, true);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('FIELD_NOT_FOUND');
  });

  it('handles is_blank operator', () => {
    const group: ConditionGroup = {
      id: 'g1',
      logic: 'AND',
      conditions: [
        { id: 'c1', fieldId: 'f1', fieldApiName: 'notes', fieldLabel: 'Notes', dataType: 'string', operator: 'is_blank' },
      ],
      groups: [],
    };
    expect(evaluateConditionGroup(group, { notes: '' }).value).toBe(true);
    expect(evaluateConditionGroup(group, { notes: 'text' }).value).toBe(false);
  });

  it('handles in_list operator', () => {
    const group: ConditionGroup = {
      id: 'g1',
      logic: 'AND',
      conditions: [
        { id: 'c1', fieldId: 'f1', fieldApiName: 'status', fieldLabel: 'Status', dataType: 'enum', operator: 'in_list', valueList: ['approved', 'published'] },
      ],
      groups: [],
    };
    expect(evaluateConditionGroup(group, { status: 'approved' }).value).toBe(true);
    expect(evaluateConditionGroup(group, { status: 'draft' }).value).toBe(false);
  });

  it('handles nested groups', () => {
    const group: ConditionGroup = {
      id: 'g1',
      logic: 'AND',
      conditions: [
        { id: 'c1', fieldId: 'f1', fieldApiName: 'mode', fieldLabel: 'Mode', dataType: 'string', operator: 'equals', value: 'from_sale_order' },
      ],
      groups: [{
        id: 'g2',
        logic: 'OR',
        conditions: [
          { id: 'c2', fieldId: 'f2', fieldApiName: 'amount', fieldLabel: 'Amount', dataType: 'number', operator: 'greater_than', value: 100 },
          { id: 'c3', fieldId: 'f3', fieldApiName: 'priority', fieldLabel: 'Priority', dataType: 'string', operator: 'equals', value: 'high' },
        ],
        groups: [],
      }],
    };
    expect(evaluateConditionGroup(group, { mode: 'from_sale_order', amount: 50, priority: 'high' }).value).toBe(true);
    expect(evaluateConditionGroup(group, { mode: 'from_sale_order', amount: 50, priority: 'low' }).value).toBe(false);
  });

  it('populates evaluation trace', () => {
    const group: ConditionGroup = {
      id: 'g1',
      logic: 'AND',
      conditions: [
        { id: 'c1', fieldId: 'f1', fieldApiName: 'amount', fieldLabel: 'Amount', dataType: 'number', operator: 'greater_than', value: 50 },
      ],
      groups: [],
    };
    const result = evaluateConditionGroup(group, { amount: 100 });
    expect(result.trace.length).toBe(1);
    expect(result.trace[0]).toMatchObject({ fieldApiName: 'amount', resolvedValue: 100 });
  });
});

// ═══════════════════════════════════════════════════════════════
// Formula Evaluation — EXP-RUN, FORM-BLD-008
// ═══════════════════════════════════════════════════════════════
describe('evaluateFormula', () => {
  const makeFormula = (expression: string, bindings: { fieldId: string; fieldApiName: string }[]): FormulaDefinition => ({
    id: 'test',
    expression,
    tokens: tokenizeFormula(expression),
    outputType: 'number',
    entityType: 'sale_invoice',
    fieldBindings: bindings.map(b => ({ ...b, displayLabel: b.fieldApiName, dataType: 'number' as const, entityType: 'sale_invoice', isRequired: true })),
  });

  it('evaluates simple subtraction', () => {
    const formula = makeFormula('ordered_qty - already_invoiced_qty', [
      { fieldId: 'f1', fieldApiName: 'ordered_qty' },
      { fieldId: 'f2', fieldApiName: 'already_invoiced_qty' },
    ]);
    const result = evaluateFormula(formula, { ordered_qty: 100, already_invoiced_qty: 30 });
    expect(result.success).toBe(true);
    expect(result.value).toBe(70);
  });

  it('evaluates multiplication', () => {
    const formula = makeFormula('base_amount * rate', [
      { fieldId: 'f1', fieldApiName: 'base_amount' },
      { fieldId: 'f2', fieldApiName: 'rate' },
    ]);
    const result = evaluateFormula(formula, { base_amount: 1000, rate: 0.18 });
    expect(result.success).toBe(true);
    expect(result.value).toBeCloseTo(180);
  });

  it('evaluates parenthesized expression', () => {
    const formula = makeFormula('(a + b) * c', [
      { fieldId: 'f1', fieldApiName: 'a' },
      { fieldId: 'f2', fieldApiName: 'b' },
      { fieldId: 'f3', fieldApiName: 'c' },
    ]);
    const result = evaluateFormula(formula, { a: 10, b: 20, c: 3 });
    expect(result.success).toBe(true);
    expect(result.value).toBe(90);
  });

  it('evaluates function calls — round', () => {
    const formula = makeFormula('round(amount, 2)', [
      { fieldId: 'f1', fieldApiName: 'amount' },
    ]);
    const result = evaluateFormula(formula, { amount: 123.456 });
    expect(result.success).toBe(true);
    expect(result.value).toBe(123.46);
  });

  it('evaluates function calls — percentage', () => {
    const formula = makeFormula('percentage(base, rate)', [
      { fieldId: 'f1', fieldApiName: 'base' },
      { fieldId: 'f2', fieldApiName: 'rate' },
    ]);
    const result = evaluateFormula(formula, { base: 1000, rate: 18 });
    expect(result.success).toBe(true);
    expect(result.value).toBe(180);
  });

  it('evaluates function calls — clamp', () => {
    const formula = makeFormula('clamp(deviation, -5, 5)', [
      { fieldId: 'f1', fieldApiName: 'deviation' },
    ]);
    const result = evaluateFormula(formula, { deviation: 10 });
    expect(result.success).toBe(true);
    expect(result.value).toBe(5);
  });

  it('FORM-BLD-008: division by zero returns error', () => {
    const formula = makeFormula('amount / divisor', [
      { fieldId: 'f1', fieldApiName: 'amount' },
      { fieldId: 'f2', fieldApiName: 'divisor' },
    ]);
    const result = evaluateFormula(formula, { amount: 100, divisor: 0 });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Division by zero');
  });

  it('fails in strict mode for missing required field', () => {
    const formula = makeFormula('qty - used', [
      { fieldId: 'f1', fieldApiName: 'qty' },
      { fieldId: 'f2', fieldApiName: 'used' },
    ]);
    const result = evaluateFormula(formula, { qty: 100 }, true);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('FIELD_NOT_FOUND');
  });

  it('populates evaluation trace', () => {
    const formula = makeFormula('a + b', [
      { fieldId: 'f1', fieldApiName: 'a' },
      { fieldId: 'f2', fieldApiName: 'b' },
    ]);
    const result = evaluateFormula(formula, { a: 10, b: 20 });
    expect(result.trace.length).toBe(2);
    expect(result.trace[0]).toMatchObject({ fieldApiName: 'a', resolvedValue: 10 });
  });
});

// ═══════════════════════════════════════════════════════════════
// Operator Type Filtering — COND-BLD-003
// ═══════════════════════════════════════════════════════════════
describe('OPERATORS_BY_TYPE', () => {
  it('string type has contains but not greater_than', () => {
    expect(OPERATORS_BY_TYPE.string).toContain('contains');
    expect(OPERATORS_BY_TYPE.string).not.toContain('greater_than');
  });

  it('number type has greater_than but not contains', () => {
    expect(OPERATORS_BY_TYPE.number).toContain('greater_than');
    expect(OPERATORS_BY_TYPE.number).not.toContain('contains');
  });

  it('boolean type only supports limited operators', () => {
    expect(OPERATORS_BY_TYPE.boolean).toContain('equals');
    expect(OPERATORS_BY_TYPE.boolean).not.toContain('in_list');
    expect(OPERATORS_BY_TYPE.boolean).not.toContain('contains');
    expect(OPERATORS_BY_TYPE.boolean).not.toContain('greater_than');
  });

  it('date type has date operators', () => {
    expect(OPERATORS_BY_TYPE.date).toContain('before');
    expect(OPERATORS_BY_TYPE.date).toContain('after');
    expect(OPERATORS_BY_TYPE.date).toContain('within_range');
    expect(OPERATORS_BY_TYPE.date).not.toContain('contains');
  });

  it('lookup type has lookup operators', () => {
    expect(OPERATORS_BY_TYPE.lookup).toContain('lookup_id_equals');
    expect(OPERATORS_BY_TYPE.lookup).toContain('lookup_code_equals');
    expect(OPERATORS_BY_TYPE.lookup).not.toContain('contains');
  });
});

// ═══════════════════════════════════════════════════════════════
// Readable Condition Display — COND-BLD-010
// ═══════════════════════════════════════════════════════════════
describe('conditionToReadable', () => {
  it('formats simple condition', () => {
    const group: ConditionGroup = {
      id: 'g1',
      logic: 'AND',
      conditions: [{
        id: 'c1',
        fieldId: 'f1',
        fieldApiName: 'amount',
        fieldLabel: 'Total Amount',
        dataType: 'number',
        operator: 'greater_than',
        value: 100000,
      }],
      groups: [],
    };
    const readable = conditionToReadable(group);
    expect(readable).toContain('Total Amount');
    expect(readable).toContain('Greater Than');
    expect(readable).toContain('100000');
  });

  it('formats AND group', () => {
    const group: ConditionGroup = {
      id: 'g1',
      logic: 'AND',
      conditions: [
        { id: 'c1', fieldId: 'f1', fieldApiName: 'a', fieldLabel: 'A', dataType: 'number', operator: 'equals', value: 1 },
        { id: 'c2', fieldId: 'f2', fieldApiName: 'b', fieldLabel: 'B', dataType: 'string', operator: 'is_blank' },
      ],
      groups: [],
    };
    const readable = conditionToReadable(group);
    expect(readable).toContain('AND');
  });
});
