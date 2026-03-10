import { createHmac, randomInt } from 'crypto'

const OTP_SECRET = process.env.OTP_SECRET || 'dev-otp-secret-change-in-production'
const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes

function generateOtp() {
  return String(randomInt(100000, 999999))
}

function signToken(email, otp, expiry) {
  const hmac = createHmac('sha256', OTP_SECRET)
  hmac.update(`${email}:${otp}:${expiry}`)
  return hmac.digest('hex')
}

async function sendEmail(to, otp) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'noreply@yourdomain.com'

  if (!apiKey) {
    // Dev mode: log OTP to console
    console.log(`[DEV] OTP for ${to}: ${otp}`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Your login code',
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:420px;margin:0 auto;padding:40px 24px">
          <div style="font-size:13px;font-weight:700;letter-spacing:2px;color:#e05c5c;margin-bottom:24px">PLATFORM</div>
          <h1 style="font-size:24px;font-weight:600;color:#1a1a2e;margin:0 0 8px">Your login code</h1>
          <p style="color:#6b7280;font-size:15px;margin:0 0 32px">Use the code below to sign in. It expires in 10 minutes.</p>
          <div style="background:#f5f6fa;border-radius:12px;padding:24px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:700;color:#1a1a2e;margin-bottom:32px">${otp}</div>
          <p style="color:#9ca3af;font-size:13px;margin:0">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Email send failed: ${body}`)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email } = req.body || {}
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' })
  }

  const otp = generateOtp()
  const expiry = Date.now() + OTP_TTL_MS
  const hmac = signToken(email.toLowerCase(), otp, expiry)

  // token = base64(email:expiry:hmac) — OTP is NOT included
  const token = Buffer.from(JSON.stringify({ email: email.toLowerCase(), expiry, hmac })).toString('base64url')

  try {
    await sendEmail(email, otp)
  } catch (err) {
    console.error('sendEmail error:', err)
    return res.status(502).json({ error: 'Failed to send email' })
  }

  return res.status(200).json({ token })
}
