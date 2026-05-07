// ============================================================
// iDMS Admin Studio — Entity Designer Zustand Store
// ============================================================
import { create } from 'zustand';
import type {
  EntityDefinition, FieldInstance, FieldLifecycleState,
  LifecycleTransitionMeta, SchemaSubTab, AddFieldMode, EntityStatus,
} from '../types/entityDesigner';
import { MOCK_ENTITIES } from '../data/entityDesignerData';

// ===== Allowed lifecycle transitions =====
const ALLOWED_TRANSITIONS: Record<FieldLifecycleState, FieldLifecycleState[]> = {
  draft:    ['active', 'disabled'],
  active:   ['disabled'],
  disabled: ['active'],
};

interface EntityDesignerStore {
  // ── Entity mutations ──────────────────────────────────────
  savedEntities: Record<string, EntityDefinition>;
  createEntity: (entity: EntityDefinition) => void;
  updateEntity: (entityType: string, patch: Partial<EntityDefinition>) => void;
  deleteEntity: (entityType: string) => void;

  setEntityStatus: (entityType: string, status: EntityStatus) => void;

  // ── Field mutations ───────────────────────────────────────
  saveSchemaField: (entityType: string, field: FieldInstance) => void;
  deleteSchemaField: (entityType: string, fieldId: string) => void;
  setFieldLifecycle: (
    entityType: string,
    fieldId: string,
    nextState: FieldLifecycleState,
    meta?: LifecycleTransitionMeta,
  ) => { success: boolean; error?: string };

  // ── UI state ──────────────────────────────────────────────
  activeEntityType: string | null;
  setActiveEntity: (entityType: string | null) => void;

  schemaSubTabByEntity: Record<string, SchemaSubTab>;
  setSchemaSubTab: (entityType: string, tab: SchemaSubTab) => void;

  selectedFieldId: string | null;
  setSelectedField: (fieldId: string | null) => void;

  inspectorOpen: boolean;
  setInspectorOpen: (open: boolean) => void;

  addFieldMode: AddFieldMode;
  setAddFieldMode: (mode: AddFieldMode) => void;

  // Overlay confirmation pending
  pendingField: { entityType: string; field: FieldInstance } | null;
  setPendingField: (pending: { entityType: string; field: FieldInstance } | null) => void;
  confirmPendingField: () => void;

