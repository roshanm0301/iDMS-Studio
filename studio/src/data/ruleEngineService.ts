/**
 * Rule Engine — Mock Data Service
 *
 * Provides CRUD operations for rule families and versions.
 * Uses local state for prototyping (will be replaced by API calls).
 */
import type {
  RuleFamily,
  RuleLifecycleState,
  RuleRegistryEntry,
  RuleType,
  RuleVersion,
} from '../metadata/rule-platform-definition';
import { VALID_LIFECYCLE_TRANSITIONS } from '../metadata/rule-platform-definition';

// ═══════════════════════════════════════════════════════════════
// Seed data
// ═══════════════════════════════════════════════════════════════
const SEED_FAMILIES: RuleFamily[] = [
  {
    familyId: 'rf-001',
    ruleCode: 'mandatory_customer_on_invoice',
    ruleType: 'validation',
    displayName: 'Mandatory Customer on Invoice',
    description: 'Block invoice save when customer field is empty',
    domain: 'sales',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    ownership: { owningLayer: 'platform', namespace: 'idms' },
    audit: { createdAt: '2026-01-15T10:00:00Z', createdBy: 'system' },
  },
  {
    familyId: 'rf-002',
    ruleCode: 'pending_invoice_qty_calculation',
    ruleType: 'calculation',
    displayName: 'Pending Invoice Quantity',
    description: 'Calculates pending invoice qty from order qty minus already invoiced qty',
    domain: 'sales',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    ownership: { owningLayer: 'platform', namespace: 'idms' },
    audit: { createdAt: '2026-01-20T09:00:00Z', createdBy: 'system' },
  },
  {
    familyId: 'rf-003',
    ruleCode: 'source_order_eligibility',
    ruleType: 'validation',
    displayName: 'Source Order Eligibility',
    description: 'Validates source sale order is committed, active, and has pending qty',
    domain: 'sales',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    ownership: { owningLayer: 'platform', namespace: 'idms' },
    audit: { createdAt: '2026-02-01T08:00:00Z', createdBy: 'system' },
  },
  {
    familyId: 'rf-004',
    ruleCode: 'gst_applicability_rule',
    ruleType: 'tax',
    displayName: 'GST Applicability Rule',
    description: 'Determines whether GST applies based on place of supply and product classification',
    domain: 'tax',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    ownership: { owningLayer: 'platform', namespace: 'idms' },
    audit: { createdAt: '2026-02-10T11:00:00Z', createdBy: 'tax_admin' },
  },
  {
    familyId: 'rf-005',
    ruleCode: 'freight_charge_rule',
    ruleType: 'charge',
    displayName: 'Freight Charge Rule',
    description: 'Applies freight charge based on delivery distance and weight tier',
    domain: 'commercial',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    ownership: { owningLayer: 'tenant', namespace: 'acme_corp' },
    audit: { createdAt: '2026-03-01T14:00:00Z', createdBy: 'commercial_admin' },
  },
  {
    familyId: 'rf-006',
    ruleCode: 'invoice_approval_decision',
    ruleType: 'approval_decision',
    displayName: 'Invoice Approval Decision',
    description: 'Determines approval requirement based on invoice amount and discount percentage',
    domain: 'governance',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    ownership: { owningLayer: 'tenant', namespace: 'acme_corp' },
    audit: { createdAt: '2026-03-15T09:00:00Z', createdBy: 'process_admin' },
  },
  {
    familyId: 'rf-007',
    ruleCode: 'sale_invoice_posting_rule',
    ruleType: 'accounting',
    displayName: 'Sale Invoice Posting Rule',
    description: 'Resolves GL accounts and posting lines for sale invoice',
    domain: 'finance',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    ownership: { owningLayer: 'platform', namespace: 'idms' },
    audit: { createdAt: '2026-03-20T10:00:00Z', createdBy: 'finance_admin' },
  },
  {
    familyId: 'rf-008',
    ruleCode: 'po_quantity_cap_validation',
    ruleType: 'validation',
    displayName: 'PO Quantity Cap Validation',
    description: 'Prevents receipt quantity from exceeding ordered quantity',
    domain: 'procurement',
    entityType: 'purchase_receipt',
    documentType: 'purchase_receipt',
    ownership: { owningLayer: 'platform', namespace: 'idms' },
    audit: { createdAt: '2026-04-01T08:00:00Z', createdBy: 'system' },
  },
];

