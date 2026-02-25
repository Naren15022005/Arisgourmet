import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api'

export default function Login() {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      // Navigate handled by PublicRoute redirect
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Correo o contraseña incorrectos.')
      } else {
        setError('Ocurrio un error al iniciar sesion. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-peach-500 mb-3">
            ArisGourmet
          </p>
          <h1 className="text-2xl font-bold text-coffee-700">Bienvenido</h1>
          <p className="text-sm text-coffee-300 mt-1">Ingresa a tu panel de gestion</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card space-y-4"
          style={{ background: 'white', border: '1px solid var(--border)' }}
        >
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
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-coffee-500 mb-1.5">
              Contraseña
            </label>
            <input
              className="input-field"
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Iniciar sesion'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-coffee-300">
          No tienes cuenta?{' '}
          <Link to="/" className="text-peach-500 font-medium hover:underline">
            Registra tu restaurante
          </Link>
        </p>
      </div>
    </div>
  )
}
