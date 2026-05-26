// UI Studio — Mock View Repository
// Implements UIStudioViewRepository using in-memory storage.
// Optionally persists to localStorage for demo continuity.
// DEMO/MOCK ONLY — not connected to any backend.

import type {
  UIStudioViewRepository,
  ViewSummary,
  ViewArtifact,
  CreateViewInput,
  PublishResult,
  ViewVersionSummary,
} from '../../types/ui-studio/index'

const now = () => new Date().toISOString()
const uuid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const SEED_VIEWS: ViewArtifact[] = [
  {
    id: 'view-customer-list',
    viewKey: 'customer_list',
    label: 'Customer List',
    description: 'Master list of all customers with search and filter',
    surfaceType: 'list',
    primaryEntityId: 'entity-customer',
    status: 'published',
    version: 2,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
    layout: { containers: [] },
    components: [],
    dataSources: [{ id: 'ds-customer', sourceType: 'primary_entity', entityId: 'entity-customer', filters: [] }],
    bindings: [],
    actions: [],
    behaviorRules: [],
  },
  {
    id: 'view-customer-detail',
    viewKey: 'customer_detail',
    label: 'Customer Detail',
    description: 'Full detail view of a single customer record',
    surfaceType: 'record_detail',
    primaryEntityId: 'entity-customer',
    status: 'published',
    version: 1,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-05T09:00:00Z',
    layout: { containers: [] },
    components: [],
    dataSources: [{ id: 'ds-customer-detail', sourceType: 'primary_entity', entityId: 'entity-customer', filters: [] }],
    bindings: [],
    actions: [],
    behaviorRules: [],
  },
  {
    id: 'view-product-master',
    viewKey: 'product_master',
    label: 'Product Master',
    description: 'Smart CRUD view for product master data',
    surfaceType: 'list',
    primaryEntityId: 'entity-product',
    status: 'draft',
    version: 1,
    createdAt: '2024-01-12T11:00:00Z',
    updatedAt: '2024-01-12T11:00:00Z',
    layout: { containers: [] },
    components: [],
    dataSources: [{ id: 'ds-product', sourceType: 'primary_entity', entityId: 'entity-product', filters: [] }],
    bindings: [],
    actions: [],
    behaviorRules: [],
  },
  {
    id: 'view-sale-order-entry',
    viewKey: 'sale_order_entry',
    label: 'Sale Order Entry',
    description: 'Header-line transaction workspace for sale order creation',
    surfaceType: 'transaction_workspace',
    primaryEntityId: 'entity-saleorder',
    status: 'draft',
    version: 1,
    viewCode: 'SO',
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-14T09:00:00Z',
    layout: { containers: [] },
    components: [],
    dataSources: [
      { id: 'ds-so-header', sourceType: 'primary_entity', entityId: 'entity-saleorder', filters: [] },
      { id: 'ds-so-lines', sourceType: 'related_entity', entityId: 'entity-saleorderline', filters: [] },
    ],
    bindings: [],
    actions: [],
    behaviorRules: [],
  },
  {
    id: 'view-sale-dashboard',
    viewKey: 'sale_dashboard',
    label: 'Sale Order Dashboard',
    description: 'Summary dashboard for sale order analytics',
    surfaceType: 'dashboard_summary',
    primaryEntityId: 'entity-saleorder',
    status: 'needs_attention',
    version: 1,
    createdAt: '2024-01-08T14:00:00Z',
    updatedAt: '2024-01-09T16:00:00Z',
    layout: { containers: [] },
    components: [],
    dataSources: [{ id: 'ds-so-dash', sourceType: 'primary_entity', entityId: 'entity-saleorder', filters: [] }],
    bindings: [],
    actions: [],
    behaviorRules: [],
  },
]

const STORAGE_KEY = 'ui-studio-mock-views'

function loadStore(): Map<string, ViewArtifact> {
  const store = new Map<string, ViewArtifact>()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ViewArtifact[]
      parsed.forEach(v => store.set(v.id, v))
      return store
    }
  } catch {
    // Fall through to seed data on parse error
  }
  SEED_VIEWS.forEach(v => store.set(v.id, v))
  return store
}

