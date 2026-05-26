import type { EntityDefinitionMetadata, EntityValidationContext } from './entity-definition';
import { validateEntityDefinition } from './entity-definition';
import type { FieldDefinitionMetadata } from './field-definition';
import { validateFieldDefinition } from './field-definition';
import type { RelationshipDefinitionMetadata } from './relationship-definition';
import { validateRelationshipDefinition } from './relationship-definition';
import type { SecurityDefinitionMetadata } from './security-definition';
import { validateSecurityDefinition } from './security-definition';
import type { ValidationRuleDefinitionMetadata } from './validation-rule-definition';
import { validateValidationRuleDefinition } from './validation-rule-definition';
import type { ActionDefinitionMetadata } from './action-definition';
import { validateActionDefinition } from './action-definition';
import type { ViewDefinitionMetadata } from './view-definition';
import { validateViewDefinition } from './view-definition';
import type { DependencyDefinition, PackageDefinition, VersionDefinition } from './version-package-definition';
import {
  validateDependencyDefinition,
  validatePackageDefinition,
  validateVersionDefinition,
} from './version-package-definition';
import type { ValidationIssue, ValidationSeverity } from './validation';

export interface MetadataSet {
  entities: EntityDefinitionMetadata[];
  fields: FieldDefinitionMetadata[];
  relationships: RelationshipDefinitionMetadata[];
  validationRules: ValidationRuleDefinitionMetadata[];
  securityDefinitions: SecurityDefinitionMetadata[];
  actions: ActionDefinitionMetadata[];
  views: ViewDefinitionMetadata[];
  versions: VersionDefinition[];
  dependencies: DependencyDefinition[];
  packages: PackageDefinition[];
}

export type CompileStatus = 'pass' | 'warning' | 'error';

export interface CompileSummary {
  errors: number;
  warnings: number;
  blockingErrors: number;
  breakingChanges: number;
  migrationRequired: boolean;
}

export interface CompileResult {
  compileStatus: CompileStatus;
  summary: CompileSummary;
  issues: ValidationIssue[];
  publishable: boolean;
}

function withPathPrefix(issue: ValidationIssue, prefix: string): ValidationIssue {
  return { ...issue, path: issue.path ? `${prefix}.${issue.path}` : prefix };
}

function pushValidationIssues<T>(
  issues: ValidationIssue[],
  items: T[],
  prefix: string,
  validator: (item: T) => { issues: ValidationIssue[] },
): void {
  items.forEach((item, index) => {
    issues.push(...validator(item).issues.map(issue => withPathPrefix(issue, `${prefix}.${index}`)));
  });
}

function compilerIssue(code: string, message: string, path: string, severity: ValidationSeverity = 'error'): ValidationIssue {
  return { code, message, path, severity };
}

function isActiveMetadata(status: string): boolean {
  return status === 'active' || status === 'published';
}

function isActiveEntity(entity: EntityDefinitionMetadata): boolean {
  return entity.lifecycle.metadataStatus === 'active';
}

function isActiveField(field: FieldDefinitionMetadata): boolean {
  return field.lifecycle.status === 'active' && field.lifecycle.metadataStatus === 'active';
}

function isActiveRelationship(relationship: RelationshipDefinitionMetadata): boolean {
  return relationship.lifecycle.metadataStatus === 'active';
}

function isActiveSecurityDefinition(security: SecurityDefinitionMetadata): boolean {
  return security.lifecycle.metadataStatus === 'active';
}

function isActiveValidationRule(rule: ValidationRuleDefinitionMetadata): boolean {
  return rule.lifecycle.metadataStatus === 'active';
}

