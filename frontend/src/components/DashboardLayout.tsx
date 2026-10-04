import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: ReactNode
  title: string
}

const navItems = [
  {
    to: '/dashboard/recepcion',
    label: 'Recepción',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    to: '/dashboard/cocina',
    label: 'Cocina',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/pedidos',
    label: 'Pedidos',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    to: '/dashboard/productos',
    label: 'Menú y Carta',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    to: '/dashboard/mesas',
    label: 'Mesas y QR',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
]

export default function DashboardLayout({ children, title }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Estado colapsado persistido en localStorage
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aris_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('aris_sidebar_collapsed', String(next))
      } catch (err) {
        console.error('Error saving sidebar state', err)
      }
      return next
    })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-cream-100">
      {/* Sidebar */}
      <aside
        className={`flex flex-col shrink-0 shadow-lg transition-all duration-300 ease-in-out select-none ${
          collapsed ? 'w-20' : 'w-60'
        }`}
        style={{ background: 'var(--sidebar)' }}
      >
        {/* Brand & Toggle Hamburger */}
        {collapsed ? (
          <div className="pt-7 pb-5 border-b border-coffee-600 flex flex-col items-center justify-center gap-2 px-2">
            <button
              type="button"
              onClick={toggleSidebar}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-cream-300 hover:text-white hover:bg-coffee-600 transition-colors shadow-2xs"
              title="Expandir menú lateral"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="px-5 pt-7 pb-5 border-b border-coffee-600 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold tracking-widest uppercase text-peach-400 mb-0.5 truncate">
                ArisGourmet
              </p>
              <p className="text-cream-100 font-bold text-sm leading-tight truncate">
                {user?.nombre ?? 'Restaurante'}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleSidebar}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-cream-300 hover:text-white hover:bg-coffee-600 transition-colors shrink-0"
              title="Contraer menú lateral"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `sidebar-link flex items-center rounded-xl transition-all font-medium text-xs ${
                  collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5'
                } ` +
                (isActive
                  ? 'bg-peach-500 text-white font-bold shadow-xs'
                  : 'text-cream-300 hover:bg-coffee-600 hover:text-white')
              }
            >
              <div className="shrink-0 flex items-center justify-center">
                {icon}
              </div>
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        {collapsed ? (
          <div className="py-4 border-t border-coffee-600 flex flex-col items-center justify-center">
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-cream-300 hover:text-rose-400 hover:bg-coffee-600 transition-colors"
              title={`Cerrar sesión (${user?.email})`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="px-4 py-5 border-t border-coffee-600">
            <p className="text-xs text-coffee-200 truncate mb-3">{user?.email}</p>
            <button
              onClick={handleLogout}
              className="w-full text-left sidebar-link text-xs flex items-center gap-2 text-cream-300 hover:text-rose-400 hover:bg-coffee-600 px-3 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}
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
