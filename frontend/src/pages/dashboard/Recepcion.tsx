import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import EstadoBadge from '../../components/EstadoBadge'
import { api, type Mesa, type Pedido } from '../../api'
import { useSocket } from '../../hooks/useSocket'

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  return `${Math.floor(diff / 3600)}h`
}

const MESA_COLORS: Record<string, string> = {
  libre:     'border-cream-300 bg-white text-coffee-600',
  ocupada:   'border-peach-400 bg-peach-50 text-peach-600',
  reservada: 'border-coffee-300 bg-coffee-50 text-coffee-500',
}

const MESA_DOT: Record<string, string> = {
  libre:     'bg-cream-300',
  ocupada:   'bg-peach-400',
  reservada: 'bg-coffee-300',
}

const ACTIVE_ESTADOS = new Set(['pendiente', 'aceptado', 'preparando'])

export default function RecepcionDashboard() {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loadingMesas, setLoadingMesas] = useState(true)
  const [loadingPedidos, setLoadingPedidos] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const fetchMesas = useCallback(async () => {
    try {
      const data = await api.mesas.list()
      setMesas(data)
    } finally {
      setLoadingMesas(false)
    }
  }, [])

  const fetchPedidos = useCallback(async () => {
    try {
      const data = await api.pedidos.list()
      setPedidos(data.filter((p) => ACTIVE_ESTADOS.has(p.estado)))
    } finally {
      setLoadingPedidos(false)
    }
  }, [])

  useEffect(() => {
    fetchMesas()
    fetchPedidos()
  }, [fetchMesas, fetchPedidos])

  // Real-time
  useSocket(useCallback((channel: string) => {
    if (channel.startsWith('pedido:')) fetchPedidos()
    if (channel.startsWith('mesa:')) fetchMesas()
  }, [fetchMesas, fetchPedidos]))

  const handleRelease = async (mesa: Mesa) => {
    if (mesa.estado !== 'ocupada') return
    setActionId(mesa.id)
    try {
      await api.mesas.release(mesa.codigo)
      await fetchMesas()
    } finally {
      setActionId(null)
    }
  }

  const handleCancelPedido = async (pedido: Pedido) => {
    setActionId(pedido.id)
    try {
      await api.pedidos.cancel(pedido.id)
      await fetchPedidos()
    } finally {
      setActionId(null)
    }
  }

  const libres = mesas.filter((m) => m.estado === 'libre').length
  const ocupadas = mesas.filter((m) => m.estado === 'ocupada').length

  return (
    <DashboardLayout title="Recepcion">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Mesas libres',    value: libres,            sub: 'disponibles' },
          { label: 'Mesas ocupadas',  value: ocupadas,          sub: 'en servicio' },
          { label: 'Pedidos activos', value: pedidos.length,    sub: 'en curso' },
          { label: 'Total mesas',     value: mesas.length,      sub: 'registradas' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="card">
            <p className="text-xs text-coffee-300 font-medium uppercase tracking-wide mb-1">{label}</p>
            <p className="text-3xl font-bold text-coffee-700">{value}</p>
            <p className="text-xs text-coffee-200 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mesas */}
        <section>
          <h2 className="text-sm font-semibold text-coffee-600 uppercase tracking-wide mb-4">
            Estado de mesas
          </h2>
          {loadingMesas ? (
            <div className="flex justify-center py-12"><span className="spinner" /></div>
          ) : mesas.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-sm text-coffee-300">No hay mesas registradas.</p>
              <p className="text-xs text-coffee-200 mt-1">
                Las mesas se registran al escanear un codigo QR.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {mesas.map((mesa) => (
                <div
                  key={mesa.id}
                  className={`rounded-xl border-2 p-3 flex flex-col gap-2 transition-shadow ${MESA_COLORS[mesa.estado] ?? MESA_COLORS.libre}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">#{mesa.numero ?? '—'}</span>
                    <span className={`w-2 h-2 rounded-full ${MESA_DOT[mesa.estado] ?? ''}`} />
                  </div>
                  <span className="text-xs capitalize text-current opacity-70">
                    {mesa.estado}
                  </span>
                  {mesa.estado === 'ocupada' && (
                    <button
                      onClick={() => handleRelease(mesa)}
                      disabled={actionId === mesa.id}
                      className="mt-auto text-xs btn-ghost py-1 px-2 w-full"
                    >
                      {actionId === mesa.id ? '...' : 'Liberar'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pedidos activos */}
        <section>
          <h2 className="text-sm font-semibold text-coffee-600 uppercase tracking-wide mb-4">
            Pedidos activos
          </h2>
          {loadingPedidos ? (
            <div className="flex justify-center py-12"><span className="spinner" /></div>
          ) : pedidos.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-sm text-coffee-300">No hay pedidos activos en este momento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidos.map((pedido) => (
                <div key={pedido.id} className="card py-4 px-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-coffee-700">
                        Mesa {pedido.mesa_id}
                      </p>
                      <p className="text-xs text-coffee-200 mt-0.5">
                        Hace {timeAgo(pedido.created_at)}
                      </p>
                    </div>
                    <EstadoBadge estado={pedido.estado} />
                  </div>

                  {pedido.items && pedido.items.length > 0 && (
                    <ul className="text-xs text-coffee-400 space-y-1 mb-3">
                      {pedido.items.map((item, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{item.cantidad}x item</span>
                          <span>${Number(item.precio_unitario).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-coffee-200 font-mono truncate">
                      {pedido.id.slice(-6)}
                    </span>
                    {pedido.estado === 'pendiente' && (
                      <button
                        onClick={() => handleCancelPedido(pedido)}
                        disabled={actionId === pedido.id}
                        className="text-xs text-peach-500 hover:underline disabled:opacity-50"
                      >
                        {actionId === pedido.id ? '...' : 'Cancelar'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}
