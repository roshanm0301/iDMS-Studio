import type { EntityClassification, EntityDisplayDefaults, EntityRuntimePolicies } from './entity-definition';
import type { RuntimeContext } from './shared';
import type { ValidationIssue } from './validation';

export type RuntimeContractType = 'form' | 'list' | 'lookup' | 'api_read' | 'api_write';

export interface RuntimeEntityContract {
  entityId: string;
  apiName: string;
  label: string;
  pluralLabel: string;
  namespace: string;
  entityCode?: string;
  category: string;
  classification: EntityClassification;
  display: EntityDisplayDefaults;
  runtimePolicies: EntityRuntimePolicies;
}

export interface RuntimeFieldContract {
  fieldId: string;
  apiName: string;
  label: string;
  logicalType: string;
  uiControl: string;
  required: boolean;
  access: 'read' | 'edit' | 'masked';
  maskStrategy?: string;
}

export interface RuntimeRelationshipContract {
  relationshipId: string;
  apiName: string;
  relationshipType: string;
  targetEntityId?: string;
  targetEntityAllowlist?: string[];
}

export interface RuntimeActionContract {
  actionId: string;
  label: string;
  visible: boolean;
  enabled: boolean;
  allowed: boolean;
  disabledReason?: string;
}

export interface RuntimeSecuritySummary {
  objectAllowed: boolean;
  recordScope: string;
  omittedFieldIds: string[];
}

export interface RuntimeContract {
  contractType: RuntimeContractType;
  metadataVersion: string;
  cacheKey: string;
  context: RuntimeContext;
  entity: RuntimeEntityContract;
  fields: RuntimeFieldContract[];
  relationships: RuntimeRelationshipContract[];
  actions: RuntimeActionContract[];
  validationRuleIds: string[];
  security: RuntimeSecuritySummary;
  messages: ValidationIssue[];
}

export interface RuntimeResolutionResult {
  resolved: boolean;
  contract?: RuntimeContract;
  issues: ValidationIssue[];
}
