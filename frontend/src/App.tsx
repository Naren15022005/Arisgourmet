import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import RecepcionDashboard from './pages/dashboard/Recepcion'
import CocinaDashboard from './pages/dashboard/Cocina'
import PedidosDashboard from './pages/dashboard/Pedidos'
import ProductosDashboard from './pages/dashboard/Productos'
import MesasDashboard from './pages/dashboard/Mesas'
import MesaCliente from './pages/MesaCliente'
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
      {/* Public landing and auth */}
      <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* Customer QR digital menu & ordering (public) */}
      <Route path="/mesa/:codigo" element={<MesaCliente />} />
      <Route path="/menu/mesa/:codigo" element={<MesaCliente />} />
      <Route path="/menu/:codigo" element={<MesaCliente />} />

      {/* Dashboard protected routes */}
      <Route
        path="/dashboard/recepcion"
        element={<PrivateRoute><RecepcionDashboard /></PrivateRoute>}
      />
      <Route
        path="/dashboard/cocina"
        element={<PrivateRoute><CocinaDashboard /></PrivateRoute>}
      />
      <Route
        path="/dashboard/pedidos"
        element={<PrivateRoute><PedidosDashboard /></PrivateRoute>}
      />
      <Route
        path="/dashboard/productos"
        element={<PrivateRoute><ProductosDashboard /></PrivateRoute>}
      />
      <Route
        path="/dashboard/mesas"
        element={<PrivateRoute><MesasDashboard /></PrivateRoute>}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
