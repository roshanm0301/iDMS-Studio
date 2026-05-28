/**
 * Validation Engine — Metadata Types & Validators
 *
 * Implements: VAL-CAT-001 through VAL-CAT-017, VAL-EXEC-001 through VAL-EXEC-009,
 * VAL-SEV-001 through VAL-SEV-008, VAL-RESULT-001 through VAL-RESULT-008,
 * VAL-CONFIG-001 through VAL-CONFIG-007
 */

// ═══════════════════════════════════════════════════════════════
// Validation Categories — VAL-CAT-001 through VAL-CAT-017
// ═══════════════════════════════════════════════════════════════
export const VALIDATION_CATEGORIES = [
  'field_mandatory',
  'conditional_mandatory',
  'data_type',
  'range',
  'lookup_active',
  'permission',
  'source_eligibility',
  'source_line_eligibility',
  'single_source',
  'multi_source_compatibility',
  'quantity_cap',
  'lifecycle_status',
  'stale_data',
  'idempotency',
  'backend_parity',
  'config_dependency',
  'post_save_readonly',
] as const;
export type ValidationCategory = (typeof VALIDATION_CATEGORIES)[number];

export const VALIDATION_CATEGORY_LABELS: Record<ValidationCategory, string> = {
  field_mandatory: 'Field Mandatory',
  conditional_mandatory: 'Conditional Mandatory',
  data_type: 'Data Type',
  range: 'Range',
  lookup_active: 'Lookup Active',
  permission: 'Permission',
  source_eligibility: 'Source Eligibility',
  source_line_eligibility: 'Source Line Eligibility',
  single_source: 'Single Source',
  multi_source_compatibility: 'Multi-Source Compatibility',
  quantity_cap: 'Quantity Cap',
  lifecycle_status: 'Lifecycle / Status',
  stale_data: 'Stale Data',
  idempotency: 'Idempotency',
  backend_parity: 'Backend / API Parity',
  config_dependency: 'Configuration Dependency',
  post_save_readonly: 'Post-Save Read-Only',
};

// ═══════════════════════════════════════════════════════════════
// Execution Points — VAL-EXEC-001 through VAL-EXEC-009
// ═══════════════════════════════════════════════════════════════
export const EXECUTION_POINTS = [
  'on_load',
  'on_change',
  'on_calculate',
  'on_save',
  'on_submit',
  'post_commit',
] as const;
export type ExecutionPoint = (typeof EXECUTION_POINTS)[number];

export const EXECUTION_POINT_LABELS: Record<ExecutionPoint, string> = {
  on_load: 'On Load',
  on_change: 'On Field Change',
  on_calculate: 'On Calculate',
  on_save: 'On Save',
  on_submit: 'On Submit',
  post_commit: 'Post-Commit',
};

// ═══════════════════════════════════════════════════════════════
// Severity — VAL-SEV-001 through VAL-SEV-008
// ═══════════════════════════════════════════════════════════════
export const VALIDATION_SEVERITIES = ['block', 'warning', 'info'] as const;
export type ValidationSeverity = (typeof VALIDATION_SEVERITIES)[number];

export const SEVERITY_LABELS: Record<ValidationSeverity, string> = {
  block: 'Block',
  warning: 'Warning',
  info: 'Info',
};

export const SEVERITY_COLORS: Record<ValidationSeverity, { bg: string; color: string }> = {
  block: { bg: '#FEE2E2', color: '#991B1B' },
  warning: { bg: '#FEF3C7', color: '#92400E' },
  info: { bg: '#DBEAFE', color: '#1E40AF' },
};

// ═══════════════════════════════════════════════════════════════
// Validation Rule Definition — VAL-CONFIG-001 through VAL-CONFIG-007
// ═══════════════════════════════════════════════════════════════
export interface ValidationRuleConfig {
  id: string;
  ruleVersionId: string;            // Links to RuleVersion
  familyId: string;                 // Links to RuleFamily
  category: ValidationCategory;
  executionPoints: ExecutionPoint[];
  severity: ValidationSeverity;
  entityType: string;
  documentType?: string;

  // Condition reference — VAL-UI-003
  conditionRef?: string;            // Links to ConditionTree

  // Message configuration — VAL-CONFIG-004, VAL-CONFIG-005
  messageTemplate: string;          // e.g. "{{field_label}} is required for {{document_type}}"
  messageParams?: string[];         // Field API names used in template
  remediationHint?: string;         // VAL-RESULT-008

  // Context binding for result — VAL-RESULT-005/006/007
  fieldRef?: string;                // Field API name this validation relates to
  lineRef?: string;                 // Line-level scope (e.g. "lines[0]")
  sourceRef?: string;               // Source document reference

