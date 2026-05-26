export const STRUCTURAL_LAYERS = ['platform', 'vertical', 'tenant', 'node'] as const;
export type StructuralLayer = (typeof STRUCTURAL_LAYERS)[number];

export const METADATA_STATUSES = ['draft', 'active', 'deprecated', 'retired', 'archived'] as const;
export type MetadataStatus = (typeof METADATA_STATUSES)[number];

export const ENTITY_CATEGORIES = ['transaction', 'master_data', 'configuration', 'ledger_like'] as const;
export type EntityCategory = (typeof ENTITY_CATEGORIES)[number];

export interface MetadataIdentity {
  id: string;
  apiName: string;
  label: string;
  description?: string;
}

export interface OwnershipScope {
  owningLayer: StructuralLayer;
  namespace: string;
  packageId?: string;
}

export interface MetadataAudit {
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface MetadataVersionRef {
  versionId: string;
  version: string;
  status: MetadataStatus;
}

export interface RuntimeContext {
  tenantId: string;
  nodeId?: string;
  roleCode: string;
  userId?: string;
  locale: string;
  channel: 'web' | 'mobile' | 'api' | 'import' | 'export';
  operation: 'create' | 'read' | 'update' | 'delete' | 'submit' | 'approve' | 'close';
  recordState?: string;
  viewId?: string;
  adminPreview?: boolean;
}
