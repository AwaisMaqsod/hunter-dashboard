"use client"

import { useState, useEffect } from "react"
import { Copy, CheckCircle, Send, Mail, Loader2 } from "lucide-react"
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
import { Lead, BusinessInfo } from "@/types"
import { getPitchTemplate } from "@/lib/utils"

interface PitchModalProps {
  lead: Lead
  open: boolean
  onClose: () => void
  onSent: (pitchText: string) => void
}

export default function PitchModal({ lead, open, onClose, onSent }: PitchModalProps) {
  const { toast } = useToast()

  const [biz, setBiz] = useState<BusinessInfo>({})
  const [toEmail, setToEmail] = useState(lead.email ?? "")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendingGmail, setSendingGmail] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!open) return
    setToEmail(lead.email ?? "")
    fetch("/api/settings/business")
      .then((r) => r.json())
      .then((data) => {
        const info: BusinessInfo = data.businessInfo ?? {}
        setBiz(info)
        const tpl = getPitchTemplate(lead.category, lead.businessName, info)
        setSubject(tpl.subject)
        setBody(tpl.body)
        setLoaded(true)
      })
      .catch(() => {
        const tpl = getPitchTemplate(lead.category, lead.businessName)
        setSubject(tpl.subject)
        setBody(tpl.body)
        setLoaded(true)
      })
  }, [open, lead.category, lead.businessName, lead.email])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Email copied to clipboard" })
  }

  // Send via Gmail SMTP directly
  const handleSendGmail = async () => {
    if (!toEmail) {
      toast({ title: "Enter a recipient email address", variant: "destructive" })
      return
    }
    setSendingGmail(true)
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead._id,
          to: toEmail,
          subject,
          body,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to send")
      toast({ title: `Email sent to ${toEmail}` })
      onSent(`Subject: ${subject}\n\n${body}`)
      onClose()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to send email",
        variant: "destructive",
      })
    } finally {
      setSendingGmail(false)
    }
  }

  // Just mark as sent without actually sending
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
      toast({ title: "Marked as sent" })
      onSent(pitchText)
      onClose()
    } catch {
      toast({ title: "Failed to update", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            Pitch Email — {lead.businessName}
          </DialogTitle>
        </DialogHeader>

        {!loaded ? (
          <div className="py-10 text-center text-sm text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            Loading template...
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Missing business info warning */}
            {(!biz.ownerName || !biz.phone) && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                ⚠ Signature uses placeholders —{" "}
                <a href="/settings" className="underline font-medium" target="_blank">
                  fill in your Business Info
                </a>{" "}
                to auto-populate.
              </div>
            )}

            {/* Recipient */}
            <div>
              <Label htmlFor="toEmail">
                To (Recipient Email)
                {!lead.email && (
                  <span className="ml-2 text-xs text-orange-500 font-normal">
                    — no email scraped for this lead
                  </span>
                )}
              </Label>
              <Input
                id="toEmail"
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="recipient@business.com"
                className="mt-1.5"
              />
            </div>

            {/* Subject */}
            <div>
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {/* Body */}
            <div>
              <Label htmlFor="body">Email Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-1.5 min-h-[300px] font-mono text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-1 border-t">
              {/* Primary — send via Gmail */}
              <Button
                className="gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={handleSendGmail}
                disabled={sendingGmail || sending || !toEmail}
              >
                {sendingGmail ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Sending...</>
                ) : (
                  <><Send className="h-4 w-4" />Send via Gmail</>
                )}
              </Button>

              {/* Copy */}
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleCopy}
                disabled={sendingGmail || sending}
              >
                {copied ? (
                  <><CheckCircle className="h-4 w-4 text-green-500" />Copied!</>
                ) : (
                  <><Copy className="h-4 w-4" />Copy Email</>
                )}
              </Button>

              {/* Mark sent without sending */}
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 gap-1"
                onClick={handleMarkSent}
                disabled={sendingGmail || sending}
              >
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Mark as sent (no email)
              </Button>
            </div>

            <p className="text-xs text-gray-400">
              "Send via Gmail" sends from <strong>{process.env.NEXT_PUBLIC_GMAIL_USER || "your configured Gmail"}</strong> and logs it in the activity timeline.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