  // Governance
  nonOverridable: boolean;          // VAL-SEV-008, VAL-CONFIG-006
  allowSeverityDowngrade: boolean;  // VAL-SEV-007
  createdBy: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Runtime Validation Result — VAL-RESULT-001 through VAL-RESULT-008
// ═══════════════════════════════════════════════════════════════
export interface ValidationResult {
  validationId: string;             // VAL-RESULT-001
  ruleVersionId: string;            // VAL-RESULT-002
  severity: ValidationSeverity;     // VAL-RESULT-003
  message: string;                  // VAL-RESULT-004
  fieldRef?: string;                // VAL-RESULT-005
  lineRef?: string;                 // VAL-RESULT-006
  sourceRef?: string;               // VAL-RESULT-007
  remediationHint?: string;         // VAL-RESULT-008
  category: ValidationCategory;
  executionPoint: ExecutionPoint;
  acknowledged?: boolean;           // For warnings — VAL-SEV-005
}

export interface ValidationRunResult {
  passed: boolean;
  results: ValidationResult[];
  blockers: ValidationResult[];
  warnings: ValidationResult[];
  infos: ValidationResult[];
  executedAt: string;
  executionPointUsed: ExecutionPoint;
}

// ═══════════════════════════════════════════════════════════════
// Source Eligibility Config — VAL-SRC-001 through VAL-SRC-011
// ═══════════════════════════════════════════════════════════════
export interface SourceEligibilityConfig {
  allowedSourceTypes: string[];
  requireCommittedSource: boolean;
  eligibleStatuses: string[];
  ineligibleStatuses: string[];
  requirePendingQuantity: boolean;
  requireSaveTimeRecheck: boolean;  // VAL-SRC-011 — mandatory for source-based
}

// ═══════════════════════════════════════════════════════════════
// Multi-Source Compatibility — VAL-MSRC-001 through VAL-MSRC-005
// ═══════════════════════════════════════════════════════════════
export interface MultiSourceConfig {
  allowMultiSource: boolean;
  allowMixedSourceTypes: boolean;
  compatibilityFields: string[];    // Fields that must match across sources
}

// ═══════════════════════════════════════════════════════════════
// Validation helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Renders a message template with field values from context
 */
export function renderMessageTemplate(
  template: string,
  context: Record<string, unknown>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = context[key];
    if (val === undefined || val === null) return `[${key}]`;
    return String(val);
  });
}

/**
 * Validates a ValidationRuleConfig structure
 */
export function validateValidationRuleConfig(config: ValidationRuleConfig): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!config.id) issues.push('Validation rule ID is required.');
  if (!config.category) issues.push('Category is required.');
  if (!config.entityType) issues.push('Entity type is required.');
  if (!config.executionPoints || config.executionPoints.length === 0) {
    issues.push('At least one execution point is required.');
  }
  if (!config.messageTemplate || config.messageTemplate.trim().length === 0) {
    issues.push('Message template is required.');
  }

  // VAL-SEV-008: Non-overridable cannot be downgraded
  if (config.nonOverridable && config.allowSeverityDowngrade) {
    issues.push('Non-overridable validations cannot allow severity downgrade.');
  }

  // Non-overridable must be block severity
  if (config.nonOverridable && config.severity !== 'block') {
    issues.push('Non-overridable validations must have "block" severity.');
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Simulates running a set of validation rules against a payload
 * Supports fail-fast (VAL-API-004) or collect-all modes.
 */
export function executeValidations(
  configs: ValidationRuleConfig[],
  executionPoint: ExecutionPoint,
  context: Record<string, unknown>,
  conditionEvaluator: (conditionRef: string, ctx: Record<string, unknown>) => boolean,
  options?: { failFast?: boolean },
): ValidationRunResult {
  const results: ValidationResult[] = [];

  const applicable = configs.filter(c => c.executionPoints.includes(executionPoint));

  for (const config of applicable) {
    // If condition is defined, evaluate it
    if (config.conditionRef) {
      const conditionMet = conditionEvaluator(config.conditionRef, context);
      if (!conditionMet) continue; // Condition not met — validation passes (no violation)
    }

    // Condition met OR no condition — this means validation triggers (violation found)
    const message = renderMessageTemplate(config.messageTemplate, context);
    results.push({
      validationId: config.id,
      ruleVersionId: config.ruleVersionId,
      severity: config.severity,
      message,
      category: config.category,
      executionPoint,
      remediationHint: config.remediationHint,
      fieldRef: config.fieldRef,
      lineRef: config.lineRef,
      sourceRef: config.sourceRef,
    });

    // VAL-API-004: fail-fast mode — stop after first blocker
    if (options?.failFast && config.severity === 'block') break;
  }

  const blockers = results.filter(r => r.severity === 'block');
  const warnings = results.filter(r => r.severity === 'warning');
  const infos = results.filter(r => r.severity === 'info');

  return {
    passed: blockers.length === 0,
    results,
    blockers,
    warnings,
    infos,
    executedAt: new Date().toISOString(),
    executionPointUsed: executionPoint,
  };
}
