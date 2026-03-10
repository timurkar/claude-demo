import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspaces } from '../context/WorkspaceContext'
import CreateWorkspaceModal from '../components/CreateWorkspaceModal'
import './Dashboard.css'

const channels = [
  { name: 'Чат Авито с AI', sub: 'Трафик с агентом', color: '#e05c5c' },
  { name: 'Курс: Вайбкодинг', sub: 'Фан-клуб', color: '#e8a83e' },
  { name: 'Менеджер Авито', sub: 'Помощь с рекламой', color: '#e8a83e' },
  { name: 'Документы', sub: 'Всё про Чати', color: '#b83eb8' },
]

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false)
  const { workspaces } = useWorkspaces()
  const navigate = useNavigate()

  return (
    <div className="dashboard">
      {showModal && <CreateWorkspaceModal onClose={() => setShowModal(false)} />}

      <div className="dashboard__greeting">
        <span className="dashboard__wave">👋</span>
        <h1 className="dashboard__hello">Hello, Timur Karimbaev!</h1>
      </div>

      <div className="dashboard__meta">
        <div className="dashboard__tokens">
          You have <strong>2434.21</strong>
          <span className="dashboard__token-icon">⬡</span> tokens.
        </div>
        <button className="dash-btn dash-btn--outline">Manage subscription</button>
        <button className="dash-btn dash-btn--outline">Partner</button>
      </div>

      <div className="dashboard__channels">
        {channels.map((ch) => (
          <div key={ch.name} className="dashboard__channel" style={{ background: ch.color }}>
            <div className="dashboard__channel-name">{ch.name}</div>
            <div className="dashboard__channel-sub">{ch.sub}</div>
          </div>
        ))}
        <button className="dashboard__channel-arrow">›</button>
      </div>

      <div className="dashboard__ws-header">
        <div className="dashboard__ws-tabs">
          <button className="ws-tab ws-tab--active">Workspaces</button>
          <button className="ws-tab">Templates</button>
          <button className="ws-tab">Gallery</button>
          <button className="ws-tab">Education</button>
        </div>
        <div className="dashboard__search">
          <input type="text" placeholder="Search..." className="dashboard__search-input" />
        </div>
        <button className="dash-btn dash-btn--primary" onClick={() => setShowModal(true)}>+ Workspace</button>
        <button className="dash-btn dash-btn--outline">⊞ Collection</button>
      </div>

      <div className="dashboard__workspace-list">
        {workspaces.length === 0 ? (
          <div className="dashboard__ws-empty">
            <p>No workspaces yet.</p>
            <button className="dash-btn dash-btn--primary" onClick={() => setShowModal(true)}>
              + Create your first workspace
            </button>
          </div>
        ) : (
          workspaces.map((ws, i) => (
            <div
              key={ws.id}
              className={`dashboard__ws-item${i === 0 ? ' dashboard__ws-item--active' : ''}`}
              onClick={() => navigate(`/workspace/${ws.id}`)}
            >
              <span className="dashboard__ws-name">{ws.name}</span>
              {ws.result && <span className="ws-tag ws-tag--public">Ready</span>}
              <span className="dashboard__ws-slug">{ws.slug}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
