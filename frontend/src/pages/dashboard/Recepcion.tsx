import { useState, useEffect, useCallback, useMemo } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { api, type Mesa, type Pedido, type Producto, type PedidoEstado } from '../../api'
import { useSocket } from '../../hooks/useSocket'
import { MesaBlueprint, getMesaCapacity } from '../../components/MesaBlueprint'

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
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  )
  const [selectedMesaCuenta, setSelectedMesaCuenta] = useState<Mesa | null>(null)
  const [mesaAsignar, setMesaAsignar] = useState<Mesa | null>(null)
  const [tabFeed, setTabFeed] = useState<'detalle' | 'alertas'>('detalle')

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      )
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

      // Actualizar mesa seleccionada si sigue existiendo
      setSelectedMesa((prev) => {
        if (!prev) return mesasData[0] || null
        return mesasData.find((m) => m.id === prev.id) || mesasData[0] || null
      })
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
    return mesas.filter((m) => filter === 'todas' || m.estado === filter)
  }, [mesas, filter])

  const libres = mesas.filter((m) => m.estado === 'libre').length
  const ocupadas = mesas.filter((m) => m.estado === 'ocupada').length
  const reservadas = mesas.filter((m) => m.estado === 'reservada').length

  const activeMesaOrders = selectedMesa ? pedidosPorMesa[selectedMesa.codigo] || [] : []
  const activeMesaTotal = selectedMesa ? totalMesa(selectedMesa.codigo) : 0

  return (
    <DashboardLayout title="Recepción">
      {/* Encabezado minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-cream-200 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-coffee-800 tracking-tight">
            Plano de Salón y Recepción
          </h1>
          <p className="text-xs text-coffee-400 mt-0.5">
            Selecciona una mesa en el plano para consultar comensales, comanda y cuenta.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-coffee-500 bg-white px-3 py-1.5 rounded-lg border border-cream-200">
            {clock}
          </div>
          <button
            onClick={() => fetchAll()}
            disabled={loading}
            className="text-xs font-medium text-coffee-600 hover:text-coffee-800 bg-white hover:bg-cream-100 border border-cream-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Métricas y Leyenda del Plano */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-3 rounded-xl border border-cream-200">
        <div className="flex items-center gap-1">
          {[
            { key: 'todas', label: 'Todas', count: mesas.length },
            { key: 'libre', label: 'Libres', count: libres },
            { key: 'ocupada', label: 'Ocupadas', count: ocupadas },
            { key: 'reservada', label: 'Reservadas', count: reservadas },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filter === key
                  ? 'bg-coffee-700 text-white'
                  : 'text-coffee-500 hover:text-coffee-800 hover:bg-cream-50'
              }`}
            >
              {label} <span className="opacity-75">({count})</span>
            </button>
          ))}
        </div>

        {/* Leyenda visual estilo plano arquitectónico */}
        <div className="flex items-center gap-4 text-[11px] text-coffee-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-xs bg-[#eef2f6] border border-slate-300" />
            <span>Libre</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-xs bg-rose-50 border border-rose-400" />
            <span>En servicio (Ocupada)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-xs bg-amber-50 border border-amber-400" />
            <span>Reservada</span>
          </div>
        </div>
      </div>

      {/* Grid del Plano y Panel Lateral */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Plano de Salón (Área Arquitectónica) */}
        <div className="lg:col-span-8 bg-[#f8fafc] rounded-2xl border border-slate-200 p-6 sm:p-8 min-h-[460px] flex flex-col justify-between shadow-2xs relative">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mb-6 flex justify-between items-center border-b border-slate-200 pb-2">
            <span>DISTRIBUCIÓN DEL SALÓN</span>
            <span>CAPACIDAD: {mesas.reduce((acc, m) => acc + getMesaCapacity(m.codigo), 0)} SILLAS</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-32">
              <span className="spinner" />
            </div>
          ) : filteredMesas.length === 0 ? (
            <div className="text-center py-24 text-slate-400">
              <p className="text-xs">No hay mesas con este filtro.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-y-10 gap-x-6 items-center justify-items-center py-4">
              {filteredMesas.map((mesa) => {
                const consumo = totalMesa(mesa.codigo)
                return (
                  <MesaBlueprint
                    key={mesa.id}
                    mesa={mesa}
                    consumo={consumo}
                    selected={selectedMesa?.id === mesa.id}
                    onClick={() => {
                      setSelectedMesa(mesa)
                      setTabFeed('detalle')
                    }}
                  />
                )
              })}
            </div>
          )}

          <div className="mt-8 pt-3 border-t border-slate-200/80 text-[11px] text-slate-400 text-center">
            Haz clic en cualquier mesa para gestionar comensales o consultar la cuenta.
          </div>
        </div>

        {/* Panel Lateral: Detalle de Mesa Seleccionada y Alertas */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-cream-200 p-5 shadow-xs">
            {/* Selector de Pestaña */}
            <div className="flex border-b border-cream-200 pb-3 mb-4 gap-2">
              <button
                onClick={() => setTabFeed('detalle')}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  tabFeed === 'detalle'
                    ? 'bg-coffee-700 text-white'
                    : 'text-coffee-500 hover:text-coffee-800'
                }`}
              >
                Mesa Seleccionada
              </button>
              <button
                onClick={() => setTabFeed('alertas')}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  tabFeed === 'alertas'
                    ? 'bg-coffee-700 text-white'
                    : 'text-coffee-500 hover:text-coffee-800'
                }`}
              >
                Alertas ({pedidosListos.length + pedidosPendientes.length})
              </button>
            </div>

            {/* Vista 1: Detalle de la Mesa Activa */}
            {tabFeed === 'detalle' && (
              <>
                {selectedMesa ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between pb-3 border-b border-cream-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-coffee-400 block">
                          Mesa seleccionada
                        </span>
                        <h2 className="text-xl font-bold text-coffee-800 mt-0.5">
                          {selectedMesa.codigo}
                        </h2>
                        <span className="text-xs text-coffee-400 font-medium">
                          Capacidad para {getMesaCapacity(selectedMesa.codigo)} comensales
                        </span>
                      </div>
                      <span
                        className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md tracking-wider ${
                          selectedMesa.estado === 'ocupada'
                            ? 'bg-rose-100 text-rose-800'
                            : selectedMesa.estado === 'libre'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {selectedMesa.estado}
                      </span>
                    </div>

                    {selectedMesa.estado === 'ocupada' ? (
                      <>
                        <div className="space-y-2 py-2 text-xs bg-cream-50/60 p-3 rounded-xl border border-cream-200">
                          <div className="flex justify-between text-coffee-500">
                            <span>Comandas activas:</span>
                            <span className="font-semibold text-coffee-800">
                              {activeMesaOrders.length}
                            </span>
                          </div>
                          <div className="flex justify-between text-coffee-500">
                            <span>Consumo actual:</span>
                            <span className="font-bold text-coffee-900 text-sm">
                              {formatCurrency(activeMesaTotal)}
                            </span>
                          </div>
                          {selectedMesa.updated_at && (
                            <div className="flex justify-between text-coffee-400 text-[11px] pt-1 border-t border-cream-200">
                              <span>Tiempo en salón:</span>
                              <span>
                                {timeAgo(selectedMesa.ocupado_desde || selectedMesa.updated_at)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Desglose de comandas en mesa */}
                        <div>
                          <span className="text-[11px] font-semibold text-coffee-600 block mb-2">
                            Platos en servicio:
                          </span>
                          {activeMesaOrders.length === 0 ? (
                            <p className="text-xs text-coffee-400 italic">
                              Mesa sin pedidos ingresados aún.
                            </p>
                          ) : (
                            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                              {activeMesaOrders.flatMap((p) => p.items || []).map((it, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center py-1 border-b border-cream-100 text-coffee-700"
                                >
                                  <span className="truncate pr-2">
                                    <strong>{it.cantidad}x</strong>{' '}
                                    {productos[it.producto_id]?.nombre ||
                                      `Ítem #${it.producto_id.slice(-4)}`}
                                  </span>
                                  <span className="font-mono text-coffee-500 text-[11px]">
                                    {formatCurrency(Number(it.precio_unitario) * it.cantidad)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Botones de acción */}
                        <div className="pt-2 flex flex-col gap-2">
                          <button
                            onClick={() => setSelectedMesaCuenta(selectedMesa)}
                            className="w-full py-2 text-xs font-semibold bg-coffee-800 hover:bg-coffee-900 text-white rounded-lg transition-colors cursor-pointer"
                          >
                            Ver cuenta / Cobrar
                          </button>
                          <button
                            onClick={() => handleReleaseMesa(selectedMesa)}
                            disabled={actionId === selectedMesa.id}
                            className="w-full py-2 text-xs font-medium text-coffee-600 hover:text-coffee-800 bg-cream-50 hover:bg-cream-100 border border-cream-200 rounded-lg transition-colors cursor-pointer"
                          >
                            {actionId === selectedMesa.id ? 'Liberando...' : 'Liberar mesa'}
                          </button>
                        </div>
                      </>
                    ) : selectedMesa.estado === 'libre' ? (
                      <div className="space-y-4 py-4 text-center">
                        <div className="p-4 rounded-xl bg-cream-50 border border-dashed border-cream-200">
                          <p className="text-xs font-medium text-coffee-600">
                            Mesa disponible para servicio
                          </p>
                          <p className="text-[11px] text-coffee-400 mt-1">
                            Asigna comensales para habilitar la toma de comandas.
                          </p>
                        </div>

                        <button
                          onClick={() => setMesaAsignar(selectedMesa)}
                          className="w-full py-2 text-xs font-semibold bg-coffee-800 hover:bg-coffee-900 text-white rounded-lg transition-colors cursor-pointer"
                        >
                          Asignar mesa a comensales
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 py-4 text-center">
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                          <p className="text-xs font-medium text-amber-800">
                            Mesa con reserva previa
                          </p>
                        </div>
                        <button
                          onClick={() => handleActivateMesa(selectedMesa)}
                          disabled={actionId === selectedMesa.id}
                          className="w-full py-2 text-xs font-semibold bg-coffee-800 hover:bg-coffee-900 text-white rounded-lg transition-colors cursor-pointer"
                        >
                          {actionId === selectedMesa.id ? 'Confirmando...' : 'Confirmar llegada'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-xs text-coffee-400 py-12">
                    Selecciona una mesa en el plano para ver su estado.
                  </p>
                )}
              </>
            )}

            {/* Vista 2: Feed de Alertas de Cocina y QR */}
            {tabFeed === 'alertas' && (
              <div className="space-y-3">
                {pedidosListos.length === 0 && pedidosPendientes.length === 0 ? (
                  <div className="py-12 text-center text-xs text-coffee-400">
                    No hay alertas pendientes en el salón.
                  </div>
                ) : (
                  <>
                    {pedidosListos.map((p) => {
                      const mesaCod = resolveMesaCodigo(p.mesa_id)
                      return (
                        <div
                          key={p.id}
                          className="p-3 rounded-lg border border-amber-300 bg-amber-50/50 space-y-2 text-xs"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-amber-900">Listo para servir</span>
                            <span className="text-amber-800 font-semibold">{mesaCod}</span>
                          </div>
                          <div className="space-y-0.5 text-coffee-600">
                            {p.items?.map((it, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>
                                  {it.cantidad}x{' '}
                                  {productos[it.producto_id]?.nombre ||
                                    `Ítem #${it.producto_id.slice(-4)}`}
                                </span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleUpdateEstadoPedido(p.id, 'entregado')}
                            disabled={actionId === p.id}
                            className="w-full py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors cursor-pointer"
                          >
                            Entregado a mesa
                          </button>
                        </div>
                      )
                    })}

                    {pedidosPendientes.map((p) => {
                      const mesaCod = resolveMesaCodigo(p.mesa_id)
                      return (
                        <div
                          key={p.id}
                          className="p-3 rounded-lg border border-cream-300 bg-cream-50/50 space-y-2 text-xs"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-coffee-800">Nuevo pedido QR</span>
                            <span className="text-coffee-700 font-semibold">{mesaCod}</span>
                          </div>
                          <div className="space-y-0.5 text-coffee-600">
                            {p.items?.map((it, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>
                                  {it.cantidad}x{' '}
                                  {productos[it.producto_id]?.nombre ||
                                    `Ítem #${it.producto_id.slice(-4)}`}
                                </span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleUpdateEstadoPedido(p.id, 'aceptado')}
                            disabled={actionId === p.id}
                            className="w-full py-1.5 text-xs font-medium bg-coffee-700 hover:bg-coffee-800 text-white rounded-md transition-colors cursor-pointer"
                          >
                            Enviar a cocina
                          </button>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Ver Cuenta y Cobro */}
      {selectedMesaCuenta && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-cream-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-cream-200">
              <div>
                <h3 className="text-base font-semibold text-coffee-800">
                  Cuenta Mesa {selectedMesaCuenta.codigo}
                </h3>
                <span className="text-xs text-coffee-400">Resumen para cierre y cobro</span>
              </div>
              <button
                onClick={() => setSelectedMesaCuenta(null)}
                className="text-coffee-400 hover:text-coffee-700 text-sm font-semibold p-1 cursor-pointer"
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
                className="flex-1 py-2 text-xs font-medium text-coffee-700 bg-white hover:bg-cream-100 border border-cream-200 rounded-lg transition-colors cursor-pointer"
              >
                Imprimir ticket
              </button>
              <button
                onClick={() => handleCobrarYLiberar(selectedMesaCuenta)}
                disabled={actionId === selectedMesaCuenta.id}
                className="flex-1 py-2 text-xs font-semibold bg-coffee-800 hover:bg-coffee-900 text-white rounded-lg transition-colors cursor-pointer"
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
              Confirmar comensales y marcar la mesa como ocupada en el plano.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setMesaAsignar(null)}
                className="flex-1 py-2 text-xs font-medium text-coffee-600 bg-white hover:bg-cream-100 border border-cream-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleActivateMesa(mesaAsignar)}
                disabled={actionId === mesaAsignar.id}
                className="flex-1 py-2 text-xs font-semibold bg-coffee-700 hover:bg-coffee-800 text-white rounded-lg transition-colors cursor-pointer"
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
