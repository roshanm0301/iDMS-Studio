import type { MetadataSet } from './compiler';
import type { FieldDefinitionMetadata } from './field-definition';
import type { RelationshipDefinitionMetadata } from './relationship-definition';
import type {
  RuntimeActionContract,
  RuntimeContract,
  RuntimeFieldContract,
  RuntimeRelationshipContract,
  RuntimeResolutionResult,
} from './runtime-contract-definition';
import { roleMatchesSecurityDefinition, type SecurityDefinitionMetadata } from './security-definition';
import type { RuntimeContext } from './shared';
import type { ValidationIssue } from './validation';

function issue(code: string, message: string, path?: string): ValidationIssue {
  return { code, message, path, severity: 'error' };
}

function securitySignature(definitions: SecurityDefinitionMetadata[], roleCode: string): string {
  return definitions
    .filter(definition => roleMatchesSecurityDefinition(definition, roleCode))
    .map(definition => `${definition.securityDefinitionId}:${definition.version?.version ?? 'draft'}`)
    .sort()
    .join('|') || 'no_security_definition';
}

function canPerformObjectOperation(securityDefinitions: SecurityDefinitionMetadata[], operation: RuntimeContext['operation']): boolean {
  const permissions = securityDefinitions.flatMap(definition => definition.objectPermissions);
  const matching = permissions.filter(permission => permission.operation === operation);
  if (matching.some(permission => permission.effect === 'deny')) return false;
  if (matching.some(permission => permission.effect === 'allow')) return true;
  return false;
}

function canUseRequestedView(securityDefinitions: SecurityDefinitionMetadata[], viewId?: string): boolean {
  if (!viewId) return true;
  const permissions = securityDefinitions
    .flatMap(definition => definition.viewPermissions)
    .filter(permission => permission.viewId === viewId);

  if (permissions.some(permission => permission.effect === 'deny')) return false;
  if (permissions.some(permission => permission.effect === 'allow')) return true;
  return false;
}

function resolveFieldAccess(field: FieldDefinitionMetadata, securityDefinitions: SecurityDefinitionMetadata[]): RuntimeFieldContract['access'] | 'hidden' {
  const permissions = securityDefinitions
    .flatMap(definition => definition.fieldPermissions)
    .filter(permission => permission.fieldId === field.fieldId);

  if (permissions.some(permission => permission.access === 'hidden')) return 'hidden';
  if (permissions.some(permission => permission.access === 'masked')) return 'masked';
  if (permissions.some(permission => permission.access === 'edit')) return 'edit';
  return 'read';
}

function resolveMaskStrategy(field: FieldDefinitionMetadata, securityDefinitions: SecurityDefinitionMetadata[]): string | undefined {
  return securityDefinitions
    .flatMap(definition => definition.fieldPermissions)
    .find(permission => permission.fieldId === field.fieldId && permission.maskStrategy)?.maskStrategy
    ?? (field.governance.maskByDefault ? 'partial' : undefined);
}

function toRuntimeField(field: FieldDefinitionMetadata, access: RuntimeFieldContract['access'], securityDefinitions: SecurityDefinitionMetadata[]): RuntimeFieldContract {
  return {
    fieldId: field.fieldId,
    apiName: field.apiName,
    label: field.label,
    logicalType: field.typing.logicalType,
    uiControl: field.typing.uiControl,
    required: field.behavior.required,
    access,
    maskStrategy: access === 'masked' ? resolveMaskStrategy(field, securityDefinitions) : undefined,
  };
}

function toRuntimeRelationship(relationship: RelationshipDefinitionMetadata): RuntimeRelationshipContract {
  return {
    relationshipId: relationship.relationshipId,
    apiName: relationship.apiName,
    relationshipType: relationship.relationshipType,
    targetEntityId: relationship.targetEntityId,
    targetEntityAllowlist: relationship.targetEntityAllowlist,
  };
}

function resolveActions(securityDefinitions: SecurityDefinitionMetadata[]): RuntimeActionContract[] {
  const actionPermissions = securityDefinitions.flatMap(definition => definition.actionPermissions);
  return actionPermissions.map(permission => ({
    actionId: permission.actionId,
    label: permission.actionId.replace(/_/g, ' '),
    visible: permission.effect === 'allow',
    enabled: permission.effect === 'allow',
    allowed: permission.effect === 'allow',
    disabledReason: permission.effect === 'deny' ? permission.disabledReason ?? 'You do not have permission to execute this action.' : undefined,
  }));
}

