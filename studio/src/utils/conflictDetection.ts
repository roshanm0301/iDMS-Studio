// ============================================================
// Unified conflict detection for Entity Designer
// Separates compile errors from governance conflicts so that:
//   - ConflictSummary (Fields tab) shows compile errors only
//   - GovernancePolicyHints (Governance tab) shows governance conflicts only
// ============================================================
import type { EntityDefinition } from '../types/entityDesigner';
import type { RelationshipDefinition } from '../types/relationshipDesigner';

export interface ConflictItem {
  severity: 'error' | 'warning';
  message: string;
  fieldId?: string;
  fieldLabel?: string;
}

export function detectAllConflicts(entity: EntityDefinition): {
  compileErrors: ConflictItem[];
  governanceConflicts: ConflictItem[];
} {
  const compileErrors: ConflictItem[] = [];
  const governanceConflicts: ConflictItem[] = [];

  entity.fields.forEach(field => {
    // ── Compile errors (schema / technical violations) ────────
    // Protected field cannot allow import — breaks schema integrity
    if (field.protected && field.governance.allowImport) {
      compileErrors.push({
        severity: 'error',
        message: `Protected field "${field.label}" cannot allow import`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }
    // Computed field cannot allow import — logically impossible
    if (field.fieldType === 'computed' && field.governance.allowImport) {
      compileErrors.push({
        severity: 'error',
        message: `Computed field "${field.label}" cannot allow import`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }
    // System-only editability + apiInputAllowed = silent data loss
    if (field.behaviors.editability === 'system_only' && field.governance.apiInputAllowed) {
      compileErrors.push({
        severity: 'warning',
        message: `System-only field "${field.label}" has API input enabled — inputs will be silently ignored`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }
    // Disabled field with live dependencies — usage risk
    if (field.lifecycle === 'disabled' && (field.dependencies?.length ?? 0) > 0) {
      compileErrors.push({
        severity: 'warning',
        message: `Disabled field "${field.label}" still has ${field.dependencies!.length} active dependency(-ies)`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }

    // ── Governance conflicts (policy / compliance violations) ─
    // Sensitive or Regulated exported without masking
    if (
      (field.classification === 'sensitive' || field.classification === 'regulated') &&
      field.governance.includeInExport &&
      !field.governance.maskInExport
    ) {
      governanceConflicts.push({
        severity: 'warning',
        message: `${field.classification === 'regulated' ? 'Regulated' : 'Sensitive'} field "${field.label}" is exported without masking`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }
    // Disabled field still included in export
    if (field.lifecycle === 'disabled' && field.governance.includeInExport) {
      governanceConflicts.push({
        severity: 'warning',
        message: `Disabled field "${field.label}" is still marked for export`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }
  });

  // ── Entity-level archetype validation rules (ENT.VAL.101–110) ──

  // ENT.VAL.101 — virtual_computed cannot be configured for ordinary writes
  if (entity.entityArchetype === 'virtual_computed' && entity.mutabilityMode === 'read_write') {
    compileErrors.push({
      severity: 'error',
      message: 'Virtual computed entities cannot be configured for ordinary direct writes. Use read_only or derived_refresh_only.',
    });
  }

  // ENT.VAL.102 — virtual_computed should declare source entity bindings
  if (entity.entityArchetype === 'virtual_computed' && (!entity.sourceEntityIds?.length)) {
    compileErrors.push({
      severity: 'warning',
      message: 'Virtual computed entity should declare source entities for lineage tracking.',
    });
  }

  // ENT.VAL.103 — external_federated requires an external system code
  if (entity.entityArchetype === 'external_federated' && !entity.externalSystemCode) {
    compileErrors.push({
      severity: 'error',
      message: 'External/federated entity requires an external system code (e.g. OEM_PORTAL, SAP_PROD).',
    });
  }

  // ENT.VAL.104 — external_federated with canSave=true and non-provider mutability is suspicious
  if (
    entity.entityArchetype === 'external_federated' &&
    entity.canSave === true &&
    entity.mutabilityMode !== 'provider_capability_driven'
  ) {
    compileErrors.push({
      severity: 'warning',
      message: 'External entities are read-only by default. Ensure the provider explicitly supports write-back before enabling save.',
    });
  }

  // ENT.VAL.105 — materialized_projection requires source entity bindings
  if (entity.entityArchetype === 'materialized_projection' && !entity.sourceEntityIds?.length) {
    compileErrors.push({
      severity: 'error',
      message: 'Materialized projection entity requires source entity bindings.',
    });
  }

  // ENT.VAL.106 — materialized_projection cannot be the canonical source of truth
  if (entity.entityArchetype === 'materialized_projection' && entity.sourceOfTruthType === 'idms') {
    compileErrors.push({
      severity: 'error',
      message: 'Materialized projection entities cannot be canonical source-of-truth. Use "derived" instead.',
    });
  }

  // ENT.VAL.107 — junction_association should declare participating entities
  if (entity.entityArchetype === 'junction_association' && !entity.parentEntityType) {
    compileErrors.push({
      severity: 'warning',
      message: 'Junction/association entity should declare participating relationship entities (parentEntityType).',
    });
  }

  // ENT.VAL.108 — owned_child requires a parent entity
  if (entity.entityArchetype === 'owned_child' && !entity.parentEntityType) {
    compileErrors.push({
      severity: 'error',
      message: 'Owned child entity requires an owning parent relationship (parentEntityType must be set).',
    });
  }

  // ENT.VAL.109 — append_only_record cannot use soft delete
  if (entity.entityArchetype === 'append_only_record' && entity.behaviors.softDelete) {
    compileErrors.push({
      severity: 'error',
      message: 'Append-only entities cannot use soft-delete. Corrections must use additive counter-entries only.',
    });
  }

  // ENT.VAL.110 — lookup-eligible entity should define a display field
  if (entity.lookupEligible && !entity.displayFieldId && !entity.lookupDisplayTemplate) {
    compileErrors.push({
      severity: 'warning',
      message: 'Lookup-eligible entity should define a display field (displayFieldId) so referencing dropdowns know what to show.',
    });
  }

  // ── Field-level v2 validation rules (FLD.VAL.001–010) ──────────────

  entity.fields.forEach(field => {
    // FLD.VAL.001 — user-editable field on a virtual_computed entity is invalid
    if (
      entity.entityArchetype === 'virtual_computed' &&
      field.fieldMutabilityMode === 'user_editable'
    ) {
      compileErrors.push({
        severity: 'error',
        message: `Field "${field.label}" is user-editable but belongs to a virtual computed entity — virtual entities cannot accept direct user writes`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }

    // FLD.VAL.002 — snapshot field requires a complete snapshot policy
    if (field.fieldArchetype === 'snapshot_copy' && !field.snapshotPolicy?.sourceEntityType) {
      compileErrors.push({
        severity: 'error',
        message: `Snapshot field "${field.label}" has no snapshot policy — set source entity, source field, copy trigger, and freeze state`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }

    // FLD.VAL.003 — snapshot field without a freeze state may never lock
    if (
      field.fieldArchetype === 'snapshot_copy' &&
      field.snapshotPolicy?.sourceEntityType &&
      !field.snapshotPolicy?.freezeAtState
    ) {
      compileErrors.push({
        severity: 'warning',
        message: `Snapshot field "${field.label}" has no freeze state — the snapshot value will be refreshed indefinitely and never locked`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }

    // FLD.VAL.004 — snapshot field without refreshUntilState refreshes on every trigger
    if (
      field.fieldArchetype === 'snapshot_copy' &&
      field.snapshotPolicy?.sourceEntityType &&
      !field.snapshotPolicy?.refreshUntilState &&
      field.snapshotPolicy?.overwriteRule === 'always_overwrite'
    ) {
      compileErrors.push({
        severity: 'warning',
        message: `Snapshot field "${field.label}" uses always_overwrite but has no refresh boundary — value may be overwritten unexpectedly late in the lifecycle`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }

    // FLD.VAL.005 — rollup field must specify a source entity
    if (
      field.fieldArchetype === 'rollup' &&
      !field.typeConfig?.sourceEntity
    ) {
      compileErrors.push({
        severity: 'error',
        message: `Rollup field "${field.label}" has no source entity — set the child entity and aggregate function`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }

    // FLD.VAL.006 — computed field should have an expression defined
    if (
      field.fieldArchetype === 'computed_virtual' &&
      !field.typeConfig?.expression
    ) {
      compileErrors.push({
        severity: 'warning',
        message: `Computed field "${field.label}" has no expression — it will always return null at runtime`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }

    // FLD.VAL.007 — external-mapped field should use integration_only editability
    if (
      field.fieldArchetype === 'external_mapped' &&
      field.behaviors.editability !== 'system_only' &&
      field.behaviors.editability !== 'integration_only' &&
      field.behaviors.editability !== 'readonly'
    ) {
      compileErrors.push({
        severity: 'warning',
        message: `External field "${field.label}" allows user edits — external fields should use integration_only or readonly editability to prevent data divergence`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }

    // FLD.VAL.008 — regulated field without a protection policy is a compliance risk
    if (
      field.classification === 'regulated' &&
      !field.protectionPolicy
    ) {
      governanceConflicts.push({
        severity: 'warning',
        message: `Regulated field "${field.label}" has no protection policy — define masking, retention, and access rules to satisfy compliance requirements`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }

    // FLD.VAL.009 — display candidate field cannot be hidden
    if (
      field.isDisplayCandidate &&
      field.behaviors.visibility === 'hidden'
    ) {
      compileErrors.push({
        severity: 'error',
        message: `Field "${field.label}" is marked as a display candidate but is hidden — display candidates must be visible so referencing dropdowns can show them`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }

    // FLD.VAL.010 — projection field on a non-projection entity is a modelling smell
    if (
      field.fieldArchetype === 'projection_field' &&
      entity.entityArchetype !== 'materialized_projection' &&
      entity.entityArchetype !== 'virtual_computed'
    ) {
      compileErrors.push({
        severity: 'warning',
        message: `Field "${field.label}" is a projection field but the entity is not a projection or virtual-computed entity — verify this is intentional`,
        fieldId: field.fieldId, fieldLabel: field.label,
      });
    }
  });

  return { compileErrors, governanceConflicts };
}

// ============================================================
// Relationship conflict detection — all 23 REL2-COMP rules
// ============================================================
export function detectRelationshipConflicts(
  relationships: RelationshipDefinition[],
  entities: EntityDefinition[],
): { compileErrors: ConflictItem[]; governanceConflicts: ConflictItem[] } {
  const compileErrors: ConflictItem[] = [];
  const governanceConflicts: ConflictItem[] = [];

  const entityMap = new Map(entities.map(e => [e.entityType, e]));

  for (const rel of relationships) {
    const label = rel.label;

    // ── Endpoint rules ────────────────────────────────────────────────────

    // REL2-COMP-001 — source entity must be declared
    if (!rel.source.entityId) {
      compileErrors.push({
        severity: 'error',
        message: `Relationship "${label}" must declare a source entity`,
      });
    }

    // REL2-COMP-002 — non-polymorphic must have a target entity
    if (
      rel.relationshipArchetype !== 'polymorphic_reference' &&
      !rel.target.entityId
    ) {
      compileErrors.push({
        severity: 'error',
        message: `Non-polymorphic relationship "${label}" must declare a target entity`,
      });
    }

    // REL2-COMP-003 — self-referential endpoint should use self_reference or self_hierarchy
    if (
      rel.source.entityId &&
      rel.target.entityId &&
      rel.source.entityId === rel.target.entityId &&
      rel.relationshipArchetype !== 'self_reference' &&
      rel.relationshipArchetype !== 'self_hierarchy'
    ) {
      compileErrors.push({
        severity: 'warning',
        message: `Relationship "${label}" connects an entity to itself — use self_reference or self_hierarchy archetype`,
      });
    }

    // REL2-COMP-004 — polymorphic must have at least one allowed target entity
    if (
      rel.relationshipArchetype === 'polymorphic_reference' &&
      (!rel.target.allowedEntityIds || rel.target.allowedEntityIds.length === 0)
    ) {
      compileErrors.push({
        severity: 'error',
        message: `Polymorphic relationship "${label}" must declare at least one allowed target entity`,
      });
    }

    // REL2-COMP-005 — junction connecting entity to itself
    if (
      rel.relationshipArchetype === 'junction_association' &&
      rel.source.entityId &&
      rel.target.entityId &&
      rel.source.entityId === rel.target.entityId
    ) {
      compileErrors.push({
        severity: 'warning',
        message: `Junction relationship "${label}" connects an entity to itself — verify intent`,
      });
    }

    // REL2-COMP-006 — external archetypes require externalProviderKey
    if (
      (rel.relationshipArchetype === 'external_lookup' ||
        rel.relationshipArchetype === 'indirect_external_lookup') &&
      !rel.keyBinding.externalProviderKey
    ) {
      compileErrors.push({
        severity: 'error',
        message: `External relationship "${label}" requires externalProviderKey in keyBinding`,
      });
    }

    // ── Integrity rules ────────────────────────────────────────────────────

    // REL2-COMP-007 — one_to_one without database_enforced integrity
    if (
      rel.cardinality === 'one_to_one' &&
      rel.integrity.mode !== 'database_enforced'
    ) {
      compileErrors.push({
        severity: 'warning',
        message: `One-to-one relationship "${label}" should use database_enforced integrity to guarantee uniqueness`,
      });
    }

    // REL2-COMP-008 — many_to_many must use junction_association
    if (
      rel.cardinality === 'many_to_many' &&
      rel.relationshipArchetype !== 'junction_association'
    ) {
      compileErrors.push({
        severity: 'error',
        message: `Many-to-many relationship "${label}" requires junction_association archetype`,
      });
    }

    // REL2-COMP-009 — database FK constraint cannot cross system boundaries
    if (
      rel.integrity.mode === 'database_enforced' &&
      (rel.endpointTopology === 'native_to_external' ||
        rel.endpointTopology === 'external_to_native' ||
        rel.endpointTopology === 'native_to_virtual' ||
        rel.endpointTopology === 'virtual_to_native' ||
        rel.endpointTopology === 'virtual_to_virtual' ||
        rel.endpointTopology === 'projection_to_source')
    ) {
      compileErrors.push({
        severity: 'error',
        message: `Relationship "${label}" uses database_enforced integrity but spans system boundaries — use provider_enforced or application_enforced`,
      });
    }

    // REL2-COMP-010 — derived/synthetic archetypes must use appropriate integrity
    if (
      (rel.relationshipArchetype === 'projection_relation' ||
        rel.relationshipArchetype === 'synthetic_virtual_relation') &&
      rel.integrity.mode !== 'derived_projection' &&
      rel.integrity.mode !== 'synthetic_key_match'
    ) {
      compileErrors.push({
        severity: 'error',
        message: `Derived/synthetic relationship "${label}" must use derived_projection or synthetic_key_match integrity mode`,
      });
    }

    // REL2-COMP-011 — active relationship must declare integrity mode
    if (
      rel.lifecycle.metadataStatus === 'active' &&
      !rel.integrity.mode
    ) {
      compileErrors.push({
        severity: 'error',
        message: `Active relationship "${label}" must declare an integrity enforcement mode`,
      });
    }

    // ── Scope & governance rules ───────────────────────────────────────────

    // REL2-COMP-012 — crossScope without explicit policy
    if (
      rel.scope.crossScopeAllowed &&
      rel.scope.policy !== 'cross_scope_explicit_only'
    ) {
      governanceConflicts.push({
        severity: 'warning',
        message: `Cross-scope relationship "${label}" requires cross_scope_explicit_only scope policy to prevent accidental data leakage`,
      });
    }

    // REL2-COMP-013 — set_null orphan policy on a required source field
    if (rel.ownership.orphanPolicy === 'set_null') {
      const sourceEntity = entityMap.get(rel.source.entityId ?? '');
      if (sourceEntity) {
        const hasMandatoryFk = (rel.keyBinding.sourceFieldIds ?? []).some(fid => {
          const f = sourceEntity.fields.find(fl => fl.fieldId === fid);
          return f && (f.behaviors.presence === 'on_create' || f.behaviors.presence === 'before_submit');
        });
        if (hasMandatoryFk) {
          compileErrors.push({
            severity: 'error',
            message: `Relationship "${label}" uses set_null orphan policy on a required source field — this will violate presence constraints at runtime`,
          });
        }
      }
    }

    // REL2-COMP-014 — cascade_soft_delete or cascade_archive on ledger_like target
    if (
      rel.lifecyclePolicies.onTargetHardDelete === 'cascade_soft_delete' ||
      rel.lifecyclePolicies.onTargetHardDelete === 'cascade_archive' ||
      rel.lifecyclePolicies.onTargetSoftDelete === 'cascade_soft_delete' ||
      rel.lifecyclePolicies.onTargetSoftDelete === 'cascade_archive'
    ) {
      const targetEntity = entityMap.get(rel.target.entityId ?? '');
      if (targetEntity && targetEntity.category === 'ledger_like') {
        compileErrors.push({
          severity: 'error',
          message: `Relationship "${label}" targets a ledger-like entity — use restrict or require_manual_resolution instead of cascade delete/archive`,
        });
      }
    }

    // ── Archetype-specific rules ───────────────────────────────────────────

    // REL2-COMP-015 — self_hierarchy should use strong integrity
    if (
      rel.relationshipArchetype === 'self_hierarchy' &&
      rel.integrity.mode !== 'application_enforced' &&
      rel.integrity.mode !== 'database_enforced'
    ) {
      compileErrors.push({
        severity: 'warning',
        message: `Self-hierarchy relationship "${label}" should use application_enforced or database_enforced integrity to enable cycle detection`,
      });
    }

    // REL2-COMP-016 — composition must use parent_owns_child coupling
    if (
      rel.relationshipArchetype === 'composition_owned_child' &&
      rel.ownership.couplingMode !== 'parent_owns_child'
    ) {
      compileErrors.push({
        severity: 'error',
        message: `Composition relationship "${label}" must use parent_owns_child ownership coupling`,
      });
    }

    // REL2-COMP-017 — projection relation must be derived_read_only
    if (
      rel.relationshipArchetype === 'projection_relation' &&
      rel.linkMutationCapabilities.mode !== 'derived_read_only'
    ) {
      compileErrors.push({
        severity: 'error',
        message: `Projection relationship "${label}" is read-only — link mutation mode must be derived_read_only`,
      });
    }

    // REL2-COMP-018 — external archetypes should use external_scope_mapped scope
    if (
      (rel.relationshipArchetype === 'external_lookup' ||
        rel.relationshipArchetype === 'indirect_external_lookup') &&
      rel.scope.policy !== 'external_scope_mapped'
    ) {
      governanceConflicts.push({
        severity: 'warning',
        message: `External relationship "${label}" should use external_scope_mapped scope policy`,
      });
    }

    // ── Capability rules ───────────────────────────────────────────────────

    // REL2-COMP-019 — cross-database aggregation may have performance implications
    if (
      rel.navigationCapabilities.aggregateAcrossAllowed &&
      (rel.integrity.mode === 'provider_enforced' ||
        rel.endpointTopology === 'native_to_external' ||
        rel.endpointTopology === 'external_to_native')
    ) {
      governanceConflicts.push({
        severity: 'warning',
        message: `Relationship "${label}" enables aggregation across system boundaries — verify provider supports cross-database aggregation`,
      });
    }

    // REL2-COMP-020 — no navigation in either direction
    if (
      !rel.navigationCapabilities.forwardNavigation &&
      !rel.navigationCapabilities.reverseNavigation
    ) {
      compileErrors.push({
        severity: 'warning',
        message: `Relationship "${label}" has no navigation enabled — it will not be traversable at runtime`,
      });
    }

    // REL2-COMP-021 — cannot create links when mutation mode is read-only
    if (
      rel.linkMutationCapabilities.createLinkAllowed &&
      (rel.linkMutationCapabilities.mode === 'link_read_only' ||
        rel.linkMutationCapabilities.mode === 'derived_read_only')
    ) {
      compileErrors.push({
        severity: 'error',
        message: `Relationship "${label}" allows link creation but mutation mode is read-only — remove createLinkAllowed or change the mode`,
      });
    }

    // ── Temporal rules ─────────────────────────────────────────────────────

    // REL2-COMP-022 — effective_dated must declare effectiveFromFieldId
    if (
      rel.temporalSemantics.mode === 'effective_dated' &&
      !rel.temporalSemantics.effectiveFromFieldId
    ) {
      compileErrors.push({
        severity: 'error',
        message: `Effective-dated relationship "${label}" must declare effectiveFromFieldId`,
      });
    }

    // REL2-COMP-023 — history_tracked must declare historyEntityId
    if (
      rel.temporalSemantics.mode === 'history_tracked' &&
      !rel.temporalSemantics.historyEntityId
    ) {
      compileErrors.push({
        severity: 'error',
        message: `History-tracked relationship "${label}" must declare historyEntityId`,
      });
    }
  }

  return { compileErrors, governanceConflicts };
}
