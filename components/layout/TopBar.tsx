import { formatDistanceToNow } from "date-fns"
import { RefreshCw } from "lucide-react"

interface TopBarProps {
  title: string
  lastSyncedAt?: string | null
}

export default function TopBar({ title, lastSyncedAt }: TopBarProps) {
  const syncText = lastSyncedAt
    ? `Last synced: ${formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}`
    : "Never synced"

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <RefreshCw className="h-3.5 w-3.5" />
        <span>{syncText}</span>
      </div>
    </div>
  )
}