const SEED_VERSIONS: RuleVersion[] = [
  {
    versionId: 'rv-001-v1',
    familyId: 'rf-001',
    versionLabel: '1.0',
    majorVersion: 1,
    minorVersion: 0,
    lifecycleState: 'published',
    scope: { tenantId: '*' },
    effectiveDate: { effectiveFrom: '2026-01-01T00:00:00Z' },
    priorityOrder: 100,
    displayName: 'Mandatory Customer on Invoice',
    ruleType: 'validation',
    domain: 'sales',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    nonOverridable: true,
    conditionRef: 'cond-001',
    createdBy: 'system',
    createdAt: '2026-01-15T10:00:00Z',
    publishedBy: 'system',
    publishedAt: '2026-01-16T12:00:00Z',
    usedInRuntime: true,
  },
  {
    versionId: 'rv-002-v1',
    familyId: 'rf-002',
    versionLabel: '1.0',
    majorVersion: 1,
    minorVersion: 0,
    lifecycleState: 'published',
    scope: { tenantId: '*' },
    effectiveDate: { effectiveFrom: '2026-01-01T00:00:00Z' },
    priorityOrder: 50,
    displayName: 'Pending Invoice Quantity',
    ruleType: 'calculation',
    domain: 'sales',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    expressionRef: 'expr-002',
    createdBy: 'system',
    createdAt: '2026-01-20T09:00:00Z',
    publishedBy: 'system',
    publishedAt: '2026-01-21T10:00:00Z',
    usedInRuntime: true,
  },
  {
    versionId: 'rv-003-v1',
    familyId: 'rf-003',
    versionLabel: '1.0',
    majorVersion: 1,
    minorVersion: 0,
    lifecycleState: 'published',
    scope: { tenantId: '*' },
    effectiveDate: { effectiveFrom: '2026-01-01T00:00:00Z' },
    priorityOrder: 200,
    displayName: 'Source Order Eligibility',
    ruleType: 'validation',
    domain: 'sales',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    nonOverridable: true,
    conditionRef: 'cond-003',
    createdBy: 'system',
    createdAt: '2026-02-01T08:00:00Z',
    publishedBy: 'system',
    publishedAt: '2026-02-02T09:00:00Z',
    usedInRuntime: true,
  },
  {
    versionId: 'rv-004-v1',
    familyId: 'rf-004',
    versionLabel: '1.0',
    majorVersion: 1,
    minorVersion: 0,
    lifecycleState: 'published',
    scope: { tenantId: '*' },
    effectiveDate: { effectiveFrom: '2026-01-01T00:00:00Z' },
    priorityOrder: 100,
    displayName: 'GST Applicability Rule',
    ruleType: 'tax',
    domain: 'tax',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    conditionRef: 'cond-004',
    domainConfigRef: 'tax-cfg-001',
    createdBy: 'tax_admin',
    createdAt: '2026-02-10T11:00:00Z',
    publishedBy: 'tax_admin',
    publishedAt: '2026-02-12T09:00:00Z',
    usedInRuntime: true,
  },
  {
    versionId: 'rv-005-v1',
    familyId: 'rf-005',
    versionLabel: '1.0',
    majorVersion: 1,
    minorVersion: 0,
    lifecycleState: 'draft',
    scope: { tenantId: 'acme_corp', branchId: 'mumbai' },
    effectiveDate: { effectiveFrom: '2026-04-01T00:00:00Z' },
    priorityOrder: 100,
    displayName: 'Freight Charge Rule',
    ruleType: 'charge',
    domain: 'commercial',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    conditionRef: 'cond-005',
    domainConfigRef: 'chg-cfg-001',
    createdBy: 'commercial_admin',
    createdAt: '2026-03-01T14:00:00Z',
  },
  {
    versionId: 'rv-006-v1',
    familyId: 'rf-006',
    versionLabel: '1.0',
    majorVersion: 1,
    minorVersion: 0,
    lifecycleState: 'in_review',
    scope: { tenantId: 'acme_corp' },
    effectiveDate: { effectiveFrom: '2026-04-01T00:00:00Z' },
    priorityOrder: 100,
    displayName: 'Invoice Approval Decision',
    ruleType: 'approval_decision',
    domain: 'governance',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    conditionRef: 'cond-006',
    domainConfigRef: 'apr-cfg-001',
    createdBy: 'process_admin',
    createdAt: '2026-03-15T09:00:00Z',
    submittedBy: 'process_admin',
    submittedAt: '2026-03-16T10:00:00Z',
  },
  {
    versionId: 'rv-007-v1',
    familyId: 'rf-007',
    versionLabel: '1.0',
    majorVersion: 1,
    minorVersion: 0,
    lifecycleState: 'approved',
    scope: { tenantId: '*' },
    effectiveDate: { effectiveFrom: '2026-04-01T00:00:00Z' },
    priorityOrder: 100,
    displayName: 'Sale Invoice Posting Rule',
    ruleType: 'accounting',
    domain: 'finance',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    conditionRef: 'cond-007',
    domainConfigRef: 'acc-cfg-001',
    createdBy: 'finance_admin',
    createdAt: '2026-03-20T10:00:00Z',
    submittedBy: 'finance_admin',
    submittedAt: '2026-03-21T11:00:00Z',
    reviewedBy: 'accounts_mgr',
    reviewedAt: '2026-03-22T09:00:00Z',
    approvedBy: 'accounts_mgr',
    approvedAt: '2026-03-22T09:30:00Z',
  },
  {
    versionId: 'rv-008-v1',
    familyId: 'rf-008',
    versionLabel: '1.0',
    majorVersion: 1,
    minorVersion: 0,
    lifecycleState: 'published',
    scope: { tenantId: '*' },
    effectiveDate: { effectiveFrom: '2026-01-01T00:00:00Z' },
    priorityOrder: 200,
    displayName: 'PO Quantity Cap Validation',
    ruleType: 'validation',
    domain: 'procurement',
    entityType: 'purchase_receipt',
    documentType: 'purchase_receipt',
    nonOverridable: true,
    conditionRef: 'cond-008',
    createdBy: 'system',
    createdAt: '2026-04-01T08:00:00Z',
    publishedBy: 'system',
    publishedAt: '2026-04-02T10:00:00Z',
    usedInRuntime: true,
  },
];

