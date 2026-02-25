import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api'

export default function Home() {
  const { register } = useAuth()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      await register(nombre, email, password)
      // AuthProvider auto-navigates via PrivateRoute
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Ya existe una cuenta con ese correo.')
      } else {
        setError('Ocurrio un error. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left — decorative panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-2/5 px-12 py-14"
        style={{ background: '#3D1F14' }}
      >
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-peach-300 mb-6">
            ArisGourmet
          </p>
          <h1 className="text-4xl font-bold text-cream-100 leading-tight">
            Gestion inteligente<br />para tu restaurante
          </h1>
          <p className="mt-5 text-coffee-200 text-base leading-relaxed">
            Controla mesas, pedidos y cocina desde un solo lugar.
            Tiempo real, sin complicaciones.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Panel de recepcion', desc: 'Estado de mesas y pedidos activos en tiempo real.' },
            { label: 'Panel de cocina', desc: 'Cola priorizada de ordenes con actualizacion de estado.' },
            { label: 'Notificaciones instantaneas', desc: 'WebSocket para sincronizar toda la operacion.' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex gap-3 items-start">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-peach-400 shrink-0" />
              <div>
                <p className="text-cream-100 text-sm font-medium">{label}</p>
                <p className="text-coffee-200 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — register form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <p className="lg:hidden text-xs font-semibold tracking-widest uppercase text-peach-500 mb-6">
            ArisGourmet
          </p>

          <h2 className="text-2xl font-bold text-coffee-700 mb-1">
            Registra tu restaurante
          </h2>
          <p className="text-sm text-coffee-300 mb-8">
            Crea tu cuenta y empieza a operar hoy mismo.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-coffee-500 mb-1.5">
                Nombre del restaurante
              </label>
              <input
                className="input-field"
                type="text"
                placeholder="Ej. El Rincon de Sofia"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-coffee-500 mb-1.5">
                Correo electronico
              </label>
              <input
                className="input-field"
                type="email"
                placeholder="tucorreo@restaurante.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-coffee-500 mb-1.5">
                Contraseña
              </label>
              <input
                className="input-field"
                type="password"
                placeholder="Minimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-coffee-500 mb-1.5">
                Confirmar contraseña
              </label>
              <input
                className="input-field"
                type="password"
                placeholder="Repite tu contraseña"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-xl bg-peach-50 border border-peach-200 px-4 py-3">
                <p className="text-xs text-peach-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-coffee-300">
            Ya tienes cuenta?{' '}
            <Link to="/login" className="text-peach-500 font-medium hover:underline">
              Inicia sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
