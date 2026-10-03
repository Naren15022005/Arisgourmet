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

const ESTADOS: { key: string; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'aceptado', label: 'Aceptados' },
  { key: 'preparando', label: 'Preparando' },
  { key: 'listo', label: 'Listos' },
  { key: 'entregado', label: 'Entregados' },
  { key: 'cancelado', label: 'Cancelados' },
]

export default function PedidosDashboard() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [searchMesa, setSearchMesa] = useState('')
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchPedidos = useCallback(async () => {
    try {
      const data = await api.pedidos.list()
      setPedidos(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPedidos()
  }, [fetchPedidos])

  useSocket(
    useCallback(
      (channel: string) => {
        if (channel.startsWith('pedido:')) fetchPedidos()
      },
      [fetchPedidos]
    )
  )

  const handleUpdateEstado = async (id: string, nuevoEstado: PedidoEstado) => {
    setActionLoading(true)
    try {
      await api.pedidos.updateEstado(id, nuevoEstado)
      await fetchPedidos()
      if (selectedPedido?.id === id) {
        setSelectedPedido((prev) => (prev ? { ...prev, estado: nuevoEstado } : null))
      }
    } catch (err: any) {
      alert('Error al cambiar estado: ' + (err?.message || 'Error'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('¿Deseas cancelar este pedido?')) return
    setActionLoading(true)
    try {
      await api.pedidos.cancel(id)
      await fetchPedidos()
      if (selectedPedido?.id === id) {
        setSelectedPedido((prev) => (prev ? { ...prev, estado: 'cancelado' } : null))
      }
    } catch (err: any) {
      alert('Error al cancelar pedido: ' + (err?.message || 'Error'))
    } finally {
      setActionLoading(false)
    }
  }

  const filtered = pedidos.filter((p) => {
    const matchesFilter = filter === 'todos' || p.estado === filter
    const matchesSearch =
      !searchMesa ||
      String(p.mesa_id).toLowerCase().includes(searchMesa.toLowerCase()) ||
      p.id.toLowerCase().includes(searchMesa.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const totalVentas = pedidos
    .filter((p) => p.estado !== 'cancelado')
    .reduce((sum, p) => {
      const subtotal = p.items?.reduce((s, i) => s + (i.precio_unitario || 0) * i.cantidad, 0) ?? 0
      return sum + subtotal
    }, 0)

  return (
    <DashboardLayout title="Control y Registro de Pedidos">
      {/* Top action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-coffee-700">Historial y Flujo de Comandas</h2>
          <p className="text-sm text-coffee-300">
            Monitorea los pedidos en tiempo real, verifica el detalle de ítems y cambia sus estados.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-coffee-300 font-medium uppercase tracking-wide mb-1">
            Total Pedidos
          </p>
          <p className="text-3xl font-bold text-coffee-700">{pedidos.length}</p>
          <span className="text-xs text-coffee-200">registrados</span>
        </div>
        <div className="card">
          <p className="text-xs text-coffee-300 font-medium uppercase tracking-wide mb-1">
            En Curso
          </p>
          <p className="text-3xl font-bold text-peach-600">
            {pedidos.filter((p) => ['pendiente', 'aceptado', 'preparando'].includes(p.estado)).length}
          </p>
          <span className="text-xs text-coffee-200">cocina y salón</span>
        </div>
        <div className="card">
          <p className="text-xs text-coffee-300 font-medium uppercase tracking-wide mb-1">
            Entregados
          </p>
          <p className="text-3xl font-bold text-emerald-600">
            {pedidos.filter((p) => p.estado === 'entregado').length}
          </p>
          <span className="text-xs text-coffee-200">completados</span>
        </div>
        <div className="card">
          <p className="text-xs text-coffee-300 font-medium uppercase tracking-wide mb-1">
            Total Liquidado
          </p>
          <p className="text-3xl font-bold text-coffee-700">${totalVentas.toFixed(2)}</p>
          <span className="text-xs text-coffee-200">pedidos válidos</span>
        </div>
      </div>

      {/* Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          {ESTADOS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === key
                  ? 'bg-coffee-700 text-cream-100 shadow-sm'
                  : 'text-coffee-300 hover:text-coffee-600 hover:bg-cream-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <input
            type="text"
            placeholder="Buscar por mesa o ID..."
            value={searchMesa}
            onChange={(e) => setSearchMesa(e.target.value)}
            className="input-field text-xs py-2"
          />
        </div>
      </div>

      {/* Orders List / Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 border-dashed border-cream-300">
          <h3 className="font-semibold text-coffee-700 mb-1">No hay pedidos registrados</h3>
          <p className="text-xs text-coffee-300">
            Los pedidos aparecerán automáticamente aquí cuando los comensales ordenen desde su mesa.
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden border border-cream-200 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream-100/70 border-b border-cream-200 text-xs text-coffee-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">ID / Hora</th>
                  <th className="py-3.5 px-6">Mesa</th>
                  <th className="py-3.5 px-6">Ítems</th>
                  <th className="py-3.5 px-6">Total</th>
                  <th className="py-3.5 px-6">Estado</th>
                  <th className="py-3.5 px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {filtered.map((p) => {
                  const itemsCount = p.items?.reduce((s, i) => s + i.cantidad, 0) ?? 0
                  const total =
                    p.items?.reduce((s, i) => s + (i.precio_unitario || 0) * i.cantidad, 0) ?? 0

                  return (
                    <tr key={p.id} className="hover:bg-cream-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-mono text-xs font-bold text-coffee-700">
                          #{p.id.slice(0, 8)}
                        </p>
                        <p className="text-[11px] text-coffee-300">Hace {timeAgo(p.created_at)}</p>
                      </td>
                      <td className="py-4 px-6 font-semibold text-coffee-700">Mesa {p.mesa_id}</td>
                      <td className="py-4 px-6 text-xs text-coffee-400">
                        {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}
                      </td>
                      <td className="py-4 px-6 font-bold text-coffee-700">
                        ${total.toFixed(2)}
                      </td>
                      <td className="py-4 px-6">
                        <EstadoBadge estado={p.estado} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedPedido(p)}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over / Modal Detalle de Pedido */}
      {selectedPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-900/40 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-cream-200 mb-4">
              <div>
                <span className="text-xs font-mono font-bold text-coffee-300 uppercase">
                  Comanda #{selectedPedido.id.slice(0, 8)}
                </span>
                <h3 className="font-bold text-lg text-coffee-700">
                  Mesa {selectedPedido.mesa_id}
                </h3>
              </div>
              <EstadoBadge estado={selectedPedido.estado} />
            </div>

            {/* List of items */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-coffee-300 mb-2">
                Platillos Solicitados
              </h4>
              {selectedPedido.items && selectedPedido.items.length > 0 ? (
                <ul className="divide-y divide-cream-100">
                  {selectedPedido.items.map((item, idx) => (
                    <li key={idx} className="py-2.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-cream-200 text-coffee-700 font-bold text-xs flex items-center justify-center">
                          {item.cantidad}x
                        </span>
                        <span className="text-coffee-700 font-medium">
                          Platillo #{item.producto_id.slice(0, 6)}
                        </span>
                      </div>
                      <span className="font-semibold text-coffee-700">
                        ${((item.precio_unitario || 0) * item.cantidad).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-coffee-300 italic">No hay ítems registrados.</p>
              )}
            </div>

            {/* Total and timestamps */}
            <div className="pt-4 border-t border-cream-200 mb-4 bg-cream-50 p-4 rounded-xl">
              <div className="flex justify-between items-center text-sm font-bold text-coffee-700 mb-1">
                <span>Total a Cobrar</span>
                <span className="text-lg text-peach-600">
                  $
                  {(
                    selectedPedido.items?.reduce(
                      (s, i) => s + (i.precio_unitario || 0) * i.cantidad,
                      0
                    ) ?? 0
                  ).toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-coffee-300">
                Creado: {new Date(selectedPedido.created_at).toLocaleTimeString('es-ES')}
              </p>
            </div>

            {/* Quick Actions according to state */}
            <div className="pt-2 border-t border-cream-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedPedido.estado === 'pendiente' && (
                  <button
                    onClick={() => handleUpdateEstado(selectedPedido.id, 'aceptado')}
                    disabled={actionLoading}
                    className="btn-primary text-xs"
                  >
                    Aceptar Pedido
                  </button>
                )}
                {selectedPedido.estado === 'aceptado' && (
                  <button
                    onClick={() => handleUpdateEstado(selectedPedido.id, 'preparando')}
                    disabled={actionLoading}
                    className="btn-primary text-xs"
                  >
                    Enviar a Cocina
                  </button>
                )}
                {selectedPedido.estado === 'preparando' && (
                  <button
                    onClick={() => handleUpdateEstado(selectedPedido.id, 'listo')}
                    disabled={actionLoading}
                    className="btn-primary text-xs"
                  >
                    Marcar Listo
                  </button>
                )}
                {selectedPedido.estado === 'listo' && (
                  <button
                    onClick={() => handleUpdateEstado(selectedPedido.id, 'entregado')}
                    disabled={actionLoading}
                    className="btn-primary text-xs"
                  >
                    Confirmar Entrega
                  </button>
                )}

                {selectedPedido.estado !== 'cancelado' &&
                  selectedPedido.estado !== 'entregado' && (
                    <button
                      onClick={() => handleCancel(selectedPedido.id)}
                      disabled={actionLoading}
                      className="btn-ghost text-xs text-rose-500 hover:bg-rose-50"
                    >
                      Cancelar
                    </button>
                  )}
              </div>

              <button onClick={() => setSelectedPedido(null)} className="btn-secondary text-xs">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
