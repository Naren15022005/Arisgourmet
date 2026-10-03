import { useState, useEffect, useCallback, useMemo } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import EstadoBadge from '../../components/EstadoBadge'
import { api, type Mesa, type Pedido, type Producto, type PedidoEstado } from '../../api'
import { useSocket } from '../../hooks/useSocket'

function timeAgo(iso: string) {
  const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(val)
}

export default function RecepcionDashboard() {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [productos, setProductos] = useState<Record<string, Producto>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todas' | 'libre' | 'ocupada' | 'reservada'>('todas')
  const [search, setSearch] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
  const [selectedMesaCuenta, setSelectedMesaCuenta] = useState<Mesa | null>(null)
  const [mesaAsignar, setMesaAsignar] = useState<Mesa | null>(null)
  const [tabAlertas, setTabAlertas] = useState<'pendientes' | 'listos'>('listos')

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      const [mesasData, pedidosData, prodList] = await Promise.all([
        api.mesas.list(),
        api.pedidos.list(),
        api.productos.listPublic().catch(() => [] as Producto[]),
      ])
      setMesas(mesasData)
      setPedidos(pedidosData)

      const prodMap: Record<string, Producto> = {}
      for (const p of prodList) {
        prodMap[p.id] = p
      }
      setProductos(prodMap)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useSocket(
    useCallback(() => {
      fetchAll()
    }, [fetchAll])
  )

  const mesasMap = useMemo(() => {
    const map: Record<string, Mesa> = {}
    for (const m of mesas) {
      map[m.id] = m
      map[m.codigo] = m
    }
    return map
  }, [mesas])

  const resolveMesaCodigo = useCallback(
    (mesaIdOrCodigo: string) => mesasMap[mesaIdOrCodigo]?.codigo ?? mesaIdOrCodigo,
    [mesasMap]
  )

  const pedidosPorMesa = useMemo(() => {
    const map: Record<string, Pedido[]> = {}
    for (const p of pedidos) {
      if (p.estado === 'cancelado' || p.estado === 'entregado') continue
      const cod = resolveMesaCodigo(p.mesa_id)
      if (!map[cod]) map[cod] = []
      map[cod].push(p)
    }
    return map
  }, [pedidos, resolveMesaCodigo])

  const totalMesa = useCallback(
    (codigo: string) => {
      const peds = pedidosPorMesa[codigo] || []
      let total = 0
      for (const ped of peds) {
        for (const it of ped.items || []) {
          total += Number(it.precio_unitario || 0) * (it.cantidad || 1)
        }
      }
      return total
    },
    [pedidosPorMesa]
  )

  const pedidosListos = useMemo(
    () => pedidos.filter((p) => p.estado === 'listo'),
    [pedidos]
  )

  const pedidosPendientes = useMemo(
    () => pedidos.filter((p) => p.estado === 'pendiente'),
    [pedidos]
  )

  const handleActivateMesa = async (mesa: Mesa) => {
    setActionId(mesa.id)
    try {
      await api.mesas.activate(mesa.codigo)
      await fetchAll()
      setMesaAsignar(null)
    } finally {
      setActionId(null)
    }
  }

  const handleReleaseMesa = async (mesa: Mesa) => {
    setActionId(mesa.id)
    try {
      await api.mesas.release(mesa.codigo)
      await fetchAll()
      if (selectedMesaCuenta?.id === mesa.id) setSelectedMesaCuenta(null)
    } finally {
      setActionId(null)
    }
  }

  const handleCobrarYLiberar = async (mesa: Mesa) => {
    setActionId(mesa.id)
    try {
      const peds = pedidosPorMesa[mesa.codigo] || []
      for (const p of peds) {
        if (p.estado !== 'entregado' && p.estado !== 'cancelado') {
          await api.pedidos.updateEstado(p.id, 'entregado').catch(() => {})
        }
      }
      await api.mesas.release(mesa.codigo)
      await fetchAll()
      setSelectedMesaCuenta(null)
    } finally {
      setActionId(null)
    }
  }

  const handleUpdateEstadoPedido = async (pedidoId: string, nuevoEstado: PedidoEstado) => {
    setActionId(pedidoId)
    try {
      await api.pedidos.updateEstado(pedidoId, nuevoEstado)
      await fetchAll()
    } finally {
      setActionId(null)
    }
  }

  const filteredMesas = useMemo(() => {
    return mesas.filter((m) => {
      const matchFilter = filter === 'todas' || m.estado === filter
      const matchSearch =
        m.codigo.toLowerCase().includes(search.toLowerCase()) ||
        String(m.numero || '').includes(search)
      return matchFilter && matchSearch
    })
  }, [mesas, filter, search])

  const libres = mesas.filter((m) => m.estado === 'libre').length
  const ocupadas = mesas.filter((m) => m.estado === 'ocupada').length
  const reservadas = mesas.filter((m) => m.estado === 'reservada').length

  const totalTurno = useMemo(() => {
    let sum = 0
    for (const p of pedidos) {
      if (p.estado === 'cancelado') continue
      for (const it of p.items || []) {
        sum += Number(it.precio_unitario || 0) * (it.cantidad || 1)
      }
    }
    return sum
  }, [pedidos])

  return (
    <DashboardLayout title="Recepción">
      {/* Encabezado minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-cream-200 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-coffee-800 tracking-tight">
            Control de Salón
          </h1>
          <p className="text-xs text-coffee-400 mt-0.5">
            Gestión de comensales, comanda y facturación en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-coffee-500 bg-white px-3 py-1.5 rounded-lg border border-cream-200">
            {clock}
          </div>
          <button
            onClick={() => fetchAll()}
            disabled={loading}
            className="text-xs font-medium text-coffee-600 hover:text-coffee-800 bg-white hover:bg-cream-100 border border-cream-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Métricas clave limpias */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-white rounded-xl border border-cream-200">
          <span className="text-[11px] font-medium uppercase tracking-wider text-coffee-400 block mb-1">
            Mesas disponibles
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-coffee-800">{libres}</span>
            <span className="text-xs text-coffee-400">de {mesas.length}</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-cream-200">
          <span className="text-[11px] font-medium uppercase tracking-wider text-coffee-400 block mb-1">
            Mesas en servicio
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-coffee-800">{ocupadas}</span>
            <span className="text-xs text-coffee-400">
              {mesas.length > 0 ? Math.round((ocupadas / mesas.length) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-cream-200">
          <span className="text-[11px] font-medium uppercase tracking-wider text-coffee-400 block mb-1">
            Platos listos
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-coffee-800">{pedidosListos.length}</span>
            <span className="text-xs text-coffee-400">por entregar</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-cream-200">
          <span className="text-[11px] font-medium uppercase tracking-wider text-coffee-400 block mb-1">
            Total en curso
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-coffee-800 truncate">
              {formatCurrency(totalTurno)}
            </span>
          </div>
        </div>
      </div>

      {/* Estructura principal: Salón y Panel de Pedidos */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mesas del Salón */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2">
            <div className="flex items-center gap-1 border border-cream-200 bg-white p-1 rounded-lg">
              {[
                { key: 'todas', label: 'Todas', count: mesas.length },
                { key: 'libre', label: 'Libres', count: libres },
                { key: 'ocupada', label: 'Ocupadas', count: ocupadas },
                { key: 'reservada', label: 'Reservadas', count: reservadas },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    filter === key
                      ? 'bg-coffee-700 text-white'
                      : 'text-coffee-500 hover:text-coffee-800 hover:bg-cream-50'
                  }`}
                >
                  {label} <span className="opacity-75">({count})</span>
                </button>
              ))}
            </div>

            <div className="w-full sm:w-56">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por código..."
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-cream-300 bg-white focus:outline-hidden focus:border-coffee-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <span className="spinner" />
            </div>
          ) : filteredMesas.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-cream-200">
              <p className="text-xs text-coffee-400">No hay mesas que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredMesas.map((mesa) => {
                const peds = pedidosPorMesa[mesa.codigo] || []
                const consumo = totalMesa(mesa.codigo)
                const isOcupada = mesa.estado === 'ocupada'
                const isLibre = mesa.estado === 'libre'
                const isReservada = mesa.estado === 'reservada'

                return (
                  <div
                    key={mesa.id}
                    className="p-4 bg-white rounded-xl border border-cream-200 flex flex-col justify-between hover:border-cream-400 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-coffee-800">
                          {mesa.codigo}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md tracking-wider ${
                            isOcupada
                              ? 'bg-peach-100 text-peach-800'
                              : isLibre
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-coffee-100 text-coffee-700'
                          }`}
                        >
                          {mesa.estado}
                        </span>
                      </div>

                      {isOcupada && (
                        <div className="space-y-1.5 py-2 text-xs border-t border-cream-100 mb-2">
                          <div className="flex justify-between text-coffee-500">
                            <span>Comandas:</span>
                            <span className="font-medium text-coffee-700">{peds.length}</span>
                          </div>
                          <div className="flex justify-between text-coffee-500">
                            <span>Consumo:</span>
                            <span className="font-semibold text-coffee-800">
                              {formatCurrency(consumo)}
                            </span>
                          </div>
                          {mesa.updated_at && (
                            <div className="flex justify-between text-[11px] text-coffee-400 pt-1">
                              <span>Ocupada hace:</span>
                              <span>{timeAgo(mesa.ocupado_desde || mesa.updated_at)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {isLibre && (
                        <div className="py-4 text-center text-xs text-coffee-400 border-t border-cream-100 mb-2">
                          Disponible para servicio
                        </div>
                      )}

                      {isReservada && (
                        <div className="py-4 text-center text-xs text-coffee-500 border-t border-cream-100 mb-2">
                          Reserva asignada
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-cream-100 flex gap-2">
                      {isLibre && (
                        <button
                          onClick={() => setMesaAsignar(mesa)}
                          className="w-full text-xs font-medium py-1.5 bg-coffee-700 hover:bg-coffee-800 text-white rounded-lg transition-colors"
                        >
                          Asignar mesa
                        </button>
                      )}

                      {isOcupada && (
                        <>
                          <button
                            onClick={() => setSelectedMesaCuenta(mesa)}
                            className="flex-1 text-xs font-medium py-1.5 bg-coffee-700 hover:bg-coffee-800 text-white rounded-lg transition-colors"
                          >
                            Ver cuenta
                          </button>
                          <button
                            onClick={() => handleReleaseMesa(mesa)}
                            disabled={actionId === mesa.id}
                            className="px-2.5 text-xs font-medium py-1.5 text-coffee-500 hover:text-coffee-800 hover:bg-cream-100 border border-cream-200 rounded-lg transition-colors"
                          >
                            {actionId === mesa.id ? '...' : 'Liberar'}
                          </button>
                        </>
                      )}

                      {isReservada && (
                        <button
                          onClick={() => handleActivateMesa(mesa)}
                          disabled={actionId === mesa.id}
                          className="w-full text-xs font-medium py-1.5 bg-coffee-700 hover:bg-coffee-800 text-white rounded-lg transition-colors"
                        >
                          Confirmar llegada
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Panel lateral: Pedidos que requieren acción */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-cream-200 p-4">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3 mb-4">
              <div className="flex gap-1">
                <button
                  onClick={() => setTabAlertas('listos')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    tabAlertas === 'listos'
                      ? 'bg-coffee-700 text-white'
                      : 'text-coffee-500 hover:text-coffee-800'
                  }`}
                >
                  Listos para servir ({pedidosListos.length})
                </button>
                <button
                  onClick={() => setTabAlertas('pendientes')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    tabAlertas === 'pendientes'
                      ? 'bg-coffee-700 text-white'
                      : 'text-coffee-500 hover:text-coffee-800'
                  }`}
                >
                  Por confirmar ({pedidosPendientes.length})
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {tabAlertas === 'listos' && (
                <>
                  {pedidosListos.length === 0 ? (
                    <div className="py-12 text-center text-xs text-coffee-400">
                      No hay platos pendientes de entrega.
                    </div>
                  ) : (
                    pedidosListos.map((pedido) => {
                      const mesaCod = resolveMesaCodigo(pedido.mesa_id)
                      return (
                        <div
                          key={pedido.id}
                          className="p-3 rounded-lg border border-cream-300 bg-cream-50/50 space-y-2"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-coffee-800">Mesa {mesaCod}</span>
                            <span className="text-coffee-400 font-mono">
                              {timeAgo(pedido.created_at)}
                            </span>
                          </div>

                          <div className="text-xs text-coffee-600 space-y-1">
                            {pedido.items?.map((it, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>
                                  {it.cantidad}x{' '}
                                  {productos[it.producto_id]?.nombre || `Ítem #${it.producto_id.slice(-4)}`}
                                </span>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => handleUpdateEstadoPedido(pedido.id, 'entregado')}
                            disabled={actionId === pedido.id}
                            className="w-full text-xs font-medium py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                          >
                            Marcar entregado
                          </button>
                        </div>
                      )
                    })
                  )}
                </>
              )}

              {tabAlertas === 'pendientes' && (
                <>
                  {pedidosPendientes.length === 0 ? (
                    <div className="py-12 text-center text-xs text-coffee-400">
                      No hay comandas pendientes de confirmación.
                    </div>
                  ) : (
                    pedidosPendientes.map((pedido) => {
                      const mesaCod = resolveMesaCodigo(pedido.mesa_id)
                      return (
                        <div
                          key={pedido.id}
                          className="p-3 rounded-lg border border-cream-300 bg-cream-50/50 space-y-2"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-coffee-800">Mesa {mesaCod}</span>
                            <span className="text-coffee-400 font-mono">
                              {timeAgo(pedido.created_at)}
                            </span>
                          </div>

                          <div className="text-xs text-coffee-600 space-y-1">
                            {pedido.items?.map((it, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>
                                  {it.cantidad}x{' '}
                                  {productos[it.producto_id]?.nombre || `Ítem #${it.producto_id.slice(-4)}`}
                                </span>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => handleUpdateEstadoPedido(pedido.id, 'aceptado')}
                            disabled={actionId === pedido.id}
                            className="w-full text-xs font-medium py-1.5 bg-coffee-700 hover:bg-coffee-800 text-white rounded-md transition-colors"
                          >
                            Enviar a cocina
                          </button>
                        </div>
                      )
                    })
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Detalle de Cuenta */}
      {selectedMesaCuenta && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-cream-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-cream-200">
              <div>
                <h3 className="text-base font-semibold text-coffee-800">
                  Cuenta Mesa {selectedMesaCuenta.codigo}
                </h3>
                <span className="text-xs text-coffee-400">Resumen de consumo para cierre</span>
              </div>
              <button
                onClick={() => setSelectedMesaCuenta(null)}
                className="text-coffee-400 hover:text-coffee-700 text-sm font-semibold p-1"
              >
                Cerrar
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-3 pr-1 text-xs">
              {(pedidosPorMesa[selectedMesaCuenta.codigo] || []).length === 0 ? (
                <p className="text-center text-coffee-400 py-6">
                  No hay comandas registradas en esta mesa.
                </p>
              ) : (
                (pedidosPorMesa[selectedMesaCuenta.codigo] || []).map((pedido, pIdx) => (
                  <div key={pedido.id} className="p-3 rounded-lg bg-cream-50/60 border border-cream-200">
                    <div className="flex justify-between font-medium text-coffee-700 mb-1">
                      <span>Comanda #{pIdx + 1}</span>
                      <span className="text-coffee-400">
                        {new Date(pedido.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="divide-y divide-cream-100">
                      {pedido.items?.map((it, idx) => {
                        const prod = productos[it.producto_id]
                        const sub = Number(it.precio_unitario) * it.cantidad
                        return (
                          <div key={idx} className="py-1 flex justify-between text-coffee-600">
                            <span>
                              {it.cantidad}x {prod ? prod.nombre : `Ítem #${it.producto_id.slice(-4)}`}
                            </span>
                            <span className="font-mono text-coffee-700">{formatCurrency(sub)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {(() => {
              const subtotal = totalMesa(selectedMesaCuenta.codigo)
              const propinaSugerida = subtotal * 0.1
              const totalConServicio = subtotal + propinaSugerida

              return (
                <div className="mt-4 pt-3 border-t border-cream-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-coffee-500">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-coffee-500">
                    <span>Propina sugerida (10%):</span>
                    <span className="font-mono">{formatCurrency(propinaSugerida)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-coffee-800 pt-2 border-t border-cream-200">
                    <span>Total a cobrar:</span>
                    <span>{formatCurrency(totalConServicio)}</span>
                  </div>
                </div>
              )
            })()}

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 text-xs font-medium text-coffee-700 bg-white hover:bg-cream-100 border border-cream-200 rounded-lg transition-colors"
              >
                Imprimir ticket
              </button>
              <button
                onClick={() => handleCobrarYLiberar(selectedMesaCuenta)}
                disabled={actionId === selectedMesaCuenta.id}
                className="flex-1 py-2 text-xs font-medium bg-coffee-800 hover:bg-coffee-900 text-white rounded-lg transition-colors"
              >
                {actionId === selectedMesaCuenta.id ? 'Procesando...' : 'Cobrar y liberar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Asignar Mesa */}
      {mesaAsignar && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-cream-200">
            <h3 className="text-base font-semibold text-coffee-800 mb-1">
              Asignar Mesa {mesaAsignar.codigo}
            </h3>
            <p className="text-xs text-coffee-400 mb-5">
              Confirmar la ocupación de la mesa para comensales en el salón.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setMesaAsignar(null)}
                className="flex-1 py-2 text-xs font-medium text-coffee-600 bg-white hover:bg-cream-100 border border-cream-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleActivateMesa(mesaAsignar)}
                disabled={actionId === mesaAsignar.id}
                className="flex-1 py-2 text-xs font-medium bg-coffee-700 hover:bg-coffee-800 text-white rounded-lg transition-colors"
              >
                {actionId === mesaAsignar.id ? 'Asignando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