export function resolveRuntimeContract(metadata: MetadataSet, entityApiName: string, context: RuntimeContext): RuntimeResolutionResult {
  const entity = metadata.entities.find(candidate => candidate.apiName === entityApiName && candidate.lifecycle.metadataStatus === 'active');
  if (!entity) {
    return { resolved: false, issues: [issue('RTC_ENTITY_NOT_ACTIVE', `Active entity '${entityApiName}' was not found.`, 'entityApiName')] };
  }

  const securityDefinitions = metadata.securityDefinitions.filter(definition =>
    definition.entityId === entity.entityId
    && definition.lifecycle.metadataStatus === 'active'
    && entity.references.securityDefinitionIds.includes(definition.securityDefinitionId)
    && roleMatchesSecurityDefinition(definition, context.roleCode),
  );

  if (securityDefinitions.length === 0) {
    return { resolved: false, issues: [issue('RTC_SECURITY_DEFINITION_NOT_FOUND', `Role '${context.roleCode}' has no active security definition for '${entity.apiName}'.`, 'context.roleCode')] };
  }

  if (!canPerformObjectOperation(securityDefinitions, context.operation)) {
    return { resolved: false, issues: [issue('RTC_OBJECT_ACCESS_DENIED', `Role '${context.roleCode}' cannot ${context.operation} '${entity.apiName}'.`, 'context.roleCode')] };
  }

  if (!canUseRequestedView(securityDefinitions, context.viewId)) {
    return { resolved: false, issues: [issue('RTC_VIEW_ACCESS_DENIED', `Role '${context.roleCode}' cannot use this view for '${entity.apiName}'.`, 'context.viewId')] };
  }

  const omittedFieldIds: string[] = [];
  const fields = metadata.fields
    .filter(field => field.entityId === entity.entityId)
    .filter(field => entity.references.fieldIds.includes(field.fieldId))
    .filter(field => field.lifecycle.status === 'active' && field.lifecycle.metadataStatus === 'active')
    .flatMap(field => {
      const access = resolveFieldAccess(field, securityDefinitions);
      if (access === 'hidden') {
        omittedFieldIds.push(field.fieldId);
        return [];
      }
      return [toRuntimeField(field, access, securityDefinitions)];
    });

  const relationships = metadata.relationships
    .filter(relationship => relationship.sourceEntityId === entity.entityId)
    .filter(relationship => entity.references.relationshipIds.includes(relationship.relationshipId))
    .filter(relationship => relationship.lifecycle.metadataStatus === 'active')
    .map(toRuntimeRelationship);

  const validationRuleIds = metadata.validationRules
    .filter(rule => rule.entityId === entity.entityId)
    .filter(rule => entity.references.validationRuleIds.includes(rule.validationRuleId))
    .filter(rule => rule.lifecycle.metadataStatus === 'active')
    .filter(rule => rule.triggers.includes(`before_${context.operation}` as never))
    .map(rule => rule.validationRuleId);

  const metadataVersion = metadata.versions.find(version =>
    version.versionId === entity.lifecycle.versionId || version.metadataObjectId === entity.entityId,
  )?.version ?? 'draft';
  const permissionSignature = securitySignature(securityDefinitions, context.roleCode);
  const cacheKey = [
    metadataVersion,
    entity.apiName,
    context.tenantId,
    context.nodeId ?? 'no_node',
    context.roleCode,
    context.locale,
    context.channel,
    context.operation,
    context.recordState ?? 'no_state',
    permissionSignature,
  ].join(':');

  const contract: RuntimeContract = {
    contractType: context.channel === 'api' ? 'api_read' : 'form',
    metadataVersion,
    cacheKey,
    context,
    entity: {
      entityId: entity.entityId,
      apiName: entity.apiName,
      label: entity.label,
      pluralLabel: entity.pluralLabel,
      namespace: entity.namespace,
      entityCode: entity.entityCode,
      category: entity.classification.entityCategory,
      classification: entity.classification,
      display: entity.display,
      runtimePolicies: entity.runtimePolicies,
    },
    fields,
    relationships,
    actions: resolveActions(securityDefinitions),
    validationRuleIds,
    security: {
      objectAllowed: true,
      recordScope: securityDefinitions[0]?.recordScope.scopeType ?? 'all_records',
      omittedFieldIds,
    },
    messages: [],
  };

  return { resolved: true, contract, issues: [] };
}
