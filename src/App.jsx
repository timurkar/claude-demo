import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WorkspaceProvider } from './context/WorkspaceContext'
import LeftMenu from './components/LeftMenu'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import WorkspaceEditor from './pages/WorkspaceEditor'
import WorkspacePreview from './pages/WorkspacePreview'
import './App.css'

function Placeholder({ title }) {
  return (
    <div style={{ padding: '32px 36px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1a1a2e' }}>{title}</h1>
      <p style={{ color: '#6b7280', marginTop: 8 }}>This page is coming soon.</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/preview/:id" element={<WorkspacePreview />} />
        <Route path="/*" element={
          <WorkspaceProvider>
            <div className="app-layout">
              <LeftMenu />
              <main className="app-main">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/workspace/:id" element={<WorkspaceEditor />} />
                  <Route path="/contacts" element={<Placeholder title="Contacts" />} />
                  <Route path="/agents" element={<Placeholder title="Agents" />} />
                  <Route path="/transports" element={<Placeholder title="Transports" />} />
                  <Route path="/payments" element={<Placeholder title="Payments" />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </WorkspaceProvider>
        } />
      </Routes>
    </BrowserRouter>
  )
}
