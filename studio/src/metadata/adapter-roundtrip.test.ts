import { describe, it, expect } from 'vitest';
import { buildCanonicalEntityAuthoringBundle, mapLegacyAction, mapLegacyView } from './legacy-entity-authoring-adapter';
import { validateActionDefinition } from './action-definition';
import { validateViewDefinition } from './view-definition';
import type { EntityDefinition as LegacyEntityDefinition, EntityAction, EntityView } from '../types/entityDesigner';

// ── Minimal legacy entity with actions + views ────────────────
function makeLegacyEntity(overrides?: Partial<LegacyEntityDefinition>): LegacyEntityDefinition {
  return {
    entityType: 'test_entity',
    label: 'Test Entity',
    category: 'transaction',
    domain: 'service',
    owningLayer: 'vertical',
    fields: [
      {
        fieldId: 'name',
        label: 'Name',
        fieldType: 'text',
        sourceLayer: 'vertical',
        protected: false,
        description: '',
        typeConfig: {},
        behaviors: {
          presence: 'required',
          editability: 'editable',
          visibility: 'visible',
          searchable: true,
          sortable: true,
          filterable: true,
          defaultValue: undefined,
        },
        governance: {
          classification: 'internal',
          allowImport: true,
          includeInExport: true,
          maskInExport: false,
          apiInputAllowed: true,
          apiOutputAllowed: true,
          apiOutputMasked: false,
        },
        lifecycle: 'active',
      },
    ],
    behaviors: {
      auditable: true,
      workflowEnabled: true,
      allowDownstreamExtension: true,
      allowDownstreamRequirednessRelaxation: false,
      allowBulkImport: true,
      reportingEnabled: true,
      searchIndexEnabled: true,
    },
    ...overrides,
  } as LegacyEntityDefinition;
}

const sampleAction: EntityAction = {
  actionId: 'submit_for_review',
  label: 'Submit for Review',
  icon: 'send',
  placement: 'toolbar',
  owningLayer: 'vertical',
  handlerType: 'workflow_trigger',
  handlerConfig: { type: 'workflow_trigger', workflowCode: 'wf_review', transitionCode: 'submit' },
  confirmationRequired: true,
  confirmationMessage: 'Are you sure?',
};

const sampleView: EntityView = {
  viewId: 'default_list',
  label: 'All Records',
  viewType: 'list_view',
  isDefault: true,
  owningLayer: 'vertical',
  fieldConfig: [
    { fieldId: 'name', visible: true, columnWidth: 250 },
  ],
};

