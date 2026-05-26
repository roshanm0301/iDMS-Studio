import { describe, expect, it } from 'vitest';
import type { EntityDefinition } from '../types/entityDesigner';
import { serviceJobCardEntity, serviceJobCardFields, serviceJobCardRelationships } from './core-fixtures';
import { validateEntityDefinition } from './entity-definition';
import { validateFieldDefinition } from './field-definition';
import { buildCanonicalEntityAuthoringBundle } from './legacy-entity-authoring-adapter';
import { validateRelationshipDefinition } from './relationship-definition';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe('EntityDefinition, FieldDefinition, RelationshipDefinition contracts', () => {
  it('accepts the Service Job Card core metadata slice', () => {
    expect(validateEntityDefinition(serviceJobCardEntity).valid).toBe(true);
    expect(serviceJobCardFields.every(field => validateFieldDefinition(field).valid)).toBe(true);
    expect(serviceJobCardRelationships.every(relationship => validateRelationshipDefinition(relationship).valid)).toBe(true);
  });

  it('rejects inline fields inside EntityDefinition', () => {
    const entity = clone(serviceJobCardEntity) as unknown as Record<string, unknown>;
    entity.fields = [];

    const result = validateEntityDefinition(entity);

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'ENTITY_FIELDS_INLINE_FORBIDDEN')).toBe(true);
  });

  it('converts the legacy creation wizard shell into separate EntityDefinition and FieldDefinition metadata', () => {
    const legacyEntity: EntityDefinition = {
      entityType: 'insurance_claim',
      label: 'Insurance Claim',
      description: 'Claims opened from the service desk.',
      category: 'transaction',
      domain: 'Service',
      owningLayer: 'tenant',
      behaviors: {
        workflowEnabled: true,
        auditable: true,
        softDelete: true,
        allowBulkImport: false,
        allowDownstreamExtension: true,
        allowDownstreamRequirednessRelaxation: false,
      },
      status: 'draft',
      fields: [
        {
          fieldId: 'record_id',
          label: 'Record ID',
          fieldType: 'text',
          sourceLayer: 'platform',
          overlayOperation: 'extend',
          protected: true,
          classification: 'internal',
          behaviors: {
            presence: 'on_create',
            editability: 'system_only',
            visibility: 'default',
            defaultSource: 'none',
            searchable: false,
            filterable: false,
            sortable: false,
            includeInDefaultList: false,
            includeInLookupDisplay: false,
            auditBehavior: 'none',
          },
          typeConfig: {},
          governance: {
            classification: 'internal',
            canDownstreamConstrain: false,
            canDownstreamRelax: false,
            canDownstreamDisable: false,
            includeInExport: true,
            allowImport: false,
            allowBulkUpdate: false,
            maskInExport: false,
            apiInputAllowed: false,
            apiOutputAllowed: true,
            apiOutputMasked: false,
          },
          lifecycle: 'active',
        },
      ],
    };

    const bundle = buildCanonicalEntityAuthoringBundle(legacyEntity);

    expect(bundle.valid).toBe(true);
    expect('fields' in bundle.entity).toBe(false);
    expect(bundle.entity.references.fieldIds).toEqual(['fld_insurance_claim_record_id']);
    expect(bundle.fields).toHaveLength(1);
    expect(bundle.fields[0].entityId).toBe(bundle.entity.entityId);
  });

  it('rejects role as a schema-owning layer', () => {
    const entity = clone(serviceJobCardEntity);
    entity.ownership.owningLayer = 'role' as never;

    const result = validateEntityDefinition(entity);

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'ENTITY_LAYER_ROLE_NOT_ALLOWED')).toBe(true);
  });

  it('requires active entities to declare display and view defaults', () => {
    const entity = clone(serviceJobCardEntity);
    entity.display.defaultListViewId = null;

    const result = validateEntityDefinition(entity);

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'ENTITY_DEFAULT_LIST_VIEW_REQUIRED')).toBe(true);
  });

  it('uses the required category error code when entity category is absent', () => {
    const entity = clone(serviceJobCardEntity) as unknown as Record<string, any>;
    delete entity.classification.entityCategory;

    const result = validateEntityDefinition(entity);

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'ENTITY_CATEGORY_REQUIRED')).toBe(true);
  });

  it('prevents soft delete policies on ledger-like entities', () => {
    const entity = clone(serviceJobCardEntity);
    entity.classification.entityCategory = 'ledger_like';
    entity.classification.businessObjectType = 'accounting_entry';
    entity.storage.softDeletePolicyId = 'policy_soft_delete_transaction';

    const result = validateEntityDefinition(entity);

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'ENTITY_LEDGER_DELETE_NOT_ALLOWED')).toBe(true);
  });

  it('rejects duplicate API names in the same namespace', () => {
    const entity = clone(serviceJobCardEntity);
    entity.entityId = 'ent_service_job_card_copy';

    const result = validateEntityDefinition(entity, { existingEntities: [serviceJobCardEntity] });

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'ENTITY_API_NAME_DUPLICATE')).toBe(true);
  });

  it('rejects PostgreSQL ENUM for business picklists', () => {
    const field = clone(serviceJobCardFields.find(item => item.apiName === 'service_type'));
    expect(field).toBeDefined();
    field!.typing.postgresType = 'enum' as never;

    const result = validateFieldDefinition(field);

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'FIELD_POSTGRES_TYPE_INVALID' || issue.code === 'FIELD_POSTGRES_ENUM_FORBIDDEN')).toBe(true);
  });

  it('requires polymorphic relationships to declare a target allowlist', () => {
    const relationship = clone(serviceJobCardRelationships[0]);
    relationship.relationshipType = 'polymorphic_reference';
    relationship.targetEntityId = undefined;
    relationship.targetEntityAllowlist = [];

    const result = validateRelationshipDefinition(relationship);

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'REL_POLYMORPHIC_ALLOWLIST_REQUIRED')).toBe(true);
  });
});
