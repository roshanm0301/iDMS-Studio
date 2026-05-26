import type { EntityDefinition as LegacyEntityDefinition, EntityCategory as LegacyEntityCategory, FieldInstance, FieldTypeCode, EntityView as LegacyEntityView, EntityAction as LegacyEntityAction } from '../types/entityDesigner';
import type {
  BusinessObjectType,
  EntityDefinitionMetadata,
  EntityDomain,
  EntityStorageStrategy,
  IndustryVertical,
} from './entity-definition';
import { validateEntityDefinition } from './entity-definition';
import type { ActionDefinitionMetadata } from './action-definition';
import { validateActionDefinition } from './action-definition';
import type { ViewDefinitionMetadata } from './view-definition';
import { validateViewDefinition } from './view-definition';
import type { BusinessFieldType, FieldDefinitionMetadata, LogicalDataType, PostgresStorageType, UiControlType } from './field-definition';
import { validateFieldDefinition } from './field-definition';
import type { StructuralLayer } from './shared';
import type { ValidationIssue } from './validation';

export interface LegacyAuthoringAdapterOptions {
  namespace?: string;
  owningPackageId?: string;
  owningModule?: string;
  industryVertical?: IndustryVertical;
  createdBy?: string;
  createdAt?: string;
}

export interface CanonicalEntityAuthoringBundle {
  entity: EntityDefinitionMetadata;
  fields: FieldDefinitionMetadata[];
  actions: ActionDefinitionMetadata[];
  views: ViewDefinitionMetadata[];
  issues: ValidationIssue[];
  valid: boolean;
}

const DOMAIN_MAP: Record<string, EntityDomain> = {
  sales: 'sales',
  service: 'service',
  finance: 'finance',
  spare_parts: 'spare_parts',
  crm: 'crm',
  accounting: 'accounting',
  taxation: 'taxation',
  inventory: 'inventory',
  network: 'network',
  system: 'system',
  reference: 'reference',
};

function toCanonicalCategory(category: LegacyEntityCategory): EntityDefinitionMetadata['classification']['entityCategory'] {
  if (category === 'master') return 'master_data';
  return category;
}

function defaultBusinessObjectType(category: LegacyEntityCategory): BusinessObjectType {
  if (category === 'master') return 'party_master';
  if (category === 'configuration') return 'configuration_record';
  if (category === 'ledger_like') return 'accounting_entry';
  return 'operational_document';
}

function normalizeDomain(domain: string): EntityDomain {
  const normalized = domain.trim().toLowerCase().replace(/\s+/g, '_');
  return DOMAIN_MAP[normalized] ?? 'reference';
}

function storagePrefix(category: LegacyEntityCategory): string {
  if (category === 'master') return 'mst';
  if (category === 'configuration') return 'cfg';
  if (category === 'ledger_like') return 'led';
  return 'txn';
}

function toStructuralLayer(layer: LegacyEntityDefinition['owningLayer']): StructuralLayer {
  return layer === 'role' ? 'tenant' : layer;
}