describe('legacy-entity-authoring-adapter action/view mapping', () => {
  // ── mapLegacyAction ─────────────────────────────────────────

  it('maps a legacy action to a valid ActionDefinitionMetadata', () => {
    const result = mapLegacyAction('test_entity', sampleAction);
    expect(result.actionId).toBe('act_test_entity_submit_for_review');
    expect(result.entityId).toBe('ent_test_entity');
    expect(result.label).toBe('Submit for Review');
    expect(result.handlerType).toBe('workflow_trigger');
    expect(result.handlerConfig.type).toBe('workflow_trigger');
    expect(result.placement).toBe('toolbar');
    expect(result.confirmationRequired).toBe(true);
    expect(result.ownership.owningLayer).toBe('vertical');

    const validation = validateActionDefinition(result);
    expect(validation.valid).toBe(true);
  });

  it('preserves act_ prefix on actionId if already present', () => {
    const action = { ...sampleAction, actionId: 'act_already_prefixed' };
    const result = mapLegacyAction('test_entity', action);
    expect(result.actionId).toBe('act_already_prefixed');
  });

  it('maps a navigation action correctly', () => {
    const navAction: EntityAction = {
      actionId: 'go_to_detail',
      label: 'View Detail',
      placement: 'context_menu',
      owningLayer: 'platform',
      handlerType: 'navigation',
      handlerConfig: { type: 'navigation', targetEntity: 'other_entity', openMode: 'new_tab' },
      confirmationRequired: false,
    };
    const result = mapLegacyAction('test_entity', navAction);
    expect(result.handlerConfig.type).toBe('navigation');
    const validation = validateActionDefinition(result);
    expect(validation.valid).toBe(true);
  });

  it('maps an export action correctly', () => {
    const exportAction: EntityAction = {
      actionId: 'export_csv',
      label: 'Export CSV',
      placement: 'toolbar',
      owningLayer: 'tenant',
      handlerType: 'export',
      handlerConfig: { type: 'export', format: 'csv' },
      confirmationRequired: false,
    };
    const result = mapLegacyAction('test_entity', exportAction);
    const validation = validateActionDefinition(result);
    expect(validation.valid).toBe(true);
  });

  it('remaps role owningLayer to tenant', () => {
    const roleAction = { ...sampleAction, owningLayer: 'role' as const };
    const result = mapLegacyAction('test_entity', roleAction);
    expect(result.ownership.owningLayer).toBe('tenant');
  });

  // ── mapLegacyView ──────────────────────────────────────────

  it('maps a legacy view to a valid ViewDefinitionMetadata', () => {
    const result = mapLegacyView('test_entity', sampleView);
    expect(result.viewId).toBe('view_test_entity_default_list');
    expect(result.entityId).toBe('ent_test_entity');
    expect(result.viewType).toBe('list_view');
    expect(result.isDefault).toBe(true);
    expect(result.fieldConfig).toHaveLength(1);
    expect(result.fieldConfig[0].fieldId).toBe('name');
    expect(result.fieldConfig[0].visible).toBe(true);

    const validation = validateViewDefinition(result);
    expect(validation.valid).toBe(true);
  });

  it('preserves view_ prefix on viewId if already present', () => {
    const view = { ...sampleView, viewId: 'view_already_prefixed' };
    const result = mapLegacyView('test_entity', view);
    expect(result.viewId).toBe('view_already_prefixed');
  });

  it('maps form view with sections', () => {
    const formView: EntityView = {
      viewId: 'edit_form',
      label: 'Edit Form',
      viewType: 'form_view',
      isDefault: true,
      owningLayer: 'vertical',
      fieldConfig: [{ fieldId: 'name', visible: true, sectionId: 'sec_general' }],
      sections: [{ sectionId: 'sec_general', label: 'General', columns: 2, collapsible: true, defaultCollapsed: false }],
    };
    const result = mapLegacyView('test_entity', formView);
    expect(result.sections).toHaveLength(1);
    expect(result.sections![0].sectionId).toBe('sec_general');
    expect(result.sections![0].columns).toBe(2);

    const validation = validateViewDefinition(result);
    expect(validation.valid).toBe(true);
  });

  // ── buildCanonicalEntityAuthoringBundle with actions/views ──

  it('includes actions in the bundle', () => {
    const legacy = makeLegacyEntity({ actions: [sampleAction] });
    const bundle = buildCanonicalEntityAuthoringBundle(legacy);
    expect(bundle.actions).toHaveLength(1);
    expect(bundle.actions[0].label).toBe('Submit for Review');
    expect(bundle.entity.references.actionIds).toContain(bundle.actions[0].actionId);
  });

  it('includes views in the bundle', () => {
    const legacy = makeLegacyEntity({ views: [sampleView] });
    const bundle = buildCanonicalEntityAuthoringBundle(legacy);
    expect(bundle.views).toHaveLength(1);
    expect(bundle.views[0].viewType).toBe('list_view');
    expect(bundle.entity.references.viewIds).toContain(bundle.views[0].viewId);
  });

  it('produces empty actions/views when legacy entity has none', () => {
    const legacy = makeLegacyEntity();
    const bundle = buildCanonicalEntityAuthoringBundle(legacy);
    expect(bundle.actions).toHaveLength(0);
    expect(bundle.views).toHaveLength(0);
    expect(bundle.entity.references.actionIds).toHaveLength(0);
  });

  it('deduplicates viewIds in entity references', () => {
    // The adapter generates default viewIds (list, form). If the legacy view has same IDs, no duplication.
    const listView: EntityView = {
      viewId: 'view_test_entity_list',
      label: 'List',
      viewType: 'list_view',
      isDefault: true,
      owningLayer: 'vertical',
      fieldConfig: [{ fieldId: 'name', visible: true }],
    };
    const legacy = makeLegacyEntity({ views: [listView] });
    const bundle = buildCanonicalEntityAuthoringBundle(legacy);
    const listViewCount = bundle.entity.references.viewIds.filter(id => id === 'view_test_entity_list').length;
    expect(listViewCount).toBe(1);
  });

  it('validates all mapped actions and views in the bundle', () => {
    const legacy = makeLegacyEntity({
      actions: [sampleAction],
      views: [sampleView],
    });
    const bundle = buildCanonicalEntityAuthoringBundle(legacy);
    // The adapter validates everything; check that action/view issues are collected
    expect(bundle.actions).toHaveLength(1);
    expect(bundle.views).toHaveLength(1);
    // Individual validation should pass
    expect(validateActionDefinition(bundle.actions[0]).valid).toBe(true);
    expect(validateViewDefinition(bundle.views[0]).valid).toBe(true);
  });
});
