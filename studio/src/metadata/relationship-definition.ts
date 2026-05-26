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

export const RELATIONSHIP_TYPES = ['lookup', 'parent_child', 'junction', 'polymorphic_reference'] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const RELATIONSHIP_CARDINALITIES = ['many_to_one', 'one_to_many', 'many_to_many', 'one_to_one'] as const;
export type RelationshipCardinality = (typeof RELATIONSHIP_CARDINALITIES)[number];

export const DELETE_BEHAVIORS = ['restrict', 'cascade', 'set_null', 'no_action'] as const;
export type DeleteBehavior = (typeof DELETE_BEHAVIORS)[number];

export interface RelationshipDefinitionMetadata {
  relationshipId: string;
  apiName: string;
  label: string;
  description?: string;
  relationshipType: RelationshipType;
  sourceEntityId: string;
  targetEntityId?: string;
  targetEntityAllowlist?: string[];
  sourceFieldId?: string;
  junctionEntityId?: string;
  cardinality: RelationshipCardinality;
  required: boolean;
  ownership: OwnershipScope;
  behavior: {
    deleteBehavior: DeleteBehavior;
    copyRulesAllowed: boolean;
    targetRecordValidationRequired: boolean;
  };
  lifecycle: {
    metadataStatus: MetadataStatus;
  };
  version?: MetadataVersionRef;
  audit?: MetadataAudit;
}

export function validateRelationshipDefinition(input: unknown): ValidationResult<RelationshipDefinitionMetadata> {
  if (!isPlainObject(input)) {
    return fail([{ code: 'REL_INVALID_SHAPE', message: 'RelationshipDefinition must be an object.', severity: 'error' }]);
  }

  const issues: ValidationIssue[] = [];
  requireString(input.relationshipId, 'relationshipId', 'REL_ID_REQUIRED', 'Relationship ID', issues);
  requireApiName(input.apiName, 'apiName', issues);
  requireString(input.label, 'label', 'REL_LABEL_REQUIRED', 'Relationship label', issues);
  requireString(input.sourceEntityId, 'sourceEntityId', 'REL_SOURCE_ENTITY_REQUIRED', 'Source entity ID', issues);
  requireOneOf(input.relationshipType, RELATIONSHIP_TYPES, 'relationshipType', 'REL_TYPE_INVALID', 'Relationship type', issues);
  requireOneOf(input.cardinality, RELATIONSHIP_CARDINALITIES, 'cardinality', 'REL_CARDINALITY_INVALID', 'Relationship cardinality', issues);

  if (!isPlainObject(input.ownership)) {
    issues.push({ code: 'REL_OWNERSHIP_REQUIRED', message: 'Relationship ownership is required.', path: 'ownership', severity: 'error' });
  } else if (input.ownership.owningLayer === 'role') {
    issues.push({ code: 'REL_ROLE_LAYER_FORBIDDEN', message: 'Role cannot own relationship schema.', path: 'ownership.owningLayer', severity: 'blocking_error' });
  }

  if (!isPlainObject(input.behavior)) {
    issues.push({ code: 'REL_BEHAVIOR_REQUIRED', message: 'Relationship behavior is required.', path: 'behavior', severity: 'error' });
  } else {
    requireOneOf(input.behavior.deleteBehavior, DELETE_BEHAVIORS, 'behavior.deleteBehavior', 'REL_DELETE_BEHAVIOR_INVALID', 'Delete behavior', issues);
  }

  if (!isPlainObject(input.lifecycle)) {
    issues.push({ code: 'REL_LIFECYCLE_REQUIRED', message: 'Relationship lifecycle is required.', path: 'lifecycle', severity: 'error' });
  } else {
    requireOneOf(input.lifecycle.metadataStatus, METADATA_STATUSES, 'lifecycle.metadataStatus', 'REL_STATUS_INVALID', 'Metadata status', issues);
  }

  if (input.relationshipType === 'polymorphic_reference') {
    if (!Array.isArray(input.targetEntityAllowlist) || input.targetEntityAllowlist.length === 0) {
      issues.push({
        code: 'REL_POLYMORPHIC_ALLOWLIST_REQUIRED',
        message: 'Polymorphic relationships require a target entity allowlist.',
        path: 'targetEntityAllowlist',
        severity: 'blocking_error',
      });
    }
  } else if (typeof input.targetEntityId !== 'string' || input.targetEntityId.length === 0) {
    issues.push({ code: 'REL_TARGET_ENTITY_REQUIRED', message: 'Relationship target entity is required.', path: 'targetEntityId', severity: 'error' });
  }

  if (input.relationshipType === 'junction' && typeof input.junctionEntityId !== 'string') {
    issues.push({ code: 'REL_JUNCTION_ENTITY_REQUIRED', message: 'Junction relationships require junctionEntityId.', path: 'junctionEntityId', severity: 'error' });
  }

  if (issues.some(item => item.severity !== 'warning')) return fail(issues);
  return ok(input as unknown as RelationshipDefinitionMetadata, issues);
}
