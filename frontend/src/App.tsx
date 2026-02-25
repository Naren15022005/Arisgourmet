import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import RecepcionDashboard from './pages/dashboard/Recepcion'
import CocinaDashboard from './pages/dashboard/Cocina'
import type { ReactNode } from 'react'

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100">
      <span className="spinner" />
    </div>
  )
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100">
      <span className="spinner" />
    </div>
  )
  return !user ? <>{children}</> : <Navigate to="/dashboard/recepcion" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route
        path="/dashboard/recepcion"
        element={<PrivateRoute><RecepcionDashboard /></PrivateRoute>}
      />
      <Route
        path="/dashboard/cocina"
        element={<PrivateRoute><CocinaDashboard /></PrivateRoute>}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
