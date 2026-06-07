import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendPitchEmail({
  to,
  subject,
  body,
  fromName,
}: {
  to: string
  subject: string
  body: string
  fromName?: string
}) {
  const from = fromName
    ? `"${fromName}" <${process.env.GMAIL_USER}>`
    : process.env.GMAIL_USER

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: body,
    // Plain text — pitch emails look more personal as plain text
  })

  return info
}

export function isGmailConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
}
