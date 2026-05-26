import { describe, it, expect } from 'vitest';
import { validateViewDefinition } from './view-definition';
import type { ViewDefinitionMetadata } from './view-definition';

function validView(overrides?: Partial<ViewDefinitionMetadata>): Record<string, unknown> {
  return {
    viewId: 'vw_vehicle_list',
    entityId: 'ent_vehicle',
    apiName: 'vehicle_default_list',
    label: 'All Vehicles',
    viewType: 'list_view',
    isDefault: true,
    fieldConfig: [
      { fieldId: 'fld_vin', visible: true, columnWidth: 200 },
      { fieldId: 'fld_make', visible: true },
    ],
    ownership: { owningLayer: 'platform', namespace: 'idms_core' },
    lifecycle: { metadataStatus: 'active' },
    ...overrides,
  };
}

describe('validateViewDefinition', () => {
  // ── Positive tests ──────────────────────────────────────────

  it('accepts a valid list view', () => {
    const result = validateViewDefinition(validView());
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('accepts a valid form view with sections', () => {
    const result = validateViewDefinition(validView({
      viewType: 'form_view',
      apiName: 'vehicle_edit_form',
      sections: [
        { sectionId: 'sec_general', label: 'General', columns: 2, collapsible: true, defaultCollapsed: false },
        { sectionId: 'sec_details', label: 'Details', columns: 1, collapsible: true, defaultCollapsed: true },
      ],
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts a quick view', () => {
    const result = validateViewDefinition(validView({
      viewType: 'quick_view',
      apiName: 'vehicle_quick',
      isDefault: false,
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts a print view', () => {
    const result = validateViewDefinition(validView({
      viewType: 'print_view',
      apiName: 'vehicle_print',
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts view with filter conditions', () => {
    const result = validateViewDefinition(validView({
      filterConditions: {
        logic: 'AND',
        conditions: [{ fieldId: 'fld_status', operator: 'equals', value: 'active' }],
      },
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts view with default sort', () => {
    const result = validateViewDefinition(validView({
      defaultSort: [{ fieldId: 'fld_created_at', direction: 'desc' }],
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts view with pageSize', () => {
    const result = validateViewDefinition(validView({
      pageSize: 50,
    } as any));
    expect(result.valid).toBe(true);
  });

  it('accepts view with empty fieldConfig', () => {
    const result = validateViewDefinition(validView({
      fieldConfig: [],
    } as any));
    expect(result.valid).toBe(true);
  });

  // ── Negative tests ──────────────────────────────────────────

  it('rejects non-object input', () => {
    const result = validateViewDefinition(42);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_INVALID_SHAPE' }));
  });

  it('rejects missing viewId', () => {
    const input = validView();
    delete input.viewId;
    const result = validateViewDefinition(input);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_ID_REQUIRED' }));
  });

  it('rejects missing entityId', () => {
    const input = validView();
    delete input.entityId;
    const result = validateViewDefinition(input);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_ENTITY_REQUIRED' }));
  });

  it('rejects missing apiName', () => {
    const input = validView();
    delete input.apiName;
    const result = validateViewDefinition(input);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'API_NAME_REQUIRED' }));
  });

  it('rejects invalid apiName format', () => {
    const result = validateViewDefinition(validView({ apiName: 'MixedCase' } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'API_NAME_INVALID' }));
  });

  it('rejects missing label', () => {
    const input = validView();
    delete input.label;
    const result = validateViewDefinition(input);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_LABEL_REQUIRED' }));
  });

  it('rejects invalid viewType', () => {
    const result = validateViewDefinition(validView({ viewType: 'kanban_view' } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_TYPE_INVALID' }));
  });

  it('rejects non-boolean isDefault', () => {
    const result = validateViewDefinition(validView({ isDefault: 'yes' } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_IS_DEFAULT_REQUIRED' }));
  });

  it('rejects missing fieldConfig', () => {
    const input = validView();
    delete input.fieldConfig;
    const result = validateViewDefinition(input);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_FIELD_CONFIG_REQUIRED' }));
  });

  it('rejects fieldConfig entry without fieldId', () => {
    const result = validateViewDefinition(validView({
      fieldConfig: [{ visible: true }],
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_FC_FIELD_ID_REQUIRED' }));
  });

  it('rejects fieldConfig entry without visible', () => {
    const result = validateViewDefinition(validView({
      fieldConfig: [{ fieldId: 'fld_vin' }],
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_FC_VISIBLE_REQUIRED' }));
  });

  it('rejects duplicate fieldIds in fieldConfig', () => {
    const result = validateViewDefinition(validView({
      fieldConfig: [
        { fieldId: 'fld_vin', visible: true },
        { fieldId: 'fld_vin', visible: false },
      ],
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_FC_DUPLICATE_FIELD' }));
  });

  it('rejects non-object fieldConfig entry', () => {
    const result = validateViewDefinition(validView({
      fieldConfig: ['not_an_object'],
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_FC_INVALID' }));
  });

  it('rejects non-array sections', () => {
    const result = validateViewDefinition(validView({
      sections: 'not_array',
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_SECTIONS_INVALID' }));
  });

  it('rejects section without sectionId', () => {
    const result = validateViewDefinition(validView({
      sections: [{ label: 'General', columns: 2, collapsible: true, defaultCollapsed: false }],
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_SECTION_ID_REQUIRED' }));
  });

  it('rejects section without label', () => {
    const result = validateViewDefinition(validView({
      sections: [{ sectionId: 'sec_1', columns: 2, collapsible: true, defaultCollapsed: false }],
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_SECTION_LABEL_REQUIRED' }));
  });

  it('rejects section with invalid columns', () => {
    const result = validateViewDefinition(validView({
      sections: [{ sectionId: 'sec_1', label: 'General', columns: 4, collapsible: true, defaultCollapsed: false }],
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_SECTION_COLUMNS_INVALID' }));
  });

  it('rejects duplicate sectionIds', () => {
    const result = validateViewDefinition(validView({
      sections: [
        { sectionId: 'sec_1', label: 'A', columns: 1, collapsible: false, defaultCollapsed: false },
        { sectionId: 'sec_1', label: 'B', columns: 2, collapsible: false, defaultCollapsed: false },
      ],
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_SECTION_DUPLICATE' }));
  });

  it('rejects non-object section entry', () => {
    const result = validateViewDefinition(validView({
      sections: [null],
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_SECTION_INVALID' }));
  });

  it('rejects zero pageSize', () => {
    const result = validateViewDefinition(validView({ pageSize: 0 } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_PAGE_SIZE_INVALID' }));
  });

  it('rejects negative pageSize', () => {
    const result = validateViewDefinition(validView({ pageSize: -10 } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_PAGE_SIZE_INVALID' }));
  });

  it('rejects missing ownership', () => {
    const input = validView();
    delete input.ownership;
    const result = validateViewDefinition(input);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_OWNERSHIP_REQUIRED' }));
  });

  it('rejects role as owning layer', () => {
    const result = validateViewDefinition(validView({
      ownership: { owningLayer: 'role', namespace: 'x' },
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_ROLE_LAYER_FORBIDDEN' }));
  });

  it('rejects missing lifecycle', () => {
    const input = validView();
    delete input.lifecycle;
    const result = validateViewDefinition(input);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_LIFECYCLE_REQUIRED' }));
  });

  it('rejects invalid metadata status', () => {
    const result = validateViewDefinition(validView({
      lifecycle: { metadataStatus: 'bogus' },
    } as any));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'VIEW_STATUS_INVALID' }));
  });

  it('collects multiple issues', () => {
    const result = validateViewDefinition({});
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(3);
  });
});
