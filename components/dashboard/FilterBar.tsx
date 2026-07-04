"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import AddLeadDialog from "@/components/leads/AddLeadDialog"

interface FilterBarProps {
  categories: string[]
}

export default function FilterBar({ categories }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [draft, setDraft] = useState({
    search: searchParams.get("search") ?? "",
    status: searchParams.get("status") ?? "all",
    hasWebsite: searchParams.get("hasWebsite") ?? "all",
    category: searchParams.get("category") ?? "all",
    source: searchParams.get("source") ?? "all",
    dateFrom: searchParams.get("dateFrom") ?? "",
    dateTo: searchParams.get("dateTo") ?? "",
  })

  const updateDraft = (key: keyof typeof draft, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const runSearch = () => {
    const params = new URLSearchParams()
    if (draft.search) params.set("search", draft.search)
    if (draft.status !== "all") params.set("status", draft.status)
    if (draft.hasWebsite !== "all") params.set("hasWebsite", draft.hasWebsite)
    if (draft.category !== "all") params.set("category", draft.category)
    if (draft.source !== "all") params.set("source", draft.source)
    if (draft.dateFrom) params.set("dateFrom", draft.dateFrom)
    if (draft.dateTo) params.set("dateTo", draft.dateTo)
    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  const clearFilters = () => {
    setDraft({
      search: "",
      status: "all",
      hasWebsite: "all",
      category: "all",
      source: "all",
      dateFrom: "",
      dateTo: "",
    })
    router.push(pathname)
    router.refresh()
  }

  const hasFilters =
    searchParams.get("search") ||
    searchParams.get("status") ||
    searchParams.get("hasWebsite") ||
    searchParams.get("category") ||
    searchParams.get("source") ||
    searchParams.get("dateFrom") ||
    searchParams.get("dateTo")

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 mb-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 flex-wrap gap-2 min-w-0">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search business name, address..."
              className="pl-9"
              value={draft.search}
              onChange={(e) => updateDraft("search", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
            />
          </div>

          {/* Status filter */}
          <Select value={draft.status} onValueChange={(v) => updateDraft("status", v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="interested">Interested</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>

          {/* Website filter */}
          <Select value={draft.hasWebsite} onValueChange={(v) => updateDraft("hasWebsite", v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Website Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="false">No Website 🎯</SelectItem>
              <SelectItem value="true">Has Website</SelectItem>
            </SelectContent>
          </Select>

          {/* Category filter */}
          <Select value={draft.category} onValueChange={(v) => updateDraft("category", v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Source filter */}
          <Select value={draft.source} onValueChange={(v) => updateDraft("source", v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="google_maps">Google Maps</SelectItem>
              <SelectItem value="manual">Manually Added</SelectItem>
            </SelectContent>
          </Select>

          {/* Date from */}
          <Input
            type="date"
            className="w-[135px]"
            value={draft.dateFrom}
            onChange={(e) => updateDraft("dateFrom", e.target.value)}
          />

          {/* Date to */}
          <Input
            type="date"
            className="w-[135px]"
            value={draft.dateTo}
            onChange={(e) => updateDraft("dateTo", e.target.value)}
          />

          {/* Search button */}
          <Button onClick={runSearch} size="sm" className="gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Search
          </Button>

          {/* Clear */}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-gray-500">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        <AddLeadDialog />
      </div>
    </div>
  )
}
