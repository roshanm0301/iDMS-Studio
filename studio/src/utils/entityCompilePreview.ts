// ============================================================
// iDMS Admin Studio — Entity Compile Preview
// Client-side validation for entity creation wizard
// ============================================================
import type {
  EntityArchetype, PersistenceMode, MutabilityMode, ScopePolicy,
  SourceOfTruthType, BusinessKeyType, ProviderCapabilityContract,
  StorageMode, RecordOwnershipModel,
} from '../types/entityDesigner';

export interface CompilePreviewIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface CompilePreviewResult {
  canCreateDraft: boolean;
  blockingIssues: CompilePreviewIssue[];
  warnings: CompilePreviewIssue[];
  nextSteps: string[];
}

export interface CompilePreviewInput {
  archetype: EntityArchetype;
  persistenceMode: PersistenceMode;
  mutabilityMode: MutabilityMode;
  scopePolicy: ScopePolicy;
  sourceOfTruth: SourceOfTruthType;
  storageMode: StorageMode;
  businessKeyType: BusinessKeyType;
  providerCapability?: Partial<ProviderCapabilityContract>;
  // capability flags
  canSave: boolean;
  apiExposed: boolean;
  offlineEnabled: boolean;
  cacheable: boolean;
  importable: boolean;
  printable: boolean;
  reportable: boolean;
  searchable: boolean;
  retentionManaged: boolean;
  partitioned: boolean;
  reversible: boolean;
  // source step state
  externalSystemCode: string;
  sourceEntityIds: string[];
  // scope
  owningLayer: string;
  // identity
  label: string;
  apiName: string;
  namespace?: string;
  recordOwnershipModel?: RecordOwnershipModel;
}

