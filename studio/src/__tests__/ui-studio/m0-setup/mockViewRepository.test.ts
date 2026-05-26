import { mockViewRepository, resetMockViewRepository } from '../../../mocks/ui-studio/mockViewRepository'

beforeEach(() => {
  resetMockViewRepository()
})

describe('mockViewRepository', () => {
  describe('listViews', () => {
    it('returns the 5 seeded view summaries', async () => {
      const views = await mockViewRepository.listViews()
      expect(views).toHaveLength(5)
    })

    it('returns view summaries with required fields', async () => {
      const views = await mockViewRepository.listViews()
      const first = views[0]
      expect(first).toHaveProperty('id')
      expect(first).toHaveProperty('viewKey')
      expect(first).toHaveProperty('label')
      expect(first).toHaveProperty('surfaceType')
      expect(first).toHaveProperty('status')
      expect(first).toHaveProperty('version')
    })
  })

  describe('getView', () => {
    it('returns a full artifact for a known view id', async () => {
      const view = await mockViewRepository.getView('view-customer-list')
      expect(view).not.toBeNull()
      expect(view?.label).toBe('Customer List')
      expect(view?.surfaceType).toBe('list')
    })

    it('returns null for an unknown view id', async () => {
      const view = await mockViewRepository.getView('view-does-not-exist')
      expect(view).toBeNull()
    })
  })

  describe('createDraft', () => {
    it('creates a new view and returns it as draft', async () => {
      const draft = await mockViewRepository.createDraft({
        label: 'Test View',
        surfaceType: 'list',
        primaryEntityId: 'entity-customer',
      })
      expect(draft.status).toBe('draft')
      expect(draft.label).toBe('Test View')
      expect(draft.version).toBe(1)
      expect(draft.id).toBeTruthy()
    })

    it('adds the new view to the list', async () => {
      await mockViewRepository.createDraft({ label: 'Extra View', surfaceType: 'dashboard_summary' })
      const views = await mockViewRepository.listViews()
      expect(views).toHaveLength(6)
      expect(views.some(v => v.label === 'Extra View')).toBe(true)
    })
  })

  describe('publish', () => {
    it('publishes a draft and increments version', async () => {
      const result = await mockViewRepository.publish('view-product-master')
      expect(result.success).toBe(true)
      expect(result.version).toBeGreaterThan(1)

      const updated = await mockViewRepository.getView('view-product-master')
      expect(updated?.status).toBe('published')
    })

    it('returns error result for unknown view', async () => {
      const result = await mockViewRepository.publish('view-nonexistent')
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('saveDraft', () => {
    it('saves draft changes and updates updatedAt', async () => {
      const original = await mockViewRepository.getView('view-product-master')
      if (!original) throw new Error('Seed view missing')

      const updated = await mockViewRepository.saveDraft('view-product-master', {
        ...original,
        label: 'Product Master Updated',
      })
      expect(updated.label).toBe('Product Master Updated')
    })
  })

  describe('listVersions', () => {
    it('returns empty array before any publish', async () => {
      const versions = await mockViewRepository.listVersions('view-customer-list')
      expect(versions).toEqual([])
    })

    it('returns one entry after publish', async () => {
      await mockViewRepository.publish('view-product-master')
      const versions = await mockViewRepository.listVersions('view-product-master')
      expect(versions).toHaveLength(1)
      expect(versions[0].versionId).toBeTruthy()
    })
  })
})