function saveStore(store: Map<string, ViewArtifact>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(store.values())))
  } catch {
    // localStorage unavailable in test/SSR environments — ignore
  }
}

let _store: Map<string, ViewArtifact> | null = null

function getStore(): Map<string, ViewArtifact> {
  if (!_store) _store = loadStore()
  return _store
}

const versionHistory = new Map<string, ViewVersionSummary[]>()

const delay = (ms = 120) => new Promise<void>(resolve => setTimeout(resolve, ms))

export const mockViewRepository: UIStudioViewRepository = {
  async listViews(): Promise<ViewSummary[]> {
    await delay()
    return Array.from(getStore().values()).map(({ id, viewKey, label, description, surfaceType, primaryEntityId, status, version, createdAt, updatedAt }) => ({
      id, viewKey, label, description, surfaceType, primaryEntityId, status, version, createdAt, updatedAt,
    }))
  },

  async getView(viewId: string): Promise<ViewArtifact | null> {
    await delay()
    return getStore().get(viewId) ?? null
  },

  async createDraft(input: CreateViewInput): Promise<ViewArtifact> {
    await delay()
    const store = getStore()
    const keyConflict = Array.from(store.values()).some(v => v.viewKey === input.viewKey)
    if (keyConflict) throw new Error(`View key "${input.viewKey}" is already in use.`)
    const id = `view-${uuid()}`
    const artifact: ViewArtifact = {
      id,
      viewKey: input.viewKey,
      label: input.label,
      description: input.description,
      surfaceType: input.surfaceType,
      primaryEntityId: input.primaryEntityId,
      status: 'draft',
      version: 1,
      createdAt: now(),
      updatedAt: now(),
      layout: { containers: [] },
      components: [],
      dataSources: [],
      bindings: [],
      actions: [],
      behaviorRules: [],
    }
    getStore().set(id, artifact)
    saveStore(getStore())
    return artifact
  },

  async saveDraft(viewId: string, artifact: ViewArtifact): Promise<ViewArtifact> {
    await delay()
    const updated: ViewArtifact = { ...artifact, updatedAt: now() }
    getStore().set(viewId, updated)
    saveStore(getStore())
    return updated
  },

  async publish(viewId: string): Promise<PublishResult> {
    await delay()
    const current = getStore().get(viewId)
    if (!current) return { success: false, version: 0, versionId: '', errors: [{ code: 'NOT_FOUND', message: 'View not found', severity: 'error' }] }

    const newVersion = current.version + 1
    const versionId = `ver-${uuid()}`
    const published: ViewArtifact = { ...current, status: 'published', version: newVersion, updatedAt: now() }

    const summary: ViewVersionSummary = {
      versionId,
      version: newVersion,
      publishedAt: now(),
      publishedBy: 'demo-user',
      label: `v${newVersion}`,
      snapshot: published,
    }

    const history = versionHistory.get(viewId) ?? []
    versionHistory.set(viewId, [...history, summary])
    getStore().set(viewId, published)
    saveStore(getStore())

    return { success: true, version: newVersion, versionId, errors: [] }
  },

  async rollback(viewId: string, versionId: string): Promise<ViewArtifact> {
    await delay()
    const history = versionHistory.get(viewId) ?? []
    const target = history.find(v => v.versionId === versionId)
    if (!target) {
      const current = getStore().get(viewId)
      if (current) return current
      throw new Error(`Version ${versionId} not found`)
    }
    const restored: ViewArtifact = { ...target.snapshot, status: 'draft', updatedAt: now() }
    getStore().set(viewId, restored)
    saveStore(getStore())
    return restored
  },

  async listVersions(viewId: string): Promise<ViewVersionSummary[]> {
    await delay()
    return versionHistory.get(viewId) ?? []
  },
}

// Exposed for tests to reset store to seed data
export function resetMockViewRepository(): void {
  _store = new Map<string, ViewArtifact>()
  SEED_VIEWS.forEach(v => _store!.set(v.id, v))
  versionHistory.clear()
}
