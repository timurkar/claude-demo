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
The page always has a global 'db' object injected before any scripts run. Use it for ALL data rendering.

API:
  db.all('name')         — all rows as array of objects
  db.find('name', fn)    — filtered rows
  db.count('name')       — row count
  db.getTable('name')    — { name, columns, rows }

CRITICAL RULES — read carefully:
1. NEVER hardcode row data as HTML. ALWAYS use db.all() in a <script> block to build rows dynamically.
2. This applies even when YOU are creating the table in the same response — db.all() will work because the data is injected before your script runs.
3. Use document.getElementById / innerHTML or DOM methods to render the rows.

Example of correct pattern when creating + rendering a table:

<body>
  <div id="rows"></div>
  <script>
    var rows = db.all('products');
    var html = rows.map(function(r) {
      return '<tr><td>' + r.id + '</td><td>' + r.name + '</td><td>$' + r.price + '</td></tr>';
    }).join('');
    document.getElementById('rows').innerHTML = '<table>' + html + '</table>';
  </script>
  <script type="application/json" id="__ws_tables__">
  [{"name":"products","columns":[{"name":"id","type":"number"},{"name":"name","type":"text"},{"name":"price","type":"number"}],"rows":[{"id":1,"name":"Widget","price":29},{"id":2,"name":"Gadget","price":49}]}]
  </script>
</body>

When defining tables via __ws_tables__:
- Place the <script type="application/json" id="__ws_tables__"> tag at the very END of <body>, after all other scripts
- Column types: "text", "number", "boolean", "date" (ISO strings like "2024-03-15")
- Include 3-5 realistic sample rows`

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
