"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import {
  Globe,
  Eye,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { Lead, LeadStatus } from "@/types"
import { getStatusColor, extractCity, STATUS_OPTIONS } from "@/lib/utils"
import LeadDetailPanel from "./LeadDetailPanel"
import BulkActions from "./BulkActions"

interface LeadsTableProps {
  leads: Lead[]
  total: number
  page: number
  totalPages: number
  currentUserId?: string
  role?: "admin" | "team"
}

export default function LeadsTable({
  leads,
  total,
  page,
  totalPages,
  currentUserId,
  role,
}: LeadsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads)

  // Keep localLeads in sync when server-side props change
  useState(() => {
    setLocalLeads(leads)
  })

  const allSelected = localLeads.length > 0 && selectedIds.length === localLeads.length

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : localLeads.map((l) => l._id))
  }

  const toggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLocalLeads((prev) => prev.map((l) => (l._id === leadId ? data.lead : l)))
      if (selectedLead?._id === leadId) setSelectedLead(data.lead)
      toast({ title: `Status updated to "${status}"` })
      router.refresh()
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" })
    }
  }

  const handleLeadUpdate = (updated: Lead) => {
    setLocalLeads((prev) => prev.map((l) => (l._id === updated._id ? updated : l)))
    if (selectedLead?._id === updated._id) setSelectedLead(updated)
  }

  const start = (page - 1) * 25 + 1
  const end = Math.min(page * 25, total)

  return (
    <>
      {selectedIds.length > 0 && (
        <BulkActions
          selectedIds={selectedIds}
          leads={localLeads}
          onClear={() => setSelectedIds([])}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Location</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Website</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Follow-up</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {localLeads.map((lead) => (
                <tr
                  key={lead._id}
                  className={`hover:bg-gray-50 transition-colors ${
                    !lead.hasWebsite ? "border-l-2 border-l-orange-400" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedIds.includes(lead._id)}
                      onCheckedChange={() => toggleRow(lead._id)}
                      aria-label={`Select ${lead.businessName}`}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <button
                      className="text-left"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <p className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                        {lead.businessName}
                      </p>
                      {lead.category && (
                        <span className="text-xs text-gray-400">{lead.category}</span>
                      )}
                    </button>
                  </td>

                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {extractCity(lead.address)}
                  </td>

                  <td className="px-4 py-3 hidden md:table-cell">
                    {lead.source === "manual" ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex w-fit items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                          {lead.platform ?? "Manual"}
                        </span>
                        {(role === "admin" || lead.addedBy !== currentUserId) && lead.addedByName && (
                          <span className="text-[11px] text-gray-400">
                            by {lead.addedBy === currentUserId ? "you" : lead.addedByName}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex w-fit items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        🗺️ Maps
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-col gap-0.5">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-1 text-gray-600 hover:text-blue-600 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </a>
                      )}
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          className="flex items-center gap-1 text-gray-600 hover:text-blue-600 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </a>
                      )}
                      {!lead.phone && !lead.email && (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 hidden lg:table-cell">
                    {lead.hasWebsite ? (
                      <a
                        href={lead.website ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="h-3 w-3" />
                        Website
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                        🎯 No Website
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer ${getStatusColor(lead.status)}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {STATUS_OPTIONS.map((opt) => (
                          <DropdownMenuItem
                            key={opt.value}
                            onClick={() => handleStatusChange(lead._id, opt.value)}
                            className={lead.status === opt.value ? "font-semibold" : ""}
                          >
                            {opt.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>

                  <td className="px-4 py-3 text-gray-500 text-xs hidden xl:table-cell">
                    {lead.followUpDate
                      ? format(new Date(lead.followUpDate), "MMM d, yyyy")
                      : "—"}
                  </td>

                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <Eye className="h-4 w-4 text-gray-400" />
                    </Button>
                  </td>
                </tr>
              ))}

              {localLeads.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-gray-400">
                    No leads found. Adjust your filters or sync from the extension.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {start}–{end} of {total.toLocaleString()} leads
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                  return (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => goToPage(p)}
                    >
                      {p}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <LeadDetailPanel
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={handleLeadUpdate}
      />
    </>
  )
}