  // ── Toast ─────────────────────────────────────────────────
  toast: { message: string; kind: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, kind?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useEntityDesignerStore = create<EntityDesignerStore>((set, get) => ({
  // ── Entity mutations ──────────────────────────────────────
  savedEntities: {},

  createEntity: (entity) => {
    set(s => ({
      savedEntities: {
        ...s.savedEntities,
        [entity.entityType]: {
          ...entity,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        },
      },
    }));
    get().showToast(`Entity "${entity.label}" created successfully`, 'success');
  },

  updateEntity: (entityType, patch) => {
    set(s => {
      const existing = s.savedEntities[entityType];
      if (!existing) return s;
      return {
        savedEntities: {
          ...s.savedEntities,
          [entityType]: { ...existing, ...patch, lastModified: new Date().toISOString() },
        },
      };
    });
  },

  deleteEntity: (entityType) => {
    set(s => {
      const next = { ...s.savedEntities };
      delete next[entityType];
      return { savedEntities: next };
    });
  },

  setEntityStatus: (entityType, status) => {
    set(s => {
      const entity = s.savedEntities[entityType];
      if (!entity) return s;
      return {
        savedEntities: {
          ...s.savedEntities,
          [entityType]: { ...entity, status, lastModified: new Date().toISOString() },
        },
      };
    });
    get().showToast(`Entity status changed to "${status}"`, 'success');
  },

  // ── Field mutations ───────────────────────────────────────
  saveSchemaField: (entityType, field) => {
    set(s => {
      // Fall back to mock entity so fields can be added to pre-existing mock entities
      const entity = s.savedEntities[entityType]
        ?? MOCK_ENTITIES.find(e => e.entityType === entityType);
      if (!entity) return s;
      const existingIdx = entity.fields.findIndex(f => f.fieldId === field.fieldId);
      const fields = existingIdx >= 0
        ? entity.fields.map((f, i) => (i === existingIdx ? field : f))
        : [...entity.fields, { ...field, lifecycle: field.lifecycle ?? 'draft' }];
      return {
        savedEntities: {
          ...s.savedEntities,
          [entityType]: { ...entity, fields, lastModified: new Date().toISOString() },
        },
      };
    });
    get().showToast(`Field "${field.label}" saved`, 'success');
  },

  deleteSchemaField: (entityType, fieldId) => {
    set(s => {
      const entity = s.savedEntities[entityType]
        ?? MOCK_ENTITIES.find(e => e.entityType === entityType);
      if (!entity) return s;
      return {
        savedEntities: {
          ...s.savedEntities,
          [entityType]: {
            ...entity,
            fields: entity.fields.filter(f => f.fieldId !== fieldId),
            lastModified: new Date().toISOString(),
          },
        },
      };
    });
    get().showToast('Field deleted', 'info');
  },

  setFieldLifecycle: (entityType, fieldId, nextState, meta) => {
    const state = get();
    const entity = state.savedEntities[entityType]
      ?? MOCK_ENTITIES.find(e => e.entityType === entityType);
    if (!entity) return { success: false, error: 'Entity not found in store' };

    const field = entity.fields.find(f => f.fieldId === fieldId);
    if (!field) return { success: false, error: 'Field not found' };

    const allowed = ALLOWED_TRANSITIONS[field.lifecycle] ?? [];
    if (!allowed.includes(nextState)) {
      if (nextState === ('removed' as any)) {
        return {
          success: false,
          error: 'Physical removal requires migration governance and is not available in Entity Designer.',
        };
      }
      return {
        success: false,
        error: `Cannot transition from "${field.lifecycle}" to "${nextState}"`,
      };
    }

    set(s => {
      const ent = s.savedEntities[entityType];
      if (!ent) return s;
      return {
        savedEntities: {
          ...s.savedEntities,
          [entityType]: {
            ...ent,
            fields: ent.fields.map(f =>
              f.fieldId === fieldId
                ? { ...f, lifecycle: nextState, lifecycleMeta: meta }
                : f
            ),
            lastModified: new Date().toISOString(),
          },
        },
      };
    });

    get().showToast(`Field lifecycle changed to "${nextState}"`, 'success');
    return { success: true };
  },

  // ── UI state ──────────────────────────────────────────────
  activeEntityType: null,
  setActiveEntity: (entityType) => set({ activeEntityType: entityType }),

  schemaSubTabByEntity: {},
  setSchemaSubTab: (entityType, tab) =>
    set(s => ({
      schemaSubTabByEntity: { ...s.schemaSubTabByEntity, [entityType]: tab },
    })),

  selectedFieldId: null,
  setSelectedField: (fieldId) => set({ selectedFieldId: fieldId }),

  inspectorOpen: false,
  setInspectorOpen: (open) => set({ inspectorOpen: open }),

  addFieldMode: null,
  setAddFieldMode: (mode) => set({ addFieldMode: mode }),

  pendingField: null,
  setPendingField: (pending) => set({ pendingField: pending }),
  confirmPendingField: () => {
    const { pendingField } = get();
    if (!pendingField) return;
    get().saveSchemaField(pendingField.entityType, pendingField.field);
    set({ pendingField: null, addFieldMode: null });
  },

  // ── Toast ─────────────────────────────────────────────────
  toast: null,
  showToast: (message, kind = 'success') => {
    set({ toast: { message, kind } });
    setTimeout(() => get().clearToast(), 3500);
  },
  clearToast: () => set({ toast: null }),
}));
