// ============================================================
// Storage Type Computer — Phase 3 quick win
// Computes physical/extension/virtual/persisted_computed
// from field type + source layer. Display-only, not stored.
// ============================================================
import type { FieldInstance } from '../types/entityDesigner';

export type StorageType = 'physical' | 'extension' | 'virtual' | 'persisted_computed';

/**
 * Derives the storage type for a field based on its fieldType and sourceLayer.
 * This is purely informational — no user configuration needed.
 */
export function computeStorageType(field: FieldInstance): StorageType {
  // Computed fields: mode determines virtual vs persisted
  if (field.fieldType === 'computed') {
    if (field.typeConfig?.mode === 'persisted') return 'persisted_computed';
    return 'virtual'; // 'display_only' (default) → not stored in DB
  }
  // Rollup fields are always persisted (recalculated on child record changes)
  if (field.fieldType === 'rollup') return 'persisted_computed';
  // Tenant/node layer fields go into the extension table ({entity}_ext)
  if (field.sourceLayer === 'tenant' || field.sourceLayer === 'node') return 'extension';
  // Platform and vertical fields live in the main entity table
  return 'physical';
}

export const STORAGE_TYPE_LABELS: Record<StorageType, {
  label: string;
  color: string;
  hint: string;
}> = {
  physical: {
    label: 'Physical',
    color: '#6b7280',
    hint: 'Column in the main entity table — standard storage',
  },
  extension: {
    label: 'Extension Table',
    color: '#0891b2', // cyan-600 — matches tenant layer color
    hint: 'Column in the tenant extension table ({entity}_ext) — added by tenant/node layer',
  },
  virtual: {
    label: 'Virtual',
    color: '#9ca3af',
    hint: 'Computed at render time — not persisted to database, not queryable in reports',
  },
  persisted_computed: {
    label: 'Persisted Computed',
    color: '#d97706', // amber
    hint: 'Computed on save and stored in DB — queryable in reports and sortable in lists',
  },
};
