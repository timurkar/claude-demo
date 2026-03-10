export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  let upstream
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    })
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }

  const contentType = upstream.headers.get('content-type') || 'application/json'
  res.status(upstream.status).setHeader('Content-Type', contentType)

  if (!upstream.ok) {
    const text = await upstream.text()
    return res.end(text)
  }

  // Stream the SSE response back to the client
  const reader = upstream.body.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(Buffer.from(value))
    }
  } finally {
    res.end()
  }
}
