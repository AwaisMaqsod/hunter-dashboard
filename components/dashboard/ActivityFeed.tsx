"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { UserPlus, RefreshCw, Send, Trash2, Pencil, ShieldCheck, Activity as ActivityIcon } from "lucide-react"
import { ActivityItem } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"

function activityIcon(action: string) {
  switch (action) {
    case "lead_added_manual":
      return <UserPlus className="h-4 w-4 text-purple-600" />
    case "lead_synced":
      return <RefreshCw className="h-4 w-4 text-blue-600" />
    case "status_changed":
      return <Pencil className="h-4 w-4 text-amber-600" />
    case "pitch_sent":
      return <Send className="h-4 w-4 text-teal-600" />
    case "lead_deleted":
      return <Trash2 className="h-4 w-4 text-red-600" />
    case "user_created":
    case "user_role_changed":
    case "user_status_changed":
      return <ShieldCheck className="h-4 w-4 text-indigo-600" />
    default:
      return <ActivityIcon className="h-4 w-4 text-gray-400" />
  }
}

interface ActivityFeedProps {
  isAdmin: boolean
}

export default function ActivityFeed({ isAdmin }: ActivityFeedProps) {
  const [activity, setActivity] = useState<ActivityItem[] | null>(null)

  useEffect(() => {
    fetch("/api/activity?limit=15")
      .then((r) => r.json())
      .then((data) => setActivity(data.activity ?? []))
      .catch(() => setActivity([]))
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          {isAdmin ? "Team Activity" : "Your Activity"}
        </h2>
      </div>

      {activity === null && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {activity !== null && activity.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">
          No activity yet. Actions on leads and the team will show up here.
        </p>
      )}

      {activity !== null && activity.length > 0 && (
        <div className="space-y-3 max-h-[420px] overflow-y-auto">
          {activity.map((item) => (
            <div key={item._id} className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5 bg-gray-50 rounded-full p-1.5">
                {activityIcon(item.action)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700 truncate">{item.description}</p>
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
