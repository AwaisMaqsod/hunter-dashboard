"use client"

import { useState } from "react"
import { Trash2, Download, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Lead, LeadStatus } from "@/types"
import { useRouter } from "next/navigation"

interface BulkActionsProps {
  selectedIds: string[]
  leads: Lead[]
  onClear: () => void
}

export default function BulkActions({ selectedIds, leads, onClear }: BulkActionsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleBulkStatusChange = async (status: LeadStatus) => {
    setLoading(true)
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/leads/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          })
        )
      )
      toast({ title: `Updated ${selectedIds.length} leads to "${status}"` })
      onClear()
      router.refresh()
    } catch {
      toast({ title: "Failed to update leads", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} leads? This cannot be undone.`)) return
    setLoading(true)
    try {
      await Promise.all(
        selectedIds.map((id) => fetch(`/api/leads/${id}`, { method: "DELETE" }))
      )
      toast({ title: `Deleted ${selectedIds.length} leads` })
      onClear()
      router.refresh()
    } catch {
      toast({ title: "Failed to delete leads", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    const selected = leads.filter((l) => selectedIds.includes(l._id))
    const headers = [
      "Business Name",
      "Category",
      "Address",
      "Phone",
      "Email",
      "Website",
      "Rating",
      "Status",
      "Notes",
      "Follow Up Date",
      "Created At",
    ]
    const rows = selected.map((l) => [
      `"${l.businessName}"`,
      `"${l.category}"`,
      `"${l.address}"`,
      `"${l.phone}"`,
      `"${l.email ?? ""}"`,
      `"${l.website ?? ""}"`,
      l.rating,
      l.status,
      `"${l.notes}"`,
      l.followUpDate ? new Date(l.followUpDate).toLocaleDateString() : "",
      new Date(l.createdAt).toLocaleDateString(),
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `leads-export-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: `Exported ${selected.length} leads` })
  }

  return (
    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
      <span className="text-sm font-medium text-blue-700">
        {selectedIds.length} lead{selectedIds.length !== 1 ? "s" : ""} selected
      </span>

      <div className="flex items-center gap-2 ml-auto">
        <Select onValueChange={(v) => handleBulkStatusChange(v as LeadStatus)} disabled={loading}>
          <SelectTrigger className="w-[160px] h-8 text-xs bg-white">
            <SelectValue placeholder="Change Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="interested">Interested</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-xs"
          onClick={handleExportCSV}
          disabled={loading}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>

        <Button
          size="sm"
          variant="destructive"
          className="h-8 gap-1 text-xs"
          onClick={handleBulkDelete}
          disabled={loading}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>

        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onClear}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
