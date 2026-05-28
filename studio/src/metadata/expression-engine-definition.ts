/**
 * Expression & Condition Engine — Metadata Types & Validators
 *
 * Implements: EXP-TYPE-001 through EXP-TYPE-011, COND-OP-001 through COND-OP-043,
 * COND-BLD-001 through COND-BLD-013, FORM-BLD-001 through FORM-BLD-012,
 * EXP-RUN-001 through EXP-RUN-012, EXP-FUNC-001 through EXP-FUNC-013,
 * EXP-SEC-001 through EXP-SEC-007
 */

// ═══════════════════════════════════════════════════════════════
// Data Types — EXP-TYPE-001 through EXP-TYPE-011
// ═══════════════════════════════════════════════════════════════
export const EXPRESSION_DATA_TYPES = [
  'string',
  'number',
  'integer',
  'boolean',
  'date',
  'datetime',
  'enum',
  'lookup',
  'list',
  'money',
  'quantity',
] as const;
export type ExpressionDataType = (typeof EXPRESSION_DATA_TYPES)[number];

// ═══════════════════════════════════════════════════════════════
// Operators — COND-OP-001 through COND-OP-043
// ═══════════════════════════════════════════════════════════════
export const COMMON_OPERATORS = [
  'equals',
  'not_equals',
  'is_blank',
  'is_not_blank',
  'in_list',
  'not_in_list',
] as const;

export const NUMERIC_OPERATORS = [
  'greater_than',
  'greater_than_or_equal',
  'less_than',
  'less_than_or_equal',
  'between',
  'not_between',
] as const;

export const STRING_OPERATORS = [
  'contains',
  'does_not_contain',
  'starts_with',
  'ends_with',
] as const;

export const DATE_OPERATORS = [
  'before',
  'after',
  'on',
  'on_or_before',
  'on_or_after',
  'within_range',
] as const;

export const LOOKUP_OPERATORS = [
  'lookup_id_equals',
  'lookup_code_equals',
  'lookup_attribute_equals',
] as const;

export type CommonOperator = (typeof COMMON_OPERATORS)[number];
export type NumericOperator = (typeof NUMERIC_OPERATORS)[number];
export type StringOperator = (typeof STRING_OPERATORS)[number];
export type DateOperator = (typeof DATE_OPERATORS)[number];
export type LookupOperator = (typeof LOOKUP_OPERATORS)[number];

export type ConditionOperator =
  | CommonOperator
  | NumericOperator
  | StringOperator
  | DateOperator
  | LookupOperator;

export const ALL_OPERATORS: ConditionOperator[] = [
  ...COMMON_OPERATORS,
  ...NUMERIC_OPERATORS,
  ...STRING_OPERATORS,
  ...DATE_OPERATORS,
  ...LOOKUP_OPERATORS,
];

// COND-BLD-003: Operators filtered by field data type
export const OPERATORS_BY_TYPE: Record<ExpressionDataType, ConditionOperator[]> = {
  string: [...COMMON_OPERATORS, ...STRING_OPERATORS],
  number: [...COMMON_OPERATORS, ...NUMERIC_OPERATORS],
  integer: [...COMMON_OPERATORS, ...NUMERIC_OPERATORS],
  boolean: ['equals', 'not_equals', 'is_blank', 'is_not_blank'],
  date: [...COMMON_OPERATORS, ...DATE_OPERATORS],
  datetime: [...COMMON_OPERATORS, ...DATE_OPERATORS],
  enum: ['equals', 'not_equals', 'is_blank', 'is_not_blank', 'in_list', 'not_in_list'],
  lookup: [...COMMON_OPERATORS, ...LOOKUP_OPERATORS],
  list: ['is_blank', 'is_not_blank', 'in_list', 'not_in_list'],
  money: [...COMMON_OPERATORS, ...NUMERIC_OPERATORS],
  quantity: [...COMMON_OPERATORS, ...NUMERIC_OPERATORS],
};

