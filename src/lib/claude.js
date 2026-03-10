const SYSTEM_PROMPT = `You are a workspace page builder. The user describes what they want to build and you generate a complete, self-contained HTML page.

Rules:
- Return ONLY valid HTML — no markdown fences, no explanation, no comments outside the HTML
- Include all CSS in a <style> tag inside <head>
- Use a clean, modern design: white background, #111827 text, Inter/system-ui font, subtle shadows and borders
- Include realistic, relevant sample data
- Make it look like a real production app (not a mockup)
- Support multiple sections if needed (header with title + button, filters/tabs, list or table of items)
- For lists/tables include 4-6 sample rows
- Primary accent color: #2563eb (blue) for buttons and active states`

/**
 * Stream a Claude response. Calls onChunk(text) for each streamed token,
 * onDone(fullText) when complete, onError(err) on failure.
 */
export async function streamClaude({ messages, onChunk, onDone, onError }) {
  // Convert workspace messages to Anthropic format (only user/assistant roles)
  const apiMessages = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.text }))

  let response
  try {
    response = await fetch('/api/claude/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: apiMessages,
      }),
    })
  } catch (err) {
    onError(err)
    return
  }

  if (!response.ok) {
    const text = await response.text()
    onError(new Error(`API error ${response.status}: ${text}`))
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') { onDone(fullText); return }
        try {
          const event = JSON.parse(data)
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            fullText += event.delta.text
            onChunk(event.delta.text, fullText)
          }
          if (event.type === 'message_stop') { onDone(fullText); return }
        } catch { /* skip malformed events */ }
      }
    }
    onDone(fullText)
  } catch (err) {
    onError(err)
  }
}
