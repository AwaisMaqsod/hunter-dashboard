"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow, format } from "date-fns"
import {
  MapPin,
  Globe,
  Instagram,
  Facebook,
  Phone,
  Mail,
  Star,
  Copy,
  CheckCircle,
  Send,
  Clock,
  RefreshCw,
  MessageSquare,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Lead, LeadStatus } from "@/types"
import { getStatusColor, STATUS_OPTIONS } from "@/lib/utils"
import PitchModal from "./PitchModal"

interface LeadDetailPanelProps {
  lead: Lead | null
  onClose: () => void
  onUpdate: (updated: Lead) => void
}

export default function LeadDetailPanel({ lead, onClose, onUpdate }: LeadDetailPanelProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [localLead, setLocalLead] = useState<Lead | null>(null)
  const [notes, setNotes] = useState("")
  const [noteSaved, setNoteSaved] = useState(false)
  const [pitchOpen, setPitchOpen] = useState(false)
  const notesTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (lead) {
      setLocalLead(lead)
      setNotes(lead.notes)
      setNoteSaved(false)
    }
  }, [lead])

  useEffect(() => {
    if (!localLead || notes === localLead.notes) return
    if (notesTimer.current) clearTimeout(notesTimer.current)
    setNoteSaved(false)
    notesTimer.current = setTimeout(() => {
      saveField("notes", notes)
    }, 1000)
    return () => {
      if (notesTimer.current) clearTimeout(notesTimer.current)
    }
  }, [notes])

  const saveField = async (field: string, value: unknown) => {
    if (!localLead) return
    try {
      const res = await fetch(`/api/leads/${localLead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLocalLead(data.lead)
      onUpdate(data.lead)
      if (field === "notes") setNoteSaved(true)
      router.refresh()
    } catch {
      toast({ title: `Failed to save ${field}`, variant: "destructive" })
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    toast({ title: `${label} copied` })
  }

  const handlePitchSent = (pitchText: string) => {
    if (localLead) {
      const updated = { ...localLead, pitchSent: pitchText }
      setLocalLead(updated)
      onUpdate(updated)
      router.refresh()
    }
  }

  const activityIcon = (action: string) => {
    if (action === "synced_from_extension") return "📥"
    if (action === "status_changed") return "🔄"
    if (action === "pitch_sent") return "📧"
    return "📝"
  }

  if (!localLead) return null

  return (
    <>
      <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto p-0">
          {/* Header */}
          <div className="px-6 py-5 border-b">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{localLead.businessName}</h2>
                {localLead.category && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {localLead.category}
                  </Badge>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5"
                      fill={i < Math.round(localLead.rating) ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {localLead.rating} ({localLead.reviewCount} reviews)
                </p>
              </div>
            </div>

            {/* External links */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {localLead.mapsUrl && (
                <a
                  href={localLead.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <MapPin className="h-3.5 w-3.5" /> Maps
                </a>
              )}
              {localLead.website && (
                <a
                  href={localLead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" /> Website
                </a>
              )}
              {localLead.instagram && (
                <a
                  href={localLead.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-pink-600 hover:underline"
                >
                  <Instagram className="h-3.5 w-3.5" /> Instagram
                </a>
              )}
              {localLead.facebook && (
                <a
                  href={localLead.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-700 hover:underline"
                >
                  <Facebook className="h-3.5 w-3.5" /> Facebook
                </a>
              )}
            </div>
          </div>

          <div className="px-6 py-4 space-y-5">
            {/* Info grid */}
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Address", value: localLead.address, icon: MapPin },
                { label: "Phone", value: localLead.phone, icon: Phone },
                { label: "Email", value: localLead.email, icon: Mail },
                { label: "Website", value: localLead.website, icon: Globe },
              ].map(({ label, value, icon: Icon }) =>
                value ? (
                  <div
                    key={label}
                    className="flex items-start gap-2 group cursor-pointer p-2 rounded-lg hover:bg-gray-50"
                    onClick={() => copyToClipboard(value, label)}
                  >
                    <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm text-gray-800 truncate">{value}</p>
                    </div>
                    <Copy className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 mt-1 shrink-0" />
                  </div>
                ) : null
              )}
            </div>

            {/* Status & Follow-up */}
            <div className="space-y-3 border-t pt-4">
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">Status</Label>
                <Select
                  value={localLead.status}
                  onValueChange={(v) => saveField("status", v as LeadStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">Follow-up Date</Label>
                <Input
                  type="date"
                  value={
                    localLead.followUpDate
                      ? format(new Date(localLead.followUpDate), "yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) =>
                    saveField("followUpDate", e.target.value || null)
                  }
                />
              </div>
            </div>

            {/* Notes */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs text-gray-500">Notes</Label>
                {noteSaved && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Saved
                  </span>
                )}
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this lead..."
                className="min-h-[100px] text-sm"
              />
            </div>

            {/* Pitch */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs text-gray-500">Pitch Email</Label>
                {localLead.pitchSent && (
                  <span className="text-xs text-gray-400">
                    Last sent:{" "}
                    {formatDistanceToNow(new Date(localLead.updatedAt), { addSuffix: true })}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => setPitchOpen(true)}
              >
                <Send className="h-4 w-4" />
                {localLead.pitchSent ? "Resend Pitch Email" : "Generate Pitch Email"}
              </Button>
            </div>

            {/* Activity log */}
            {localLead.activityLog.length > 0 && (
              <div className="border-t pt-4">
                <Label className="text-xs text-gray-500 mb-3 block">Activity Log</Label>
                <div className="space-y-2">
                  {[...localLead.activityLog]
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    )
                    .map((entry, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-base shrink-0">{activityIcon(entry.action)}</span>
                        <div>
                          <span className="text-gray-700">{entry.note}</span>
                          <span className="text-xs text-gray-400 ml-2">
                            {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {pitchOpen && (
        <PitchModal
          lead={localLead}
          open={pitchOpen}
          onClose={() => setPitchOpen(false)}
          onSent={handlePitchSent}
        />
      )}
    </>
  )
}
