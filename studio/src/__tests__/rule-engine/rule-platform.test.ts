/**
 * Rule Platform Foundation — Unit Tests
 *
 * Tests for: validators, lifecycle transitions, scope resolution,
 * effective date validation, publish readiness, and best-match selection.
 */
import { describe, it, expect } from 'vitest';
import {
  validateLifecycleTransition,
  validateRuleFamily,
  validateEffectiveDateRange,
  validatePublishReadiness,
  resolveScopePriority,
  selectBestMatch,
  VALID_LIFECYCLE_TRANSITIONS,
  RULE_TYPES,
  RULE_LIFECYCLE_STATES,
} from '../../metadata/rule-platform-definition';
import type { RuleVersion, RuleScope } from '../../metadata/rule-platform-definition';

// ═══════════════════════════════════════════════════════════════
// Lifecycle Transition Tests — RULE-LC-009
// ═══════════════════════════════════════════════════════════════
describe('validateLifecycleTransition', () => {
  it('allows draft → in_review', () => {
    const result = validateLifecycleTransition('draft', 'in_review');
    expect(result.valid).toBe(true);
  });

  it('allows in_review → approved', () => {
    const result = validateLifecycleTransition('in_review', 'approved');
    expect(result.valid).toBe(true);
  });

  it('allows in_review → draft (send back)', () => {
    const result = validateLifecycleTransition('in_review', 'draft');
    expect(result.valid).toBe(true);
  });

  it('allows in_review → rejected', () => {
    const result = validateLifecycleTransition('in_review', 'rejected');
    expect(result.valid).toBe(true);
  });

  it('allows approved → published', () => {
    const result = validateLifecycleTransition('approved', 'published');
    expect(result.valid).toBe(true);
  });

  it('allows published → retired', () => {
    const result = validateLifecycleTransition('published', 'retired');
    expect(result.valid).toBe(true);
  });

  it('allows retired → published (rollback)', () => {
    const result = validateLifecycleTransition('retired', 'published');
    expect(result.valid).toBe(true);
  });

  // Negative tests
  it('blocks draft → published (must go through review+approval)', () => {
    const result = validateLifecycleTransition('draft', 'published');
    expect(result.valid).toBe(false);
    expect(result.issues[0].code).toBe('INVALID_LIFECYCLE_TRANSITION');
  });

  it('blocks published → draft (must create new version)', () => {
    const result = validateLifecycleTransition('published', 'draft');
    expect(result.valid).toBe(false);
  });

  it('blocks rejected → published', () => {
    const result = validateLifecycleTransition('rejected', 'published');
    expect(result.valid).toBe(false);
  });

  it('blocks archived → any state', () => {
    for (const state of RULE_LIFECYCLE_STATES) {
      if (state === 'archived') continue;
      const result = validateLifecycleTransition('archived', state);
      expect(result.valid).toBe(false);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// Rule Family Validation Tests
// ═══════════════════════════════════════════════════════════════
describe('validateRuleFamily', () => {
  it('passes for valid input', () => {
    const result = validateRuleFamily({
      familyId: 'rf-001',
      ruleCode: 'test_rule',
      ruleType: 'validation',
      displayName: 'Test Rule',
      ownership: { owningLayer: 'platform', namespace: 'idms' },
      audit: { createdAt: '2026-01-01', createdBy: 'admin' },
    });
    expect(result.valid).toBe(true);
  });

  it('fails for missing familyId', () => {
    const result = validateRuleFamily({
      ruleCode: 'test_rule',
      ruleType: 'validation',
      displayName: 'Test Rule',
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.path === 'familyId')).toBe(true);
  });

  it('fails for invalid ruleCode (not snake_case)', () => {
    const result = validateRuleFamily({
      familyId: 'rf-001',
      ruleCode: 'InvalidCode',
      ruleType: 'validation',
      displayName: 'Test Rule',
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.path === 'ruleCode')).toBe(true);
  });

  it('fails for invalid ruleType', () => {
    const result = validateRuleFamily({
      familyId: 'rf-001',
      ruleCode: 'test_rule',
      ruleType: 'unknown_type',
      displayName: 'Test Rule',
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.path === 'ruleType')).toBe(true);
  });

  it('fails for non-object input', () => {
    const result = validateRuleFamily('not an object');
    expect(result.valid).toBe(false);
  });

  it('fails for null input', () => {
    const result = validateRuleFamily(null);
    expect(result.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// Effective Date Validation — RULE-EFF-003
// ═══════════════════════════════════════════════════════════════
describe('validateEffectiveDateRange', () => {
  it('passes with only effectiveFrom', () => {
    const result = validateEffectiveDateRange({
      effectiveFrom: '2026-01-01T00:00:00Z',
    });
    expect(result.valid).toBe(true);
  });

  it('passes when effectiveTo > effectiveFrom', () => {
    const result = validateEffectiveDateRange({
      effectiveFrom: '2026-01-01T00:00:00Z',
      effectiveTo: '2026-12-31T23:59:59Z',
    });
    expect(result.valid).toBe(true);
  });

  it('fails when effectiveTo <= effectiveFrom', () => {
    const result = validateEffectiveDateRange({
      effectiveFrom: '2026-06-01T00:00:00Z',
      effectiveTo: '2026-01-01T00:00:00Z',
    });
    expect(result.valid).toBe(false);
    expect(result.issues[0].code).toBe('EFFECTIVE_TO_BEFORE_FROM');
  });

  it('fails when effectiveTo equals effectiveFrom', () => {
    const result = validateEffectiveDateRange({
      effectiveFrom: '2026-06-01T00:00:00Z',
      effectiveTo: '2026-06-01T00:00:00Z',
    });
    expect(result.valid).toBe(false);
  });

  it('fails when effectiveFrom is empty', () => {
    const result = validateEffectiveDateRange({
      effectiveFrom: '',
    });
    expect(result.valid).toBe(false);
    expect(result.issues[0].code).toBe('EFFECTIVE_FROM_REQUIRED');
  });

  it('fails when effectiveFrom is invalid date', () => {
    const result = validateEffectiveDateRange({
      effectiveFrom: 'not-a-date',
    });
    expect(result.valid).toBe(false);
    expect(result.issues[0].code).toBe('EFFECTIVE_FROM_INVALID');
  });
});

// ═══════════════════════════════════════════════════════════════
// Publish Readiness — RULE-LC-010
// ═══════════════════════════════════════════════════════════════
describe('validatePublishReadiness', () => {
  const baseVersion: RuleVersion = {
    versionId: 'rv-test',
    familyId: 'rf-test',
    versionLabel: '1.0',
    majorVersion: 1,
    minorVersion: 0,
    lifecycleState: 'approved',
    scope: { tenantId: 'tenant-1' },
    effectiveDate: { effectiveFrom: '2026-01-01T00:00:00Z' },
    priorityOrder: 100,
    displayName: 'Test Rule',
    ruleType: 'validation',
    conditionRef: 'cond-001',
    createdBy: 'admin',
    createdAt: '2026-01-01T00:00:00Z',
    approvedBy: 'reviewer',
    approvedAt: '2026-01-02T00:00:00Z',
  };

  it('allows publish for approved version with valid config', () => {
    const result = validatePublishReadiness(baseVersion);
    expect(result.canPublish).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('blocks publish for non-approved version', () => {
    const result = validatePublishReadiness({ ...baseVersion, lifecycleState: 'draft' });
    expect(result.canPublish).toBe(false);
    expect(result.blockingIssues.some(i => i.code === 'NOT_APPROVED')).toBe(true);
  });

  it('blocks publish when tenant scope is missing', () => {
    const result = validatePublishReadiness({
      ...baseVersion,
      scope: { tenantId: '' },
    });
    expect(result.canPublish).toBe(false);
    expect(result.blockingIssues.some(i => i.code === 'SCOPE_TENANT_REQUIRED')).toBe(true);
  });

  it('warns when no configuration reference exists', () => {
    const result = validatePublishReadiness({
      ...baseVersion,
      conditionRef: undefined,
      expressionRef: undefined,
      actionRef: undefined,
      outputRef: undefined,
      domainConfigRef: undefined,
    });
    expect(result.canPublish).toBe(true); // warning, not blocking
    expect(result.warnings.some(i => i.code === 'NO_CONFIG_REF')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// Scope Resolution — RULE-SCOPE-010, RULE-SCOPE-012
// ═══════════════════════════════════════════════════════════════
describe('resolveScopePriority', () => {
  it('returns higher priority for more specific scope', () => {
    const tenantOnly: RuleScope = { tenantId: 'T1' };
    const withBranch: RuleScope = { tenantId: 'T1', branchId: 'B1' };
    const withRole: RuleScope = { tenantId: 'T1', branchId: 'B1', roleId: 'R1' };

    const pTenant = resolveScopePriority(tenantOnly);
    const pBranch = resolveScopePriority(withBranch);
    const pRole = resolveScopePriority(withRole);

    expect(pBranch).toBeGreaterThan(pTenant);
    expect(pRole).toBeGreaterThan(pBranch);
  });

  it('role scope has highest priority contribution', () => {
    const roleOnly: RuleScope = { tenantId: 'T1', roleId: 'R1' };
    const branchOnly: RuleScope = { tenantId: 'T1', branchId: 'B1' };

    expect(resolveScopePriority(roleOnly)).toBeGreaterThan(resolveScopePriority(branchOnly));
  });
});

// ═══════════════════════════════════════════════════════════════
// Best Match Selection — RULE-SCOPE-010, RULE-EFF-004
// ═══════════════════════════════════════════════════════════════
describe('selectBestMatch', () => {
  const makeVersion = (overrides: Partial<RuleVersion>): RuleVersion => ({
    versionId: 'rv-default',
    familyId: 'rf-default',
    versionLabel: '1.0',
    majorVersion: 1,
    minorVersion: 0,
    lifecycleState: 'published',
    scope: { tenantId: 'T1' },
    effectiveDate: { effectiveFrom: '2026-01-01T00:00:00Z' },
    priorityOrder: 100,
    displayName: 'Default',
    ruleType: 'validation',
    createdBy: 'admin',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  });

  it('selects published version matching transaction date', () => {
    const candidates = [
      makeVersion({ versionId: 'v1' }),
    ];
    const result = selectBestMatch(candidates, '2026-06-01T00:00:00Z');
    expect(result?.versionId).toBe('v1');
  });

  it('excludes non-published versions', () => {
    const candidates = [
      makeVersion({ versionId: 'v1', lifecycleState: 'draft' }),
    ];
    const result = selectBestMatch(candidates, '2026-06-01T00:00:00Z');
    expect(result).toBeNull();
  });

  it('excludes versions not yet effective', () => {
    const candidates = [
      makeVersion({ versionId: 'v1', effectiveDate: { effectiveFrom: '2027-01-01T00:00:00Z' } }),
    ];
    const result = selectBestMatch(candidates, '2026-06-01T00:00:00Z');
    expect(result).toBeNull();
  });

  it('excludes expired versions', () => {
    const candidates = [
      makeVersion({
        versionId: 'v1',
        effectiveDate: { effectiveFrom: '2025-01-01T00:00:00Z', effectiveTo: '2025-12-31T00:00:00Z' },
      }),
    ];
    const result = selectBestMatch(candidates, '2026-06-01T00:00:00Z');
    expect(result).toBeNull();
  });

  it('selects most specific scope when multiple versions match', () => {
    const candidates = [
      makeVersion({ versionId: 'v-tenant', scope: { tenantId: 'T1' } }),
      makeVersion({ versionId: 'v-branch', scope: { tenantId: 'T1', branchId: 'B1' } }),
    ];
    const result = selectBestMatch(candidates, '2026-06-01T00:00:00Z');
    expect(result?.versionId).toBe('v-branch');
  });

  it('falls back to priority order when scope is equal', () => {
    const candidates = [
      makeVersion({ versionId: 'v-low', priorityOrder: 50 }),
      makeVersion({ versionId: 'v-high', priorityOrder: 200 }),
    ];
    const result = selectBestMatch(candidates, '2026-06-01T00:00:00Z');
    expect(result?.versionId).toBe('v-high');
  });

  it('returns null when no candidates', () => {
    const result = selectBestMatch([], '2026-06-01T00:00:00Z');
    expect(result).toBeNull();
  });

  it('uses stable versionId tie-breaker when scope and priority are equal (RULE-SCOPE-010)', () => {
    const candidates = [
      makeVersion({ versionId: 'rv-zzz', priorityOrder: 100, scope: { tenantId: 'T1' } }),
      makeVersion({ versionId: 'rv-aaa', priorityOrder: 100, scope: { tenantId: 'T1' } }),
    ];
    const result = selectBestMatch(candidates, '2026-06-01T00:00:00Z');
    expect(result?.versionId).toBe('rv-aaa'); // alphabetically first wins
  });
});

// ═══════════════════════════════════════════════════════════════
// Service-level Governance Tests — Devil's Advocate Fixes
// ═══════════════════════════════════════════════════════════════
describe('ruleEngineService governance', () => {
  it('RULE-FND-010: rejects duplicate rule code within same type and namespace', async () => {
    const { createRuleFamily } = await import('../../data/ruleEngineService');

    // First creation succeeds
    const family = createRuleFamily({
      ruleCode: 'test_duplicate_check',
      ruleType: 'validation',
      displayName: 'Duplicate Test',
      ownership: { owningLayer: 'platform', namespace: 'test_ns' },
    });
    expect(family.familyId).toBeDefined();

    // Duplicate creation throws
    expect(() =>
      createRuleFamily({
        ruleCode: 'test_duplicate_check',
        ruleType: 'validation',
        displayName: 'Duplicate Test 2',
        ownership: { owningLayer: 'platform', namespace: 'test_ns' },
      }),
    ).toThrow(/Duplicate rule code/);
  });

  it('RULE-FND-010: allows same code for different rule type', async () => {
    const { createRuleFamily } = await import('../../data/ruleEngineService');

    expect(() =>
      createRuleFamily({
        ruleCode: 'test_duplicate_check',
        ruleType: 'calculation',
        displayName: 'Same code different type',
        ownership: { owningLayer: 'platform', namespace: 'test_ns' },
      }),
    ).not.toThrow();
  });

  it('RULE-RBK-006: requires reason for retire transition', async () => {
    const { createRuleFamily, createDraftVersion, transitionLifecycleState } = await import('../../data/ruleEngineService');

    const fam = createRuleFamily({
      ruleCode: 'retire_reason_test',
      ruleType: 'validation',
      displayName: 'Retire Reason Test',
      ownership: { owningLayer: 'platform', namespace: 'retire_ns' },
    });
    const ver = createDraftVersion(fam.familyId, {});
    transitionLifecycleState(ver.versionId, 'in_review');
    transitionLifecycleState(ver.versionId, 'approved');
    transitionLifecycleState(ver.versionId, 'published');

    // Retire without reason should throw
    expect(() => transitionLifecycleState(ver.versionId, 'retired', 'admin')).toThrow(/Reason is required/);

    // Retire with reason should succeed
    expect(() => transitionLifecycleState(ver.versionId, 'retired', 'admin', 'No longer needed')).not.toThrow();
  });
});
