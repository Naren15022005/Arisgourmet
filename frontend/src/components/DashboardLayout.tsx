import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  title: string
}

const navItems = [
  { to: '/dashboard/recepcion', label: 'Recepcion' },
  { to: '/dashboard/cocina', label: 'Cocina' },
]

export default function DashboardLayout({ children, title }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-cream-100">
      {/* Sidebar */}
      <aside
        className="w-56 flex flex-col shrink-0"
        style={{ background: 'var(--sidebar)' }}
      >
        {/* Brand */}
        <div className="px-6 pt-8 pb-6 border-b border-coffee-600">
          <p className="text-xs font-medium tracking-widest uppercase text-coffee-200 mb-1">
            ArisGourmet
          </p>
          <p className="text-cream-100 font-semibold text-base leading-tight truncate">
            {user?.nombre ?? 'Restaurante'}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' active' : '')
              }
            >
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-5 border-t border-coffee-600">
          <p className="text-xs text-coffee-200 truncate mb-3">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="w-full text-left sidebar-link text-xs"
          >
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-cream-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-coffee-700">{title}</h1>
          <span className="text-xs text-coffee-200 font-medium">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </span>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
