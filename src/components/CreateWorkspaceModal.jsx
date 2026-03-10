import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspaces } from '../context/WorkspaceContext'
import './CreateWorkspaceModal.css'

export default function CreateWorkspaceModal({ onClose }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { createWorkspace } = useWorkspaces()
  const navigate = useNavigate()
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    const ws = createWorkspace(name.trim(), description.trim())
    onClose()
    navigate(`/workspace/${ws.id}`)
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">New Workspace</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal__form">
          <div className="modal__field">
            <label className="modal__label">Workspace name</label>
            <input
              ref={nameRef}
              className="modal__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Content Planner, Landing Page…"
            />
          </div>

          <div className="modal__field">
            <label className="modal__label">What do you want to build? <span className="modal__optional">optional</span></label>
            <textarea
              className="modal__input modal__textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you need — the AI will help you build it…"
              rows={4}
            />
          </div>

          <div className="modal__actions">
            <button type="button" className="modal__btn modal__btn--cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal__btn modal__btn--create" disabled={!name.trim()}>
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
