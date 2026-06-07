"use client"

import { useState } from "react"
import { Copy, CheckCircle, Send } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Lead } from "@/types"
import { getPitchTemplate } from "@/lib/utils"

interface PitchModalProps {
  lead: Lead
  open: boolean
  onClose: () => void
  onSent: (pitchText: string) => void
}

export default function PitchModal({ lead, open, onClose, onSent }: PitchModalProps) {
  const { toast } = useToast()
  const template = getPitchTemplate(lead.category, lead.businessName)

  const [subject, setSubject] = useState(template.subject)
  const [body, setBody] = useState(template.body)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Email copied to clipboard" })
  }

  const handleMarkSent = async () => {
    setSending(true)
    try {
      const pitchText = `Subject: ${subject}\n\n${body}`
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitchSent: pitchText }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Pitch marked as sent" })
      onSent(pitchText)
      onClose()
    } catch {
      toast({ title: "Failed to mark pitch as sent", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Pitch Email — {lead.businessName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1.5 min-h-[340px] font-mono text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleCopy}
              disabled={sending}
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Email
                </>
              )}
            </Button>

            <Button
              className="gap-2"
              onClick={handleMarkSent}
              disabled={sending}
            >
              <Send className="h-4 w-4" />
              {sending ? "Saving..." : "Mark as Sent"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