// ═══════════════════════════════════════════════════════════════
// In-memory store
// ═══════════════════════════════════════════════════════════════
let families = [...SEED_FAMILIES];
let versions = [...SEED_VERSIONS];

let nextFamilyId = 9;
let nextVersionId = 9;

function generateFamilyId(): string {
  return `rf-${String(nextFamilyId++).padStart(3, '0')}`;
}
function generateVersionId(familyId: string, major: number, minor: number): string {
  return `rv-${String(nextVersionId++).padStart(3, '0')}-v${major}.${minor}`;
}

// ═══════════════════════════════════════════════════════════════
// Service API
// ═══════════════════════════════════════════════════════════════

export function getRuleFamilies(filters?: {
  ruleType?: RuleType;
  domain?: string;
  entityType?: string;
  search?: string;
}): RuleRegistryEntry[] {
  let results = families;

  if (filters?.ruleType) {
    results = results.filter(f => f.ruleType === filters.ruleType);
  }
  if (filters?.domain) {
    results = results.filter(f => f.domain === filters.domain);
  }
  if (filters?.entityType) {
    results = results.filter(f => f.entityType === filters.entityType);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      f =>
        f.displayName.toLowerCase().includes(q) ||
        f.ruleCode.toLowerCase().includes(q) ||
        (f.description ?? '').toLowerCase().includes(q),
    );
  }

  return results.map(f => {
    const familyVersions = versions.filter(v => v.familyId === f.familyId);
    const published = familyVersions.find(v => v.lifecycleState === 'published');
    const latest = familyVersions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

    return {
      familyId: f.familyId,
      ruleCode: f.ruleCode,
      displayName: f.displayName,
      description: f.description,
      ruleType: f.ruleType,
      domain: f.domain,
      entityType: f.entityType,
      documentType: f.documentType,
      currentVersion: latest?.versionLabel ?? '0.0',
      lifecycleState: latest?.lifecycleState ?? 'draft',
      versionCount: familyVersions.length,
      publishedVersionId: published?.versionId,
      lastModified: latest?.createdAt ?? f.audit.createdAt,
      lastModifiedBy: latest?.createdBy ?? f.audit.createdBy,
      ownership: f.ownership,
    };
  });
}