export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: 'Equals',
  not_equals: 'Not Equals',
  is_blank: 'Is Blank',
  is_not_blank: 'Is Not Blank',
  in_list: 'In List',
  not_in_list: 'Not In List',
  greater_than: 'Greater Than',
  greater_than_or_equal: '≥ Greater Than or Equal',
  less_than: 'Less Than',
  less_than_or_equal: '≤ Less Than or Equal',
  between: 'Between',
  not_between: 'Not Between',
  contains: 'Contains',
  does_not_contain: 'Does Not Contain',
  starts_with: 'Starts With',
  ends_with: 'Ends With',
  before: 'Before',
  after: 'After',
  on: 'On',
  on_or_before: 'On or Before',
  on_or_after: 'On or After',
  within_range: 'Within Range',
  lookup_id_equals: 'Lookup ID Equals',
  lookup_code_equals: 'Lookup Code Equals',
  lookup_attribute_equals: 'Lookup Attribute Equals',
};

// ═══════════════════════════════════════════════════════════════
// Field Binding — EXP-FLD-001 through EXP-FLD-006
// ═══════════════════════════════════════════════════════════════
export interface FieldBinding {
  fieldId: string;              // Stable field identifier — EXP-FLD-001
  fieldApiName: string;         // API name for lookups
  displayLabel: string;         // Snapshot of display label — EXP-FLD-002
  dataType: ExpressionDataType;
  entityType: string;
  isRequired?: boolean;
  isActive?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Condition Tree — COND-BLD-001 through COND-BLD-013
// ═══════════════════════════════════════════════════════════════
export type LogicOperator = 'AND' | 'OR';

export interface ConditionNode {
  id: string;
  fieldId: string;
  fieldApiName: string;
  fieldLabel: string;
  dataType: ExpressionDataType;
  operator: ConditionOperator;
  value?: unknown;          // Literal value (number, string, date, etc.)
  valueTo?: unknown;        // Second value for 'between' / 'not_between' / 'within_range'
  valueList?: unknown[];    // List values for 'in_list' / 'not_in_list'
}

export interface ConditionGroup {
  id: string;
  logic: LogicOperator;
  conditions: ConditionNode[];
  groups: ConditionGroup[];  // Nested groups — COND-BLD-004
}

export interface ConditionTree {
  id: string;
  rootGroup: ConditionGroup;
  description?: string;
  entityType: string;
  documentType?: string;
}

// ═══════════════════════════════════════════════════════════════
// Formula — FORM-BLD-001 through FORM-BLD-012
// ═══════════════════════════════════════════════════════════════
export type FormulaTokenType = 'field' | 'operator' | 'number' | 'function' | 'open_paren' | 'close_paren' | 'comma' | 'string';

export interface FormulaToken {
  type: FormulaTokenType;
  value: string;
  fieldId?: string;          // For 'field' tokens — stable field binding
  functionName?: string;     // For 'function' tokens
}

export interface FormulaDefinition {
  id: string;
  expression: string;            // Human-readable expression string
  tokens: FormulaToken[];        // Parsed token array (executable metadata) — FORM-BLD-011
  outputType: ExpressionDataType;
  entityType: string;
  documentType?: string;
  fieldBindings: FieldBinding[]; // All referenced fields
  description?: string;
}

// ═══════════════════════════════════════════════════════════════
// Function Library — EXP-FUNC-001 through EXP-FUNC-013
// ═══════════════════════════════════════════════════════════════
export interface ApprovedFunction {
  name: string;
  description: string;
  inputTypes: ExpressionDataType[][];  // Array of valid input signatures
  outputType: ExpressionDataType;
  minArgs: number;
  maxArgs: number;
  examples: string[];
}

export const APPROVED_FUNCTIONS: ApprovedFunction[] = [
  {
    name: 'round',
    description: 'Rounds a number to specified precision',
    inputTypes: [['number', 'integer']],
    outputType: 'number',
    minArgs: 1,
    maxArgs: 2,
    examples: ['round(amount, 2)', 'round(percentage)'],
  },
  {
    name: 'abs',
    description: 'Returns absolute value',
    inputTypes: [['number']],
    outputType: 'number',
    minArgs: 1,
    maxArgs: 1,
    examples: ['abs(difference)'],
  },
  {
    name: 'min',
    description: 'Returns the minimum value',
    inputTypes: [['number', 'number']],
    outputType: 'number',
    minArgs: 2,
    maxArgs: Infinity,
    examples: ['min(qty_ordered, qty_available)'],
  },
  {
    name: 'max',
    description: 'Returns the maximum value',
    inputTypes: [['number', 'number']],
    outputType: 'number',
    minArgs: 2,
    maxArgs: Infinity,
    examples: ['max(base_price, min_price)'],
  },
  {
    name: 'sum',
    description: 'Returns sum of values',
    inputTypes: [['list']],
    outputType: 'number',
    minArgs: 1,
    maxArgs: Infinity,
    examples: ['sum(line_amounts)'],
  },
  {
    name: 'coalesce',
    description: 'Returns first non-null value',
    inputTypes: [['string', 'string']],
    outputType: 'string',
    minArgs: 2,
    maxArgs: Infinity,
    examples: ['coalesce(preferred_name, legal_name)'],
  },
  {
    name: 'if',
    description: 'Returns trueValue when condition is true, otherwise falseValue',
    inputTypes: [['boolean', 'number', 'number']],
    outputType: 'number',
    minArgs: 3,
    maxArgs: 3,
    examples: ['if(is_taxable, taxable_amount, 0)'],
  },
  {
    name: 'dateDiff',
    description: 'Returns difference between two dates',
    inputTypes: [['date', 'date', 'string']],
    outputType: 'integer',
    minArgs: 2,
    maxArgs: 3,
    examples: ['dateDiff(due_date, invoice_date, "days")'],
  },
  {
    name: 'percentage',
    description: 'Calculates percentage: base * rate / 100',
    inputTypes: [['number', 'number']],
    outputType: 'number',
    minArgs: 2,
    maxArgs: 2,
    examples: ['percentage(base_amount, discount_rate)'],
  },
  {
    name: 'clamp',
    description: 'Clamps value between min and max',
    inputTypes: [['number', 'number', 'number']],
    outputType: 'number',
    minArgs: 3,
    maxArgs: 3,
    examples: ['clamp(deviation, -5, 5)'],
  },
];

// ═══════════════════════════════════════════════════════════════
// Expression Evaluation Result — EXP-RUN-001 through EXP-RUN-011
// ═══════════════════════════════════════════════════════════════
export interface EvaluationTrace {
  fieldId: string;
  fieldApiName: string;
  resolvedValue: unknown;
}

export interface ExpressionResult {
  success: boolean;
  value: unknown;
  outputType?: ExpressionDataType;
  error?: {
    code: string;
    message: string;
    fieldRef?: string;
  };
  trace: EvaluationTrace[];  // EXP-RUN-011
}

// ═══════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════
export interface ExpressionValidationIssue {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning';
  position?: { start: number; end: number };
}

export interface ExpressionValidationResult {
  valid: boolean;
  issues: ExpressionValidationIssue[];
}

// EXP-SEC-004 / EXP-SEC-006: Complexity limits
export const EXPRESSION_LIMITS = {
  maxConditionDepth: 5,         // Max nesting of groups
  maxConditionsPerGroup: 20,
  maxFormulaLength: 500,
  maxFormulaTokens: 100,
  maxFunctionNesting: 3,
} as const;

/**
 * Validates a condition tree structure — COND-BLD-009
 */
export function validateConditionTree(tree: ConditionTree): ExpressionValidationResult {
  const issues: ExpressionValidationIssue[] = [];

  if (!tree.rootGroup) {
    issues.push({ code: 'NO_ROOT_GROUP', message: 'Condition tree must have a root group.', severity: 'error' });
    return { valid: false, issues };
  }

  validateGroup(tree.rootGroup, 0, issues);

  return { valid: issues.every(i => i.severity !== 'error'), issues };
}

function validateGroup(group: ConditionGroup, depth: number, issues: ExpressionValidationIssue[]): void {
  if (depth > EXPRESSION_LIMITS.maxConditionDepth) {
    issues.push({
      code: 'MAX_DEPTH_EXCEEDED',
      message: `Condition nesting exceeds maximum depth of ${EXPRESSION_LIMITS.maxConditionDepth}.`,
      severity: 'error',
    });
    return;
  }

  if (group.conditions.length === 0 && group.groups.length === 0) {
    issues.push({
      code: 'EMPTY_GROUP',
      message: 'Condition group must have at least one condition or nested group.',
      severity: 'error',
    });
  }

  if (group.conditions.length > EXPRESSION_LIMITS.maxConditionsPerGroup) {
    issues.push({
      code: 'TOO_MANY_CONDITIONS',
      message: `Group exceeds maximum of ${EXPRESSION_LIMITS.maxConditionsPerGroup} conditions.`,
      severity: 'error',
    });
  }

  for (const cond of group.conditions) {
    validateConditionNode(cond, issues);
  }

  for (const nested of group.groups) {
    validateGroup(nested, depth + 1, issues);
  }
}

function validateConditionNode(node: ConditionNode, issues: ExpressionValidationIssue[]): void {
  if (!node.fieldId) {
    issues.push({ code: 'FIELD_REQUIRED', message: 'Condition must have a field.', field: node.id, severity: 'error' });
  }
  if (!node.operator) {
    issues.push({ code: 'OPERATOR_REQUIRED', message: 'Condition must have an operator.', field: node.id, severity: 'error' });
  }

  // Check operator is valid for the data type — COND-BLD-012
  if (node.dataType && node.operator) {
    const allowed = OPERATORS_BY_TYPE[node.dataType];
    if (allowed && !allowed.includes(node.operator)) {
      issues.push({
        code: 'INVALID_OPERATOR_FOR_TYPE',
        message: `Operator "${node.operator}" is not supported for data type "${node.dataType}".`,
        field: node.id,
        severity: 'error',
      });
    }
  }

  // Value required for operators that need it — COND-BLD-009
  const noValueOps: ConditionOperator[] = ['is_blank', 'is_not_blank'];
  if (!noValueOps.includes(node.operator)) {
    if (node.operator === 'in_list' || node.operator === 'not_in_list') {
      if (!node.valueList || node.valueList.length === 0) {
        issues.push({ code: 'VALUE_LIST_REQUIRED', message: 'List value is required for in/not-in operators.', field: node.id, severity: 'error' });
      }
    } else if (node.operator === 'between' || node.operator === 'not_between' || node.operator === 'within_range') {
      if (node.value === undefined || node.value === null || node.value === '') {
        issues.push({ code: 'VALUE_REQUIRED', message: 'Start value is required.', field: node.id, severity: 'error' });
      }
      if (node.valueTo === undefined || node.valueTo === null || node.valueTo === '') {
        issues.push({ code: 'VALUE_TO_REQUIRED', message: 'End value is required for range operators.', field: node.id, severity: 'error' });
      }
    } else {
      if (node.value === undefined || node.value === null || node.value === '') {
        issues.push({ code: 'VALUE_REQUIRED', message: 'Value is required.', field: node.id, severity: 'error' });
      }
    }
  }
}

/**
 * Validates a formula definition — FORM-BLD-006
 */
export function validateFormulaDefinition(formula: FormulaDefinition): ExpressionValidationResult {
  const issues: ExpressionValidationIssue[] = [];

  if (!formula.expression || formula.expression.trim().length === 0) {
    issues.push({ code: 'FORMULA_EMPTY', message: 'Formula expression cannot be empty.', severity: 'error' });
    return { valid: false, issues };
  }

  if (formula.expression.length > EXPRESSION_LIMITS.maxFormulaLength) {
    issues.push({
      code: 'FORMULA_TOO_LONG',
      message: `Formula exceeds maximum length of ${EXPRESSION_LIMITS.maxFormulaLength} characters.`,
      severity: 'error',
    });
  }

  if (formula.tokens.length > EXPRESSION_LIMITS.maxFormulaTokens) {
    issues.push({
      code: 'TOO_MANY_TOKENS',
      message: `Formula exceeds maximum of ${EXPRESSION_LIMITS.maxFormulaTokens} tokens.`,
      severity: 'error',
    });
  }

  // Check parentheses balancing
  let parenDepth = 0;
  let maxFuncNesting = 0;
  let funcNesting = 0;
  for (const token of formula.tokens) {
    if (token.type === 'open_paren') {
      parenDepth++;
    } else if (token.type === 'close_paren') {
      parenDepth--;
      if (parenDepth < 0) {
        issues.push({ code: 'UNMATCHED_PAREN', message: 'Unmatched closing parenthesis.', severity: 'error' });
        break;
      }
    } else if (token.type === 'function') {
      funcNesting++;
      maxFuncNesting = Math.max(maxFuncNesting, funcNesting);
    }
    if (token.type === 'close_paren' && funcNesting > 0) {
      funcNesting--;
    }
  }
  if (parenDepth !== 0) {
    issues.push({ code: 'UNCLOSED_PAREN', message: 'Unclosed opening parenthesis.', severity: 'error' });
  }

  if (maxFuncNesting > EXPRESSION_LIMITS.maxFunctionNesting) {
    issues.push({
      code: 'FUNCTION_NESTING_EXCEEDED',
      message: `Function nesting exceeds maximum of ${EXPRESSION_LIMITS.maxFunctionNesting}.`,
      severity: 'error',
    });
  }

  // Check function tokens reference approved functions — EXP-FUNC-013
  const approvedNames = new Set(APPROVED_FUNCTIONS.map(f => f.name));
  for (const token of formula.tokens) {
    if (token.type === 'function' && !approvedNames.has(token.value)) {
      issues.push({
        code: 'UNAPPROVED_FUNCTION',
        message: `Function "${token.value}" is not in the approved function catalog.`,
        severity: 'error',
      });
    }
  }

  // Check field tokens have bindings
  const boundFieldIds = new Set(formula.fieldBindings.map(b => b.fieldId));
  for (const token of formula.tokens) {
    if (token.type === 'field' && token.fieldId && !boundFieldIds.has(token.fieldId)) {
      issues.push({
        code: 'UNBOUND_FIELD',
        message: `Field "${token.value}" (${token.fieldId}) has no binding.`,
        field: token.fieldId,
        severity: 'error',
      });
    }
  }

  return { valid: issues.every(i => i.severity !== 'error'), issues };
}

/**
 * Get readable description for a condition tree — COND-BLD-010
 */
export function conditionToReadable(group: ConditionGroup): string {
  const parts: string[] = [];

  for (const cond of group.conditions) {
    const opLabel = OPERATOR_LABELS[cond.operator] ?? cond.operator;
    let desc = `${cond.fieldLabel} ${opLabel}`;
    if (cond.value !== undefined && cond.value !== null) {
      desc += ` ${String(cond.value)}`;
    }
    if (cond.valueTo !== undefined && cond.valueTo !== null) {
      desc += ` and ${String(cond.valueTo)}`;
    }
    if (cond.valueList && cond.valueList.length > 0) {
      desc += ` [${cond.valueList.join(', ')}]`;
    }
    parts.push(desc);
  }

  for (const nested of group.groups) {
    parts.push(`(${conditionToReadable(nested)})`);
  }

  return parts.join(` ${group.logic} `);
}
