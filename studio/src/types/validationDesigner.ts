// ============================================================
// iDMS Admin Studio — Validation Rule Definition v2 Types
// ============================================================
import type { LayerCode } from './index';

// ── Dimension 1 — Validation Family (19 values) ──────────────
export type ValidationFamily =
  | 'conditional_presence'
  | 'cross_field_consistency'
  | 'record_state_consistency'
  | 'child_row_validation'
  | 'child_collection_validation'
  | 'aggregate_validation'
  | 'relationship_eligibility'
  | 'relationship_absence_or_presence'
  | 'temporal_validity'
  | 'lifecycle_gate'
  | 'action_eligibility'
  | 'import_row_validation'
  | 'import_batch_validation'
  | 'api_payload_validation'
  | 'bulk_operation_validation'
  | 'provider_external_validation'
  | 'warning_advisory'
  | 'compliance_validity'
  | 'exact_business_duplicate';

// ── Dimension 2 — Evaluation Scope (10 values) ───────────────
export type EvaluationScope =
  | 'field'
  | 'record'
  | 'child_row'
  | 'child_collection'
  | 'related_record'
  | 'related_collection'
  | 'cross_entity'
  | 'batch'
  | 'provider'
  | 'projection_refresh';

// ── Dimension 3 — Trigger Context (25 values) ────────────────
export type TriggerContext =
  | 'on_create'
  | 'on_save'
  | 'on_update'
  | 'on_field_change_preview'
  | 'before_submit'
  | 'before_approve'
  | 'before_reject'
  | 'before_post'
  | 'before_cancel'
  | 'before_close'
  | 'before_reopen'
  | 'before_reverse'
  | 'before_delete'
  | 'before_restore'
  | 'before_convert'
  | 'before_import_preview'
  | 'before_import_commit'
  | 'before_api_create'
  | 'before_api_update'
  | 'before_api_upsert'
  | 'before_bulk_operation'
  | 'before_provider_write'
  | 'on_provider_response'
  | 'before_projection_refresh'
  | 'after_projection_refresh_validation';

// ── Dimension 4 — Enforcement Layer (7 values) ───────────────
export type EnforcementLayer =
  | 'database_constraint'
  | 'application_sync'
  | 'application_async_advisory'
  | 'provider_sync'
  | 'provider_async'
  | 'import_pipeline'
  | 'projection_pipeline';

// ── Dimension 5 — Severity (5 values) ───────────────────────
export type ValidationSeverity =
  | 'error_blocking'
  | 'warning_acknowledge'
  | 'warning_nonblocking'
  | 'info'
  | 'advisory_async';

// ── Dimension 6 — Truth Source (10 values) ───────────────────
export type TruthSource =
  | 'current_record'
  | 'persisted_record'
  | 'snapshot_field'
  | 'live_relationship'
  | 'effective_dated_relationship'
  | 'derived_field'
  | 'provider_current'
  | 'provider_cached'
  | 'projection_value'
  | 'import_batch';

// ── Dimension 7 — Evaluation Phase (9 values) ────────────────
export type EvaluationPhase =
  | 'pre_defaulting'
  | 'post_defaulting'
  | 'post_derivation'
  | 'pre_persistence'
  | 'pre_transition'
  | 'post_provider_response'
  | 'import_row_phase'
  | 'import_batch_phase'
  | 'projection_refresh_phase';

// ── Dimension 8 — Applicability Scope (9 values) ─────────────
export type ApplicabilityScope =
  | 'entity_wide'
  | 'document_type_specific'
  | 'view_preview_only'
  | 'channel_specific'
  | 'lifecycle_state_specific'
  | 'action_specific'
  | 'layer_specific'
  | 'effective_dated'
  | 'package_specific';

// ── Dimension 9 — Determinism Type (6 values) ────────────────
export type DeterminismType =
  | 'pure_deterministic'
  | 'time_dependent'
  | 'provider_dependent'
  | 'projection_dependent'
  | 'configuration_dependent'
  | 'security_context_dependent';

// ── ValidationRuleDefinition interface (26 fields / 13 sub-objects) ──
export interface ValidationRuleDefinition {
  // Core Identity
  validationRuleId: string;
  entityId: string;          // entityType of the entity this rule applies to
  apiName: string;           // snake_case, locked after activation
  label: string;
  description?: string;

