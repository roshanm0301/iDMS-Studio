// ============================================================
// iDMS Admin Studio — Create Entity Page (v2 Wizard)
// ============================================================
// v2 changes:
//   • 8-archetype selection step (blank pattern)
//   • Conditional Source step (virtual / external / materialized)
//   • Scope & Ownership step (separate from Identity)
//   • Capability Profile step (13 toggles with lock rules)
//   • Expanded Review: Architecture card + Capabilities grid
//   • handleCreate() assembles full v2 EntityDefinition
// ============================================================
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database, Check, ChevronLeft,
  ChevronRight, AlertTriangle, Lock, Info,
  Cpu, Globe, BarChart2, Link2, List, BookOpen, Shield,
  CalendarClock, Upload, Activity, Send, FileCheck, Tag,
  ArrowRight, Package, Plus, Layers, Eye, Key, HardDrive,
  Zap, Clock, RefreshCw, AlertOctagon,
} from 'lucide-react';
import { useEntityDesignerStore } from '../hooks/useEntityDesignerStore';
import { getEntityDefinitions } from '../data/mockService';
import type {
  EntityDefinition, EntityCategory, CreationPattern, EntityBehaviors,
  FieldInstance, EntityArchetype, PersistenceMode, MutabilityMode,
  ScopePolicy, SourceOfTruthType, BusinessCategory,
  SimpleFieldDef, FieldTypeCode,
  BusinessKeyType, StorageMode, ProviderCapabilityContract,
  ProviderAuthMode, SecurityDefaults, ProviderSecurityMode,
  CapabilityDefinition, CapabilitySource, StorageConfig, RecordOwnershipModel,
} from '../types/entityDesigner';
import type { LayerCode } from '../types';
import { toSlug } from '../utils/entityDesignerUtils';
import { buildCanonicalEntityAuthoringBundle } from '../metadata';
import { ARCHETYPE_SYSTEM_FIELDS, ARCHETYPE_DISPLAY_NAME_FIELD } from '../data/archetypeSystemFields';
import { computeCompilePreview } from '../utils/entityCompilePreview';
import type { CompilePreviewResult } from '../utils/entityCompilePreview';

// ── Step key type (string-based, avoids raw integer mapping) ──
type StepKey =
  | 'origin'
  | 'archetype'
  | 'base_entity'
  | 'source'
  | 'identity'
  | 'key_storage'
  | 'security_capability'
  | 'review';

// ── Archetype card definitions ─────────────────────────────────
const ARCHETYPE_CARDS: {
  value: EntityArchetype;
  label: string;
  desc: string;
  defaults: string;
  Icon: React.ElementType;
}[] = [
  { value: 'native_persistent',       label: 'Native Persistent',       Icon: Database,  defaults: 'Read/Write · Physical Table · iDMS-owned',      desc: 'iDMS owns and stores the data. Full CRUD, workflow, and governance support.' },
  { value: 'virtual_computed',        label: 'Virtual Computed',         Icon: Cpu,       defaults: 'Read-only · View-backed · Derived',              desc: 'Computed at query time. No own physical table. Cannot be directly saved.' },
  { value: 'external_federated',      label: 'External / Federated',     Icon: Globe,     defaults: 'Provider-managed · External source',             desc: 'Data owned by an external system (OEM, ERP, CRM). iDMS reads, does not own.' },
  { value: 'materialized_projection', label: 'Materialized Projection',  Icon: BarChart2, defaults: 'Read-only · Materialized · Derived',             desc: 'Derived read model stored for search/reporting performance. Refresh-only.' },
  { value: 'junction_association',    label: 'Junction / Association',   Icon: Link2,     defaults: 'Read/Write · Physical Table · iDMS-owned',      desc: 'Many-to-many link between two entities. Optional payload attributes.' },
  { value: 'owned_child',             label: 'Owned Child',              Icon: List,      defaults: 'Read/Write · Physical Table · iDMS-owned',      desc: "Child/detail entity whose lifecycle is governed by a parent (e.g., invoice line)." },
  { value: 'append_only_record',      label: 'Append-Only Record',       Icon: BookOpen,  defaults: 'Append-only · Stream-backed · iDMS-owned',      desc: 'Immutable event or ledger record. Corrections only via counter-entries.' },
  { value: 'system_technical',        label: 'System / Technical',       Icon: Shield,    defaults: 'System-managed · Platform-owned',               desc: 'Platform-managed internal entity. Hidden from business configurators.' },
  // v3 new archetypes
  { value: 'activity_interaction',    label: 'Activity / Interaction',   Icon: CalendarClock, defaults: 'Read/Write · Physical Table · Owner-assigned',  desc: 'Tasks, calls, appointments, follow-ups, reminders. Timeline and notification eligible.' },
  { value: 'staging_import',          label: 'Staging / Import',         Icon: Upload,    defaults: 'Staging · Temporary · Validation-heavy',        desc: 'Temporarily holds imported data before validation and promotion to target entities.' },
  { value: 'high_volume_event_log',   label: 'High-Volume / Event Log',  Icon: Activity,  defaults: 'Append-only · Partitioned · Retention-managed', desc: 'Large-volume, append-heavy, time-series or telemetry data with retention and partition policies.' },
  { value: 'integration_outbox',      label: 'Integration Outbox',       Icon: Send,      defaults: 'Append-only · Retry-managed · Idempotent',      desc: 'Reliable event publishing with retry handling and outbound integration delivery.' },
  { value: 'posting_document',        label: 'Posting Document',         Icon: FileCheck, defaults: 'Draft-editable · Posted-immutable · Reversible', desc: 'Business document editable in draft, immutable after posting. Supports reversal and cancellation.' },
  { value: 'reference_code',          label: 'Reference / Code',         Icon: Tag,       defaults: 'Lookup · Cacheable · Effective-dated',          desc: 'Stable lookup/code data (currencies, UOM, reason codes) with optional localization and effective dates.' },
];

// ── Archetype auto-defaults ────────────────────────────────────
const ARCHETYPE_DEFAULTS: Record<EntityArchetype, {
  persistence: PersistenceMode;
  mutability: MutabilityMode;
  sourceOfTruth: SourceOfTruthType;
  canSave: boolean;
  scopePolicy: ScopePolicy;
  businessCategory: BusinessCategory;
}> = {
  native_persistent:       { persistence: 'physical_table',            mutability: 'read_write',                sourceOfTruth: 'idms',            canSave: true,  scopePolicy: 'tenant_scoped', businessCategory: 'transaction'    },
  virtual_computed:        { persistence: 'view_backed',               mutability: 'read_only',                 sourceOfTruth: 'derived',         canSave: false, scopePolicy: 'tenant_scoped', businessCategory: 'reference'      },
  external_federated:      { persistence: 'provider_backed',           mutability: 'provider_capability_driven', sourceOfTruth: 'external_system', canSave: false, scopePolicy: 'external_scope', businessCategory: 'reference'     },
  materialized_projection: { persistence: 'materialized_view_backed',  mutability: 'derived_refresh_only',      sourceOfTruth: 'derived',         canSave: false, scopePolicy: 'tenant_scoped', businessCategory: 'reference'      },
  junction_association:    { persistence: 'physical_table',            mutability: 'read_write',                sourceOfTruth: 'idms',            canSave: true,  scopePolicy: 'tenant_scoped', businessCategory: 'configuration'  },
  owned_child:             { persistence: 'physical_table',            mutability: 'read_write',                sourceOfTruth: 'idms',            canSave: true,  scopePolicy: 'tenant_scoped', businessCategory: 'transaction'    },
  append_only_record:      { persistence: 'stream_backed',             mutability: 'append_only',               sourceOfTruth: 'idms',            canSave: true,  scopePolicy: 'tenant_scoped', businessCategory: 'ledger_like'    },
  system_technical:        { persistence: 'physical_table',            mutability: 'system_managed',            sourceOfTruth: 'platform',        canSave: false, scopePolicy: 'not_applicable', businessCategory: 'technical'     },
  // v3 new archetypes
  activity_interaction:    { persistence: 'physical_table',            mutability: 'read_write',                sourceOfTruth: 'idms',            canSave: true,  scopePolicy: 'tenant_scoped', businessCategory: 'transaction'    },
  staging_import:          { persistence: 'physical_table',            mutability: 'staging_promote_only',      sourceOfTruth: 'idms',            canSave: true,  scopePolicy: 'tenant_scoped', businessCategory: 'technical'      },
  high_volume_event_log:   { persistence: 'append_log_table',          mutability: 'append_only',               sourceOfTruth: 'idms',            canSave: true,  scopePolicy: 'tenant_scoped', businessCategory: 'technical'      },
  integration_outbox:      { persistence: 'outbox_table',              mutability: 'append_only',               sourceOfTruth: 'idms',            canSave: false, scopePolicy: 'tenant_scoped', businessCategory: 'technical'      },
  posting_document:        { persistence: 'physical_table',            mutability: 'draft_edit_posted_immutable', sourceOfTruth: 'idms',           canSave: true,  scopePolicy: 'tenant_scoped', businessCategory: 'transaction'    },
  reference_code:          { persistence: 'physical_table',            mutability: 'read_write',                sourceOfTruth: 'idms',            canSave: true,  scopePolicy: 'tenant_scoped', businessCategory: 'reference'      },
};