export function compileMetadataSet(metadata: MetadataSet): CompileResult {
  const issues: ValidationIssue[] = [];

  const activePackageIds = metadata.packages
    .filter(pkg => isActiveMetadata(pkg.status))
    .map(pkg => pkg.packageId);
  const activeFieldIdsForContext = metadata.fields
    .filter(isActiveField)
    .map(field => field.fieldId);
  const referencedViewIds = Array.from(new Set(metadata.entities.flatMap(entity => entity.references?.viewIds ?? [])));
  const entityValidationContext: EntityValidationContext = {
    existingEntities: metadata.entities,
    activeFieldIds: activeFieldIdsForContext,
    activeViewIds: referencedViewIds,
    activePackageIds,
  };

  metadata.entities.forEach((entity, index) => {
    issues.push(
      ...validateEntityDefinition(entity, entityValidationContext).issues.map(issue => withPathPrefix(issue, `entities.${index}`)),
    );
  });
  pushValidationIssues(issues, metadata.fields, 'fields', validateFieldDefinition);
  pushValidationIssues(issues, metadata.relationships, 'relationships', validateRelationshipDefinition);
  pushValidationIssues(issues, metadata.validationRules, 'validationRules', validateValidationRuleDefinition);
  pushValidationIssues(issues, metadata.securityDefinitions, 'securityDefinitions', validateSecurityDefinition);
  pushValidationIssues(issues, metadata.actions, 'actions', validateActionDefinition);
  pushValidationIssues(issues, metadata.views, 'views', validateViewDefinition);
  pushValidationIssues(issues, metadata.versions, 'versions', validateVersionDefinition);
  pushValidationIssues(issues, metadata.dependencies, 'dependencies', validateDependencyDefinition);
  pushValidationIssues(issues, metadata.packages, 'packages', validatePackageDefinition);

  const entityById = new Map(metadata.entities.map(entity => [entity.entityId, entity]));
  const fieldById = new Map(metadata.fields.map(field => [field.fieldId, field]));
  const relationshipById = new Map(metadata.relationships.map(relationship => [relationship.relationshipId, relationship]));
  const validationRuleById = new Map(metadata.validationRules.map(rule => [rule.validationRuleId, rule]));
  const securityById = new Map(metadata.securityDefinitions.map(security => [security.securityDefinitionId, security]));
  const actionById = new Map(metadata.actions.map(action => [action.actionId, action]));
  const viewById = new Map(metadata.views.map(view => [view.viewId, view]));
  const versionById = new Map(metadata.versions.map(version => [version.versionId, version]));
  const packageById = new Map(metadata.packages.map(pkg => [pkg.packageId, pkg]));
  const activeEntityIds = new Set(
    metadata.entities
      .filter(isActiveEntity)
      .map(entity => entity.entityId),
  );
  const activeFieldIds = new Set(
    metadata.fields.filter(isActiveField).map(field => field.fieldId),
  );
  const activeSecurityIds = new Set(
    metadata.securityDefinitions.filter(isActiveSecurityDefinition).map(security => security.securityDefinitionId),
  );

  const tableOwners = new Map<string, EntityDefinitionMetadata[]>();
  for (const entity of metadata.entities) {
    if (!entity.storage.tableName) continue;
    const owners = tableOwners.get(entity.storage.tableName) ?? [];
    owners.push(entity);
    tableOwners.set(entity.storage.tableName, owners);
  }

  for (const [tableName, owners] of tableOwners.entries()) {
    if (owners.length < 2) continue;
    owners.forEach(entity => {
      issues.push(compilerIssue(
        'COMP_ENTITY_TABLE_DUPLICATE',
        `Storage table '${tableName}' is used by more than one entity.`,
        `entities.${entity.entityId}.storage.tableName`,
        'blocking_error',
      ));
    });
  }

  for (const entity of metadata.entities) {
    const active = isActiveEntity(entity);
    const owningPackage = packageById.get(entity.ownership.owningPackageId);
    const entityVersion = versionById.get(entity.lifecycle.versionId);

    if (!owningPackage || !isActiveMetadata(owningPackage.status)) {
      issues.push(compilerIssue(
        'COMP_ENTITY_PACKAGE_INACTIVE',
        `Entity '${entity.apiName}' references a missing or inactive owning package.`,
        `entities.${entity.entityId}.ownership.owningPackageId`,
      ));
    } else if (!owningPackage.contents.some(component => component.objectId === entity.entityId && component.objectType === 'EntityDefinition')) {
      issues.push(compilerIssue(
        'COMP_ENTITY_PACKAGE_CONTENT_MISSING',
        `Entity '${entity.apiName}' is not listed in its owning package contents.`,
        `packages.${owningPackage.packageId}.contents`,
      ));
    }

    if (!entityVersion) {
      issues.push(compilerIssue(
        'COMP_ENTITY_VERSION_MISSING',
        `Entity '${entity.apiName}' references a missing VersionDefinition.`,
        `entities.${entity.entityId}.lifecycle.versionId`,
        'blocking_error',
      ));
    } else {
      if (entityVersion.metadataObjectId !== entity.entityId || entityVersion.metadataObjectType !== 'EntityDefinition') {
        issues.push(compilerIssue(
          'COMP_ENTITY_VERSION_MISMATCH',
          `Entity '${entity.apiName}' version does not point back to this EntityDefinition.`,
          `versions.${entityVersion.versionId}.metadataObjectId`,
          'blocking_error',
        ));
      }
      if (active && entityVersion.status !== 'published') {
        issues.push(compilerIssue(
          'COMP_ENTITY_VERSION_NOT_PUBLISHED',
          `Active entity '${entity.apiName}' must reference a published immutable version.`,
          `versions.${entityVersion.versionId}.status`,
        ));
      }
    }

    for (const fieldId of entity.references.fieldIds) {
      const field = fieldById.get(fieldId);
      if (!field) {
        issues.push(compilerIssue('COMP_ENTITY_FIELD_REFERENCE_MISSING', `Entity '${entity.apiName}' references a missing field.`, `entities.${entity.entityId}.references.fieldIds`, 'blocking_error'));
      } else if (field.entityId !== entity.entityId) {
        issues.push(compilerIssue('COMP_ENTITY_FIELD_WRONG_ENTITY', `Field '${field.apiName}' belongs to a different entity.`, `fields.${field.fieldId}.entityId`, 'blocking_error'));
      } else if (active && !activeFieldIds.has(fieldId)) {
        issues.push(compilerIssue('COMP_ENTITY_FIELD_INACTIVE', `Active entity '${entity.apiName}' references inactive field '${field.apiName}'.`, `fields.${field.fieldId}.lifecycle.metadataStatus`));
      }
    }

    if (entity.display.defaultDisplayFieldId) {
      const displayField = fieldById.get(entity.display.defaultDisplayFieldId);
      if (!displayField || displayField.entityId !== entity.entityId || !activeFieldIds.has(entity.display.defaultDisplayFieldId)) {
        issues.push(compilerIssue(
          'COMP_ENTITY_DISPLAY_FIELD_INVALID',
          `Entity '${entity.apiName}' default display field must be an active field on the same entity.`,
          `entities.${entity.entityId}.display.defaultDisplayFieldId`,
          active ? 'blocking_error' : 'error',
        ));
      }
    }

    for (const [path, viewId] of [
      ['display.defaultListViewId', entity.display.defaultListViewId],
      ['display.defaultFormViewId', entity.display.defaultFormViewId],
      ['display.defaultLookupViewId', entity.display.defaultLookupViewId],
    ] as const) {
      if (typeof viewId === 'string' && viewId.length > 0 && !entity.references.viewIds.includes(viewId)) {
        issues.push(compilerIssue(
          'COMP_ENTITY_DEFAULT_VIEW_UNREFERENCED',
          `Default view '${viewId}' must be present in EntityDefinition.references.viewIds.`,
          `entities.${entity.entityId}.${path}`,
          active ? 'blocking_error' : 'error',
        ));
      }
    }

    for (const relationshipId of entity.references.relationshipIds) {
      const relationship = relationshipById.get(relationshipId);
      if (!relationship) {
        issues.push(compilerIssue('COMP_ENTITY_RELATIONSHIP_REFERENCE_MISSING', `Entity '${entity.apiName}' references a missing relationship.`, `entities.${entity.entityId}.references.relationshipIds`, 'blocking_error'));
      } else if (relationship.sourceEntityId !== entity.entityId) {
        issues.push(compilerIssue('COMP_ENTITY_RELATIONSHIP_WRONG_SOURCE', `Relationship '${relationship.apiName}' belongs to a different source entity.`, `relationships.${relationship.relationshipId}.sourceEntityId`, 'blocking_error'));
      } else if (active && !isActiveRelationship(relationship)) {
        issues.push(compilerIssue('COMP_ENTITY_RELATIONSHIP_INACTIVE', `Active entity '${entity.apiName}' references inactive relationship '${relationship.apiName}'.`, `relationships.${relationship.relationshipId}.lifecycle.metadataStatus`));
      }
    }

    for (const validationRuleId of entity.references.validationRuleIds) {
      const rule = validationRuleById.get(validationRuleId);
      if (!rule) {
        issues.push(compilerIssue('COMP_ENTITY_VALIDATION_REFERENCE_MISSING', `Entity '${entity.apiName}' references a missing validation rule.`, `entities.${entity.entityId}.references.validationRuleIds`, 'blocking_error'));
      } else if (rule.entityId !== entity.entityId) {
        issues.push(compilerIssue('COMP_ENTITY_VALIDATION_WRONG_ENTITY', `Validation rule '${rule.apiName}' belongs to a different entity.`, `validationRules.${rule.validationRuleId}.entityId`, 'blocking_error'));
      } else if (active && !isActiveValidationRule(rule)) {
        issues.push(compilerIssue('COMP_ENTITY_VALIDATION_INACTIVE', `Active entity '${entity.apiName}' references inactive validation rule '${rule.apiName}'.`, `validationRules.${rule.validationRuleId}.lifecycle.metadataStatus`));
      }
    }

    for (const securityDefinitionId of entity.references.securityDefinitionIds) {
      const security = securityById.get(securityDefinitionId);
      if (!security) {
        issues.push(compilerIssue('COMP_ENTITY_SECURITY_REFERENCE_MISSING', `Entity '${entity.apiName}' references a missing security definition.`, `entities.${entity.entityId}.references.securityDefinitionIds`, 'blocking_error'));
      } else if (security.entityId !== entity.entityId) {
        issues.push(compilerIssue('COMP_ENTITY_SECURITY_WRONG_ENTITY', `Security definition '${security.apiName}' belongs to a different entity.`, `securityDefinitions.${security.securityDefinitionId}.entityId`, 'blocking_error'));
      } else if (active && !isActiveSecurityDefinition(security)) {
        issues.push(compilerIssue('COMP_ENTITY_SECURITY_INACTIVE', `Active entity '${entity.apiName}' references inactive security definition '${security.apiName}'.`, `securityDefinitions.${security.securityDefinitionId}.lifecycle.metadataStatus`));
      }
    }

    if (active && !entity.references.securityDefinitionIds.some(securityDefinitionId => activeSecurityIds.has(securityDefinitionId))) {
      issues.push(compilerIssue(
        'COMP_ENTITY_SECURITY_DEFINITION_MISSING',
        `Active entity '${entity.apiName}' must reference at least one active SecurityDefinition.`,
        `entities.${entity.entityId}.references.securityDefinitionIds`,
        'blocking_error',
      ));
    }

    for (const actionId of entity.references.actionIds) {
      const action = actionById.get(actionId);
      if (!action) {
        issues.push(compilerIssue('COMP_ENTITY_ACTION_REFERENCE_MISSING', `Entity '${entity.apiName}' references a missing action.`, `entities.${entity.entityId}.references.actionIds`, 'blocking_error'));
      } else if (action.entityId !== entity.entityId) {
        issues.push(compilerIssue('COMP_ENTITY_ACTION_WRONG_ENTITY', `Action '${action.apiName}' belongs to a different entity.`, `actions.${action.actionId}.entityId`, 'blocking_error'));
      }
    }

    for (const viewId of entity.references.viewIds) {
      const view = viewById.get(viewId);
      if (view && view.entityId !== entity.entityId) {
        issues.push(compilerIssue('COMP_ENTITY_VIEW_WRONG_ENTITY', `View '${view.apiName}' belongs to a different entity.`, `views.${view.viewId}.entityId`, 'blocking_error'));
      }
    }
  }

  for (const field of metadata.fields) {
    if (!entityById.has(field.entityId)) {
      issues.push(compilerIssue('COMP_FIELD_ENTITY_MISSING', `Field '${field.apiName}' references a missing entity.`, `fields.${field.fieldId}.entityId`, 'blocking_error'));
    }
    if (field.lifecycle.metadataStatus === 'active' && !activeEntityIds.has(field.entityId)) {
      issues.push(compilerIssue('COMP_FIELD_ENTITY_INACTIVE', `Active field '${field.apiName}' belongs to an inactive entity.`, `fields.${field.fieldId}.entityId`));
    }
  }

  for (const relationship of metadata.relationships) {
    if (!activeEntityIds.has(relationship.sourceEntityId)) {
      issues.push(compilerIssue('COMP_REL_SOURCE_INACTIVE', `Relationship '${relationship.apiName}' has an inactive or missing source entity.`, `relationships.${relationship.relationshipId}.sourceEntityId`, 'blocking_error'));
    }
    if (relationship.targetEntityId && !activeEntityIds.has(relationship.targetEntityId)) {
      issues.push(compilerIssue('COMP_REL_TARGET_INACTIVE', `Relationship '${relationship.apiName}' has an inactive or missing target entity.`, `relationships.${relationship.relationshipId}.targetEntityId`, 'blocking_error'));
    }
    if (relationship.sourceFieldId && !activeFieldIds.has(relationship.sourceFieldId)) {
      issues.push(compilerIssue('COMP_REL_FIELD_INACTIVE', `Relationship '${relationship.apiName}' references an inactive source field.`, `relationships.${relationship.relationshipId}.sourceFieldId`));
    }
  }

  for (const rule of metadata.validationRules) {
    if (rule.lifecycle.metadataStatus === 'active' && !activeEntityIds.has(rule.entityId)) {
      issues.push(compilerIssue('COMP_VAL_ENTITY_INACTIVE', `Active validation rule '${rule.apiName}' references an inactive entity.`, `validationRules.${rule.validationRuleId}.entityId`));
    }
  }

  for (const security of metadata.securityDefinitions) {
    if (security.lifecycle.metadataStatus === 'active' && !activeEntityIds.has(security.entityId)) {
      issues.push(compilerIssue('COMP_SEC_ENTITY_INACTIVE', `Active security definition '${security.apiName}' references an inactive entity.`, `securityDefinitions.${security.securityDefinitionId}.entityId`));
    }
  }

  for (const action of metadata.actions) {
    if (!entityById.has(action.entityId)) {
      issues.push(compilerIssue('COMP_ACTION_ENTITY_MISSING', `Action '${action.apiName}' references a missing entity.`, `actions.${action.actionId}.entityId`, 'blocking_error'));
    }
    if (action.lifecycle.metadataStatus === 'active' && !activeEntityIds.has(action.entityId)) {
      issues.push(compilerIssue('COMP_ACTION_ENTITY_INACTIVE', `Active action '${action.apiName}' references an inactive entity.`, `actions.${action.actionId}.entityId`));
    }
  }

  for (const view of metadata.views) {
    if (!entityById.has(view.entityId)) {
      issues.push(compilerIssue('COMP_VIEW_ENTITY_MISSING', `View '${view.apiName}' references a missing entity.`, `views.${view.viewId}.entityId`, 'blocking_error'));
    }
    if (view.lifecycle.metadataStatus === 'active' && !activeEntityIds.has(view.entityId)) {
      issues.push(compilerIssue('COMP_VIEW_ENTITY_INACTIVE', `Active view '${view.apiName}' references an inactive entity.`, `views.${view.viewId}.entityId`));
    }
  }

  const blockingErrors = issues.filter(issue => issue.severity === 'blocking_error').length;
  const errors = issues.filter(issue => issue.severity === 'error').length;
  const warnings = issues.filter(issue => issue.severity === 'warning').length;
  const breakingChanges = metadata.dependencies.filter(dep => dep.impactSeverity === 'breaking' || dep.impactSeverity === 'blocked').length;
  const migrationRequired = metadata.dependencies.some(dep => dep.migrationRequired || dep.impactSeverity === 'migration_required');
  const publishable = blockingErrors === 0 && errors === 0 && breakingChanges === 0 && !migrationRequired;

  return {
    compileStatus: publishable ? (warnings > 0 ? 'warning' : 'pass') : 'error',
    summary: {
      errors,
      warnings,
      blockingErrors,
      breakingChanges,
      migrationRequired,
    },
    issues,
    publishable,
  };
}
