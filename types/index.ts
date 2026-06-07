export type LeadStatus = "new" | "contacted" | "interested" | "closed" | "lost"

export interface ActivityEntry {
  action: string
  note: string
  timestamp: string
}

export interface Lead {
  _id: string
  businessName: string
  category: string
  address: string
  phone: string
  website: string | null
  email: string | null
  instagram: string | null
  facebook: string | null
  rating: number
  reviewCount: number
  mapsUrl: string
  hasWebsite: boolean
  status: LeadStatus
  notes: string
  pitchSent: string | null
  followUpDate: string | null
  searchKeyword: string
  syncedFromExtension: boolean
  isDeleted: boolean
  activityLog: ActivityEntry[]
  createdAt: string
  updatedAt: string
}

export interface LeadsResponse {
  leads: Lead[]
  total: number
  page: number
  totalPages: number
}

export interface FilterParams {
  page?: number
  limit?: number
  status?: string
  hasWebsite?: string
  category?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: string
}

export interface StatsData {
  totalLeads: number
  hotLeads: number
  contacted: number
  closed: number
  lastSyncedAt: string | null
}

export interface AnalyticsData {
  leadsPerDay: { date: string; count: number }[]
  byStatus: { status: string; count: number }[]
  byCategory: { category: string; count: number }[]
  conversionFunnel: {
    new: number
    contacted: number
    interested: number
    closed: number
  }
  totalRevenue: number
}

export interface SyncResult {
  success: boolean
  inserted: number
  updated: number
  errors: number
}
