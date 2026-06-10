import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { navItems } from '../navigation'
import Logo from './Logo'

const gearIcon = (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

export default function AppLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="app-shell">
      {/* Menu lateral (desktop/tablet) */}
      <aside className="sidebar">
        <Logo size={46} className="sidebar-brand" />

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link--active' : 'nav-link'
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/empresa"
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link--active' : 'nav-link'
            }
          >
            <span className="nav-icon">{gearIcon}</span>
            <span className="nav-label">Minha empresa</span>
          </NavLink>
          <div className="sidebar-user" title={user?.email ?? ''}>
            {user?.email}
          </div>
          <button type="button" className="btn-ghost" onClick={() => signOut()}>
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="content-area">
        <header className="topbar">
          <Logo size={34} className="topbar-brand" />
          <div className="topbar-actions">
            <NavLink
              to="/empresa"
              className="icon-btn topbar-gear"
              aria-label="Minha empresa"
            >
              {gearIcon}
            </NavLink>
            <button
              type="button"
              className="btn-ghost topbar-signout"
              onClick={() => signOut()}
            >
              Sair
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      {/* Menu inferior (mobile) */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? 'bottom-link bottom-link--active' : 'bottom-link'
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="bottom-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