function toTitleCase(input: string): string {
  return input
    .split('_')
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function pluralize(label: string): string {
  if (label.endsWith('s')) return label;
  if (label.endsWith('y')) return `${label.slice(0, -1)}ies`;
  return `${label}s`;
}

function mapFieldTyping(fieldType: FieldTypeCode): {
  businessType: BusinessFieldType;
  logicalType: LogicalDataType;
  postgresType: PostgresStorageType;
  uiControl: UiControlType;
} {
  switch (fieldType) {
    case 'textarea':
    case 'rich_text':
      return { businessType: 'plain_data', logicalType: 'text', postgresType: 'text', uiControl: 'textarea' };
    case 'number':
      return { businessType: 'plain_data', logicalType: 'number', postgresType: 'numeric', uiControl: 'number_input' };
    case 'decimal':
      return { businessType: 'plain_data', logicalType: 'decimal', postgresType: 'numeric', uiControl: 'number_input' };
    case 'currency':
      return { businessType: 'currency_amount', logicalType: 'currency', postgresType: 'numeric', uiControl: 'currency_input' };
    case 'percentage':
      return { businessType: 'plain_data', logicalType: 'percentage', postgresType: 'numeric', uiControl: 'number_input' };
    case 'date':
      return { businessType: 'plain_data', logicalType: 'date', postgresType: 'date', uiControl: 'date_picker' };
    case 'datetime':
      return { businessType: 'plain_data', logicalType: 'datetime', postgresType: 'timestamptz', uiControl: 'datetime_picker' };
    case 'time':
      return { businessType: 'plain_data', logicalType: 'time', postgresType: 'time', uiControl: 'time_picker' };
    case 'boolean':
      return { businessType: 'plain_data', logicalType: 'boolean', postgresType: 'boolean', uiControl: 'checkbox' };
    case 'select':
      return { businessType: 'status', logicalType: 'enum', postgresType: 'varchar', uiControl: 'dropdown' };
    case 'multi_select':
      return { businessType: 'status', logicalType: 'multi_enum', postgresType: 'jsonb', uiControl: 'multi_select' };
    case 'entity_ref':
      return { businessType: 'relationship_key', logicalType: 'entity_reference', postgresType: 'uuid', uiControl: 'lookup' };
    case 'file':
      return { businessType: 'plain_data', logicalType: 'file_reference', postgresType: 'uuid', uiControl: 'file_picker' };
    case 'auto_number':
      return { businessType: 'identifier', logicalType: 'auto_number', postgresType: 'varchar', uiControl: 'read_only' };
    default:
      return { businessType: 'plain_data', logicalType: 'text_identifier', postgresType: 'varchar', uiControl: 'text_input' };
  }
}

function defaultTypeConfig(field: FieldInstance): Record<string, unknown> {
  const typing = mapFieldTyping(field.fieldType);
  if ((typing.logicalType === 'enum' || typing.logicalType === 'multi_enum') && !Array.isArray(field.typeConfig.options)) {
    return {
      ...field.typeConfig,
      options: [
        { code: 'draft', label: 'Draft' },
        { code: 'active', label: 'Active' },
        { code: 'inactive', label: 'Inactive' },
      ],
    };
  }
  if (typing.logicalType === 'entity_reference' && typeof field.typeConfig.targetEntityId !== 'string') {
    return { ...field.typeConfig, targetEntityId: 'ent_reference_placeholder' };
  }
  return field.typeConfig;
}

function toCanonicalField(entityApiName: string, field: FieldInstance): FieldDefinitionMetadata {
  const typing = mapFieldTyping(field.fieldType);
  const fieldId = `fld_${entityApiName}_${field.fieldId}`;
  const fieldLifecycle = field.lifecycle === 'disabled' ? 'disabled' : field.lifecycle;

  return {
    fieldId,
    entityId: `ent_${entityApiName}`,
    apiName: field.fieldId,
    label: field.label,
    description: field.description,
    source: field.sourceLayer === 'platform' && field.protected ? 'system' : 'local',
    ownership: {
      owningLayer: toStructuralLayer(field.sourceLayer),
      namespace: 'authoring',
      packageId: undefined,
    },
    typing,
    storage: {
      strategy: typing.logicalType === 'computed' ? 'virtual' : 'physical_column',
      columnName: field.fieldId,
      nullable: field.behaviors.presence === 'optional',
    },
    typeConfig: defaultTypeConfig(field),
    behavior: {
      required: field.behaviors.presence !== 'optional',
      immutable: field.protected || field.behaviors.editability === 'system_only',
      searchable: field.behaviors.searchable,
      sortable: field.behaviors.sortable,
      filterable: field.behaviors.filterable,
      defaultValue: field.behaviors.defaultValue,
    },
    governance: {
      classification: field.governance.classification,
      maskByDefault: field.governance.apiOutputMasked || field.governance.maskInExport,
      allowImport: field.governance.allowImport,
      allowExport: field.governance.includeInExport,
      apiInputAllowed: field.governance.apiInputAllowed,
      apiOutputAllowed: field.governance.apiOutputAllowed,
    },
    lifecycle: {
      status: fieldLifecycle,
      metadataStatus: fieldLifecycle === 'active' ? 'active' : 'draft',
    },
  };
}

function toCanonicalActionHandlerConfig(
  handlerConfig: LegacyEntityAction['handlerConfig'],
): ActionDefinitionMetadata['handlerConfig'] {
  switch (handlerConfig.type) {
    case 'workflow_trigger':
      return { type: 'workflow_trigger', workflowCode: handlerConfig.workflowCode, transitionCode: handlerConfig.transitionCode };
    case 'navigation':
      return { type: 'navigation', targetEntityId: handlerConfig.targetEntity, targetViewId: handlerConfig.targetViewId, openMode: handlerConfig.openMode };
    case 'api_call':
      return { type: 'api_call', endpointCode: handlerConfig.endpointCode, successMessage: handlerConfig.successMessage, failureMessage: handlerConfig.failureMessage };
    case 'print':
      return { type: 'print', templateCode: handlerConfig.templateCode };
    case 'export':
      return { type: 'export', format: handlerConfig.format, viewId: handlerConfig.viewId };
  }
}

export function mapLegacyAction(
  entityApiName: string,
  action: LegacyEntityAction,
): ActionDefinitionMetadata {
  return {
    actionId: action.actionId.startsWith('act_') ? action.actionId : `act_${entityApiName}_${action.actionId}`,
    entityId: `ent_${entityApiName}`,
    apiName: action.actionId.replace(/^act_/, '').replace(new RegExp(`^${entityApiName}_`), ''),
    label: action.label,
    icon: action.icon,
    placement: action.placement,
    handlerType: action.handlerType,
    handlerConfig: toCanonicalActionHandlerConfig(action.handlerConfig),
    confirmationRequired: action.confirmationRequired,
    confirmationMessage: action.confirmationMessage,
    ownership: {
      owningLayer: toStructuralLayer(action.owningLayer),
      namespace: 'authoring',
    },
    lifecycle: { metadataStatus: 'draft' },
  };
}

export function mapLegacyView(
  entityApiName: string,
  view: LegacyEntityView,
): ViewDefinitionMetadata {
  return {
    viewId: view.viewId.startsWith('view_') ? view.viewId : `view_${entityApiName}_${view.viewId}`,
    entityId: `ent_${entityApiName}`,
    apiName: view.viewId.replace(/^view_/, '').replace(new RegExp(`^${entityApiName}_`), ''),
    label: view.label,
    viewType: view.viewType,
    isDefault: view.isDefault,
    fieldConfig: view.fieldConfig.map(fc => ({
      fieldId: fc.fieldId,
      visible: fc.visible,
      columnWidth: fc.columnWidth,
      summaryType: fc.summaryType,
      groupInterval: fc.groupInterval,
      freezePosition: fc.freezePosition,
      textAlign: fc.textAlign,
      showInColumnChooser: fc.showInColumnChooser,
      sectionId: fc.sectionId,
      readonly: fc.readonly,
    })),
    sections: view.sections?.map(s => ({
      sectionId: s.sectionId,
      label: s.label,
      columns: s.columns,
      collapsible: s.collapsible,
      defaultCollapsed: s.defaultCollapsed,
    })),
    ownership: {
      owningLayer: toStructuralLayer(view.owningLayer),
      namespace: 'authoring',
    },
    lifecycle: { metadataStatus: 'draft' },
  };
}

export function buildCanonicalEntityAuthoringBundle(
  legacyEntity: LegacyEntityDefinition,
  options: LegacyAuthoringAdapterOptions = {},
): CanonicalEntityAuthoringBundle {
  const timestamp = options.createdAt ?? new Date().toISOString();
  const namespace = options.namespace ?? 'auto_service';
  const owningPackageId = options.owningPackageId ?? 'pkg_automotive_service';
  const owningModule = options.owningModule ?? (legacyEntity.domain || 'Entity Designer');
  const category = toCanonicalCategory(legacyEntity.category);
  const fields = legacyEntity.fields.map(field => toCanonicalField(legacyEntity.entityType, field));
  const fieldIds = fields.map(field => field.fieldId);
  const listViewId = `view_${legacyEntity.entityType}_list`;
  const formViewId = `view_${legacyEntity.entityType}_form`;
  const lookupViewId = category === 'master_data' ? `view_${legacyEntity.entityType}_lookup` : null;
  const storageStrategy: EntityStorageStrategy = 'physical_table';
  const defaultDisplayFieldId = fields[0]?.fieldId ?? null;

  const entity: EntityDefinitionMetadata = {
    entityId: `ent_${legacyEntity.entityType}`,
    apiName: legacyEntity.entityType,
    label: legacyEntity.label,
    pluralLabel: legacyEntity.pluralLabel ?? pluralize(legacyEntity.label),
    description: legacyEntity.description,
    entityCode: legacyEntity.entityType.split('_').map(segment => segment[0]).join('').slice(0, 20).toUpperCase(),
    namespace,
    classification: {
      domain: normalizeDomain(legacyEntity.domain),
      module: owningModule,
      entityCategory: category,
      businessObjectType: defaultBusinessObjectType(legacyEntity.category),
      industryVertical: options.industryVertical ?? 'automobile',
      lookupEligible: category === 'master_data',
      lookupOverrideReason: undefined,
    },
    ownership: {
      owningLayer: toStructuralLayer(legacyEntity.owningLayer),
      owningPackageId,
      owningModule,
      protected: false,
      extensionPolicyId: legacyEntity.behaviors.allowDownstreamExtension ? 'policy_allow_tenant_extension' : 'policy_no_downstream_extension',
      overridePolicyId: 'policy_constrain_only',
    },
    storage: {
      storageStrategy,
      tableName: `${storagePrefix(legacyEntity.category)}_${legacyEntity.entityType}`,
      primaryKeyField: 'id',
      primaryKeyStrategy: 'uuid',
      tenantScoped: true,
      nodeScoped: legacyEntity.owningLayer === 'node' || legacyEntity.category === 'transaction',
      softDeletePolicyId: legacyEntity.category === 'ledger_like' ? null : 'policy_soft_delete_standard',
    },
    display: {
      defaultDisplayFieldId,
      defaultListViewId: listViewId,
      defaultFormViewId: formViewId,
      defaultLookupViewId: lookupViewId,
      titleFormat: defaultDisplayFieldId ? `{${fields[0].apiName}}` : null,
      subtitleFormat: null,
    },
    lifecycle: {
      metadataStatus: 'draft',
      recordLifecycleModelId: legacyEntity.behaviors.workflowEnabled || category === 'ledger_like' ? `lifecycle_${legacyEntity.entityType}` : null,
      activationPolicyId: 'policy_compile_required',
      versionId: `ver_${legacyEntity.entityType}_draft`,
      activatedAt: null,
      deprecatedAt: null,
      retiredAt: null,
    },
    runtimePolicies: {
      auditPolicyId: legacyEntity.behaviors.auditable ? 'audit_transaction_full' : 'audit_metadata_only',
      securityPolicyId: 'security_default_metadata_admin',
      apiExposurePolicyId: 'api_internal_only',
      importPolicyId: legacyEntity.behaviors.allowBulkImport ? 'import_governed' : 'import_disabled',
      exportPolicyId: 'export_role_based',
      analyticsPolicyId: legacyEntity.behaviors.reportingEnabled === false ? 'analytics_disabled' : 'analytics_standard',
      searchPolicyId: legacyEntity.behaviors.searchIndexEnabled === false ? 'search_disabled' : 'search_enabled',
      localizationPolicyId: 'locale_india_default',
    },
    governanceFlags: {
      allowExtension: legacyEntity.behaviors.allowDownstreamExtension,
      allowFieldAddition: legacyEntity.behaviors.allowDownstreamExtension,
      allowRelationshipAddition: legacyEntity.behaviors.allowDownstreamExtension,
      allowViewOverride: true,
      allowActionAddition: true,
      allowRequirednessRelaxation: legacyEntity.behaviors.allowDownstreamRequirednessRelaxation,
      allowApiExposureOverride: false,
    },
    systemAudit: {
      createdBy: options.createdBy ?? 'ui_author',
      createdAt: timestamp,
      updatedBy: options.createdBy ?? 'ui_author',
      updatedAt: timestamp,
      changeReason: 'Created from Entity Designer wizard.',
    },
    references: {
      fieldIds,
      relationshipIds: [],
      validationRuleIds: [],
      securityDefinitionIds: [],
      viewIds: lookupViewId ? [listViewId, formViewId, lookupViewId] : [listViewId, formViewId],
      actionIds: [],
    },
  };

  // Map legacy actions & views
  const actions = (legacyEntity.actions ?? []).map(a => mapLegacyAction(legacyEntity.entityType, a));
  const views = (legacyEntity.views ?? []).map(v => mapLegacyView(legacyEntity.entityType, v));

  // Update entity references
  entity.references.actionIds = actions.map(a => a.actionId);
  entity.references.viewIds = [
    ...entity.references.viewIds,
    ...views.map(v => v.viewId).filter(id => !entity.references.viewIds.includes(id)),
  ];

  const validationResults = [
    validateEntityDefinition(entity),
    ...fields.map(validateFieldDefinition),
    ...actions.map(validateActionDefinition),
    ...views.map(validateViewDefinition),
  ];
  const issues = validationResults.flatMap(result => result.issues);

  return {
    entity,
    fields,
    actions,
    views,
    issues,
    valid: validationResults.every(result => result.valid),
  };
}

export function describeCanonicalEntityBundle(bundle: CanonicalEntityAuthoringBundle): string {
  const fieldCount = bundle.fields.length;
  return `${bundle.entity.label} (${bundle.entity.apiName}) uses ${fieldCount} separate ${fieldCount === 1 ? 'FieldDefinition' : 'FieldDefinitions'}.`;
}
