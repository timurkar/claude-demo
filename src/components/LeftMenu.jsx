import { NavLink } from 'react-router-dom'
import logo from '../assets/logo.svg'
import './LeftMenu.css'

const menuItems = [
  {
    to: '/contacts',
    label: 'Contacts',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: '/agents',
    label: 'Agents',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/transports',
    label: 'Transports',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
  {
    to: '/payments',
    label: 'Payments',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
]

export default function LeftMenu() {
  return (
    <aside className="left-menu">
      <NavLink to="/" className="left-menu__logo">
        <img src={logo} alt="Chatium AI" className="left-menu__logo-icon" />
        <span className="left-menu__logo-label">Chatium AI</span>
      </NavLink>

      <nav className="left-menu__nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `left-menu__item${isActive ? ' left-menu__item--active' : ''}`
            }
          >
            <span className="left-menu__icon">{item.icon}</span>
            <span className="left-menu__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="left-menu__bottom">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `left-menu__item${isActive ? ' left-menu__item--active' : ''}`
          }
        >
          <span className="left-menu__avatar">TK</span>
          <span className="left-menu__label">Admin</span>
        </NavLink>
      </div>
    </aside>
  )
}