// ── Capability defaults per archetype ─────────────────────────

// ── Storage mode defaults per archetype ───────────────────────
const ARCHETYPE_STORAGE_DEFAULTS: Record<EntityArchetype, StorageMode> = {
  native_persistent:       'physical_table',
  virtual_computed:        'sql_view',
  external_federated:      'external_provider',
  materialized_projection: 'materialized_view_or_table',
  junction_association:    'junction_table',
  owned_child:             'owned_child_table',
  append_only_record:      'append_log_table',
  system_technical:        'system_table',
  activity_interaction:    'physical_table',
  staging_import:          'physical_table',
  high_volume_event_log:   'append_log_table',
  integration_outbox:      'outbox_table',
  posting_document:        'physical_table',
  reference_code:          'physical_table',
};

// ── Valid storage modes per archetype ──────────────────────────
const ARCHETYPE_VALID_STORAGE_MODES: Record<EntityArchetype, StorageMode[]> = {
  native_persistent:       ['physical_table'],
  virtual_computed:        ['sql_view'],
  external_federated:      ['external_provider'],
  materialized_projection: ['materialized_view_or_table'],
  junction_association:    ['junction_table'],
  owned_child:             ['owned_child_table', 'physical_table'],
  append_only_record:      ['append_log_table'],
  system_technical:        ['system_table'],
  activity_interaction:    ['physical_table'],
  staging_import:          ['physical_table'],
  high_volume_event_log:   ['append_log_table'],
  integration_outbox:      ['outbox_table'],
  posting_document:        ['physical_table'],
  reference_code:          ['physical_table'],
};

// ── Record Ownership defaults per archetype ───────────────────
const ARCHETYPE_OWNERSHIP_DEFAULTS: Record<EntityArchetype, RecordOwnershipModel> = {
  native_persistent:       'user_owned',
  activity_interaction:    'user_owned',
  posting_document:        'user_owned',
  staging_import:          'user_owned',
  reference_code:          'org_owned',
  virtual_computed:        'none',
  external_federated:      'none',
  materialized_projection: 'none',
  junction_association:    'none',
  owned_child:             'none',
  append_only_record:      'none',
  system_technical:        'none',
  high_volume_event_log:   'none',
  integration_outbox:      'none',
};


interface CapabilityState {
  canSave: boolean;
  lookupEligible: boolean;
  searchable: boolean;
  importable: boolean;
  exportable: boolean;
  reportable: boolean;
  printable: boolean;
  apiExposed: boolean;
  cacheable: boolean;
  offlineEnabled: boolean;
  extendable: boolean;
  workflowEnabled: boolean;
  auditable: boolean;
  // v3 new capabilities
  timelineEligible: boolean;
  notificationEligible: boolean;
  packageInstallable: boolean;
  eventPublishable: boolean;
  reversible: boolean;
  retentionManaged: boolean;
  partitioned: boolean;
  providerBacked: boolean;
  stagingPromotable: boolean;
  hierarchyRollupEnabled: boolean;
}

const ARCHETYPE_CAPABILITY_DEFAULTS: Record<EntityArchetype, CapabilityState> = {
  native_persistent:       { canSave: true,  lookupEligible: true,  searchable: true,  importable: true,  exportable: true,  reportable: true,  printable: false, apiExposed: true,  cacheable: false, offlineEnabled: false, extendable: true,  workflowEnabled: true,  auditable: true,  timelineEligible: false, notificationEligible: false, packageInstallable: true,  eventPublishable: true,  reversible: false, retentionManaged: false, partitioned: false, providerBacked: false, stagingPromotable: false, hierarchyRollupEnabled: false },
  virtual_computed:        { canSave: false, lookupEligible: false, searchable: true,  importable: false, exportable: true,  reportable: true,  printable: false, apiExposed: true,  cacheable: true,  offlineEnabled: false, extendable: false, workflowEnabled: false, auditable: false, timelineEligible: false, notificationEligible: false, packageInstallable: false, eventPublishable: false, reversible: false, retentionManaged: false, partitioned: false, providerBacked: false, stagingPromotable: false, hierarchyRollupEnabled: false },
  external_federated:      { canSave: false, lookupEligible: true,  searchable: true,  importable: false, exportable: false, reportable: true,  printable: false, apiExposed: true,  cacheable: true,  offlineEnabled: false, extendable: false, workflowEnabled: false, auditable: false, timelineEligible: false, notificationEligible: false, packageInstallable: false, eventPublishable: false, reversible: false, retentionManaged: false, partitioned: false, providerBacked: true,  stagingPromotable: false, hierarchyRollupEnabled: false },
  materialized_projection: { canSave: false, lookupEligible: true,  searchable: true,  importable: false, exportable: true,  reportable: true,  printable: false, apiExposed: true,  cacheable: true,  offlineEnabled: false, extendable: false, workflowEnabled: false, auditable: false, timelineEligible: false, notificationEligible: false, packageInstallable: false, eventPublishable: false, reversible: false, retentionManaged: false, partitioned: false, providerBacked: false, stagingPromotable: false, hierarchyRollupEnabled: false },
  junction_association:    { canSave: true,  lookupEligible: false, searchable: false, importable: true,  exportable: true,  reportable: true,  printable: false, apiExposed: true,  cacheable: false, offlineEnabled: false, extendable: true,  workflowEnabled: false, auditable: true,  timelineEligible: false, notificationEligible: false, packageInstallable: true,  eventPublishable: false, reversible: false, retentionManaged: false, partitioned: false, providerBacked: false, stagingPromotable: false, hierarchyRollupEnabled: false },
  owned_child:             { canSave: true,  lookupEligible: false, searchable: false, importable: false, exportable: true,  reportable: true,  printable: false, apiExposed: false, cacheable: false, offlineEnabled: false, extendable: true,  workflowEnabled: false, auditable: true,  timelineEligible: false, notificationEligible: false, packageInstallable: true,  eventPublishable: false, reversible: false, retentionManaged: false, partitioned: false, providerBacked: false, stagingPromotable: false, hierarchyRollupEnabled: false },
  append_only_record:      { canSave: true,  lookupEligible: false, searchable: true,  importable: false, exportable: true,  reportable: true,  printable: false, apiExposed: true,  cacheable: false, offlineEnabled: false, extendable: false, workflowEnabled: false, auditable: true,  timelineEligible: false, notificationEligible: false, packageInstallable: false, eventPublishable: false, reversible: true,  retentionManaged: true,  partitioned: false, providerBacked: false, stagingPromotable: false, hierarchyRollupEnabled: false },
  system_technical:        { canSave: false, lookupEligible: false, searchable: false, importable: false, exportable: false, reportable: false, printable: false, apiExposed: false, cacheable: false, offlineEnabled: false, extendable: false, workflowEnabled: false, auditable: false, timelineEligible: false, notificationEligible: false, packageInstallable: false, eventPublishable: false, reversible: false, retentionManaged: false, partitioned: false, providerBacked: false, stagingPromotable: false, hierarchyRollupEnabled: false },
  // v3 new archetypes
  activity_interaction:    { canSave: true,  lookupEligible: false, searchable: true,  importable: false, exportable: true,  reportable: true,  printable: false, apiExposed: true,  cacheable: false, offlineEnabled: false, extendable: true,  workflowEnabled: true,  auditable: true,  timelineEligible: true,  notificationEligible: true,  packageInstallable: true,  eventPublishable: true,  reversible: false, retentionManaged: false, partitioned: false, providerBacked: false, stagingPromotable: false, hierarchyRollupEnabled: false },
  staging_import:          { canSave: true,  lookupEligible: false, searchable: false, importable: true,  exportable: false, reportable: false, printable: false, apiExposed: false, cacheable: false, offlineEnabled: false, extendable: false, workflowEnabled: false, auditable: false, timelineEligible: false, notificationEligible: false, packageInstallable: false, eventPublishable: false, reversible: false, retentionManaged: true,  partitioned: false, providerBacked: false, stagingPromotable: true,  hierarchyRollupEnabled: false },
  high_volume_event_log:   { canSave: true,  lookupEligible: false, searchable: false, importable: false, exportable: true,  reportable: true,  printable: false, apiExposed: true,  cacheable: false, offlineEnabled: false, extendable: false, workflowEnabled: false, auditable: false, timelineEligible: false, notificationEligible: false, packageInstallable: false, eventPublishable: false, reversible: false, retentionManaged: true,  partitioned: true,  providerBacked: false, stagingPromotable: false, hierarchyRollupEnabled: false },
  integration_outbox:      { canSave: false, lookupEligible: false, searchable: false, importable: false, exportable: false, reportable: false, printable: false, apiExposed: false, cacheable: false, offlineEnabled: false, extendable: false, workflowEnabled: false, auditable: false, timelineEligible: false, notificationEligible: false, packageInstallable: false, eventPublishable: true,  reversible: false, retentionManaged: true,  partitioned: false, providerBacked: false, stagingPromotable: false, hierarchyRollupEnabled: false },
  posting_document:        { canSave: true,  lookupEligible: false, searchable: true,  importable: true,  exportable: true,  reportable: true,  printable: true,  apiExposed: true,  cacheable: false, offlineEnabled: false, extendable: true,  workflowEnabled: true,  auditable: true,  timelineEligible: false, notificationEligible: true,  packageInstallable: true,  eventPublishable: true,  reversible: true,  retentionManaged: false, partitioned: false, providerBacked: false, stagingPromotable: false, hierarchyRollupEnabled: false },
  reference_code:          { canSave: true,  lookupEligible: true,  searchable: true,  importable: true,  exportable: true,  reportable: false, printable: false, apiExposed: true,  cacheable: true,  offlineEnabled: false, extendable: true,  workflowEnabled: false, auditable: true,  timelineEligible: false, notificationEligible: false, packageInstallable: true,  eventPublishable: false, reversible: false, retentionManaged: false, partitioned: false, providerBacked: false, stagingPromotable: false, hierarchyRollupEnabled: false },
};

