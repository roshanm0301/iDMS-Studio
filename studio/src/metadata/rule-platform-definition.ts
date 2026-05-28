/**
 * Rule Platform Foundation — Metadata Types & Validators
 *
 * Implements: RULE-FND-001 through RULE-FND-010, RULE-LC-001 through RULE-LC-010,
 * RULE-VER-001 through RULE-VER-010, RULE-SCOPE-001 through RULE-SCOPE-014,
 * RULE-EFF-001 through RULE-EFF-007
 */
import type { MetadataAudit, MetadataIdentity, OwnershipScope, StructuralLayer } from './shared';
import {
  fail,
  hasBlockingIssue,
  isPlainObject,
  issue,
  ok,
  requireApiName,
  requireOneOf,
  requireString,
  type ValidationIssue,
  type ValidationResult,
} from './validation';

// ═══════════════════════════════════════════════════════════════
// Rule Types — RULE-FND-006
// ═══════════════════════════════════════════════════════════════
export const RULE_TYPES = [
  'validation',
  'calculation',
  'charge',
  'tax',
  'accounting',
  'approval_decision',
  'workflow_decision',
  'field_behavior',
  'output_rule',
  'integration_rule',
] as const;
export type RuleType = (typeof RULE_TYPES)[number];

// ═══════════════════════════════════════════════════════════════
// Rule Lifecycle States — RULE-LC-001
// ═══════════════════════════════════════════════════════════════
export const RULE_LIFECYCLE_STATES = [
  'draft',
  'in_review',
  'approved',
  'published',
  'retired',
  'rejected',
  'archived',
] as const;
export type RuleLifecycleState = (typeof RULE_LIFECYCLE_STATES)[number];

// ═══════════════════════════════════════════════════════════════
// Valid Lifecycle Transitions — RULE-LC-009
// ═══════════════════════════════════════════════════════════════
export const VALID_LIFECYCLE_TRANSITIONS: Record<RuleLifecycleState, RuleLifecycleState[]> = {
  draft: ['in_review'],
  in_review: ['draft', 'approved', 'rejected'],
  approved: ['published'],
  published: ['retired'],
  retired: ['published'], // Rollback/reactivation only through governance
  rejected: [], // Must create new draft version — no transitions allowed
  archived: [],
};

// ═══════════════════════════════════════════════════════════════
// Scope Priority — RULE-SCOPE-012
// Default specificity order (most specific first):
// Role > Branch > Business Unit > Organization > Tenant > Platform
// ═══════════════════════════════════════════════════════════════
export const SCOPE_PRIORITY_ORDER = [
  'role',
  'branch',
  'business_unit',
  'organization',
  'tenant',
  'platform',
] as const;
export type ScopePriorityLevel = (typeof SCOPE_PRIORITY_ORDER)[number];

// ═══════════════════════════════════════════════════════════════
// Rule Scope — RULE-SCOPE-001 through RULE-SCOPE-009
// ═══════════════════════════════════════════════════════════════
export interface RuleScope {
  tenantId: string;
  organizationId?: string;
  businessUnitId?: string;
  branchId?: string;
  roleId?: string;
  entityType?: string;
  documentType?: string;
  /** Custom transaction context fields if domain engine allows */
  contextFields?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════
// Effective Dating — RULE-EFF-001 through RULE-EFF-007
// ═══════════════════════════════════════════════════════════════
export interface EffectiveDateRange {
  effectiveFrom: string; // ISO date string
  effectiveTo?: string;  // ISO date string — must be > effectiveFrom when provided
}

// ═══════════════════════════════════════════════════════════════
// Rule Family — RULE-FND-002, RULE-FND-005
// ═══════════════════════════════════════════════════════════════
export interface RuleFamily {
  familyId: string;
  ruleCode: string; // Stable code across versions — RULE-FND-005
  ruleType: RuleType;
  displayName: string;
  description?: string;
  domain?: string;
  entityType?: string;
  documentType?: string;
  ownership: OwnershipScope;
  audit: MetadataAudit;
}

// ═══════════════════════════════════════════════════════════════
// Rule Version — RULE-FND-003, RULE-FND-004, RULE-FND-008, RULE-FND-009
// ═══════════════════════════════════════════════════════════════
export interface RuleVersion {
  versionId: string;          // Unique system-generated — RULE-FND-004
  familyId: string;           // Belongs to exactly one family — RULE-FND-002
  versionLabel: string;       // e.g. "1.0", "1.1", "2.0" — RULE-VER-001
  majorVersion: number;
  minorVersion: number;
  lifecycleState: RuleLifecycleState;
  scope: RuleScope;
  effectiveDate: EffectiveDateRange;
  priorityOrder: number;

