import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockViewRepository } from '../../mocks/ui-studio/mockViewRepository'
import type { CreateViewInput, ViewArtifact } from '../../types/ui-studio/index'

const QUERY_KEYS = {
  views: ['ui-studio', 'views'] as const,
  view: (id: string) => ['ui-studio', 'views', id] as const,
  versions: (id: string) => ['ui-studio', 'views', id, 'versions'] as const,
}

export function useViewListQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.views,
    queryFn: () => mockViewRepository.listViews(),
  })
}

export function useViewQuery(viewId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.view(viewId ?? ''),
    queryFn: () => mockViewRepository.getView(viewId!),
    enabled: !!viewId,
  })
}

export function useViewVersionsQuery(viewId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.versions(viewId ?? ''),
    queryFn: () => mockViewRepository.listVersions(viewId!),
    enabled: !!viewId,
  })
}

export function useCreateViewMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateViewInput) => mockViewRepository.createDraft(input),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: QUERY_KEYS.views }) },
  })
}

export function useSaveViewMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ viewId, artifact }: { viewId: string; artifact: ViewArtifact }) =>
      mockViewRepository.saveDraft(viewId, artifact),
    onSuccess: (_data, { viewId }) => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.view(viewId) })
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.views })
    },
  })
}

export function usePublishViewMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (viewId: string) => mockViewRepository.publish(viewId),
    onSuccess: (_data, viewId) => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.view(viewId) })
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.views })
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.versions(viewId) })
    },
  })
}

export function useRollbackViewMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ viewId, versionId }: { viewId: string; versionId: string }) =>
      mockViewRepository.rollback(viewId, versionId),
    onSuccess: (_data, { viewId }) => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.view(viewId) })
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.views })
    },
  })
}
