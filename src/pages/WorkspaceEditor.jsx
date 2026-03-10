import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWorkspaces } from '../context/WorkspaceContext'
import { streamClaude } from '../lib/claude'
import TableView from '../components/TableView'
import './WorkspaceEditor.css'

let msgIdCounter = 1000
function nextId() { return ++msgIdCounter }

function formatTs(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function parseTablesFromHtml(html) {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const script = doc.getElementById('__ws_tables__')
    if (!script) return []
    const data = JSON.parse(script.textContent)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

// ── Chat message ──────────────────────────────────────────────────────────────
function ChatMessage({ msg }) {
  if (msg.role === 'thinking') {
    return (
      <div className="chat-thinking">
        <div className="chat-thinking__row">
          <span className="chat-thinking__dot" />
          <span className="chat-thinking__label">Thinking…</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`chat-msg chat-msg--${msg.role}`}>
      {msg.role === 'user' && (
        <div className="chat-msg__meta">
          <div className="chat-msg__avatar">TK</div>
          <span className="chat-msg__name">Timur Karimbaev</span>
          <span className="chat-msg__ts">{formatTs(msg.ts)}</span>
        </div>
      )}
      <div className="chat-msg__text">{msg.text}</div>
    </div>
  )
}

// ── Result iframe renderer ────────────────────────────────────────────────────
function ResultFrame({ html, streaming }) {
  const iframeRef = useRef(null)

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = html
    }
  }, [html])

  return (
    <div className="result-frame-wrap">
      {streaming && (
        <div className="result-frame-overlay">
          <div className="result-frame-overlay__bar">
            <span className="result-frame-overlay__dot" />
            Generating…
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="result-frame"
        title="workspace-result"
        sandbox="allow-scripts"
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WorkspaceEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getWorkspace, addMessage, updateMessage, setResult, upsertTable, insertRow, deleteRow, deleteTable } = useWorkspaces()
  const ws = getWorkspace(id)

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState('Result')
  const [viewMode, setViewMode] = useState('desktop')
  const [streamingHtml, setStreamingHtml] = useState('')
  const [error, setError] = useState(null)

  const messagesEndRef = useRef(null)
  const triggeredRef = useRef(false)

  // Auto-trigger if workspace was created with a description
  useEffect(() => {
    if (!triggeredRef.current && ws && ws.messages.length === 1 && ws.messages[0].role === 'user' && !ws.result) {
      triggeredRef.current = true
      callClaude(ws.messages[0].text)
    }
  }, [id]) // eslint-disable-line

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ws?.messages])

  if (!ws) {
    return (
      <div style={{ padding: 32 }}>
        <p>Workspace not found.</p>
        <button onClick={() => navigate('/')}>← Back</button>
      </div>
    )
  }

  const tables = ws.tables || []

  async function callClaude(userText) {
    if (sending) return
    setSending(true)
    setError(null)
    setStreamingHtml('')
    setActiveTab('Result')

    const thinkId = nextId()
    addMessage(id, { id: thinkId, role: 'thinking', ts: new Date() })

    // Build history: user + assistant messages only
    const history = ws.messages.filter((m) => m.role === 'user' || m.role === 'assistant')
    const lastIsCurrentUser =
      history.length > 0 &&
      history[history.length - 1].role === 'user' &&
      history[history.length - 1].text === userText
    const apiMessages = lastIsCurrentUser
      ? history
      : [...history, { role: 'user', text: userText }]

    await streamClaude({
      messages: apiMessages,
      tables,
      onChunk: (_chunk, full) => {
        setStreamingHtml(full)
      },
      onDone: (full) => {
        // Parse any tables the AI defined
        const parsedTables = parseTablesFromHtml(full)
        parsedTables.forEach((t) => upsertTable(id, t))

        const tableMsg = parsedTables.length > 0
          ? ` Created ${parsedTables.length} table${parsedTables.length > 1 ? 's' : ''}: ${parsedTables.map((t) => t.name).join(', ')}.`
          : ''

        updateMessage(id, thinkId, {
          role: 'assistant',
          text: `Here's your workspace. You can ask me to make changes.${tableMsg}`,
          ts: new Date(),
        })
        setResult(id, full)
        setStreamingHtml('')
        setSending(false)
      },
      onError: (err) => {
        updateMessage(id, thinkId, {
          role: 'assistant',
          text: `Error: ${err.message}`,
          ts: new Date(),
        })
        setError(err.message)
        setSending(false)
      },
    })
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    addMessage(id, { id: nextId(), role: 'user', text, ts: new Date() })
    await callClaude(text)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const displayHtml = sending ? streamingHtml : (ws.result || '')

  return (
    <div className="wse">
      {/* ── Left: Chat ── */}
      <div className="wse__chat">
        <div className="wse__chat-header">
          <button className="wse__back" onClick={() => navigate('/')}>‹</button>
          <span className="wse__chat-title">{ws.name}</span>
          <div className="wse__chat-actions">
            <button className="wse__icon-btn" title="Search">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l-3-3"/>
              </svg>
            </button>
            <button className="wse__icon-btn" title="Settings">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
              </svg>
            </button>
            <button className="wse__icon-btn" title="Members">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="wse__messages">
          {ws.messages.length === 0 && (
            <div className="wse__empty">
              <p>Send a message to start building your workspace.</p>
            </div>
          )}
          {ws.messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="wse__input-area">
          <div className="wse__input-tabs">
            <button className="wse__mode-tab wse__mode-tab--active">Code</button>
            <button className="wse__mode-tab">Chat</button>
          </div>
          <div className="wse__input-box">
            <textarea
              className="wse__textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter assistant prompt…"
              rows={3}
              disabled={sending}
            />
            <div className="wse__input-footer">
              <div className="wse__input-tools">
                <button className="wse__tool-btn">🤖 Botan: Basic</button>
              </div>
              <div className="wse__input-right">
                <button className="wse__icon-btn" title="Attach">📎</button>
                <button
                  className={`wse__send-btn${sending || !input.trim() ? ' wse__send-btn--disabled' : ''}`}
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
          {error && <div className="wse__error">⚠ {error}</div>}
          <div className="wse__tokens">
            Tokens left <strong>2434.21</strong>
            <span className="wse__token-icon">⬡</span>
            <a href="#" className="wse__buy-tokens">Buy more tokens</a>
          </div>
        </div>
      </div>

      {/* ── Right: Preview ── */}
      <div className="wse__preview">
        <div className="wse__preview-bar">
          <div className="wse__preview-tabs">
            <button
              className={`wse__preview-tab${activeTab === 'Result' ? ' wse__preview-tab--active' : ''}`}
              onClick={() => setActiveTab('Result')}
            >
              ⊡ Result
            </button>
            <button
              className={`wse__preview-tab${activeTab === 'Code' ? ' wse__preview-tab--active' : ''}`}
              onClick={() => setActiveTab('Code')}
            >
              ‹/› Code
            </button>
            <button
              className={`wse__preview-tab${activeTab === 'Tables' ? ' wse__preview-tab--active' : ''}`}
              onClick={() => setActiveTab('Tables')}
            >
              ⊞ Tables
              {tables.length > 0 && (
                <span className="wse__tab-badge">{tables.length}</span>
              )}
            </button>
            <button className="wse__refresh-btn" title="Reload">↻</button>
          </div>
          <div className="wse__preview-url">
            🔒 {window.location.host}/{ws.slug}
          </div>
          <div className="wse__view-modes">
            {[
              { mode: 'desktop', icon: '🖥' },
              { mode: 'tablet', icon: '📱' },
              { mode: 'mobile', icon: '📲' },
            ].map(({ mode, icon }) => (
              <button
                key={mode}
                className={`wse__view-btn${viewMode === mode ? ' wse__view-btn--active' : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className={`wse__preview-content wse__preview-content--${viewMode}`}>
          {activeTab === 'Result' && (
            displayHtml
              ? <ResultFrame html={displayHtml} streaming={sending} />
              : (
                <div className="wse__preview-empty">
                  <div className="wse__preview-empty-icon">🗂️</div>
                  <p>Send a message to generate your workspace.</p>
                </div>
              )
          )}
          {activeTab === 'Code' && (
            <div className="wse__code-view">
              <pre>{displayHtml || '// No code generated yet'}</pre>
            </div>
          )}
          {activeTab === 'Tables' && (
            <TableView
              tables={tables}
              onDeleteTable={(tableId) => deleteTable(id, tableId)}
              onDeleteRow={(tableId, rowId) => deleteRow(id, tableId, rowId)}
              onInsertRow={(tableId, row) => insertRow(id, tableId, row)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
