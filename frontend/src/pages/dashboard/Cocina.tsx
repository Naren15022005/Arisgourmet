import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import EstadoBadge from '../../components/EstadoBadge'
import { api, type Pedido, type PedidoEstado } from '../../api'
import { useSocket } from '../../hooks/useSocket'

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  return `${Math.floor(diff / 3600)}h`
}

const SIGUIENTE: Record<string, PedidoEstado> = {
  pendiente:  'aceptado',
  aceptado:   'preparando',
  preparando: 'listo',
  listo:      'entregado',
}

const ACCION_LABEL: Record<string, string> = {
  pendiente:  'Aceptar',
  aceptado:   'Preparar',
  preparando: 'Marcar listo',
  listo:      'Confirmar entrega',
}

const COLUMNS: { key: PedidoEstado; label: string; accent: string }[] = [
  { key: 'pendiente',  label: 'Nuevos',      accent: 'border-t-cream-300' },
  { key: 'aceptado',   label: 'Aceptados',   accent: 'border-t-peach-200' },
  { key: 'preparando', label: 'Preparando',  accent: 'border-t-peach-400' },
  { key: 'listo',      label: 'Listos',      accent: 'border-t-coffee-300' },
]

interface PedidoCardProps {
  pedido: Pedido
  onAdvance: (pedido: Pedido) => void
  loading: boolean
}

function PedidoCard({ pedido, onAdvance, loading }: PedidoCardProps) {
  const totalItems = pedido.items?.reduce((s, i) => s + i.cantidad, 0) ?? 0
  const total = pedido.items?.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0) ?? 0
  const canAdvance = pedido.estado in SIGUIENTE

  return (
    <div className="card p-4 gap-3 flex flex-col border border-cream-200 shadow-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm text-coffee-700">Mesa {pedido.mesa_id}</p>
          <p className="text-xs text-coffee-200">Hace {timeAgo(pedido.created_at)}</p>
        </div>
        <EstadoBadge estado={pedido.estado} />
      </div>

      {/* Items */}
      {pedido.items && pedido.items.length > 0 ? (
        <ul className="divide-y divide-cream-200">
          {pedido.items.map((item, i) => (
            <li key={i} className="flex justify-between py-1.5 text-xs text-coffee-500">
              <span className="font-medium">{item.cantidad} x</span>
              <span className="text-coffee-400 font-mono">{item.producto_id.slice(-6)}</span>
              <span>${Number(item.precio_unitario).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-coffee-200 italic">Sin detalle de items</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-cream-200 mt-auto">
        <span className="text-xs text-coffee-300">
          {totalItems} {totalItems === 1 ? 'item' : 'items'} — ${total.toFixed(2)}
        </span>
        {canAdvance && (
          <button
            onClick={() => onAdvance(pedido)}
            disabled={loading}
            className="btn-primary py-1.5 px-3 text-xs"
          >
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : ACCION_LABEL[pedido.estado]}
          </button>
        )}
      </div>
    </div>
  )
}

export default function CocinaDashboard() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const ACTIVE = new Set(['pendiente', 'aceptado', 'preparando', 'listo'])

  const fetchPedidos = useCallback(async () => {
    try {
      const data = await api.pedidos.list()
      setPedidos(data.filter((p) => ACTIVE.has(p.estado)))
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { fetchPedidos() }, [fetchPedidos])

  // Real-time refresh
  useSocket(useCallback(() => { fetchPedidos() }, [fetchPedidos]))

  const handleAdvance = async (pedido: Pedido) => {
    const nextEstado = SIGUIENTE[pedido.estado]
    if (!nextEstado) return
    setActionId(pedido.id)
    try {
      await api.pedidos.updateEstado(pedido.id, nextEstado)
      await fetchPedidos()
    } finally {
      setActionId(null)
    }
  }

  // Group pedidos by estado
  const byEstado = (estado: PedidoEstado) =>
    pedidos.filter((p) => p.estado === estado)

  return (
    <DashboardLayout title="Cocina">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="spinner" />
        </div>
      ) : (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {COLUMNS.map(({ key, label }) => {
              const count = byEstado(key).length
              return (
                <div key={key} className="card">
                  <p className="text-xs font-medium text-coffee-300 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-3xl font-bold text-coffee-700">{count}</p>
                </div>
              )
            })}
          </div>

          {/* Kanban columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {COLUMNS.map(({ key, label, accent }) => {
              const col = byEstado(key)
              return (
                <div key={key} className={`rounded-2xl border-t-4 bg-cream-100 ${accent} min-h-40`}>
                  {/* Column header */}
                  <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-coffee-500 uppercase tracking-wider">
                      {label}
                    </p>
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white border border-cream-300 text-xs font-medium text-coffee-400">
                      {col.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="px-3 pb-4 space-y-3">
                    {col.length === 0 ? (
                      <p className="text-center text-xs text-coffee-200 py-6">Sin ordenes</p>
                    ) : (
                      col.map((pedido) => (
                        <PedidoCard
                          key={pedido.id}
                          pedido={pedido}
                          onAdvance={handleAdvance}
                          loading={actionId === pedido.id}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
