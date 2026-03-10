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
    const ws = { id, name, slug: id, messages: initMessages, result: null, createdAt: new Date() }
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

  return (
    <WorkspaceContext.Provider value={{ workspaces, createWorkspace, addMessage, updateMessage, setResult, getWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspaces = () => useContext(WorkspaceContext)
