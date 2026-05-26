import type { ViewStatus } from '../../../types/ui-studio/index'

const STATUS_CONFIG: Record<ViewStatus, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'tag amber' },
  published: { label: 'Published', cls: 'tag green' },
  needs_attention: { label: 'Needs Attention', cls: 'tag red' },
}

interface ViewStatusBadgeProps {
  status: ViewStatus
}

export function ViewStatusBadge({ status }: ViewStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  return <span className={cfg.cls}>{cfg.label}</span>
}
