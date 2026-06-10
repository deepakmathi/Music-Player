import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/categories', label: 'Categories', icon: '🎸' },
  { to: '/admin', label: 'Admin Guide', icon: '⚙️' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">🎵</span>
        <span className="logo-text">MusicPlayer</span>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-section-label">MENU</p>
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end={to === '/'}
          >
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="sidebar-footer-text">Static Music Player</p>
        <p className="sidebar-footer-sub">Hosted on Netlify</p>
      </div>
    </aside>
  )
}