  // 9 Classification Dimensions
  validationFamily: ValidationFamily;
  evaluationScope: EvaluationScope;
  triggerContexts: TriggerContext[];   // rule fires on any listed context
  enforcementLayer: EnforcementLayer;
  severity: ValidationSeverity;
  priority: number;                   // 0–999; lower = higher priority
  truthSource: TruthSource;
  evaluationPhase: EvaluationPhase;
  determinismType?: DeterminismType;

  // Applicability
  applicability: {
    applicabilityScope: ApplicabilityScope;
    documentTypes?: string[];
    channels?: string[];              // 'web' | 'api' | 'mobile' | 'import' | 'bulk'
    lifecycleStates?: string[];
    effectiveFrom?: string;           // ISO date
    effectiveTo?: string | null;      // ISO date or null
    layerCode?: LayerCode;
  };

  // Condition & Assertion (expressions)
  condition?: {
    expressionLanguage: 'idms_expression_v2' | 'none';
    expression: string;
  };
  assertion: {
    expressionLanguage: 'idms_expression_v2';
    expression: string;
  };

  // Dependency Profile
  dependencyProfile: {
    fieldIds: string[];
    relationshipIds: string[];
    derivedFieldIds: string[];
    queryBindingIds: string[];
    providerBindingIds: string[];
  };

  // Affected Targets (what the runtime highlights when rule fails)
  affectedTargets: {
    fieldIds: string[];
    relationshipIds: string[];
    childRelationIds: string[];
  };

  // Message
  message: {
    code: string;                // e.g. 'INV-GST-POST-001'
    localizationKey?: string;
    text: string;
    remediationHint?: string;
  };

  // Conditional policies
  warningAcknowledgmentPolicy?: {
    acknowledgmentRequired: boolean;
    acknowledgmentCode?: string;
    reasonRequired: boolean;
    expiryAfterMinutes?: number;
  } | null;

  providerPolicy?: {
    providerBindingId: string;
    timeoutMs: number;
    onTimeout: 'block' | 'allow_with_warning' | 'cache_last_known';
    retryCount: number;
  } | null;

  bypassPolicy: {
    allowed: boolean;
    permissionCode?: string | null;
    reasonRequired: boolean;
  };

  // Governance
  governance?: {
    owningLayer?: LayerCode;
    owningPackageId?: string;
    criticality?: 'compliance_critical' | 'business_critical' | 'advisory';
    canDownstreamConstrain?: boolean;
    canDownstreamRelax?: boolean;
    canDownstreamDisable?: boolean;
  };

  // Lifecycle
  lifecycle: {
    metadataStatus: 'draft' | 'active' | 'deprecated' | 'disabled';
    version?: string;
  };

  // Optional test cases
  testCases?: Array<{
    caseId: string;
    description: string;
    expectedResult: 'pass' | 'fail' | 'warn';
  }>;

  createdAt?: string;
  lastModified?: string;
}

// ── VALIDATION_FAMILY_CONFIG (19 entries) ────────────────────
export type ValidationFamilyGroup =
  | 'field'
  | 'record'
  | 'relational'
  | 'operational'
  | 'pipeline'
  | 'advisory'
  | 'compliance';

export const VALIDATION_FAMILY_CONFIG: Record<
  ValidationFamily,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
    group: ValidationFamilyGroup;
    description: string;
  }