export function getRuleFamilyById(familyId: string): RuleFamily | undefined {
  return families.find(f => f.familyId === familyId);
}

export function getRuleVersions(familyId: string): RuleVersion[] {
  return versions
    .filter(v => v.familyId === familyId)
    .sort((a, b) => {
      if (b.majorVersion !== a.majorVersion) return b.majorVersion - a.majorVersion;
      return b.minorVersion - a.minorVersion;
    });
}

export function getRuleVersionById(versionId: string): RuleVersion | undefined {
  return versions.find(v => v.versionId === versionId);
}

export function createRuleFamily(
  data: Omit<RuleFamily, 'familyId' | 'audit'>,
): RuleFamily {
  // RULE-FND-010: Prevent duplicate active rule codes within same tenant and rule type
  const duplicate = families.find(
    f =>
      f.ruleCode === data.ruleCode &&
      f.ruleType === data.ruleType &&
      f.ownership.namespace === data.ownership.namespace,
  );
  if (duplicate) {
    throw new Error(
      `Duplicate rule code "${data.ruleCode}" already exists for type "${data.ruleType}" in namespace "${data.ownership.namespace}".`,
    );
  }

  const family: RuleFamily = {
    ...data,
    familyId: generateFamilyId(),
    audit: {
      createdAt: new Date().toISOString(),
      createdBy: 'current_user',
    },
  };
  families = [...families, family];
  return family;
}

export function createDraftVersion(
  familyId: string,
  data: Partial<Omit<RuleVersion, 'versionId' | 'familyId' | 'lifecycleState' | 'createdAt' | 'createdBy'>>,
): RuleVersion {
  const family = families.find(f => f.familyId === familyId);
  if (!family) throw new Error(`Rule family ${familyId} not found`);

  const existing = versions.filter(v => v.familyId === familyId);
  const maxMajor = existing.reduce((m, v) => Math.max(m, v.majorVersion), 0);
  const major = maxMajor + 1;
  const minor = 0;

  const version: RuleVersion = {
    versionId: generateVersionId(familyId, major, minor),
    familyId,
    versionLabel: `${major}.${minor}`,
    majorVersion: major,
    minorVersion: minor,
    lifecycleState: 'draft',
    scope: data.scope ?? { tenantId: '*' },
    effectiveDate: data.effectiveDate ?? { effectiveFrom: new Date().toISOString() },
    priorityOrder: data.priorityOrder ?? 100,
    displayName: data.displayName ?? family.displayName,
    description: data.description ?? family.description,
    ruleType: family.ruleType,
    domain: data.domain ?? family.domain,
    entityType: data.entityType ?? family.entityType,
    documentType: data.documentType ?? family.documentType,
    expressionRef: data.expressionRef,
    conditionRef: data.conditionRef,
    actionRef: data.actionRef,
    outputRef: data.outputRef,
    domainConfigRef: data.domainConfigRef,
    dependsOn: data.dependsOn,
    nonOverridable: data.nonOverridable,
    createdBy: 'current_user',
    createdAt: new Date().toISOString(),
  };

  versions = [...versions, version];
  return version;
}

