import { useState } from 'react'
import { Upload } from 'lucide-react'
import { usePublishViewMutation } from '../../../hooks/ui-studio/useUIStudioViewsQuery'
import { useUIStudioEditorStore } from '../../../hooks/ui-studio/useUIStudioEditorStore'
import type { ViewArtifact } from '../../../types/ui-studio/index'

interface PublishButtonProps {
  artifact: ViewArtifact
  viewId: string
  onPublished: () => void
}

export function PublishButton({ artifact, viewId, onPublished }: PublishButtonProps) {
  const publishMutation = usePublishViewMutation()
  const { isDirty } = useUIStudioEditorStore()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isPublishedAndClean = artifact.status === 'published' && !isDirty

  async function handlePublish() {
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      const result = await publishMutation.mutateAsync(viewId)
      if (result.success) {
        setSuccessMsg(`Published as v${result.version}`)
        setTimeout(() => setSuccessMsg(null), 3000)
        onPublished()
      } else {
        setErrorMsg(result.errors[0]?.message ?? 'Publish failed')
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Publish failed')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <button
        className="btn btn-primary btn-sm"
        onClick={handlePublish}
        disabled={isPublishedAndClean || publishMutation.isPending}
        type="button"
        style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center' }}
      >
        <Upload size={13} />
        {publishMutation.isPending ? 'Publishing…' : 'Publish'}
      </button>

      {successMsg && (
        <div style={{
          fontSize: '11.5px', color: '#16a34a',
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 'var(--radius-sm)', padding: '4px 8px',
        }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{
          fontSize: '11.5px', color: '#dc2626',
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 'var(--radius-sm)', padding: '4px 8px',
        }}>
          {errorMsg}
        </div>
      )}
    </div>
  )
}
