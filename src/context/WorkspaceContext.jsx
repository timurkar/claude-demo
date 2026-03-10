import { createContext, useContext, useState, useCallback } from 'react'

const WorkspaceContext = createContext(null)
const STORAGE_KEY = 'chatium_workspaces'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(workspaces) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces))
  } catch {}
}

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState(load)

  function update(fn) {
    setWorkspaces((prev) => {
      const next = fn(prev)
      save(next)
      return next
    })
  }

  const createWorkspace = useCallback((name, description) => {
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const initMessages = description
      ? [{ id: 1, role: 'user', text: description, ts: new Date() }]
      : []
    const ws = { id, name, slug: id, messages: initMessages, result: null, tables: [], createdAt: new Date() }
    update((prev) => [ws, ...prev])
    return ws
  }, []) // eslint-disable-line

  const addMessage = useCallback((wsId, msg) => {
    update((prev) =>
      prev.map((ws) => ws.id === wsId ? { ...ws, messages: [...ws.messages, msg] } : ws)
    )
  }, []) // eslint-disable-line

  const updateMessage = useCallback((wsId, msgId, patch) => {
    update((prev) =>
      prev.map((ws) =>
        ws.id === wsId
          ? { ...ws, messages: ws.messages.map((m) => m.id === msgId ? { ...m, ...patch } : m) }
          : ws
      )
    )
  }, []) // eslint-disable-line

  const setResult = useCallback((wsId, result) => {
    update((prev) =>
      prev.map((ws) => ws.id === wsId ? { ...ws, result } : ws)
    )
  }, []) // eslint-disable-line

  const getWorkspace = useCallback((id) => workspaces.find((ws) => ws.id === id), [workspaces])

  // ── Tables ──────────────────────────────────────────────────────────────────

  // Create or replace a table by name (used when AI generates tables)
  const upsertTable = useCallback((wsId, tableData) => {
    update((prev) =>
      prev.map((ws) => {
        if (ws.id !== wsId) return ws
        const tables = ws.tables || []
        const rows = (tableData.rows || []).map((r) => ({ _id: genId(), ...r }))
        const existingIdx = tables.findIndex((t) => t.name === tableData.name)
        if (existingIdx >= 0) {
          const updated = [...tables]
          updated[existingIdx] = { id: tables[existingIdx].id, ...tableData, rows }
          return { ...ws, tables: updated }
        }
        return { ...ws, tables: [...tables, { id: genId(), ...tableData, rows }] }
      })
    )
  }, []) // eslint-disable-line

  const insertRow = useCallback((wsId, tableId, row) => {
    update((prev) =>
      prev.map((ws) => {
        if (ws.id !== wsId) return ws
        return {
          ...ws,
          tables: (ws.tables || []).map((t) =>
            t.id === tableId ? { ...t, rows: [...t.rows, { _id: genId(), ...row }] } : t
          ),
        }
      })
    )
  }, []) // eslint-disable-line

  const deleteRow = useCallback((wsId, tableId, rowId) => {
    update((prev) =>
      prev.map((ws) => {
        if (ws.id !== wsId) return ws
        return {
          ...ws,
          tables: (ws.tables || []).map((t) =>
            t.id === tableId ? { ...t, rows: t.rows.filter((r) => r._id !== rowId) } : t
          ),
        }
      })
    )
  }, []) // eslint-disable-line

  const deleteTable = useCallback((wsId, tableId) => {
    update((prev) =>
      prev.map((ws) => {
        if (ws.id !== wsId) return ws
        return { ...ws, tables: (ws.tables || []).filter((t) => t.id !== tableId) }
      })
    )
  }, []) // eslint-disable-line

  return (
    <WorkspaceContext.Provider value={{
      workspaces, createWorkspace, addMessage, updateMessage, setResult, getWorkspace,
      upsertTable, insertRow, deleteRow, deleteTable,
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspaces = () => useContext(WorkspaceContext)
