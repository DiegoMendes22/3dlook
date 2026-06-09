import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { navItems } from '../navigation'
import Logo from './Logo'

export default function AppLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="app-shell">
      {/* Menu lateral (desktop/tablet) */}
      <aside className="sidebar">
        <Logo size={26} className="sidebar-brand" />

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
          <Logo size={20} className="topbar-brand" />
          <button
            type="button"
            className="btn-ghost topbar-signout"
            onClick={() => signOut()}
          >
            Sair
          </button>
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
