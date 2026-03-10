const SYSTEM_PROMPT = `You are a workspace page builder with database capabilities. The user describes what they want to build and you generate a complete, self-contained HTML page.

Rules:
- Return ONLY valid HTML — no markdown fences, no explanation, no comments outside the HTML
- Include all CSS in a <style> tag inside <head>
- Use a clean, modern design: white background, #111827 text, Inter/system-ui font, subtle shadows and borders
- Include realistic, relevant sample data
- Make it look like a real production app (not a mockup)
- Support multiple sections if needed (header with title + button, filters/tabs, list or table of items)
- For lists/tables include 4-6 sample rows
- Primary accent color: #2563eb (blue) for buttons and active states

Tables / Database:
- The generated HTML page always has access to a global 'db' object with live workspace table data:
  - db.all('table_name') — returns all rows as an array of objects
  - db.find('table_name', fn) — returns filtered rows, e.g. db.find('products', r => r.price > 100)
  - db.getTable('table_name') — returns { name, columns, rows }
  - db.count('table_name') — returns row count
- When existing tables are available in context, ALWAYS use db.all(...) inside a <script> block to render real data dynamically instead of hardcoding rows
- When creating new tables, include a <script type="application/json" id="__ws_tables__"> tag at the very end of <body>:
[
  {
    "name": "table_name",
    "columns": [
      { "name": "column_name", "type": "text|number|boolean|date" }
    ],
    "rows": [
      { "column_name": value }
    ]
  }
]
- Column types: "text" (strings), "number" (integers or floats), "boolean" (true/false), "date" (ISO date strings like "2024-03-15")
- Include 3-5 realistic sample rows per new table
- When rendering table data, use a <script> block that calls db.all() and builds DOM dynamically so it always reflects current workspace data`

/**
 * Stream a Claude response. Calls onChunk(text) for each streamed token,
 * onDone(fullText) when complete, onError(err) on failure.
 * Pass tables[] to inject existing workspace table context into the system prompt.
 */
export async function streamClaude({ messages, tables = [], onChunk, onDone, onError }) {
  // Convert workspace messages to Anthropic format (only user/assistant roles)
  const apiMessages = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.text }))

  let system = SYSTEM_PROMPT
  if (tables.length > 0) {
    system += '\n\nExisting tables in this workspace:\n' + JSON.stringify(
      tables.map((t) => ({ name: t.name, columns: t.columns, rowCount: t.rows.length })),
      null, 2
    )
  }

  let response
  try {
    response = await fetch('/api/claude/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        stream: true,
        system,
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
