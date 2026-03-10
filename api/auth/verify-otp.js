import { createHmac, timingSafeEqual } from 'crypto'

const OTP_SECRET = process.env.OTP_SECRET || 'dev-otp-secret-change-in-production'
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret-change-in-production'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function expectedHmac(email, otp, expiry) {
  const hmac = createHmac('sha256', OTP_SECRET)
  hmac.update(`${email}:${otp}:${expiry}`)
  return hmac.digest('hex')
}

function createSessionToken(email) {
  const payload = Buffer.from(
    JSON.stringify({ email, iat: Date.now(), exp: Date.now() + SESSION_TTL_MS })
  ).toString('base64url')

  const sig = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { token, otp } = req.body || {}
  if (!token || !otp) {
    return res.status(400).json({ error: 'token and otp are required' })
  }

  let parsed
  try {
    parsed = JSON.parse(Buffer.from(token, 'base64url').toString())
  } catch {
    return res.status(400).json({ error: 'Invalid token' })
  }

  const { email, expiry, hmac: storedHmac } = parsed

  if (!email || !expiry || !storedHmac) {
    return res.status(400).json({ error: 'Invalid token' })
  }

  if (Date.now() > expiry) {
    return res.status(400).json({ error: 'Code expired. Please request a new one.' })
  }

  const computed = expectedHmac(email, otp.trim(), expiry)

  // Constant-time comparison to prevent timing attacks
  const valid = timingSafeEqual(
    Buffer.from(computed, 'hex'),
    Buffer.from(storedHmac, 'hex')
  )

  if (!valid) {
    return res.status(400).json({ error: 'Invalid code' })
  }

  const sessionToken = createSessionToken(email)
  return res.status(200).json({ sessionToken, email })
}
