import { useState } from 'react'
import './Profile.css'

const stats = [
  { label: 'Workspaces', value: '6' },
  { label: 'Agents', value: '12' },
  { label: 'Messages', value: '1,284' },
]

const activity = [
  { action: 'Created workspace', target: 'alfa-presentation', time: '2 hours ago' },
  { action: 'Published', target: 'Content Planning and Publishing', time: '1 day ago' },
  { action: 'Updated', target: 'Timur Karimbaev Profile', time: '3 days ago' },
  { action: 'Added agent', target: 'Conference Submission Tracker', time: '5 days ago' },
]

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function Profile() {
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    firstName: 'Timur',
    lastName: 'Karimbaev',
    email: 'timur@karimbaev.com',
    phone: '',
    company: '',
    bio: '',
  })
  const [draft, setDraft] = useState(form)

  const fullName = `${form.firstName} ${form.lastName}`
  const initials = getInitials(fullName)

  function handleEdit() {
    setDraft(form)
    setEditing(true)
    setSaved(false)
  }

  function handleCancel() {
    setEditing(false)
  }

  function handleSave() {
    setForm(draft)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setDraft((d) => ({ ...d, [name]: value }))
  }

  return (
    <div className="profile">
      <div className="profile__header">
        <h1 className="profile__title">Profile</h1>
        {saved && <span className="profile__saved-toast">Changes saved</span>}
      </div>

      <div className="profile__body">
        {/* Identity card */}
        <div className="profile__card profile__identity">
          <div className="profile__avatar">{initials}</div>

          {editing ? (
            <div className="profile__edit-form">
              <div className="profile__edit-row">
                <div className="profile__field">
                  <label className="profile__field-label">First name</label>
                  <input
                    className="profile__input"
                    name="firstName"
                    value={draft.firstName}
                    onChange={handleChange}
                    placeholder="First name"
                  />
                </div>
                <div className="profile__field">
                  <label className="profile__field-label">Last name</label>
                  <input
                    className="profile__input"
                    name="lastName"
                    value={draft.lastName}
                    onChange={handleChange}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div className="profile__edit-row">
                <div className="profile__field">
                  <label className="profile__field-label">Email</label>
                  <input
                    className="profile__input"
                    name="email"
                    type="email"
                    value={draft.email}
                    onChange={handleChange}
                    placeholder="Email address"
                  />
                </div>
                <div className="profile__field">
                  <label className="profile__field-label">Phone</label>
                  <input
                    className="profile__input"
                    name="phone"
                    value={draft.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <div className="profile__field">
                <label className="profile__field-label">Company</label>
                <input
                  className="profile__input"
                  name="company"
                  value={draft.company}
                  onChange={handleChange}
                  placeholder="Company or organization"
                />
              </div>
              <div className="profile__field">
                <label className="profile__field-label">Bio</label>
                <textarea
                  className="profile__input profile__textarea"
                  name="bio"
                  value={draft.bio}
                  onChange={handleChange}
                  placeholder="A short bio about yourself"
                  rows={3}
                />
              </div>
              <div className="profile__edit-actions">
                <button className="btn btn--outline" onClick={handleCancel}>Cancel</button>
                <button className="btn btn--primary-sm" onClick={handleSave}>Save changes</button>
              </div>
            </div>
          ) : (
            <div className="profile__info">
              <h2 className="profile__name">{fullName}</h2>
              <p className="profile__email">{form.email}</p>
              {form.phone && <p className="profile__meta">{form.phone}</p>}
              {form.company && <p className="profile__meta">{form.company}</p>}
              {form.bio && <p className="profile__bio">{form.bio}</p>}
              <div className="profile__badges">
                <span className="badge badge--partner">Partner</span>
                <span className="badge badge--active">Active</span>
              </div>
            </div>
          )}

          {!editing && (
            <button className="btn btn--outline" onClick={handleEdit}>Edit Profile</button>
          )}
        </div>

        <div className="profile__grid">
          <div className="profile__card profile__tokens">
            <div className="profile__card-label">Token Balance</div>
            <div className="profile__token-value">
              <span className="profile__token-icon">⬡</span>
              <span className="profile__token-number">2,434.21</span>
            </div>
            <div className="profile__token-sub">tokens available</div>
            <div className="profile__token-actions">
              <button className="btn btn--primary">Manage Subscription</button>
            </div>
          </div>

          <div className="profile__card profile__stats">
            <div className="profile__card-label">Overview</div>
            <div className="profile__stat-list">
              {stats.map((s) => (
                <div key={s.label} className="profile__stat">
                  <span className="profile__stat-value">{s.value}</span>
                  <span className="profile__stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="profile__card profile__subscription">
            <div className="profile__card-label">Subscription</div>
            <div className="profile__plan">
              <div className="profile__plan-name">Partner Plan</div>
              <div className="profile__plan-status">Active</div>
            </div>
            <ul className="profile__features">
              <li>Unlimited workspaces</li>
              <li>Priority support</li>
              <li>Custom agents</li>
              <li>API access</li>
            </ul>
          </div>
        </div>

        <div className="profile__card profile__activity">
          <div className="profile__card-label">Recent Activity</div>
          <ul className="profile__activity-list">
            {activity.map((item, i) => (
              <li key={i} className="profile__activity-item">
                <div className="profile__activity-dot" />
                <div className="profile__activity-content">
                  <span className="profile__activity-action">{item.action}</span>
                  <span className="profile__activity-target">{item.target}</span>
                </div>
                <span className="profile__activity-time">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