export function updateDraftVersion(
  versionId: string,
  patch: Partial<RuleVersion>,
): RuleVersion {
  const idx = versions.findIndex(v => v.versionId === versionId);
  if (idx === -1) throw new Error(`Version ${versionId} not found`);
  const existing = versions[idx];
  if (existing.lifecycleState !== 'draft') {
    throw new Error('Only draft versions can be edited.');
  }

  const updated: RuleVersion = {
    ...existing,
    ...patch,
    versionId: existing.versionId,
    familyId: existing.familyId,
    lifecycleState: 'draft', // cannot change state via update
    createdBy: existing.createdBy,
    createdAt: existing.createdAt,
  };
  versions = versions.map((v, i) => (i === idx ? updated : v));
  return updated;
}

export function transitionLifecycleState(
  versionId: string,
  toState: RuleLifecycleState,
  actor: string = 'current_user',
  reason?: string,
): RuleVersion {
  const idx = versions.findIndex(v => v.versionId === versionId);
  if (idx === -1) throw new Error(`Version ${versionId} not found`);
  const existing = versions[idx];

  const allowed = VALID_LIFECYCLE_TRANSITIONS[existing.lifecycleState];
  if (!allowed || !allowed.includes(toState)) {
    throw new Error(
      `Transition from "${existing.lifecycleState}" to "${toState}" is not allowed.`,
    );
  }

  // RULE-RBK-006: Require reason remarks for retire and rollback
  if ((toState === 'retired' || (existing.lifecycleState === 'retired' && toState === 'published')) && !reason) {
    throw new Error(`Reason is required for ${toState === 'retired' ? 'retire' : 'rollback'} action.`);
  }

  const now = new Date().toISOString();
  const auditPatch: Partial<RuleVersion> = {};

  switch (toState) {
    case 'in_review':
      auditPatch.submittedBy = actor;
      auditPatch.submittedAt = now;
      break;
    case 'approved':
      auditPatch.approvedBy = actor;
      auditPatch.approvedAt = now;
      break;
    case 'published':
      auditPatch.publishedBy = actor;
      auditPatch.publishedAt = now;
      break;
    case 'retired':
      auditPatch.retiredBy = actor;
      auditPatch.retiredAt = now;
      break;
  }

  const updated: RuleVersion = {
    ...existing,
    ...auditPatch,
    lifecycleState: toState,
  };
  versions = versions.map((v, i) => (i === idx ? updated : v));
  return updated;
}

export function deleteRuleVersion(versionId: string): boolean {
  const version = versions.find(v => v.versionId === versionId);
  if (!version) return false;
  // RULE-VER-010: Cannot delete if used in runtime
  if (version.usedInRuntime) {
    throw new Error('Cannot delete a rule version that was used in runtime execution.');
  }
  if (version.lifecycleState === 'published') {
    throw new Error('Cannot delete a published version. Retire it first.');
  }
  versions = versions.filter(v => v.versionId !== versionId);
  return true;
}

// ═══════════════════════════════════════════════════════════════
// Stats for dashboard
// ═══════════════════════════════════════════════════════════════
export interface RuleEngineStats {
  totalFamilies: number;
  totalVersions: number;
  publishedCount: number;
  draftCount: number;
  inReviewCount: number;
  byType: Record<RuleType, number>;
}

export function getRuleEngineStats(): RuleEngineStats {
  const byType = {} as Record<RuleType, number>;
  for (const rt of ['validation', 'calculation', 'charge', 'tax', 'accounting', 'approval_decision', 'workflow_decision', 'field_behavior', 'output_rule', 'integration_rule'] as RuleType[]) {
    byType[rt] = families.filter(f => f.ruleType === rt).length;
  }

  return {
    totalFamilies: families.length,
    totalVersions: versions.length,
    publishedCount: versions.filter(v => v.lifecycleState === 'published').length,
    draftCount: versions.filter(v => v.lifecycleState === 'draft').length,
    inReviewCount: versions.filter(v => v.lifecycleState === 'in_review').length,
    byType,
  };
}
