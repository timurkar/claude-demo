import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const [step, setStep] = useState('email') // 'email' | 'otp'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const otpRefs = useRef([])
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  async function handleSendOtp(e) {
    e?.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send code')
      setToken(data.token)
      setStep('otp')
      setResendCooldown(30)
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleOtpChange(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
    if (next.every((d) => d !== '')) {
      verifyOtp(next.join(''))
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const next = pasted.split('')
      setOtp(next)
      otpRefs.current[5]?.focus()
      verifyOtp(pasted)
    }
  }

  async function verifyOtp(code) {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, otp: code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid code')
      login(data.sessionToken, data.email)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    setStep('email')
    setOtp(['', '', '', '', '', ''])
    setError('')
    setToken('')
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__logo">
          <div className="login__logo-icon">P</div>
          <span className="login__logo-label">PLATFORM</span>
        </div>

        {step === 'email' ? (
          <>
            <h1 className="login__title">Sign in</h1>
            <p className="login__subtitle">Enter your email and we'll send you a login code.</p>

            <form className="login__form" onSubmit={handleSendOtp}>
              <div className="login__field">
                <label className="login__label">Email address</label>
                <input
                  className="login__input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {error && <p className="login__error">{error}</p>}

              <button className="login__btn" type="submit" disabled={loading || !email}>
                {loading ? 'Sending…' : 'Send login code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="login__title">Check your email</h1>
            <p className="login__subtitle">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>

            <div className="login__otp-row" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  className="login__otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  disabled={loading}
                />
              ))}
            </div>

            {error && <p className="login__error">{error}</p>}

            {loading && <p className="login__hint">Verifying…</p>}

            <div className="login__actions">
              <button className="login__link" onClick={handleBack} disabled={loading}>
                Change email
              </button>
              <button
                className="login__link"
                onClick={handleSendOtp}
                disabled={loading || resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
