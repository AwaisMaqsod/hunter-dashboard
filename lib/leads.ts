import { Session } from "next-auth"

/** Team members only see leads they personally added manually or synced from the extension. Admins see everything. */
export function getLeadVisibilityFilter(session: Session): Record<string, unknown> {
  if (session.user.role === "admin") return {}
  return {
    $or: [{ addedBy: session.user.userId }, { syncedBy: session.user.userId }],
  }
}

type PopulatedRef = { _id: unknown; name?: string } | string | null

interface LeanLeadWithPopulatedOwner {
  addedBy: PopulatedRef
  syncedBy: PopulatedRef
  [key: string]: unknown
}

function flattenRef(ref: PopulatedRef): { id: PopulatedRef; name: string | null } {
  if (ref && typeof ref === "object") {
    return { id: String(ref._id), name: ref.name ?? null }
  }
  return { id: ref, name: null }
}

/** Flattens populated `addedBy`/`syncedBy` refs (from `.populate({ path: "...", select: "name" })`) into plain id + name strings for the client. */
export function serializeLeadsWithOwner<T extends LeanLeadWithPopulatedOwner>(leads: T[]) {
  return leads.map((lead) => {
    const addedBy = flattenRef(lead.addedBy)
    const syncedBy = flattenRef(lead.syncedBy)
    return {
      ...lead,
      addedBy: addedBy.id,
      addedByName: addedBy.name,
      syncedBy: syncedBy.id,
      syncedByName: syncedBy.name,
    }
  })
}
