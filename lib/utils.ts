import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { LeadStatus, BusinessInfo } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractCity(address: string): string {
  if (!address) return "—"
  const parts = address.split(",")
  return parts.length >= 2 ? parts[parts.length - 2].trim() : address
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    contacted: "bg-yellow-100 text-yellow-700",
    interested: "bg-green-100 text-green-700",
    closed: "bg-teal-100 text-teal-700",
    lost: "bg-red-100 text-red-700",
  }
  return map[status] ?? "bg-gray-100 text-gray-700"
}

export const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "closed", label: "Closed" },
  { value: "lost", label: "Lost" },
]

function buildSignature(biz: BusinessInfo): string {
  const name = biz.ownerName || "[Your Name]"
  const agency = biz.agencyName || ""
  const website = biz.website || "[Your Website]"
  const phone = biz.phone || "[Your Phone]"
  const email = biz.email || ""

  const line1 = agency ? `${name} — ${agency}` : name
  const line2 = [website, phone, email].filter(Boolean).join(" | ")
  return `${line1}\n${line2}`
}

export function getPitchTemplate(
  category: string,
  businessName: string,
  biz: BusinessInfo = {}
): { subject: string; body: string } {
  const cat = category.toLowerCase()
  const sig = buildSignature(biz)

  if (
    cat.includes("cafe") ||
    cat.includes("restaurant") ||
    cat.includes("food") ||
    cat.includes("pizza") ||
    cat.includes("bar") ||
    cat.includes("takeaway")
  ) {
    return {
      subject: `Help ${businessName} Get More Online Orders`,
      body: `Hi ${businessName} Team,

I noticed your restaurant on Google Maps and wanted to reach out. In today's competitive food industry, a strong online presence drives more orders and reservations.

Here's what I can build for you:
• Accept online orders directly (no 30% delivery app commission)
• Show up higher in Google searches for your area
• Display your menu beautifully on mobile
• Build customer loyalty through email sign-ups

I'd love to show you what I've done for similar businesses nearby. Open for a quick 15-minute call this week?

Best regards,
${sig}`,
    }
  }

  if (
    cat.includes("salon") ||
    cat.includes("barber") ||
    cat.includes("beauty") ||
    cat.includes("hair") ||
    cat.includes("nail")
  ) {
    return {
      subject: `Fill Your Appointment Book at ${businessName}`,
      body: `Hi ${businessName} Team,

I came across your salon on Google Maps and wanted to introduce myself. I help salons attract more clients through professional websites with online booking.

Here's what I can do:
• 24/7 online booking so clients never have to call
• Instagram integration to showcase your work
• Google Business optimisation for local rankings
• Review management to build your reputation

Many salons I work with see a 40% increase in bookings within 3 months.

Can we schedule a quick 15-minute call?

Best regards,
${sig}`,
    }
  }

  if (
    cat.includes("gym") ||
    cat.includes("fitness") ||
    cat.includes("yoga") ||
    cat.includes("pilates") ||
    cat.includes("sport")
  ) {
    return {
      subject: `Grow ${businessName}'s Membership with a Professional Website`,
      body: `Hi ${businessName} Team,

I found your studio on Google Maps and noticed you could benefit from a stronger web presence. A professional website significantly boosts membership sign-ups.

I can build:
• Membership sign-up and management
• Class schedules with online booking
• Trainer profiles to showcase your team
• Local SEO to rank for fitness searches in your area

Fitness studios I work with typically grow membership by 25–50%.

Free for a 15-minute call this week?

Best regards,
${sig}`,
    }
  }

  if (
    cat.includes("plumb") ||
    cat.includes("electr") ||
    cat.includes("hvac") ||
    cat.includes("repair") ||
    cat.includes("contrac")
  ) {
    return {
      subject: `Get More Emergency Calls for ${businessName}`,
      body: `Hi ${businessName} Team,

Being the #1 result when someone searches "emergency plumber near me" can mean thousands in extra revenue each month.

I specialise in trade business websites that:
• Rank highly for emergency service searches locally
• Show a prominent click-to-call button on mobile
• Display your certifications and reviews to build trust
• Convert Google Ads traffic efficiently

Homeowners are searching for your services right now — let's make sure they find YOU first.

15-minute call this week?

Best regards,
${sig}`,
    }
  }

  return {
    subject: `Professional Website for ${businessName}`,
    body: `Hi ${businessName} Team,

I came across your business on Google Maps and wanted to get in touch. I help local businesses get more customers through professional, mobile-friendly websites.

A website can:
• Help you show up in Google searches locally
• Make a great first impression on potential customers
• Convert visitors 24/7 even when you're closed
• Build credibility and trust in your community

I work exclusively with local businesses and offer affordable, fast turnaround.

Would you be open to a free 15-minute consultation?

Best regards,
${sig}`,
  }
}