> = {
  conditional_presence: {
    label: 'Conditional Presence',
    color: '#2563eb',
    bgColor: '#dbeafe',
    icon: 'ToggleLeft',
    group: 'field',
    description: 'Field required only when a condition is met',
  },
  cross_field_consistency: {
    label: 'Cross-Field Consistency',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    icon: 'GitCompare',
    group: 'record',
    description: 'Two or more fields must be internally consistent',
  },
  record_state_consistency: {
    label: 'Record State',
    color: '#0891b2',
    bgColor: '#cffafe',
    icon: 'CheckSquare',
    group: 'record',
    description: 'Current record state must satisfy conditions',
  },
  child_row_validation: {
    label: 'Child Row',
    color: '#059669',
    bgColor: '#d1fae5',
    icon: 'List',
    group: 'relational',
    description: 'Each row in a child collection must satisfy conditions',
  },
  child_collection_validation: {
    label: 'Child Collection',
    color: '#16a34a',
    bgColor: '#dcfce7',
    icon: 'Layers',
    group: 'relational',
    description: 'Aggregate or count of child rows must satisfy conditions',
  },
  aggregate_validation: {
    label: 'Aggregate',
    color: '#0f766e',
    bgColor: '#ccfbf1',
    icon: 'Sigma',
    group: 'relational',
    description: 'Aggregate over related records must satisfy conditions',
  },
  relationship_eligibility: {
    label: 'Relationship Eligibility',
    color: '#d97706',
    bgColor: '#fef3c7',
    icon: 'Link',
    group: 'relational',
    description: 'Target record of a relationship must satisfy conditions',
  },
  relationship_absence_or_presence: {
    label: 'Relationship Presence',
    color: '#b45309',
    bgColor: '#fff7ed',
    icon: 'GitFork',
    group: 'relational',
    description: 'A relationship must exist or must not exist',
  },
  temporal_validity: {
    label: 'Temporal Validity',
    color: '#c2410c',
    bgColor: '#ffedd5',
    icon: 'Calendar',
    group: 'record',
    description: 'Dates/times must satisfy ordering and validity rules',
  },
  lifecycle_gate: {
    label: 'Lifecycle Gate',
    color: '#9333ea',
    bgColor: '#f3e8ff',
    icon: 'Lock',
    group: 'operational',
    description: 'Status transition permitted only when conditions are met',
  },
  action_eligibility: {
    label: 'Action Eligibility',
    color: '#db2777',
    bgColor: '#fce7f3',
    icon: 'Play',
    group: 'operational',
    description: 'Action/command permitted only when conditions are met',
  },
  import_row_validation: {
    label: 'Import Row',
    color: '#0369a1',
    bgColor: '#e0f2fe',
    icon: 'FileInput',
    group: 'pipeline',
    description: 'Each import row must satisfy field-level rules',
  },
  import_batch_validation: {
    label: 'Import Batch',
    color: '#075985',
    bgColor: '#f0f9ff',
    icon: 'Package',
    group: 'pipeline',
    description: 'Import batch aggregate conditions must be met',
  },
  api_payload_validation: {
    label: 'API Payload',
    color: '#6366f1',
    bgColor: '#eef2ff',
    icon: 'Braces',
    group: 'pipeline',
    description: 'API request payload must satisfy schema-level constraints',
  },
  bulk_operation_validation: {
    label: 'Bulk Operation',
    color: '#4f46e5',
    bgColor: '#e0e7ff',
    icon: 'Layers2',
    group: 'pipeline',
    description: 'Bulk operation must satisfy pre-flight conditions',
  },
  provider_external_validation: {
    label: 'Provider / External',
    color: '#ea580c',
    bgColor: '#fff7ed',
    icon: 'Globe',
    group: 'pipeline',
    description: 'Validation delegated to or confirmed by external provider',
  },
  warning_advisory: {
    label: 'Warning Advisory',
    color: '#92400e',
    bgColor: '#fef3c7',
    icon: 'AlertTriangle',
    group: 'advisory',
    description: 'Non-blocking advisory that requires user acknowledgment',
  },
  compliance_validity: {
    label: 'Compliance',
    color: '#991b1b',
    bgColor: '#fee2e2',
    icon: 'Shield',
    group: 'compliance',
    description: 'Regulatory or statutory compliance conditions',
  },
  exact_business_duplicate: {
    label: 'Duplicate Detection',
    color: '#374151',
    bgColor: '#f3f4f6',
    icon: 'Copy',
    group: 'compliance',
    description: 'Duplicate detection across specific field combinations',
  },
};

// ── Group labels for the ValidationFamilyGrid UI ─────────────
export const FAMILY_GROUP_LABELS: Record<ValidationFamilyGroup, string> = {
  field:       'Field-Level',
  record:      'Record-Level',
  relational:  'Relational',
  operational: 'Operational',
  pipeline:    'Pipeline',
  advisory:    'Advisory',
  compliance:  'Compliance & Duplicate',
};
