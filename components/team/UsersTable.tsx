"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Trash2, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { TeamUser } from "@/types"

interface UsersTableProps {
  users: TeamUser[]
  currentUserId: string
}

export default function UsersTable({ users, currentUserId }: UsersTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)

  const patchUser = async (id: string, body: Record<string, unknown>, successMsg: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to update user")
      toast({ title: successMsg })
      router.refresh()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (user: TeamUser) => {
    if (!confirm(`Delete ${user.name}'s account? This cannot be undone.`)) return
    setBusyId(user._id)
    try {
      const res = await fetch(`/api/users/${user._id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to delete user")
      toast({ title: `${user.name}'s account deleted` })
      router.refresh()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Leads Added</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Last Active</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => {
              const isSelf = user._id === currentUserId
              const isBusy = busyId === user._id
              return (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {user.name}
                      {isSelf && <span className="text-xs text-gray-400 ml-1.5">(you)</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={user.role}
                      disabled={isBusy}
                      onValueChange={(v) =>
                        patchUser(user._id, { role: v }, `${user.name}'s role changed to ${v}`)
                      }
                    >
                      <SelectTrigger className="w-[110px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      disabled={isBusy || isSelf}
                      onClick={() =>
                        patchUser(
                          user._id,
                          { isActive: !user.isActive },
                          `${user.name} ${user.isActive ? "deactivated" : "activated"}`
                        )
                      }
                      className="disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Badge
                        variant="outline"
                        className={
                          user.isActive
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{user.leadsAdded}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                    {user.lastActiveAt
                      ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600 disabled:opacity-40"
                      disabled={isSelf || isBusy}
                      onClick={() => handleDelete(user)}
                    >
                      {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </td>
                </tr>
              )
            })}

            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center text-gray-400">
                  No team members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
