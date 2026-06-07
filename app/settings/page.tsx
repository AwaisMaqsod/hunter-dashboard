"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Eye, EyeOff, Copy, RefreshCw, CheckCircle, Loader2 } from "lucide-react"
import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [regenLoading, setRegenLoading] = useState(false)

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

  const maskedKey = apiKey
    ? `sk-${apiKey.slice(3, 7)}${"*".repeat(24)}${apiKey.slice(-4)}`
    : ""

  const copyApiKey = async () => {
    await navigator.clipboard.writeText(apiKey)
    toast({ title: "API key copied to clipboard" })
  }

  const regenerateKey = async () => {
    if (
      !confirm(
        "Regenerating the API key will disconnect your Chrome Extension until you update it. Continue?"
      )
    )
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

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword && newPassword !== confirmPassword) {
      toast({ title: "New passwords do not match", variant: "destructive" })
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
      toast({ title: "Account settings saved" })
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
      />

      <main className="flex-1 lg:ml-64 p-6 max-w-3xl">
        <TopBar title="Settings" />

        {/* API Connection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Chrome Extension Connection</h2>
          <p className="text-sm text-gray-500 mb-5">
            Use these credentials to connect your Google Maps scraper extension.
          </p>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">Sync Endpoint URL</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={syncUrl} className="font-mono text-sm bg-gray-50" />
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
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={apiKeyVisible ? apiKey : maskedKey}
                  className="font-mono text-sm bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setApiKeyVisible(!apiKeyVisible)}
                >
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
              {regenLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Regenerate API Key
            </Button>

            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 border border-blue-100">
              <p className="font-medium mb-1">Extension Setup</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Go to Settings page in your Chrome Extension</li>
                <li>Enter the Sync Endpoint URL above</li>
                <li>Enter your API Key above</li>
                <li>Click Save — leads will now sync automatically</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Account</h2>
          <p className="text-sm text-gray-500 mb-5">Update your name and password.</p>

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
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
