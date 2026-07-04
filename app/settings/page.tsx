"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  Eye, EyeOff, Copy, RefreshCw, CheckCircle, Loader2, Save,
} from "lucide-react"
import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { BusinessInfo } from "@/types"

function CopyField({
  label,
  value,
  placeholder,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (v: string) => void
  type?: string
}) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    toast({ title: `${label} copied` })
  }

  return (
    <div>
      <Label className="text-xs text-gray-500 mb-1.5 block">{label}</Label>
      <div className="flex gap-2">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleCopy}
          disabled={!value}
          title={`Copy ${label}`}
          className={copied ? "border-green-400 text-green-600" : ""}
        >
          {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  // API connection state
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [regenLoading, setRegenLoading] = useState(false)

  // Business info state
  const [biz, setBiz] = useState<BusinessInfo>({
    ownerName: "",
    agencyName: "",
    email: "",
    phone: "",
    website: "",
    tagline: "",
  })
  const [bizSaving, setBizSaving] = useState(false)

  // Account state
  const [displayName, setDisplayName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [accountSaving, setAccountSaving] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setApiKey(session.user.apiKey ?? "")
      setDisplayName(session.user.name ?? "")
    }
  }, [session])

  useEffect(() => {
    fetch("/api/settings/business")
      .then((r) => r.json())
      .then((data) => {
        if (data.businessInfo) setBiz(data.businessInfo)
      })
  }, [])

  const maskedKey = apiKey
    ? `sk-${apiKey.slice(3, 7)}${"•".repeat(24)}${apiKey.slice(-4)}`
    : ""

  const copyApiKey = async () => {
    await navigator.clipboard.writeText(apiKey)
    toast({ title: "API key copied" })
  }

  const regenerateKey = async () => {
    if (!confirm("Regenerating the API key will disconnect your Chrome Extension until updated. Continue?"))
      return
    setRegenLoading(true)
    try {
      const res = await fetch("/api/settings/regenerate-key", { method: "POST" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setApiKey(data.apiKey)
      toast({ title: "API key regenerated. Update your Chrome Extension." })
    } catch {
      toast({ title: "Failed to regenerate key", variant: "destructive" })
    } finally {
      setRegenLoading(false)
    }
  }

  const saveBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    setBizSaving(true)
    try {
      const res = await fetch("/api/settings/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(biz),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Business info saved — pitches will now use your details" })
    } catch {
      toast({ title: "Failed to save", variant: "destructive" })
    } finally {
      setBizSaving(false)
    }
  }

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword && newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" })
      return
    }
    if (newPassword && newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" })
      return
    }
    setAccountSaving(true)
    try {
      const res = await fetch("/api/settings/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed")
      }
      toast({ title: "Account updated" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to save",
        variant: "destructive",
      })
    } finally {
      setAccountSaving(false)
    }
  }

  if (!session) return null

  const syncUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/leads/sync`
      : "/api/leads/sync"

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userName={session.user.name ?? "User"}
        userEmail={session.user.email ?? ""}
        role={session.user.role}
      />

      <main className="flex-1 min-w-0 lg:ml-56 p-5 max-w-3xl">
        <TopBar title="Settings" />

        {/* ── Business Info ─────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Your Business Info</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                These values are automatically injected into every pitch email. Copy any field with the button — works like GHL custom values.
              </p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-1 font-medium shrink-0 ml-4">
              Custom Values
            </span>
          </div>

          <form onSubmit={saveBusiness} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CopyField
                label="Your Full Name"
                value={biz.ownerName ?? ""}
                placeholder="e.g. Awais Maqsood"
                onChange={(v) => setBiz((b) => ({ ...b, ownerName: v }))}
              />
              <CopyField
                label="Agency / Business Name"
                value={biz.agencyName ?? ""}
                placeholder="e.g. Pixel Studio UK"
                onChange={(v) => setBiz((b) => ({ ...b, agencyName: v }))}
              />
              <CopyField
                label="Your Email"
                value={biz.email ?? ""}
                placeholder="e.g. hello@pixelstudio.co.uk"
                type="email"
                onChange={(v) => setBiz((b) => ({ ...b, email: v }))}
              />
              <CopyField
                label="Your Phone"
                value={biz.phone ?? ""}
                placeholder="e.g. +44 7700 900000"
                onChange={(v) => setBiz((b) => ({ ...b, phone: v }))}
              />
              <CopyField
                label="Your Website"
                value={biz.website ?? ""}
                placeholder="e.g. https://pixelstudio.co.uk"
                onChange={(v) => setBiz((b) => ({ ...b, website: v }))}
              />
              <CopyField
                label="Tagline (optional)"
                value={biz.tagline ?? ""}
                placeholder="e.g. Websites for local businesses"
                onChange={(v) => setBiz((b) => ({ ...b, tagline: v }))}
              />
            </div>

            {/* Preview signature */}
            {(biz.ownerName || biz.agencyName) && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 text-xs text-gray-600 font-mono whitespace-pre-line">
                <p className="text-[10px] text-gray-400 mb-1 font-sans">Email signature preview:</p>
                {[
                  biz.agencyName
                    ? `${biz.ownerName || ""} — ${biz.agencyName}`
                    : biz.ownerName || "",
                  [biz.website, biz.phone, biz.email].filter(Boolean).join(" | "),
                ]
                  .filter(Boolean)
                  .join("\n")}
              </div>
            )}

            <Button type="submit" disabled={bizSaving} className="gap-2">
              {bizSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Saving...</>
              ) : (
                <><Save className="h-4 w-4" />Save Business Info</>
              )}
            </Button>
          </form>
        </div>

        {/* ── API Connection ────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Chrome Extension Connection</h2>
          <p className="text-sm text-gray-500 mb-5">
            Connect your Google Maps scraper extension to sync leads automatically.
          </p>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">Sync Endpoint URL</Label>
              <div className="flex gap-2">
                <Input readOnly value={syncUrl} className="font-mono text-sm bg-gray-50 flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(syncUrl)
                    toast({ title: "URL copied" })
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">API Key</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={apiKeyVisible ? apiKey : maskedKey}
                  className="font-mono text-sm bg-gray-50 flex-1"
                />
                <Button variant="outline" size="icon" onClick={() => setApiKeyVisible(!apiKeyVisible)}>
                  {apiKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={copyApiKey}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
              onClick={regenerateKey}
              disabled={regenLoading}
            >
              {regenLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Regenerate API Key
            </Button>

            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 border border-blue-100">
              <p className="font-medium mb-1">Extension Setup</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700 text-xs">
                <li>Open your Chrome Extension settings</li>
                <li>Paste the Sync Endpoint URL above</li>
                <li>Paste your API Key above</li>
                <li>Save — leads sync automatically on scrape</li>
              </ol>
            </div>
          </div>
        </div>

        {/* ── Account ───────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Account</h2>
          <p className="text-sm text-gray-500 mb-5">Update your login name and password.</p>

          <form onSubmit={saveAccount} className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <hr className="my-2" />
            <p className="text-sm font-medium text-gray-700">Change Password</p>

            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Leave blank to keep unchanged"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <Button type="submit" disabled={accountSaving} className="gap-2">
              {accountSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Saving...</>
              ) : (
                <><CheckCircle className="h-4 w-4" />Save Changes</>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