// ── Lock rules: capabilities locked based on archetype ─────────
function getLockedCapabilities(archetype: EntityArchetype): Partial<Record<keyof CapabilityState, string>> {
  const locks: Partial<Record<keyof CapabilityState, string>> = {};
  if (['virtual_computed', 'external_federated', 'materialized_projection'].includes(archetype)) {
    locks.canSave = 'Cannot save directly — data is derived or externally owned';
    locks.importable = 'Bulk import not supported for this archetype';
  }
  if (archetype === 'system_technical') {
    locks.canSave = 'System entities are platform-managed — no direct saves';
    locks.importable = 'Not applicable for system entities';
    locks.apiExposed = 'System entities are not exposed via public API';
    locks.workflowEnabled = 'No workflow lifecycle for system entities';
    locks.auditable = 'System entity changes tracked via platform audit, not Entity Designer';
  }
  // v3 new archetype lock rules
  if (archetype === 'integration_outbox') {
    locks.canSave = 'Outbox events are system-published — no manual saves';
    locks.importable = 'Outbox entries cannot be bulk-imported';
    locks.searchable = 'Outbox events are not searchable by end users';
    locks.reportable = 'Use integration monitoring for outbox reporting';
    locks.workflowEnabled = 'Outbox uses retry/dead-letter, not workflow';
    locks.eventPublishable = 'Always enabled — publishing is the outbox purpose';
    locks.retentionManaged = 'Outbox events always require retention policy';
  }
  if (archetype === 'high_volume_event_log') {
    locks.importable = 'Event logs are append-only — no bulk import';
    locks.workflowEnabled = 'Event logs do not have workflow lifecycle';
    locks.retentionManaged = 'Event logs always require retention policy';
    locks.partitioned = 'Event logs always require partition policy';
  }
  if (archetype === 'staging_import') {
    locks.reportable = 'Staging data is transient — not reportable';
    locks.searchable = 'Staging records are not searchable by end users';
    locks.stagingPromotable = 'Always enabled — promotion is the staging purpose';
    locks.retentionManaged = 'Staging data always requires retention/cleanup policy';
  }
  if (archetype === 'posting_document') {
    locks.reversible = 'Posting documents always support reversal';
  }
  if (archetype === 'external_federated') {
    locks.providerBacked = 'Always enabled — external entities are provider-backed';
  }
  return locks;
}

// ── Step sequence per pattern ──────────────────────────────────
function getStepSequence(pattern: CreationPattern, archetype: EntityArchetype): StepKey[] {
  const needsSource = ['virtual_computed', 'external_federated', 'materialized_projection', 'staging_import'].includes(archetype);
  if (pattern === 'extend') {
    return ['origin', 'base_entity', 'identity', 'review'];
  }
  // blank
  const seq: StepKey[] = ['origin', 'archetype'];
  if (needsSource) seq.push('source');
  seq.push('identity', 'key_storage', 'security_capability', 'review');
  return seq;
}

const STEP_LABELS: Record<StepKey, string> = {
  origin:              'Origin',
  archetype:           'Archetype',
  base_entity:         'Base Entity',
  source:              'Source',
  identity:            'Identity & Scope',
  key_storage:         'Key & Storage',
  security_capability: 'Security & Capabilities',
  review:              'Review & Create',
};

// ── Infra field IDs that should be hidden by default ──────────
const INFRA_FIELD_IDS = new Set([
  'record_id', 'tenant_id', 'node_id', 'created_by', 'created_at', 'updated_at', 'deleted_at',
]);

// ── Convert SimpleFieldDef → FieldInstance ─────────────────────
function simpleDefToFieldInstance(def: SimpleFieldDef, owningLayer: LayerCode, order: number): FieldInstance {
  const isSystem = def.systemOwned ?? false;
  const isProtected = def.protected ?? false;
  const isInfra = isSystem && INFRA_FIELD_IDS.has(def.fieldId);
  return {
    fieldId: def.fieldId,
    label: def.label,
    fieldType: def.fieldType as FieldTypeCode,
    sourceLayer: isSystem ? 'platform' : owningLayer,
    overlayOperation: 'extend',
    protected: isProtected,
    classification: 'internal',
    behaviors: {
      presence: def.required ? 'on_create' : 'optional',
      editability: isSystem ? 'system_only' : 'always',
      visibility: isInfra ? 'hidden' : 'default',
      defaultSource: 'none',
      searchable: !isSystem,
      filterable: !isInfra,
      sortable: false,
      includeInDefaultList: !isInfra && def.required,
      includeInLookupDisplay: false,
      auditBehavior: 'none',
    },
    typeConfig: def.typeConfig ?? {},
    governance: {
      classification: 'internal',
      canDownstreamConstrain: !isProtected,
      canDownstreamRelax: false,
      canDownstreamDisable: false,
      includeInExport: !isInfra,
      allowImport: false,
      allowBulkUpdate: false,
      maskInExport: false,
      apiInputAllowed: !isSystem,
      apiOutputAllowed: true,
      apiOutputMasked: false,
      isExternalId: false,
    },
    lifecycle: 'active',
    viewParticipation: isInfra ? 'explicit' : 'list_and_form',
    order,
  };
}

// ── Derive EntityCategory from BusinessCategory (backward compat)
function toEntityCategory(bc: BusinessCategory): EntityCategory {
  if (bc === 'master_data') return 'master';
  if (bc === 'reference' || bc === 'technical') return 'configuration';
  return bc as EntityCategory;
}

// ── Step Progress Component ────────────────────────────────────
function StepProgress({ sequence, current }: { sequence: StepKey[]; current: StepKey }) {
  const currentIdx = sequence.indexOf(current);
  return (
    <div style={{ display: 'flex', gap: '0', marginBottom: '32px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
      {sequence.map((key, i) => (
        <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {i > 0 && <div style={{ flex: 1, height: '2px', background: i <= currentIdx ? 'var(--accent)' : 'var(--border)' }} />}
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 600,
              background: i <= currentIdx ? 'var(--accent)' : 'var(--bg-secondary)',
              color: i <= currentIdx ? '#fff' : 'var(--muted)',
              border: `2px solid ${i <= currentIdx ? 'var(--accent)' : 'var(--border)'}`,
            }}>
              {i < currentIdx ? <Check size={12} /> : i + 1}
            </div>
            {i < sequence.length - 1 && <div style={{ flex: 1, height: '2px', background: i < currentIdx ? 'var(--accent)' : 'var(--border)' }} />}
          </div>
          <span style={{
            fontSize: '11px', whiteSpace: 'nowrap', textAlign: 'center',
            color: i === currentIdx ? 'var(--accent)' : 'var(--muted)',
            fontWeight: i === currentIdx ? 600 : 400,
          }}>
            {STEP_LABELS[key]}
          </span>
        </div>
      ))}
    </div>
  );
}

// toEntityType alias
const toEntityType = toSlug;

