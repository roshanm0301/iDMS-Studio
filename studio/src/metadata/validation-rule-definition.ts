import {
  METADATA_STATUSES,
  type MetadataAudit,
  type MetadataStatus,
  type MetadataVersionRef,
  type OwnershipScope,
} from './shared';
import {
  fail,
  isPlainObject,
  ok,
  requireApiName,
  requireOneOf,
  requireString,
  type ValidationIssue,
  type ValidationResult,
} from './validation';

export const VALIDATION_RULE_TYPES = [
  'required_when',
  'range_check',
  'format_check',
  'cross_field',
  'relationship_exists',
  'state_transition_guard',
] as const;
export type ValidationRuleType = (typeof VALIDATION_RULE_TYPES)[number];

export const VALIDATION_TRIGGERS = [
  'before_create',
  'before_update',
  'before_submit',
  'before_approve',
  'before_close',
  'before_delete',
] as const;
export type ValidationTrigger = (typeof VALIDATION_TRIGGERS)[number];

export const VALIDATION_SEVERITIES = ['info', 'warning', 'error', 'blocking_error'] as const;
export type ValidationRuleSeverity = (typeof VALIDATION_SEVERITIES)[number];

export const EXPRESSION_OPERATORS = [
  'and',
  'or',
  'not',
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'not_in',
  'is_empty',
  'is_not_empty',
] as const;
export type ExpressionOperator = (typeof EXPRESSION_OPERATORS)[number];

export interface RuleExpression {
  op: ExpressionOperator;
  field?: string;
  value?: string | number | boolean | null | string[] | number[];
  conditions?: RuleExpression[];
}

export interface ValidationRuleDefinitionMetadata {
  validationRuleId: string;
  entityId: string;
  apiName: string;
  label: string;
  description?: string;
  ruleType: ValidationRuleType;
  triggers: ValidationTrigger[];
  severity: ValidationRuleSeverity;
  expression: RuleExpression;
  message: string;
  ownership: OwnershipScope;
  lifecycle: {
    metadataStatus: MetadataStatus;
  };
  version?: MetadataVersionRef;
  audit?: MetadataAudit;
}

function validateExpression(expression: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isPlainObject(expression)) {
    issues.push({ code: 'VAL_EXPRESSION_INVALID', message: 'Validation expression must be a structured object.', path, severity: 'error' });
    return;
  }

  if ('script' in expression || 'javascript' in expression || 'source' in expression) {
    issues.push({
      code: 'VAL_ARBITRARY_CODE_FORBIDDEN',
      message: 'Validation expressions must be deterministic metadata, not arbitrary code.',
      path,
      severity: 'blocking_error',
    });
  }

  requireOneOf(expression.op, EXPRESSION_OPERATORS, `${path}.op`, 'VAL_EXPRESSION_OPERATOR_INVALID', 'Expression operator', issues);

  if ((expression.op === 'and' || expression.op === 'or') && (!Array.isArray(expression.conditions) || expression.conditions.length === 0)) {
    issues.push({ code: 'VAL_EXPRESSION_CONDITIONS_REQUIRED', message: 'Composite expressions require child conditions.', path: `${path}.conditions`, severity: 'error' });
  }

  if (Array.isArray(expression.conditions)) {
    expression.conditions.forEach((item, index) => validateExpression(item, `${path}.conditions.${index}`, issues));
  }
}

export function validateValidationRuleDefinition(input: unknown): ValidationResult<ValidationRuleDefinitionMetadata> {
  if (!isPlainObject(input)) {
    return fail([{ code: 'VAL_INVALID_SHAPE', message: 'ValidationRuleDefinition must be an object.', severity: 'error' }]);
  }

  const issues: ValidationIssue[] = [];
  requireString(input.validationRuleId, 'validationRuleId', 'VAL_ID_REQUIRED', 'Validation rule ID', issues);
  requireString(input.entityId, 'entityId', 'VAL_ENTITY_REQUIRED', 'Entity ID', issues);
  requireApiName(input.apiName, 'apiName', issues);
  requireString(input.label, 'label', 'VAL_LABEL_REQUIRED', 'Validation rule label', issues);
  requireOneOf(input.ruleType, VALIDATION_RULE_TYPES, 'ruleType', 'VAL_TYPE_INVALID', 'Validation rule type', issues);
  requireOneOf(input.severity, VALIDATION_SEVERITIES, 'severity', 'VAL_SEVERITY_INVALID', 'Validation severity', issues);
  requireString(input.message, 'message', 'VAL_MESSAGE_REQUIRED', 'Validation message', issues);

  if (!Array.isArray(input.triggers) || input.triggers.length === 0) {
    issues.push({ code: 'VAL_TRIGGER_REQUIRED', message: 'At least one validation trigger is required.', path: 'triggers', severity: 'error' });
  } else {
    input.triggers.forEach((trigger, index) => {
      requireOneOf(trigger, VALIDATION_TRIGGERS, `triggers.${index}`, 'VAL_TRIGGER_INVALID', 'Validation trigger', issues);
    });
  }

  validateExpression(input.expression, 'expression', issues);

  if (!isPlainObject(input.ownership)) {
    issues.push({ code: 'VAL_OWNERSHIP_REQUIRED', message: 'Validation rule ownership is required.', path: 'ownership', severity: 'error' });
  } else if (input.ownership.owningLayer === 'role') {
    issues.push({ code: 'VAL_ROLE_LAYER_FORBIDDEN', message: 'Role cannot own validation schema.', path: 'ownership.owningLayer', severity: 'blocking_error' });
  }

  if (!isPlainObject(input.lifecycle)) {
    issues.push({ code: 'VAL_LIFECYCLE_REQUIRED', message: 'Validation rule lifecycle is required.', path: 'lifecycle', severity: 'error' });
  } else {
    requireOneOf(input.lifecycle.metadataStatus, METADATA_STATUSES, 'lifecycle.metadataStatus', 'VAL_STATUS_INVALID', 'Metadata status', issues);
  }

  if (issues.some(item => item.severity !== 'warning')) return fail(issues);
  return ok(input as unknown as ValidationRuleDefinitionMetadata, issues);
}