/** Compute compile preview: blocking issues, warnings, and next steps. */
export function computeCompilePreview(input: CompilePreviewInput): CompilePreviewResult {
  const issues: CompilePreviewIssue[] = [];
  const warnings: CompilePreviewIssue[] = [];
  const nextSteps: string[] = [];

  const { archetype } = input;

  // ── External/Federated Validation ─────────────────────────────
  if (archetype === 'external_federated') {
    if (!input.providerCapability?.providerAdapterCode) {
      issues.push({
        code: 'PROVIDER_ADAPTER_REQUIRED',
        severity: 'error',
        message: 'Provider capability contract is required for External/Federated entities.',
      });
    }
    if (!input.providerCapability?.providerEntityName) {
      issues.push({
        code: 'PROVIDER_ENTITY_REQUIRED',
        severity: 'error',
        message: 'Provider entity name is required for External/Federated entities.',
      });
    }
    if (input.canSave && input.providerCapability && !input.providerCapability.updateSupported) {
      issues.push({
        code: 'PROVIDER_NO_UPDATE',
        severity: 'error',
        message: 'Can Be Saved is enabled but the provider does not support update operations.',
      });
    }
    if (input.offlineEnabled && !input.providerCapability?.cachePolicyId) {
      issues.push({
        code: 'OFFLINE_NO_SYNC',
        severity: 'error',
        message: 'Offline Enabled cannot be enabled for external entity without a sync contract.',
      });
    }
  }

  // ── Virtual Computed Validation ───────────────────────────────
  if (archetype === 'virtual_computed') {
    if (input.sourceEntityIds.length === 0) {
      issues.push({
        code: 'VIRTUAL_NO_SOURCE',
        severity: 'error',
        message: 'Virtual Computed entity requires a query binding or dataset definition.',
      });
    }
    if (input.canSave) {
      issues.push({
        code: 'VIRTUAL_NO_SAVE',
        severity: 'error',
        message: 'Virtual Computed entities cannot be directly saved.',
      });
    }
  }

  // ── Materialized Projection Validation ────────────────────────
  if (archetype === 'materialized_projection') {
    if (input.sourceEntityIds.length === 0) {
      issues.push({
        code: 'PROJECTION_NO_SOURCE',
        severity: 'error',
        message: 'Materialized Projection requires source entities.',
      });
    }
    if (input.canSave) {
      issues.push({
        code: 'PROJECTION_NO_SAVE',
        severity: 'error',
        message: 'Materialized Projection entities cannot be directly updated.',
      });
    }
    nextSteps.push('Configure refresh policy (mode, trigger, schedule)');
    if (input.reportable) {
      warnings.push({
        code: 'PROJECTION_STALE_REPORT',
        severity: 'warning',
        message: 'Reportable is enabled. Configure stale data display policy to avoid misleading reports.',
      });
    }
  }

  // ── Owned Child Validation ────────────────────────────────────
  if (archetype === 'owned_child') {
    nextSteps.push('Define parent relationship after entity creation');
    nextSteps.push('Configure lifecycle-aware delete/update policy');
  }

  // ── Junction Validation ───────────────────────────────────────
  if (archetype === 'junction_association') {
    nextSteps.push('Define two relationship endpoints after entity creation');
    nextSteps.push('Configure uniqueness constraint');
  }

  // ── Posting Document Validation ───────────────────────────────
  if (archetype === 'posting_document') {
    nextSteps.push('Configure posting lifecycle model');
    nextSteps.push('Configure document numbering sequence');
    nextSteps.push('Configure reversal/cancellation policy');
    nextSteps.push('Configure audit policy');
  }

  // ── Staging / Import Validation ───────────────────────────────
  if (archetype === 'staging_import') {
    nextSteps.push('Configure import validation rules');
    nextSteps.push('Configure promotion policy');
    nextSteps.push('Configure retention policy');
  }

  // ── High-Volume / Event Log Validation ────────────────────────
  if (archetype === 'high_volume_event_log') {
    if (!input.retentionManaged) {
      issues.push({
        code: 'EVENT_LOG_NO_RETENTION',
        severity: 'error',
        message: 'High-Volume/Event Log entity requires a retention policy.',
      });
    }
    if (!input.partitioned) {
      issues.push({
        code: 'EVENT_LOG_NO_PARTITION',
        severity: 'error',
        message: 'High-Volume/Event Log entity requires a partition policy.',
      });
    }
  }

  // ── Integration Outbox Validation ─────────────────────────────
  if (archetype === 'integration_outbox') {
    nextSteps.push('Configure retry policy');
    nextSteps.push('Configure dead-letter policy');
    nextSteps.push('Configure destination system mapping');
  }

  // ── Cross-Archetype Capability Validation ─────────────────────
  if (input.apiExposed) {
    warnings.push({
      code: 'API_SECURITY_REQUIRED',
      severity: 'warning',
      message: 'API Exposed is enabled. Configure API security before publishing.',
    });
  }

  // ── Namespace Validation ──────────────────────────────────────
  if (input.owningLayer !== 'platform' && !input.namespace) {
    warnings.push({
      code: 'NAMESPACE_MISSING',
      severity: 'warning',
      message: 'Non-platform entities should define a namespace to prevent API name collisions.',
    });
  }

  if (input.cacheable) {
    warnings.push({
      code: 'CACHE_TTL_REQUIRED',
      severity: 'warning',
      message: 'Cacheable is enabled. Configure cache policy with TTL before publishing.',
    });
  }

  if (input.printable) {
    warnings.push({
      code: 'PRINT_TEMPLATE_NOT_CONFIGURED',
      severity: 'warning',
      message: 'Printable is enabled but no print template strategy is configured.',
    });
  }

  if (input.importable && ['virtual_computed', 'external_federated', 'materialized_projection', 'high_volume_event_log', 'integration_outbox'].includes(archetype)) {
    issues.push({
      code: 'IMPORT_NOT_SUPPORTED',
      severity: 'error',
      message: `Bulk import is not supported for ${archetype.replace(/_/g, ' ')} entities.`,
    });
  }

  // ── Scope Validation ──────────────────────────────────────────
  if (input.scopePolicy === 'tenant_scoped' || input.scopePolicy === 'company_scoped' || input.scopePolicy === 'node_scoped' || input.scopePolicy === 'hierarchical_scope') {
    // These are valid, no blockers
  }
  if (archetype === 'external_federated' && input.scopePolicy !== 'external_scope' && input.scopePolicy !== 'tenant_scoped') {
    warnings.push({
      code: 'EXTERNAL_SCOPE_MISMATCH',
      severity: 'warning',
      message: 'External/Federated entities typically use external scope or tenant scope.',
    });
  }

  // ── Business Key Validation ───────────────────────────────────
  if (input.businessKeyType === 'external_id' && archetype !== 'external_federated') {
    warnings.push({
      code: 'EXTERNAL_KEY_NO_PROVIDER',
      severity: 'warning',
      message: 'External ID key is typically used with External/Federated entities.',
    });
  }
  if (input.businessKeyType === 'provider_key' && archetype !== 'external_federated') {
    issues.push({
      code: 'PROVIDER_KEY_NO_PROVIDER',
      severity: 'error',
      message: 'Provider key requires an External/Federated archetype with provider capability.',
    });
  }

  // ── General next steps ────────────────────────────────────────
  if (input.recordOwnershipModel === 'user_owned' || input.recordOwnershipModel === 'team_owned') {
    nextSteps.push('Configure owner field visibility and sharing rules in the Permission Matrix');
  }
  nextSteps.push('Add business fields');
  nextSteps.push('Configure views');
  if (['native_persistent', 'posting_document', 'activity_interaction'].includes(archetype)) {
    nextSteps.push('Configure lifecycle/workflow model');
  }

  return {
    canCreateDraft: issues.length === 0,
    blockingIssues: issues,
    warnings,
    nextSteps,
  };
}