// ── Main Component ─────────────────────────────────────────────
export default function CreateEntityPage() {
  const navigate = useNavigate();
  const { createEntity, createEntityMetadataBundle, savedEntities, showToast } = useEntityDesignerStore();

  // ── Step & pattern ────────────────────────────────────────────
  const [stepKey, setStepKey] = useState<StepKey>('origin');
  const [pattern, setPattern] = useState<CreationPattern>('blank');

  // ── Archetype + persistence state ─────────────────────────────
  const [entityArchetype, setEntityArchetype] = useState<EntityArchetype>('native_persistent');
  const [persistenceMode, setPersistenceMode] = useState<PersistenceMode>('physical_table');
  const [mutabilityMode, setMutabilityMode] = useState<MutabilityMode>('read_write');
  const [scopePolicy, setScopePolicy] = useState<ScopePolicy>('tenant_scoped');
  const [sourceOfTruthType, setSourceOfTruthType] = useState<SourceOfTruthType>('idms');

  // ── Source step state (conditional) ──────────────────────────
  const [sourceEntityIds, setSourceEntityIds] = useState<string[]>([]);
  const [externalSystemCode, setExternalSystemCode] = useState('');
  const [providerBindingId, setProviderBindingId] = useState('');

  // ── Identity state ────────────────────────────────────────────
  const [label, setLabel] = useState('');
  const [entityTypeOverride, setEntityTypeOverride] = useState('');
  const [description, setDescription] = useState('');

  const [businessCategory, setBusinessCategory] = useState<BusinessCategory>('transaction');
  const [domain, setDomain] = useState('Sales');

  // ── Scope state ───────────────────────────────────────────────
  const [owningLayer, setOwningLayer] = useState<LayerCode>('tenant');

  // ── Key & Numbering state ────────────────────────────────────
  const [businessKeyType, setBusinessKeyType] = useState<BusinessKeyType>('none');
  const [namespace, setNamespace] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [pluralLabel, setPluralLabel] = useState('');

  // ── Storage state ────────────────────────────────────────────
  const [storageMode, setStorageMode] = useState<StorageMode>('physical_table');

  // ── Security Defaults state ──────────────────────────────────
  const [permissionPosture, setPermissionPosture] = useState<'deny_by_default' | 'allow_by_default'>('deny_by_default');
  const [providerSecurityMode, setProviderSecurityMode] = useState<ProviderSecurityMode>('local_only');
  const [recordOwnershipModel, setRecordOwnershipModel] = useState<RecordOwnershipModel>('user_owned');

  // ── Capability profile ────────────────────────────────────────
  const [capabilities, setCapabilities] = useState<CapabilityState>(
    ARCHETYPE_CAPABILITY_DEFAULTS['native_persistent']
  );

  // ── Extend state ──────────────────────────────────────────────
  const [selectedBaseEntityType, setSelectedBaseEntityType] = useState('');
  const [entitySearchQ, setEntitySearchQ] = useState('');

  // ── Derived values ────────────────────────────────────────────
  const derivedEntityType = entityTypeOverride || toEntityType(label);
  const sequence = useMemo(() => getStepSequence(pattern, entityArchetype), [pattern, entityArchetype]);
  const lockedCaps = useMemo(() => getLockedCapabilities(entityArchetype), [entityArchetype]);
  const derivedCategory: EntityCategory = useMemo(() => toEntityCategory(businessCategory), [businessCategory]);

  // ── Compile preview (computed from wizard state) ──────────────
  const compilePreview: CompilePreviewResult = useMemo(() => computeCompilePreview({
    archetype: entityArchetype,
    persistenceMode,
    mutabilityMode,
    scopePolicy,
    sourceOfTruth: sourceOfTruthType,
    storageMode,
    businessKeyType,
    canSave: capabilities.canSave,
    apiExposed: capabilities.apiExposed,
    offlineEnabled: capabilities.offlineEnabled,
    cacheable: capabilities.cacheable,
    importable: capabilities.importable,
    printable: capabilities.printable,
    reportable: capabilities.reportable,
    searchable: capabilities.searchable,
    retentionManaged: capabilities.retentionManaged,
    partitioned: capabilities.partitioned,
    reversible: capabilities.reversible,
    externalSystemCode,
    sourceEntityIds,
    owningLayer,
    label,
    apiName: derivedEntityType,
    namespace: namespace.trim() || undefined,
    recordOwnershipModel,
  }), [entityArchetype, persistenceMode, mutabilityMode, scopePolicy, sourceOfTruthType, storageMode, businessKeyType, capabilities, externalSystemCode, sourceEntityIds, owningLayer, label, derivedEntityType, namespace, recordOwnershipModel]);

  // ── Select archetype — auto-apply defaults ─────────────────────
  const selectArchetype = (arch: EntityArchetype) => {
    setEntityArchetype(arch);
    const d = ARCHETYPE_DEFAULTS[arch];
    setPersistenceMode(d.persistence);
    setMutabilityMode(d.mutability);
    setSourceOfTruthType(d.sourceOfTruth);
    setScopePolicy(d.scopePolicy);
    setBusinessCategory(d.businessCategory);
    setCapabilities(ARCHETYPE_CAPABILITY_DEFAULTS[arch]);
    setStorageMode(ARCHETYPE_STORAGE_DEFAULTS[arch]);
    setRecordOwnershipModel(ARCHETYPE_OWNERSHIP_DEFAULTS[arch]);
  };

  // ── Toggle capability ──────────────────────────────────────────
  const toggleCap = (key: keyof CapabilityState) => {
    if (lockedCaps[key]) return;
    setCapabilities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Toggle source entity ───────────────────────────────────────
  const toggleSourceEntity = (entityType: string) => {
    setSourceEntityIds(prev =>
      prev.includes(entityType) ? prev.filter(e => e !== entityType) : [...prev, entityType]
    );
  };

  // ── canProceed ─────────────────────────────────────────────────
  const canProceed = useCallback((): boolean => {
    switch (stepKey) {
      case 'origin':     return !!pattern;
      case 'archetype':  return !!entityArchetype;
      case 'base_entity': return !!selectedBaseEntityType;
      case 'source':
        if (entityArchetype === 'external_federated') return externalSystemCode.trim().length > 0;
        if (entityArchetype === 'staging_import') return true; // target entity set later
        return true;
      case 'identity': {
        if (label.trim().length < 2 || derivedEntityType.length < 2) return false;
        const allEntities = getEntityDefinitions(savedEntities);
        if (allEntities.some(e => e.entityType === derivedEntityType)) return false;
        if (owningLayer !== 'platform' && namespace.trim().length < 2) return false;
        return true;
      }
      case 'key_storage': return true; // defaults are always valid
      case 'security_capability': return true;
      default: return true;
    }
  }, [stepKey, pattern, entityArchetype, selectedBaseEntityType,
      externalSystemCode, label, derivedEntityType, owningLayer, namespace, savedEntities]);

  // ── handleCreate ───────────────────────────────────────────────
  const handleCreate = () => {
    let fields: FieldInstance[];
    let displayNameFieldId: string | undefined;

    // Use archetype system fields from data file
    const systemFieldDefs = ARCHETYPE_SYSTEM_FIELDS[entityArchetype] ?? ARCHETYPE_SYSTEM_FIELDS['native_persistent'];
    const systemFields: FieldInstance[] = systemFieldDefs.map((def, i) =>
      simpleDefToFieldInstance(def, owningLayer, i)
    );

    // Determine display name field from archetype or default to 'name'
    const archetypeDisplayField = ARCHETYPE_DISPLAY_NAME_FIELD[entityArchetype];
    if (archetypeDisplayField) {
      displayNameFieldId = archetypeDisplayField.fieldId;
    } else {
      // Default: add a 'name' text field if not already in system fields
      const hasName = systemFields.some(f => f.fieldId === 'name');
      if (!hasName) {
        systemFields.push(simpleDefToFieldInstance(
          { fieldId: 'name', label: 'Name', fieldType: 'text', required: true },
          owningLayer, systemFields.length
        ));
      }
      displayNameFieldId = 'name';
    }

    fields = systemFields;

    // Build EntityBehaviors from capabilities
    const isReadOnlyArchetype = ['virtual_computed', 'external_federated', 'materialized_projection', 'system_technical'].includes(entityArchetype);
    const entityBehaviors: EntityBehaviors = {
      workflowEnabled: capabilities.workflowEnabled && !isReadOnlyArchetype,
      auditable: capabilities.auditable,
      softDelete: entityArchetype === 'append_only_record' ? false : derivedCategory !== 'ledger_like',
      allowAttachments: false,
      allowBulkImport: capabilities.importable,
      allowDownstreamExtension: capabilities.extendable,
      allowDownstreamRequirednessRelaxation: false,
    };

    const newEntity: EntityDefinition = {
      entityType: derivedEntityType,
      label: label.trim(),
      description: description.trim(),
      category: derivedCategory,
      domain,
      owningLayer,
      behaviors: entityBehaviors,
      status: 'draft',
      fields,
      parentEntityType: pattern === 'extend' ? selectedBaseEntityType : undefined,
      displayNameFieldId,
      // v2 classification dimensions
      entityArchetype,
      businessCategory,
      persistenceMode,
      mutabilityMode,
      scopePolicy,
      sourceOfTruthType,
      sourceEntityIds: sourceEntityIds.length > 0 ? sourceEntityIds : undefined,
      externalSystemCode: externalSystemCode.trim() || undefined,
      providerBindingId: providerBindingId.trim() || undefined,
      primaryKeyStrategy: 'uuid',
      // v2 capability profile
      lookupEligible: capabilities.lookupEligible,
      canSave: capabilities.canSave,
      importable: capabilities.importable,
      exportable: capabilities.exportable,
      printable: capabilities.printable,
      reportable: capabilities.reportable,
      apiExposed: capabilities.apiExposed,
      offlineEnabled: capabilities.offlineEnabled,
      cacheable: capabilities.cacheable,
      extendable: capabilities.extendable,
      searchable: capabilities.searchable,
      // v3 new fields
      businessKeyType,
      namespace: namespace.trim() || undefined,
      shortCode: shortCode.trim() || undefined,
      owningModule: domain.trim() || undefined,
      pluralLabel: pluralLabel.trim() || undefined,
      timelineEligible: capabilities.timelineEligible,
      notificationEligible: capabilities.notificationEligible,
      packageInstallable: capabilities.packageInstallable,
      eventPublishable: capabilities.eventPublishable,
      reversible: capabilities.reversible,
      retentionManaged: capabilities.retentionManaged,
      partitioned: capabilities.partitioned,
      providerBacked: capabilities.providerBacked,
      stagingPromotable: capabilities.stagingPromotable,
      hierarchyRollupEnabled: capabilities.hierarchyRollupEnabled,
      storageConfig: {
        storageMode,
      },
      securityDefaults: {
        recordCreateDefault: permissionPosture === 'deny_by_default' ? 'deny' : 'allow',
        recordReadDefault: permissionPosture === 'deny_by_default' ? 'deny' : 'allow',
        recordUpdateDefault: permissionPosture === 'deny_by_default' ? 'deny' : 'allow',
        recordDeleteDefault: permissionPosture === 'deny_by_default' ? 'deny' : 'allow',
        exportDefault: permissionPosture === 'deny_by_default' ? 'deny' : 'allow',
        apiAccessDefault: permissionPosture === 'deny_by_default' ? 'deny' : 'allow',
        fieldProtectionDefault: permissionPosture === 'deny_by_default' ? 'internal' : 'open',
        providerSecurityMode: entityArchetype === 'external_federated' ? providerSecurityMode : undefined,
      },
      recordOwnershipModel,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    const canonicalBundle = buildCanonicalEntityAuthoringBundle(newEntity, {
      namespace: 'auto_service',
      owningPackageId: 'pkg_automotive_service',
      owningModule: domain || 'Entity Designer',
      createdBy: 'ui_author',
    });

    if (!canonicalBundle.valid) {
      const firstIssue = canonicalBundle.issues[0];
      showToast(firstIssue?.message ?? 'Entity metadata validation failed.', 'error');
      return;
    }

    createEntityMetadataBundle(canonicalBundle.entity, canonicalBundle.fields);
    createEntity(newEntity);
    navigate(`/admin/studio/entities/${derivedEntityType}/schema`);
  };

  // ── Navigation ─────────────────────────────────────────────────
  const next = () => {
    if (!canProceed()) return;
    const idx = sequence.indexOf(stepKey);
    if (idx < sequence.length - 1) setStepKey(sequence[idx + 1]);
  };
  const back = () => {
    const idx = sequence.indexOf(stepKey);
    if (idx > 0) setStepKey(sequence[idx - 1]);
  };

  // ── Shared style helpers ───────────────────────────────────────
  const radioCard = (selected: boolean, disabled = false): React.CSSProperties => ({
    padding: '14px 16px',
    border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    background: selected ? 'hsl(22 100% 51% / 0.06)' : 'var(--bg-secondary)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  });

  const radioDot = (selected: boolean): React.CSSProperties => ({
    width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
    border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
    background: selected ? 'var(--accent)' : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  });

  // ── All entities (for pickers) ─────────────────────────────────
  const allEntities = useMemo(() => getEntityDefinitions(savedEntities), [savedEntities]);

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="page" style={{ maxWidth: '820px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Create Entity</h1>
          <p className="page-subtitle">Define a new governed entity schema</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/admin/studio/entities')}>
          Cancel
        </button>
      </div>

      <StepProgress sequence={sequence} current={stepKey} />

      <div className="card" style={{ padding: '24px', flex: 1, minHeight: 0, overflow: 'auto' }}>

        {/* ══ STEP: Origin ══ */}
        {stepKey === 'origin' && (
          <div>
            <h2 style={{ fontWeight: 600, marginBottom: '4px' }}>How would you like to create this entity?</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>Choose a creation pattern to get started.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {([
                { value: 'blank'    as CreationPattern, label: 'Create from Blank',      desc: 'Start with only system fields. Choose an archetype and configure all capabilities manually.',         recommended: true  },
                { value: 'extend'   as CreationPattern, label: 'Extend Existing Entity', desc: 'Inherit all fields from an existing entity and add or constrain fields at your governance layer.',                        },
              ]).map(opt => (
                <div key={opt.value} onClick={() => setPattern(opt.value)} style={radioCard(pattern === opt.value)}>
                  <div style={radioDot(pattern === opt.value)}>
                    {pattern === opt.value && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 500 }}>{opt.label}</span>
                      {opt.recommended && <span className="badge badge-green" style={{ fontSize: '10px' }}>Recommended</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0' }}>{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ STEP: Archetype (blank pattern) ══ */}
        {stepKey === 'archetype' && (
          <div>
            <h2 style={{ fontWeight: 600, marginBottom: '4px' }}>Select Entity Archetype</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>
              The archetype determines the runtime shape, persistence model, and mutability of this entity.
              Selecting an archetype auto-configures sensible defaults — you can adjust them in later steps.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {ARCHETYPE_CARDS.map(card => {
                const selected = entityArchetype === card.value;
                const Icon = card.Icon;
                return (
                  <div key={card.value} onClick={() => selectArchetype(card.value)}
                    style={{ ...radioCard(selected), padding: '16px', alignItems: 'flex-start', gap: '14px', cursor: 'pointer' }}>
                    <Icon size={22} style={{ color: selected ? 'var(--accent)' : 'var(--muted)', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: selected ? 'var(--accent)' : 'var(--text)', marginBottom: '4px' }}>
                        {card.label}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 8px' }}>{card.desc}</p>
                      <span style={{
                        fontSize: '10px', padding: '2px 7px', borderRadius: '10px', fontWeight: 600,
                        background: selected ? 'hsl(22 100% 51% / 0.1)' : 'var(--bg)',
                        color: selected ? 'var(--accent)' : 'var(--muted)',
                        border: `1px solid ${selected ? 'hsl(22 100% 51% / 0.25)' : 'var(--border)'}`,
                      }}>
                        {card.defaults}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ STEP: Base Entity Picker (extend pattern) ══ */}
        {stepKey === 'base_entity' && (() => {
          const q = entitySearchQ.toLowerCase();
          const filtered = allEntities.filter(e =>
            !q || e.label.toLowerCase().includes(q) || e.entityType.includes(q) || e.domain.toLowerCase().includes(q)
          );
          return (
            <div>
              <h2 style={{ fontWeight: 600, marginBottom: '4px' }}>Select Base Entity</h2>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>
                Your entity will inherit all fields. You can add new fields or constrain inherited ones at your layer.
              </p>
              <input className="search-input" style={{ width: '100%', marginBottom: '12px' }}
                placeholder="Search entities…" value={entitySearchQ} onChange={e => setEntitySearchQ(e.target.value)} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '340px', overflowY: 'auto' }}>
                {filtered.map(e => {
                  const sel = selectedBaseEntityType === e.entityType;
                  const arch = ARCHETYPE_CARDS.find(a => a.value === e.entityArchetype);
                  return (
                    <div key={e.entityType} onClick={() => setSelectedBaseEntityType(e.entityType)}
                      style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                        border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                        background: sel ? 'hsl(22 100% 51% / 0.06)' : 'var(--bg-secondary)',
                        display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                        background: sel ? 'var(--accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {sel && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '14px' }}>{e.label}</span>
                          <code style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)' }}>{e.entityType}</code>
                          {arch && (
                            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 600 }}>
                              {arch.label}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                          {e.domain} · {e.owningLayer} layer · {e.fields.length} fields
                        </div>
                      </div>
                      {sel && <Check size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '24px' }}>No entities match your search.</p>
                )}
              </div>
            </div>
          );
        })()}

        {/* ══ STEP: Source of Truth & Persistence (conditional) ══ */}
        {stepKey === 'source' && (
          <div>
            <h2 style={{ fontWeight: 600, marginBottom: '4px' }}>Source of Truth & Persistence</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>
              Configure where the data for this <strong>{ARCHETYPE_CARDS.find(a => a.value === entityArchetype)?.label}</strong> entity comes from.
            </p>

            {/* virtual_computed */}
            {entityArchetype === 'virtual_computed' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Source Entities</label>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
                    Select the entities whose data this computed entity aggregates or transforms.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px' }}>
                    {allEntities.map(e => (
                      <label key={e.entityType} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', background: sourceEntityIds.includes(e.entityType) ? 'hsl(22 100% 51% / 0.06)' : 'transparent' }}>
                        <input type="checkbox" checked={sourceEntityIds.includes(e.entityType)} onChange={() => toggleSourceEntity(e.entityType)} />
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{e.label}</span>
                        <code style={{ fontSize: '11px', color: 'var(--muted)' }}>{e.entityType}</code>
                      </label>
                    ))}
                  </div>
                  {sourceEntityIds.length === 0 && (
                    <p style={{ fontSize: '11px', color: 'var(--warning, #f59e0b)', marginTop: '6px' }}>
                      ⚠ Source entities are required for lineage tracking.
                    </p>
                  )}
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', gap: '8px' }}>
                  <Lock size={14} style={{ color: 'var(--muted)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                    Mutability is locked to <strong>Read-only</strong> for virtual computed entities.
                    Data cannot be saved directly — it is derived from source entities at query time.
                  </p>
                </div>
              </div>
            )}

            {/* external_federated */}
            {entityArchetype === 'external_federated' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">External System Code *</label>
                  <input className="search-input" style={{ width: '100%' }}
                    placeholder="e.g. OEM_PORTAL, SAP_PROD, SALESFORCE_CRM"
                    value={externalSystemCode}
                    onChange={e => setExternalSystemCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))} />
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                    Uppercase alphanumeric code identifying the external system of record.
                  </p>
                </div>
                <div>
                  <label className="form-label">Provider Binding ID</label>
                  <input className="search-input" style={{ width: '100%' }}
                    placeholder="e.g. provider_oem_allocation"
                    value={providerBindingId}
                    onChange={e => setProviderBindingId(e.target.value)} />
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                    Optional: the integration provider binding that handles data sync.
                  </p>
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', gap: '8px' }}>
                  <Info size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                    iDMS reads and syncs data but does not own the canonical record. Saves are disabled by default.
                    Enable write-back only if the external provider explicitly supports it.
                  </p>
                </div>
              </div>
            )}

            {/* materialized_projection */}
            {entityArchetype === 'materialized_projection' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Source Entities *</label>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
                    Select the canonical entities this projection is built from.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px' }}>
                    {allEntities.map(e => (
                      <label key={e.entityType} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', background: sourceEntityIds.includes(e.entityType) ? 'hsl(22 100% 51% / 0.06)' : 'transparent' }}>
                        <input type="checkbox" checked={sourceEntityIds.includes(e.entityType)} onChange={() => toggleSourceEntity(e.entityType)} />
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{e.label}</span>
                        <code style={{ fontSize: '11px', color: 'var(--muted)' }}>{e.entityType}</code>
                      </label>
                    ))}
                  </div>
                  {sourceEntityIds.length === 0 && (
                    <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>
                      Source entities are required for materialized projections.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* staging_import */}
            {entityArchetype === 'staging_import' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', gap: '8px' }}>
                  <Info size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                    Staging entities temporarily hold imported data before validation and promotion.
                    The target entity will be configured after creation.
                  </p>
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', gap: '8px' }}>
                  <Lock size={14} style={{ color: 'var(--muted)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                    Mutability is locked to <strong>Staging Promote Only</strong>. Records are validated then promoted to the target entity.
                    Retention policy is required for cleanup.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ STEP: Identity & Key ══ */}
        {stepKey === 'identity' && (
          <div>
            <h2 style={{ fontWeight: 600, marginBottom: '4px' }}>Identity</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>
              {pattern === 'extend'
                ? 'Name your extension entity. It will inherit all fields from the base entity.'
                : 'Define the name, description, and classification of this entity.'}
            </p>

            {/* Extend mode: base entity banner */}
            {pattern === 'extend' && (() => {
              const base = allEntities.find(e => e.entityType === selectedBaseEntityType);
              return base ? (
                <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Info size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontWeight: 600 }}>Extending: </span>
                    {base.label}{' '}
                    <code style={{ fontFamily: 'monospace', fontSize: '11px' }}>({base.entityType})</code>
                    <span style={{ color: 'var(--muted)', marginLeft: '8px' }}>— {base.fields.length} fields will be inherited</span>
                  </div>
                </div>
              ) : null;
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Label */}
              <div>
                <label className="form-label">Entity Label *</label>
                <input className="search-input" style={{ width: '100%' }}
                  placeholder="e.g., Insurance Claim"
                  value={label}
                  onChange={e => { setLabel(e.target.value); setEntityTypeOverride(''); }} />
                <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Human-readable name shown in the UI</p>
              </div>

              {/* API Name */}
              <div>
                <label className="form-label">API Name (auto-generated, locked after creation)</label>
                <div style={{ position: 'relative' }}>
                  <input className="search-input" style={{ width: '100%', fontFamily: 'monospace', paddingRight: '80px' }}
                    placeholder="entity_type"
                    value={entityTypeOverride || derivedEntityType}
                    onChange={e => setEntityTypeOverride(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 50))} />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--muted)' }}>
                    {entityTypeOverride ? 'custom' : 'auto'}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                  Used as: <code style={{ fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: '1px 4px', borderRadius: '3px' }}>entity.{derivedEntityType || 'entity_type'}</code>
                </p>
                {derivedEntityType && allEntities.some(e => e.entityType === derivedEntityType) && (
                  <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={11} /> API name <code style={{ fontFamily: 'monospace' }}>{derivedEntityType}</code> already exists.
                  </p>
                )}
              </div>

              {/* Namespace */}
              <div>
                <label className="form-label">Namespace{owningLayer !== 'platform' ? ' *' : ''}</label>
                <input className="search-input" style={{ width: '100%' }}
                  placeholder="e.g. auto_service"
                  value={namespace}
                  onChange={e => setNamespace(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} />
                {owningLayer !== 'platform' && namespace.trim().length > 0 && namespace.trim().length < 2 && (
                  <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={11} /> Namespace must be at least 2 characters.
                  </p>
                )}
                {owningLayer !== 'platform' && namespace.trim().length === 0 && (
                  <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={11} /> Namespace is required for non-platform entities to prevent API name collisions.
                  </p>
                )}
                {owningLayer === 'platform' && (
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                    Optional for platform-level entities.
                  </p>
                )}
                <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                  Logical namespace for API routing (e.g. <code style={{ fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: '1px 4px', borderRadius: '3px' }}>/api/v1/{namespace.trim() || 'namespace'}/{derivedEntityType || 'entity'}</code>).
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="form-label">Description</label>
                <textarea className="search-input" style={{ width: '100%', minHeight: '72px', resize: 'vertical' }}
                  placeholder="When is this entity created? Who creates it? What are its key lifecycle stages?"
                  value={description}
                  onChange={e => setDescription(e.target.value)} />
              </div>

              {/* Domain + Business Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Domain</label>
                  <input className="search-input" style={{ width: '100%' }}
                    placeholder="e.g., Sales, Service, Finance"
                    value={domain}
                    onChange={e => setDomain(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Business Category</label>
                  <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', fontWeight: 500, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={12} style={{ color: 'var(--muted)' }} />
                    {businessCategory.replace(/_/g, ' ')}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Set by archetype — change archetype to modify.</p>
                </div>
              </div>

              {/* Ledger warning */}
              {derivedCategory === 'ledger_like' && (
                <div style={{ padding: '12px', background: 'var(--warning-bg, rgba(245,158,11,0.1))', border: '1px solid var(--warning-border, rgba(245,158,11,0.3))', borderRadius: '6px', display: 'flex', gap: '8px' }}>
                  <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '12px', margin: 0 }}>
                    <strong>Ledger-like entities</strong> are immutable. Records can never be soft-deleted. Corrections require counter-entries only.
                  </p>
                </div>
              )}

              {/* Scope & Ownership (blank pattern only) */}
              {pattern === 'blank' && (
                <>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '8px', paddingBottom: '4px', borderBottom: '1px solid var(--border)' }}>
                    Scope & Ownership
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label">Owning Layer</label>
                      <select className="search-input" style={{ width: '100%' }}
                        value={owningLayer}
                        onChange={e => setOwningLayer(e.target.value as LayerCode)}>
                        <option value="platform">Platform</option>
                        <option value="vertical">Vertical</option>
                        <option value="tenant">Tenant</option>
                        <option value="node">Branch / Location</option>
                      </select>
                      {owningLayer === 'node' && (
                        <p style={{ fontSize: '11px', color: 'var(--warning, #f59e0b)', marginTop: '4px' }}>
                          ⚠ Branch/location-level entities are isolated per node.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="form-label">Scope Policy</label>
                      <select className="search-input" style={{ width: '100%' }}
                        value={scopePolicy}
                        onChange={e => setScopePolicy(e.target.value as ScopePolicy)}>
                        <option value="global">Global</option>
                        <option value="tenant_scoped">Tenant-scoped</option>
                        <option value="company_scoped">Company-scoped</option>
                        <option value="node_scoped">Node-scoped</option>
                        <option value="hierarchical_scope">Hierarchical</option>
                        <option value="external_scope">External</option>
                        <option value="not_applicable">Not applicable</option>
                      </select>
                      <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Auto-set from archetype.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ STEP: Key & Storage ══ */}
        {stepKey === 'key_storage' && (
          <div>
            <h2 style={{ fontWeight: 600, marginBottom: '4px' }}>Key & Storage</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>
              Configure primary key strategy, namespace, short code, and storage mode.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Business Key Type */}
              <div>
                <label className="form-label">Primary Key Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {([
                    { value: 'none' as BusinessKeyType,         label: 'UUID Only',        desc: 'Platform-generated UUID primary key (recommended for most entities)' },
                    { value: 'natural' as BusinessKeyType,      label: 'Natural Key',      desc: 'User-defined meaningful business key alongside UUID' },
                    { value: 'composite' as BusinessKeyType,    label: 'Composite Key',    desc: 'Multi-column business key alongside UUID' },
                    { value: 'external_id' as BusinessKeyType,  label: 'External ID',      desc: 'Key managed by external system' },
                    { value: 'provider_key' as BusinessKeyType, label: 'Provider Key',     desc: 'Key assigned by integration provider' },
                  ]).map(opt => (
                    <div key={opt.value} onClick={() => setBusinessKeyType(opt.value)}
                      style={{ ...radioCard(businessKeyType === opt.value), padding: '10px 14px', cursor: 'pointer' }}>
                      <div style={radioDot(businessKeyType === opt.value)}>
                        {businessKeyType === opt.value && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: businessKeyType === opt.value ? 'var(--accent)' : 'var(--text)' }}>{opt.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{opt.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Short Code only (namespace moved to Identity step) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Short Code</label>
                  <input className="search-input" style={{ width: '100%' }}
                    placeholder="e.g. VO, IC"
                    value={shortCode}
                    onChange={e => setShortCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))} />
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                    2-5 char code used in auto-numbering prefixes (e.g. VO-2026-000001).
                  </p>
                </div>
              </div>

              {/* Plural Label */}
              <div>
                <label className="form-label">Plural Label</label>
                <input className="search-input" style={{ width: '100%' }}
                  placeholder="e.g. Vehicle Orders, Insurance Claims"
                  value={pluralLabel}
                  onChange={e => setPluralLabel(e.target.value)} />
                <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                  Used in navigation, list views, and search result headers.
                </p>
              </div>

              {/* Storage section divider */}
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '8px', paddingBottom: '4px', borderBottom: '1px solid var(--border)' }}>
                Storage
              </div>

              {/* Storage Mode (read-only if only one valid option) */}
              {(() => {
                const validModes = ARCHETYPE_VALID_STORAGE_MODES[entityArchetype] ?? ['physical_table'];
                const allStorageOptions = [
                  { value: 'physical_table' as StorageMode,              label: 'Physical Table',       desc: 'iDMS manages table creation and schema.' },
                  { value: 'owned_child_table' as StorageMode,           label: 'Owned Child Table',    desc: 'Child table tied to parent entity.' },
                  { value: 'junction_table' as StorageMode,              label: 'Junction Table',       desc: 'Many-to-many link table.' },
                  { value: 'append_log_table' as StorageMode,            label: 'Append Log Table',     desc: 'Append-only event/audit table.' },
                  { value: 'outbox_table' as StorageMode,                label: 'Outbox Table',         desc: 'Outbox pattern for event publishing.' },
                  { value: 'sql_view' as StorageMode,                    label: 'SQL View',             desc: 'Virtual computed view — no physical storage.' },
                  { value: 'materialized_view_or_table' as StorageMode,  label: 'Materialized View',    desc: 'Materialized projection for read perf.' },
                  { value: 'external_provider' as StorageMode,           label: 'External Provider',    desc: 'Data in external system. No local table.' },
                  { value: 'system_table' as StorageMode,                label: 'System Table',         desc: 'Platform-managed internal table.' },
                ];
                const filtered = allStorageOptions.filter(o => validModes.includes(o.value));
                if (filtered.length <= 1) {
                  return (
                    <div>
                      <label className="form-label">Storage Mode</label>
                      <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Lock size={12} style={{ color: 'var(--muted)' }} />
                        {filtered[0]?.label ?? 'Physical Table'}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Determined by archetype.</p>
                    </div>
                  );
                }
                return (
                  <div>
                    <label className="form-label">Storage Mode</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {filtered.map(opt => (
                        <div key={opt.value} onClick={() => setStorageMode(opt.value)}
                          style={{ ...radioCard(storageMode === opt.value), cursor: 'pointer' }}>
                          <div style={radioDot(storageMode === opt.value)}>
                            {storageMode === opt.value && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: storageMode === opt.value ? 'var(--accent)' : 'var(--text)' }}>{opt.label}</div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{opt.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Persistence info banner */}
              <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', gap: '8px' }}>
                <HardDrive size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                  Persistence mode: <strong>{persistenceMode.replace(/_/g, ' ')}</strong>.
                  {entityArchetype === 'high_volume_event_log' && ' Partition and retention policies are required.'}
                  {entityArchetype === 'integration_outbox' && ' Outbox table with retry management.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP: Security & Capabilities ══ */}
        {stepKey === 'security_capability' && (
          <div>
            <h2 style={{ fontWeight: 600, marginBottom: '4px' }}>Security & Capabilities</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>
              Set the default security posture and configure what this entity can do.
            </p>

            {/* Record Ownership */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid var(--border)' }}>
                Record Ownership
              </div>
              {recordOwnershipModel === 'none' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', color: 'var(--muted)' }}>
                  <Lock size={13} style={{ flexShrink: 0 }} />
                  Not applicable — this archetype has no record ownership concept.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {([
                    { value: 'user_owned' as RecordOwnershipModel, label: 'User Owned', desc: 'Each record has a single owning user; row-level security is per-user' },
                    { value: 'team_owned' as RecordOwnershipModel, label: 'Team Owned', desc: 'Record belongs to a team; all team members share access' },
                    { value: 'org_owned'  as RecordOwnershipModel, label: 'Org Owned',  desc: 'All tenant users can access; no per-record owner concept' },
                  ]).map(opt => (
                    <div key={opt.value} onClick={() => setRecordOwnershipModel(opt.value)}
                      style={{ ...radioCard(recordOwnershipModel === opt.value), cursor: 'pointer', flex: 1 }}>
                      <div style={radioDot(recordOwnershipModel === opt.value)}>
                        {recordOwnershipModel === opt.value && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: recordOwnershipModel === opt.value ? 'var(--accent)' : 'var(--text)' }}>{opt.label}</span>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{opt.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Permission Posture */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid var(--border)' }}>
                Security Defaults
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {([
                  { value: 'deny_by_default' as const, label: 'Deny by Default', desc: 'No access unless granted', recommended: true },
                  { value: 'allow_by_default' as const, label: 'Allow by Default', desc: 'All roles access unless denied' },
                ]).map(opt => (
                  <div key={opt.value} onClick={() => setPermissionPosture(opt.value)}
                    style={{ ...radioCard(permissionPosture === opt.value), cursor: 'pointer', flex: 1 }}>
                    <div style={radioDot(permissionPosture === opt.value)}>
                      {permissionPosture === opt.value && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: permissionPosture === opt.value ? 'var(--accent)' : 'var(--text)' }}>{opt.label}</span>
                        {opt.recommended && <span className="badge badge-green" style={{ fontSize: '10px' }}>Recommended</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{opt.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Provider Security Mode */}
              {entityArchetype === 'external_federated' && (
                <div style={{ marginTop: '12px' }}>
                  <label className="form-label">Provider Security Mode</label>
                  <select className="search-input" style={{ width: '100%' }}
                    value={providerSecurityMode}
                    onChange={e => setProviderSecurityMode(e.target.value as ProviderSecurityMode)}>
                    <option value="local_only">Local Only — iDMS enforces all security</option>
                    <option value="provider_only">Provider Only — external system enforces</option>
                    <option value="hybrid">Hybrid — both enforce</option>
                    <option value="user_context_propagated">User Context Propagated</option>
                  </select>
                </div>
              )}
            </div>

            {/* Capability Toggles */}
            {[
              {
                group: 'Core',
                items: [
                  { key: 'canSave' as keyof CapabilityState,       label: 'Can Be Saved',      desc: 'Records can be created and updated through iDMS forms and APIs' },
                  { key: 'lookupEligible' as keyof CapabilityState, label: 'Lookup Eligible',   desc: 'This entity can be referenced by entity_ref fields on other entities' },
                  { key: 'searchable' as keyof CapabilityState,     label: 'Searchable',        desc: 'Records appear in global and entity-level search results' },
                ],
              },
              {
                group: 'Data',
                items: [
                  { key: 'importable' as keyof CapabilityState,  label: 'Importable',  desc: 'CSV/bulk import contracts are supported for this entity' },
                  { key: 'exportable' as keyof CapabilityState,  label: 'Exportable',  desc: 'Export operations (CSV, Excel, PDF) are allowed' },
                  { key: 'reportable' as keyof CapabilityState,  label: 'Reportable',  desc: 'Entity feeds into analytics, report builders, and BI datasets' },
                  { key: 'printable' as keyof CapabilityState,   label: 'Printable',   desc: 'Print/PDF document output is supported (e.g. invoice print)' },
                ],
              },
              {
                group: 'Integration',
                items: [
                  { key: 'apiExposed' as keyof CapabilityState,     label: 'API Exposed',      desc: 'A runtime REST API endpoint is generated for this entity' },
                  { key: 'cacheable' as keyof CapabilityState,      label: 'Cacheable',        desc: 'Runtime caching is allowed for query results' },
                  { key: 'offlineEnabled' as keyof CapabilityState, label: 'Offline Enabled',  desc: 'Offline synchronisation is supported for mobile/field use' },
                ],
              },
              {
                group: 'Governance',
                items: [
                  { key: 'extendable' as keyof CapabilityState,      label: 'Extendable',       desc: 'Downstream layers (tenant, node) may add fields and behaviors' },
                  { key: 'workflowEnabled' as keyof CapabilityState, label: 'Workflow Eligible', desc: 'Entity participates in workflow lifecycle (Draft → Active → Closed)' },
                  { key: 'auditable' as keyof CapabilityState,       label: 'Auditable',         desc: 'All field changes are tracked with author and timestamp' },
                  { key: 'packageInstallable' as keyof CapabilityState, label: 'Package Installable', desc: 'Entity can be included in metadata packages for cross-tenant deployment' },
                ],
              },
              {
                group: 'Activity & Communication',
                items: [
                  { key: 'timelineEligible' as keyof CapabilityState,      label: 'Timeline Eligible',      desc: 'Records appear in the activity timeline feed' },
                  { key: 'notificationEligible' as keyof CapabilityState, label: 'Notification Eligible',   desc: 'Events on this entity can trigger notifications' },
                  { key: 'eventPublishable' as keyof CapabilityState,     label: 'Event Publishable',       desc: 'Entity lifecycle events are published to the event bus' },
                ],
              },
              {
                group: 'Data Lifecycle',
                items: [
                  { key: 'reversible' as keyof CapabilityState,       label: 'Reversible',         desc: 'Posted records support reversal (counter-entries)' },
                  { key: 'retentionManaged' as keyof CapabilityState, label: 'Retention Managed', desc: 'Data retention and archival policies are enforced' },
                  { key: 'partitioned' as keyof CapabilityState,      label: 'Partitioned',        desc: 'Table is partitioned for high-volume performance' },
                  { key: 'stagingPromotable' as keyof CapabilityState, label: 'Staging Promotable', desc: 'Records can be promoted to a target entity after validation' },
                ],
              },
              {
                group: 'Provider',
                items: [
                  { key: 'providerBacked' as keyof CapabilityState,          label: 'Provider Backed',          desc: 'Data is managed by an external integration provider' },
                  { key: 'hierarchyRollupEnabled' as keyof CapabilityState, label: 'Hierarchy Rollup Enabled', desc: 'Values roll up through the organisational hierarchy' },
                ],
              },
            ].map(section => (
              <div key={section.group} style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid var(--border)' }}>
                  {section.group}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {section.items.map(item => {
                    const isLocked = !!lockedCaps[item.key];
                    const isOn = capabilities[item.key];
                    return (
                      <div key={item.key}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '6px', gap: '12px', opacity: isLocked ? 0.65 : 1 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 500, fontSize: '13px' }}>{item.label}</span>
                            {isLocked && (
                              <span title={lockedCaps[item.key]} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'var(--muted)', cursor: 'help' }}>
                                <Lock size={10} /> locked
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{item.desc}</div>
                        </div>
                        <button
                          disabled={isLocked}
                          onClick={() => toggleCap(item.key)}
                          style={{
                            width: '40px', height: '22px', borderRadius: '11px', border: 'none',
                            cursor: isLocked ? 'not-allowed' : 'pointer', flexShrink: 0,
                            background: isOn ? 'var(--accent)' : 'var(--border)',
                            position: 'relative', transition: 'background 0.15s',
                          }}>
                          <div style={{
                            position: 'absolute', top: '2px', width: '18px', height: '18px',
                            borderRadius: '50%', background: '#fff', transition: 'left 0.15s',
                            left: isOn ? '20px' : '2px',
                          }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ STEP: Review & Create ══ */}
        {stepKey === 'review' && (
          <div>
            <h2 style={{ fontWeight: 600, marginBottom: '4px' }}>Review & Create</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>Review your configuration and resolve any issues before creating the entity.</p>

            {/* Compile Preview — Status banner */}
            <div style={{
              padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
              background: compilePreview.canCreateDraft ? 'hsl(142 70% 45% / 0.08)' : 'hsl(0 70% 50% / 0.08)',
              border: `1px solid ${compilePreview.canCreateDraft ? 'hsl(142 70% 45% / 0.3)' : 'hsl(0 70% 50% / 0.3)'}`,
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              {compilePreview.canCreateDraft
                ? <Check size={18} style={{ color: 'hsl(142 70% 45%)' }} />
                : <AlertOctagon size={18} style={{ color: 'hsl(0 70% 50%)' }} />
              }
              <span style={{ fontWeight: 600, fontSize: '14px', color: compilePreview.canCreateDraft ? 'hsl(142 70% 35%)' : 'hsl(0 70% 40%)' }}>
                {compilePreview.canCreateDraft ? 'Ready to create draft' : `${compilePreview.blockingIssues.length} blocking issue(s) must be resolved`}
              </span>
            </div>

            {/* Blocking issues */}
            {compilePreview.blockingIssues.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(0 70% 50%)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                  Blocking Issues
                </div>
                {compilePreview.blockingIssues.map((issue, i) => (
                  <div key={i} style={{ padding: '10px 14px', background: 'hsl(0 70% 50% / 0.06)', border: '1px solid hsl(0 70% 50% / 0.2)', borderRadius: '6px', marginBottom: '6px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <AlertOctagon size={14} style={{ color: 'hsl(0 70% 50%)', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '13px' }}>{issue.message}</div>
                      <code style={{ fontSize: '10px', color: 'var(--muted)' }}>{issue.code}</code>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {compilePreview.warnings.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                  Warnings
                </div>
                {compilePreview.warnings.map((w, i) => (
                  <div key={i} style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '6px', marginBottom: '6px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '13px' }}>{w.message}</div>
                      <code style={{ fontSize: '10px', color: 'var(--muted)' }}>{w.code}</code>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Identity + Architecture cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {/* Identity card */}
              <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Identity</div>
                {([
                  ['Label',    label || '—'],
                  ['API Name', `entity.${derivedEntityType || '—'}`],
                  ['Category', businessCategory.replace(/_/g, ' ')],
                  ['Domain',   domain || '—'],
                  ['Layer',    owningLayer],
                  ['Key Type', businessKeyType.replace(/_/g, ' ')],
                  ['Namespace', namespace || '—'],
                  ['Ownership', recordOwnershipModel === 'none' ? 'N/A' : recordOwnershipModel.replace(/_/g, ' ')],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                    <span style={{ color: 'var(--muted)' }}>{k}</span>
                    <span style={{ fontWeight: 500, fontFamily: k === 'API Name' ? 'monospace' : 'inherit', fontSize: k === 'API Name' ? '11px' : '12px' }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Architecture card */}
              <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Architecture</div>
                {([
                  ['Archetype',   ARCHETYPE_CARDS.find(a => a.value === entityArchetype)?.label ?? entityArchetype],
                  ['Persistence', persistenceMode.replace(/_/g, ' ')],
                  ['Mutability',  mutabilityMode.replace(/_/g, ' ')],
                  ['Source',      sourceOfTruthType.replace(/_/g, ' ')],
                  ['Scope',       scopePolicy.replace(/_/g, ' ')],
                  ['Storage',     storageMode.replace(/_/g, ' ')],
                  ['Security',    permissionPosture.replace(/_/g, ' ')],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                    <span style={{ color: 'var(--muted)' }}>{k}</span>
                    <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Capabilities grid */}
            <div style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Capabilities</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {(Object.keys(capabilities) as (keyof CapabilityState)[]).map(key => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
                    <span style={{ fontWeight: 700, color: capabilities[key] ? 'var(--accent)' : 'var(--muted)' }}>
                      {capabilities[key] ? '✓' : '✗'}
                    </span>
                    <span style={{ color: capabilities[key] ? 'var(--text)' : 'var(--muted)', textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* API Endpoint Preview */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={12} />
                API Endpoints
              </div>
              {capabilities.apiExposed ? (() => {
                const apiBase = namespace.trim()
                  ? `/api/v1/${namespace.trim()}/${derivedEntityType || 'entity'}`
                  : `/api/v1/${derivedEntityType || 'entity'}`;
                const methodBadge = (method: string) => {
                  const colors: Record<string, string> = { GET: '#3b82f6', POST: '#22c55e', PATCH: '#f97316', DELETE: '#ef4444' };
                  return (
                    <span style={{ display: 'inline-block', minWidth: '52px', padding: '1px 6px', borderRadius: '4px', background: colors[method] ?? 'var(--accent)', color: '#fff', fontSize: '10px', fontWeight: 700, textAlign: 'center', marginRight: '10px', flexShrink: 0 }}>
                      {method}
                    </span>
                  );
                };
                const endpoints: { method: string; path: string }[] = [
                  { method: 'GET',    path: apiBase },
                  { method: 'GET',    path: `${apiBase}/{id}` },
                  ...(capabilities.canSave ? [
                    { method: 'POST',   path: apiBase },
                    { method: 'PATCH',  path: `${apiBase}/{id}` },
                    { method: 'DELETE', path: `${apiBase}/{id}` },
                  ] : []),
                ];
                return (
                  <div style={{ background: '#0f172a', borderRadius: '6px', padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {endpoints.map((ep, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', color: '#e2e8f0' }}>
                        {methodBadge(ep.method)}
                        <span>{ep.path}</span>
                      </div>
                    ))}
                  </div>
                );
              })() : (
                <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={13} style={{ flexShrink: 0 }} />
                  API not exposed. Enable "API Exposed" in Security &amp; Capabilities to generate REST endpoints.
                </div>
              )}
            </div>

            {/* System Fields */}
            <div style={{ marginBottom: '16px' }}>
              <div className="form-label">System Fields (auto-included)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {(ARCHETYPE_SYSTEM_FIELDS[entityArchetype] ?? []).map(f => (
                  <span key={f.fieldId} className="tag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {f.systemOwned && <Lock size={10} />} {f.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Post-Creation Next Steps */}
            {compilePreview.nextSteps.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                  Post-Creation Next Steps
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {compilePreview.nextSteps.map((step, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '6px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
                      <ArrowRight size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info banner */}
            <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '6px', display: 'flex', gap: '8px' }}>
              <Info size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '13px', margin: 0 }}>
                Clicking <strong>Create Schema Shell</strong> will create the entity in <strong>draft</strong> state.
                You'll be taken to the Schema Builder to add fields and configure views.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation buttons ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', flexShrink: 0 }}>
        <button className="btn btn-ghost"
          onClick={stepKey === 'origin' ? () => navigate('/admin/studio/entities') : back}>
          <ChevronLeft size={14} /> {stepKey === 'origin' ? 'Cancel' : 'Back'}
        </button>
        {stepKey !== 'review' ? (
          <button className="btn btn-primary" onClick={next} disabled={!canProceed()}>
            Next <ChevronRight size={14} />
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleCreate} disabled={!compilePreview.canCreateDraft}>
            <Check size={14} /> Create Schema Shell
          </button>
        )}
      </div>
    </div>
  );
}