  // Metadata — RULE-FND-008
  displayName: string;
  description?: string;
  ruleType: RuleType;
  domain?: string;
  entityType?: string;
  documentType?: string;

  // References to engine-specific configuration — RULE-FND-009
  expressionRef?: string;
  conditionRef?: string;
  actionRef?: string;
  outputRef?: string;
  domainConfigRef?: string;

  // Dependency metadata
  dependsOn?: string[];       // other rule version IDs this depends on
  nonOverridable?: boolean;   // RULE-SCOPE-014 — cannot be weakened by more specific scope

  // Audit — RULE-VER-009
  createdBy: string;
  createdAt: string;
  submittedBy?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedBy?: string;
  publishedAt?: string;
  retiredBy?: string;
  retiredAt?: string;

  // Runtime usage tracking — RULE-VER-010
  usedInRuntime?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Rule Registry Entry (for list views)
// ═══════════════════════════════════════════════════════════════
export interface RuleRegistryEntry {
  familyId: string;
  ruleCode: string;
  displayName: string;
  description?: string;
  ruleType: RuleType;
  domain?: string;
  entityType?: string;
  documentType?: string;
  currentVersion: string;
  lifecycleState: RuleLifecycleState;
  versionCount: number;
  publishedVersionId?: string;
  lastModified: string;
  lastModifiedBy: string;
  ownership: OwnershipScope;
}

// ═══════════════════════════════════════════════════════════════
// Publish Validation — RULE-LC-010
// ═══════════════════════════════════════════════════════════════
export interface PublishValidationResult {
  canPublish: boolean;
  blockingIssues: ValidationIssue[];
  warnings: ValidationIssue[];
}

// ═══════════════════════════════════════════════════════════════
// VALIDATORS
// ═══════════════════════════════════════════════════════════════

/**
 * Validates a lifecycle transition — RULE-LC-009
 */
export function validateLifecycleTransition(
  fromState: RuleLifecycleState,
  toState: RuleLifecycleState,
): ValidationResult<{ from: RuleLifecycleState; to: RuleLifecycleState }> {
  const issues: ValidationIssue[] = [];
  const allowed = VALID_LIFECYCLE_TRANSITIONS[fromState];

  if (!allowed || !allowed.includes(toState)) {
    issues.push(
      issue(
        'INVALID_LIFECYCLE_TRANSITION',
        `Transition from "${fromState}" to "${toState}" is not allowed.`,
        'lifecycleState',
      ),
    );
    return fail(issues);
  }

  return ok({ from: fromState, to: toState });
}

/**
 * Validates a RuleFamily definition
 */
export function validateRuleFamily(input: unknown): ValidationResult<RuleFamily> {
  const issues: ValidationIssue[] = [];

  if (!isPlainObject(input)) {
    issues.push(issue('INVALID_INPUT', 'Rule family input must be an object.'));
    return fail(issues);
  }

  requireString(input.familyId, 'familyId', 'FAMILY_ID_REQUIRED', 'Family ID', issues);
  requireApiName(input.ruleCode, 'ruleCode', issues);
  requireOneOf(input.ruleType, RULE_TYPES, 'ruleType', 'RULE_TYPE_INVALID', 'Rule type', issues);
  requireString(input.displayName, 'displayName', 'DISPLAY_NAME_REQUIRED', 'Display name', issues);

  if (hasBlockingIssue(issues)) return fail(issues);
  return ok(input as unknown as RuleFamily, issues);
}

/**
 * Validates effective date range — RULE-EFF-003
 */
export function validateEffectiveDateRange(range: EffectiveDateRange): ValidationResult<EffectiveDateRange> {
  const issues: ValidationIssue[] = [];

  if (!range.effectiveFrom) {
    issues.push(issue('EFFECTIVE_FROM_REQUIRED', 'Effective From date is required.', 'effectiveFrom'));
    return fail(issues);
  }

  const from = new Date(range.effectiveFrom);
  if (isNaN(from.getTime())) {
    issues.push(issue('EFFECTIVE_FROM_INVALID', 'Effective From must be a valid date.', 'effectiveFrom'));
    return fail(issues);
  }

  if (range.effectiveTo) {
    const to = new Date(range.effectiveTo);
    if (isNaN(to.getTime())) {
      issues.push(issue('EFFECTIVE_TO_INVALID', 'Effective To must be a valid date.', 'effectiveTo'));
      return fail(issues);
    }
    if (to <= from) {
      issues.push(
        issue(
          'EFFECTIVE_TO_BEFORE_FROM',
          'Effective To must be greater than Effective From.',
          'effectiveTo',
        ),
      );
      return fail(issues);
    }
  }

  return ok(range);
}

/**
 * Validates a RuleVersion for publish readiness — RULE-LC-010
 */
export function validatePublishReadiness(version: RuleVersion): PublishValidationResult {
  const blockingIssues: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Must be in 'approved' state to publish
  if (version.lifecycleState !== 'approved') {
    blockingIssues.push(
      issue(
        'NOT_APPROVED',
        `Rule version must be in "approved" state to publish. Current: "${version.lifecycleState}".`,
        'lifecycleState',
      ),
    );
  }

  // Effective date validation
  const dateResult = validateEffectiveDateRange(version.effectiveDate);
  if (!dateResult.valid) {
    blockingIssues.push(...dateResult.issues);
  }

  // Scope must have at least tenant
  if (!version.scope.tenantId) {
    blockingIssues.push(
      issue('SCOPE_TENANT_REQUIRED', 'Rule scope must include a tenant ID.', 'scope.tenantId'),
    );
  }

  // Must have at least one configuration reference (domain-specific check)
  const hasConfig =
    version.expressionRef || version.conditionRef || version.actionRef ||
    version.outputRef || version.domainConfigRef;
  if (!hasConfig) {
    warnings.push(
      issue(
        'NO_CONFIG_REF',
        'Rule version has no expression, condition, action, output, or domain configuration reference.',
        undefined,
        'warning',
      ),
    );
  }

  return {
    canPublish: blockingIssues.length === 0,
    blockingIssues,
    warnings,
  };
}

/**
 * Resolves scope priority — RULE-SCOPE-010, RULE-SCOPE-011, RULE-SCOPE-012
 * Returns a numeric priority (higher = more specific)
 */
export function resolveScopePriority(scope: RuleScope): number {
  let priority = 0;
  if (scope.tenantId) priority += 1;       // platform → tenant
  if (scope.organizationId) priority += 2;
  if (scope.businessUnitId) priority += 4;
  if (scope.branchId) priority += 8;
  if (scope.roleId) priority += 16;        // most specific
  if (scope.entityType) priority += 1;
  if (scope.documentType) priority += 1;
  return priority;
}

/**
 * Selects the most specific applicable rule version — RULE-SCOPE-010
 * Among matching versions, highest priority wins.
 */
export function selectBestMatch(
  candidates: RuleVersion[],
  transactionDate: string,
): RuleVersion | null {
  const now = new Date(transactionDate);
  const eligible = candidates.filter(v => {
    if (v.lifecycleState !== 'published') return false;
    const from = new Date(v.effectiveDate.effectiveFrom);
    if (now < from) return false;
    if (v.effectiveDate.effectiveTo) {
      const to = new Date(v.effectiveDate.effectiveTo);
      if (now > to) return false;
    }
    return true;
  });

  if (eligible.length === 0) return null;

  // Sort by scope priority descending, then by priority order descending,
  // then by versionId ascending for stable deterministic tie-breaking (RULE-SCOPE-010)
  eligible.sort((a, b) => {
    const pa = resolveScopePriority(a.scope);
    const pb = resolveScopePriority(b.scope);
    if (pb !== pa) return pb - pa;
    if (b.priorityOrder !== a.priorityOrder) return b.priorityOrder - a.priorityOrder;
    return a.versionId.localeCompare(b.versionId);
  });

  return eligible[0];
}
