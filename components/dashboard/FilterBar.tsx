"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useState, useEffect } from "react"
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

  const [search, setSearch] = useState(searchParams.get("search") ?? "")

  useEffect(() => {
    const handler = setTimeout(() => {
      updateParam("search", search || null)
    }, 400)
    return () => clearTimeout(handler)
  }, [search])

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const clearFilters = () => {
    setSearch("")
    router.push(pathname)
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
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 flex-wrap gap-3 min-w-0">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search business name, address..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <Select
          value={searchParams.get("status") ?? "all"}
          onValueChange={(v) => updateParam("status", v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[160px]">
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
        <Select
          value={searchParams.get("hasWebsite") ?? "all"}
          onValueChange={(v) => updateParam("hasWebsite", v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Website Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leads</SelectItem>
            <SelectItem value="false">No Website 🎯</SelectItem>
            <SelectItem value="true">Has Website</SelectItem>
          </SelectContent>
        </Select>

        {/* Category filter */}
        <Select
          value={searchParams.get("category") ?? "all"}
          onValueChange={(v) => updateParam("category", v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[160px]">
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
        <Select
          value={searchParams.get("source") ?? "all"}
          onValueChange={(v) => updateParam("source", v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[160px]">
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
          className="w-[150px]"
          value={searchParams.get("dateFrom") ?? ""}
          onChange={(e) => updateParam("dateFrom", e.target.value || null)}
        />

        {/* Date to */}
        <Input
          type="date"
          className="w-[150px]"
          value={searchParams.get("dateTo") ?? ""}
          onChange={(e) => updateParam("dateTo", e.target.value || null)}
        />

        {/* Clear */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-gray-500">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
        </div>

        <AddLeadDialog />
      </div>
    </div>
  )
}
