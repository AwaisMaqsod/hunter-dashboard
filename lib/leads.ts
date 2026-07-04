import { Session } from "next-auth"

/** Team members see Google-Maps-scraped leads (shared pool) plus only the leads they manually added. Admins see everything. */
export function getLeadVisibilityFilter(session: Session): Record<string, unknown> {
  if (session.user.role === "admin") return {}
  return {
    $or: [{ source: "google_maps" }, { addedBy: session.user.userId }],
  }
}

interface LeanLeadWithPopulatedOwner {
  addedBy: { _id: unknown; name?: string } | string | null
  [key: string]: unknown
}

/** Flattens a populated `addedBy` (from `.populate({ path: "addedBy", select: "name" })`) into `addedBy`/`addedByName` strings for the client. */
export function serializeLeadsWithOwner<T extends LeanLeadWithPopulatedOwner>(leads: T[]) {
  return leads.map((lead) => {
    const addedByDoc = lead.addedBy as { _id: unknown; name?: string } | null
    return {
      ...lead,
      addedBy: addedByDoc && typeof addedByDoc === "object" ? String(addedByDoc._id) : addedByDoc,
      addedByName: addedByDoc && typeof addedByDoc === "object" ? addedByDoc.name ?? null : null,
    }
  })
}
