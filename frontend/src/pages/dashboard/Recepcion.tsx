import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import EstadoBadge from '../../components/EstadoBadge'
import { api, type Mesa, type Pedido, type Producto, type PedidoEstado } from '../../api'
import { useSocket } from '../../hooks/useSocket'

function timeAgo(iso: string) {
  const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(val)
}

// Chime sintetizado con Web Audio API (cero dependencias externas)
function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now) // D5
    gain1.gain.setValueAtTime(0.15, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.5)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now + 0.15) // A5
    gain2.gain.setValueAtTime(0.2, now + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.15)
    osc2.stop(now + 0.7)
  } catch {
    // Si el navegador bloquea audio sin interacción previa
  }
}

export default function RecepcionDashboard() {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [productos, setProductos] = useState<Record<string, Producto>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todas' | 'libre' | 'ocupada' | 'reservada'>('todas')
  const [search, setSearch] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString())
  const [selectedMesaCuenta, setSelectedMesaCuenta] = useState<Mesa | null>(null)
  const [mesaAsignar, setMesaAsignar] = useState<Mesa | null>(null)
  const [feedTab, setFeedTab] = useState<'alertas' | 'en_cocina'>('alertas')

  // Reloj en vivo
  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Carga inicial de datos
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

  // Escucha en tiempo real vía WebSockets
  const prevAlertCount = useRef(0)
  useSocket(
    useCallback(
      (channel: string) => {
        fetchAll()
        if (soundEnabled && (channel.includes('CREADO') || channel.includes('ESTADO_ACTUALIZADO'))) {
          playChime()
        }
      },
      [fetchAll, soundEnabled]
    )
  )

  // Mapas auxiliares para resolución rápida
  const mesasMap = useMemo(() => {
    const map: Record<string, Mesa> = {}
    for (const m of mesas) {
      map[m.id] = m
      map[m.codigo] = m
    }
    return map
  }, [mesas])

  const resolveMesaCodigo = useCallback(
    (mesaIdOrCodigo: string) => {
      return mesasMap[mesaIdOrCodigo]?.codigo ?? mesaIdOrCodigo
    },
    [mesasMap]
  )

  // Pedidos activos por mesa (excluyendo cancelados y entregados)
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

  // Cálculo de total acumulado por mesa
  const totalMesa = useCallback(
    (codigo: string) => {
      const peds = pedidosPorMesa[codigo] || []
      let total = 0
      for (const ped of peds) {
        if (!ped.items) continue
        for (const it of ped.items) {
          total += Number(it.precio_unitario || 0) * (it.cantidad || 1)
        }
      }
      return total
    },
    [pedidosPorMesa]
  )

  // Pedidos que requieren atención inmediata del Maître / Camareros
  const pedidosAlertas = useMemo(() => {
    return pedidos.filter((p) => p.estado === 'listo' || p.estado === 'pendiente')
  }, [pedidos])

  // Pedidos actualmente en preparación en cocina
  const pedidosEnCocina = useMemo(() => {
    return pedidos.filter((p) => p.estado === 'aceptado' || p.estado === 'preparando')
  }, [pedidos])

  // Sonar aviso si entra nueva alerta
  useEffect(() => {
    if (soundEnabled && pedidosAlertas.length > prevAlertCount.current) {
      playChime()
    }
    prevAlertCount.current = pedidosAlertas.length
  }, [pedidosAlertas.length, soundEnabled])

  // Acciones rápidas de mesas
  const handleActivateMesa = async (mesa: Mesa) => {
    setActionId(mesa.id)
    try {
      await api.mesas.activate(mesa.codigo)
      await fetchAll()
      setMesaAsignar(null)
    } catch (err: any) {
      alert('Error al asignar mesa: ' + (err?.message || 'Error'))
    } finally {
      setActionId(null)
    }
  }

  const handleReleaseMesa = async (mesa: Mesa) => {
    setActionId(mesa.id)
    try {
      await api.mesas.release(mesa.codigo)
      await fetchAll()
      if (selectedMesaCuenta?.id === mesa.id) {
        setSelectedMesaCuenta(null)
      }
    } catch (err: any) {
      alert('Error al liberar mesa: ' + (err?.message || 'Error'))
    } finally {
      setActionId(null)
    }
  }

  const handleCobrarYLiberar = async (mesa: Mesa) => {
    setActionId(mesa.id)
    try {
      // 1. Marcar todos los pedidos activos de la mesa como entregados/cerrados
      const peds = pedidosPorMesa[mesa.codigo] || []
      for (const p of peds) {
        if (p.estado !== 'entregado' && p.estado !== 'cancelado') {
          await api.pedidos.updateEstado(p.id, 'entregado').catch(() => {})
        }
      }
      // 2. Liberar la mesa
      await api.mesas.release(mesa.codigo)
      await fetchAll()
      setSelectedMesaCuenta(null)
    } catch (err: any) {
      alert('Error al procesar cobro: ' + (err?.message || 'Error'))
    } finally {
      setActionId(null)
    }
  }

  const handleUpdateEstadoPedido = async (pedidoId: string, nuevoEstado: PedidoEstado) => {
    setActionId(pedidoId)
    try {
      await api.pedidos.updateEstado(pedidoId, nuevoEstado)
      await fetchAll()
    } catch (err: any) {
      alert('Error al actualizar pedido: ' + (err?.message || 'Error'))
    } finally {
      setActionId(null)
    }
  }

  // Filtrado de mesas en el salón
  const filteredMesas = useMemo(() => {
    return mesas.filter((m) => {
      const matchFilter = filter === 'todas' || m.estado === filter
      const matchSearch =
        m.codigo.toLowerCase().includes(search.toLowerCase()) ||
        String(m.numero || '').includes(search)
      return matchFilter && matchSearch
    })
  }, [mesas, filter, search])

  // KPIs del turno
  const libres = mesas.filter((m) => m.estado === 'libre').length
  const ocupadas = mesas.filter((m) => m.estado === 'ocupada').length
  const reservadas = mesas.filter((m) => m.estado === 'reservada').length
  const tasaOcupacion = mesas.length > 0 ? Math.round((ocupadas / mesas.length) * 100) : 0

  const totalFacturadoTurno = useMemo(() => {
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
    <DashboardLayout title="Estación de Recepción y Maître">
      {/* Barra Superior de Control y Turno */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-cream-50 p-4 rounded-2xl border border-cream-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coffee-700 text-cream-100 flex items-center justify-center font-bold text-lg shadow-sm">
            🍽️
          </div>
          <div>
            <h2 className="text-base font-bold text-coffee-800 flex items-center gap-2">
              Salón Principal
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                En vivo
              </span>
            </h2>
            <p className="text-xs text-coffee-400">
              Control de flujo de comensales, comanda digital y cuentas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Reloj de turno */}
          <div className="px-3 py-1.5 rounded-xl bg-white border border-cream-300 text-xs font-mono font-bold text-coffee-700 shadow-xs">
            🕒 {clock}
          </div>

          {/* Toggle de audio */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled)
              if (!soundEnabled) playChime()
            }}
            title={soundEnabled ? 'Silenciar avisos sonoros' : 'Activar avisos sonoros'}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              soundEnabled
                ? 'bg-peach-50 border-peach-300 text-peach-700 shadow-xs'
                : 'bg-white border-cream-300 text-coffee-400'
            }`}
          >
            {soundEnabled ? '🔔 Alertas ON' : '🔕 Mute'}
          </button>

          {/* Recarga manual */}
          <button
            onClick={() => fetchAll()}
            disabled={loading}
            className="btn-secondary text-xs px-3 py-1.5"
            title="Refrescar datos"
          >
            {loading ? '...' : '↻ Refrescar'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
        <div className="card py-3 px-4 bg-white border-l-4 border-l-emerald-500">
          <p className="text-xs text-coffee-400 font-semibold uppercase tracking-wider">
            Mesas Libres
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-coffee-800">{libres}</span>
            <span className="text-xs text-emerald-600 font-medium">de {mesas.length} totales</span>
          </div>
        </div>

        <div className="card py-3 px-4 bg-white border-l-4 border-l-peach-500">
          <p className="text-xs text-coffee-400 font-semibold uppercase tracking-wider">
            En Servicio
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-peach-700">{ocupadas}</span>
            <span className="text-xs text-peach-600 font-medium">{tasaOcupacion}% ocupación</span>
          </div>
        </div>

        <div className="card py-3 px-4 bg-white border-l-4 border-l-amber-500">
          <p className="text-xs text-coffee-400 font-semibold uppercase tracking-wider">
            Platos Listos
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-700">
              {pedidos.filter((p) => p.estado === 'listo').length}
            </span>
            <span className="text-xs text-amber-600 font-medium">por servir a mesa</span>
          </div>
        </div>

        <div className="card py-3 px-4 bg-white border-l-4 border-l-coffee-500">
          <p className="text-xs text-coffee-400 font-semibold uppercase tracking-wider">
            En Cocina
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-coffee-700">{pedidosEnCocina.length}</span>
            <span className="text-xs text-coffee-400 font-medium">comandas activas</span>
          </div>
        </div>

        <div className="card py-3 px-4 bg-white border-l-4 border-l-coffee-700 col-span-2 md:col-span-4 lg:col-span-1">
          <p className="text-xs text-coffee-400 font-semibold uppercase tracking-wider">
            Consumo Turno
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-coffee-800 truncate">
              {formatCurrency(totalFacturadoTurno)}
            </span>
            <span className="text-xs text-coffee-400 font-medium">acumulado</span>
          </div>
        </div>
      </div>

      {/* Grid Principal: Salón (2/3) y Feed de Atención (1/3) */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Plano de Mesas del Salón */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-cream-200">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: 'todas', label: 'Todas', count: mesas.length },
                { key: 'libre', label: 'Libres', count: libres },
                { key: 'ocupada', label: 'Ocupadas', count: ocupadas },
                { key: 'reservada', label: 'Reservadas', count: reservadas },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    filter === key
                      ? 'bg-coffee-700 text-cream-100 shadow-xs'
                      : 'text-coffee-400 hover:text-coffee-700 hover:bg-cream-100'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-48">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar mesa..."
                className="w-full text-xs py-1.5 pl-7 pr-3 rounded-lg border border-cream-300 focus:outline-hidden focus:border-coffee-500 bg-cream-50"
              />
              <span className="absolute left-2.5 top-2 text-xs text-coffee-300">🔍</span>
            </div>
          </div>

          {/* Grid de Mesas */}
          {loading ? (
            <div className="flex justify-center py-24">
              <span className="spinner" />
            </div>
          ) : filteredMesas.length === 0 ? (
            <div className="card text-center py-16 border-dashed border-cream-300">
              <span className="text-4xl mb-2 block">🪑</span>
              <h3 className="font-semibold text-coffee-700 mb-1">
                No se encontraron mesas para este filtro
              </h3>
              <p className="text-xs text-coffee-300">
                Cambia el filtro o registra nuevas mesas en el panel de Mesas y QR.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMesas.map((mesa) => {
                const peds = pedidosPorMesa[mesa.codigo] || []
                const consumoActual = totalMesa(mesa.codigo)
                const isOcupada = mesa.estado === 'ocupada'
                const isLibre = mesa.estado === 'libre'
                const isReservada = mesa.estado === 'reservada'

                return (
                  <div
                    key={mesa.id}
                    className={`card relative p-4 transition-all duration-200 flex flex-col justify-between ${
                      isOcupada
                        ? 'border-peach-300 bg-gradient-to-br from-white via-peach-50/20 to-peach-50/50 shadow-md ring-1 ring-peach-200'
                        : isLibre
                        ? 'border-cream-300 bg-white hover:border-emerald-300 hover:shadow-md'
                        : 'border-coffee-200 bg-coffee-50/40'
                    }`}
                  >
                    {/* Header de la tarjeta */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-xs ${
                              isOcupada
                                ? 'bg-peach-600 text-white'
                                : isLibre
                                ? 'bg-emerald-600 text-white'
                                : 'bg-coffee-600 text-white'
                            }`}
                          >
                            {mesa.numero || mesa.codigo.replace(/\D/g, '') || '•'}
                          </span>
                          <div>
                            <h3 className="font-bold text-coffee-800 text-sm">{mesa.codigo}</h3>
                            <span className="text-[10px] text-coffee-300 uppercase tracking-wider font-semibold">
                              {mesa.codigo.toLowerCase().includes('terraza')
                                ? 'Terraza Exterior'
                                : 'Salón Principal'}
                            </span>
                          </div>
                        </div>

                        {/* Badge de Estado con Pulso */}
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                            isOcupada
                              ? 'bg-peach-100 text-peach-700'
                              : isLibre
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-coffee-100 text-coffee-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOcupada
                                ? 'bg-peach-500 animate-ping'
                                : isLibre
                                ? 'bg-emerald-500'
                                : 'bg-coffee-400'
                            }`}
                          />
                          {mesa.estado}
                        </span>
                      </div>

                      {/* Información de consumo / tiempo */}
                      {isOcupada && (
                        <div className="mt-3 p-2.5 rounded-xl bg-white border border-peach-200/80 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-coffee-400">Comandas activas:</span>
                            <span className="font-bold text-coffee-700">
                              {peds.length} {peds.length === 1 ? 'pedido' : 'pedidos'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-coffee-400">Consumo acumulado:</span>
                            <span className="font-black text-peach-700 text-sm">
                              {formatCurrency(consumoActual)}
                            </span>
                          </div>
                          {mesa.updated_at && (
                            <div className="flex items-center justify-between text-[11px] text-coffee-300 pt-1 border-t border-cream-200">
                              <span>Tiempo en salón:</span>
                              <span className="font-medium">
                                Hace {timeAgo(mesa.ocupado_desde || mesa.updated_at)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {isLibre && (
                        <div className="mt-3 p-3 rounded-xl bg-cream-50 border border-dashed border-cream-300 text-center">
                          <p className="text-xs text-coffee-400 font-medium">Mesa disponible</p>
                          <p className="text-[11px] text-coffee-300 mt-0.5">
                            Lista para recibir comensales
                          </p>
                        </div>
                      )}

                      {isReservada && (
                        <div className="mt-3 p-3 rounded-xl bg-coffee-50 border border-coffee-200 text-center">
                          <p className="text-xs font-semibold text-coffee-700">Mesa Reservada</p>
                          <p className="text-[11px] text-coffee-400 mt-0.5">
                            Pendiente llegada del cliente
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Botonera de acciones por mesa */}
                    <div className="mt-4 pt-3 border-t border-cream-200 flex gap-2">
                      {isLibre && (
                        <button
                          onClick={() => setMesaAsignar(mesa)}
                          className="btn-primary text-xs w-full py-2"
                        >
                          Asignar Mesa
                        </button>
                      )}

                      {isOcupada && (
                        <>
                          <button
                            onClick={() => setSelectedMesaCuenta(mesa)}
                            className="btn-primary text-xs flex-1 py-1.5 bg-peach-600 hover:bg-peach-700 border-none shadow-sm"
                          >
                            🧾 Ver Cuenta
                          </button>
                          <button
                            onClick={() => handleReleaseMesa(mesa)}
                            disabled={actionId === mesa.id}
                            className="btn-secondary text-xs px-2.5 py-1.5 text-coffee-400 hover:text-coffee-700"
                            title="Liberar mesa sin cerrar cuenta"
                          >
                            {actionId === mesa.id ? '...' : 'Liberar'}
                          </button>
                        </>
                      )}

                      {isReservada && (
                        <button
                          onClick={() => handleActivateMesa(mesa)}
                          disabled={actionId === mesa.id}
                          className="btn-primary text-xs w-full py-2"
                        >
                          Confirmar Llegada
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha: Feed en Vivo y Alertas de Servicio */}
        <div className="space-y-4">
          <div className="card p-4 bg-white shadow-sm border border-cream-200">
            {/* Tabs del Feed */}
            <div className="flex items-center justify-between border-b border-cream-200 pb-3 mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setFeedTab('alertas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    feedTab === 'alertas'
                      ? 'bg-amber-100 text-amber-900'
                      : 'text-coffee-400 hover:text-coffee-700'
                  }`}
                >
                  ⚡ Alertas
                  {pedidosAlertas.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
                      {pedidosAlertas.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setFeedTab('en_cocina')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    feedTab === 'en_cocina'
                      ? 'bg-coffee-100 text-coffee-800'
                      : 'text-coffee-400 hover:text-coffee-700'
                  }`}
                >
                  👨‍🍳 En Cocina ({pedidosEnCocina.length})
                </button>
              </div>
            </div>

            {/* Contenido del Feed */}
            {feedTab === 'alertas' && (
              <div className="space-y-3">
                {pedidosAlertas.length === 0 ? (
                  <div className="text-center py-12 text-coffee-300">
                    <span className="text-3xl block mb-2">✨</span>
                    <p className="text-xs font-semibold text-coffee-600">Salón al día</p>
                    <p className="text-[11px] text-coffee-300 mt-1">
                      No hay pedidos pendientes de confirmación ni platos esperando ser servidos.
                    </p>
                  </div>
                ) : (
                  pedidosAlertas.map((pedido) => {
                    const mesaCod = resolveMesaCodigo(pedido.mesa_id)
                    const isListo = pedido.estado === 'listo'
                    const isPendiente = pedido.estado === 'pendiente'

                    return (
                      <div
                        key={pedido.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isListo
                            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200'
                            : 'bg-peach-50/60 border-peach-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{isListo ? '🔔' : '📲'}</span>
                            <div>
                              <p className="text-xs font-black text-coffee-800">
                                {isListo ? '¡Listo para servir!' : 'Nuevo Pedido QR'}
                              </p>
                              <p className="text-[11px] font-bold text-coffee-600">
                                Mesa {mesaCod}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-coffee-400 font-mono">
                            {timeAgo(pedido.created_at)}
                          </span>
                        </div>

                        {/* Lista de ítems del pedido con nombres reales */}
                        <div className="my-2.5 py-2 px-2.5 rounded-lg bg-white/80 border border-cream-200 text-xs space-y-1">
                          {pedido.items && pedido.items.length > 0 ? (
                            pedido.items.map((it, idx) => {
                              const prod = productos[it.producto_id]
                              return (
                                <div key={idx} className="flex justify-between items-center text-coffee-700">
                                  <span className="font-medium truncate pr-2">
                                    <strong className="text-peach-700">{it.cantidad}x</strong>{' '}
                                    {prod ? prod.nombre : `Ítem #${it.producto_id.slice(-4)}`}
                                  </span>
                                  <span className="text-coffee-400 font-mono text-[11px]">
                                    {formatCurrency(Number(it.precio_unitario) * it.cantidad)}
                                  </span>
                                </div>
                              )
                            })
                          ) : (
                            <span className="text-coffee-300 italic text-[11px]">Sin ítems detallados</span>
                          )}
                        </div>

                        {/* Botón de acción rápida */}
                        <div className="flex justify-end gap-2 pt-1">
                          {isListo && (
                            <button
                              onClick={() => handleUpdateEstadoPedido(pedido.id, 'entregado')}
                              disabled={actionId === pedido.id}
                              className="btn-primary text-xs py-1.5 px-3 bg-amber-600 hover:bg-amber-700 border-none shadow-xs font-bold"
                            >
                              ✓ Marcar Entregado a Mesa
                            </button>
                          )}
                          {isPendiente && (
                            <button
                              onClick={() => handleUpdateEstadoPedido(pedido.id, 'aceptado')}
                              disabled={actionId === pedido.id}
                              className="btn-primary text-xs py-1.5 px-3 bg-peach-600 hover:bg-peach-700 border-none shadow-xs font-bold"
                            >
                              ✓ Aceptar a Cocina
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {feedTab === 'en_cocina' && (
              <div className="space-y-3">
                {pedidosEnCocina.length === 0 ? (
                  <div className="text-center py-12 text-coffee-300">
                    <p className="text-xs font-semibold text-coffee-600">Cocina despejada</p>
                    <p className="text-[11px] text-coffee-300 mt-1">
                      No hay pedidos en preparación en este instante.
                    </p>
                  </div>
                ) : (
                  pedidosEnCocina.map((pedido) => {
                    const mesaCod = resolveMesaCodigo(pedido.mesa_id)
                    return (
                      <div
                        key={pedido.id}
                        className="p-3 rounded-xl border border-cream-300 bg-cream-50/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-coffee-800">Mesa {mesaCod}</span>
                          <EstadoBadge estado={pedido.estado} />
                        </div>
                        <div className="text-xs text-coffee-500 space-y-0.5">
                          {pedido.items?.map((it, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>
                                {it.cantidad}x{' '}
                                {productos[it.producto_id]?.nombre || `Ítem #${it.producto_id.slice(-4)}`}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="text-[10px] text-coffee-300 text-right">
                          En marcha hace {timeAgo(pedido.created_at)}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: Ver Cuenta y Cobro de Mesa */}
      {selectedMesaCuenta && (
        <div className="fixed inset-0 z-50 bg-coffee-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-cream-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-cream-200 pb-3 mb-4">
              <div>
                <span className="text-[11px] font-bold text-peach-700 uppercase tracking-wider">
                  Ticket y Facturación
                </span>
                <h3 className="text-xl font-black text-coffee-800">
                  Mesa {selectedMesaCuenta.codigo}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMesaCuenta(null)}
                className="w-8 h-8 rounded-full bg-cream-100 hover:bg-cream-200 text-coffee-400 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Listado consolidado de comandas de la mesa */}
            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {(pedidosPorMesa[selectedMesaCuenta.codigo] || []).length === 0 ? (
                <p className="text-center text-xs text-coffee-300 py-8">
                  No hay pedidos registrados para esta mesa.
                </p>
              ) : (
                (pedidosPorMesa[selectedMesaCuenta.codigo] || []).map((pedido, pIdx) => (
                  <div key={pedido.id} className="p-3 rounded-xl bg-cream-50 border border-cream-200">
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="font-bold text-coffee-700">Comanda #{pIdx + 1}</span>
                      <span className="text-[11px] text-coffee-300">
                        {new Date(pedido.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="divide-y divide-cream-200 text-xs">
                      {pedido.items?.map((it, idx) => {
                        const prod = productos[it.producto_id]
                        const sub = Number(it.precio_unitario) * it.cantidad
                        return (
                          <div key={idx} className="py-1.5 flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-coffee-800">
                                {it.cantidad}x {prod ? prod.nombre : `Plato #${it.producto_id.slice(-4)}`}
                              </p>
                              <p className="text-[10px] text-coffee-400">
                                {formatCurrency(Number(it.precio_unitario))} c/u
                              </p>
                            </div>
                            <span className="font-mono font-bold text-coffee-700">
                              {formatCurrency(sub)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totales y Liquidación */}
            {(() => {
              const subtotal = totalMesa(selectedMesaCuenta.codigo)
              const propinaSugerida = subtotal * 0.1
              const totalConServicio = subtotal + propinaSugerida

              return (
                <div className="mt-4 pt-3 border-t border-cream-200 space-y-2 bg-cream-50/50 p-4 rounded-2xl">
                  <div className="flex justify-between text-xs text-coffee-600">
                    <span>Subtotal consumo:</span>
                    <span className="font-mono font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-coffee-400">
                    <span>Propina sugerida (10%):</span>
                    <span className="font-mono">{formatCurrency(propinaSugerida)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-coffee-900 pt-2 border-t border-cream-200">
                    <span>Total a pagar:</span>
                    <span className="text-peach-700">{formatCurrency(totalConServicio)}</span>
                  </div>
                </div>
              )
            })()}

            {/* Acciones de Cobro */}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                className="btn-secondary text-xs flex-1 py-2.5"
              >
                🖨️ Imprimir Pre-cuenta
              </button>
              <button
                onClick={() => handleCobrarYLiberar(selectedMesaCuenta)}
                disabled={actionId === selectedMesaCuenta.id}
                className="btn-primary text-xs flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 border-none font-bold"
              >
                {actionId === selectedMesaCuenta.id ? 'Procesando...' : '💰 Cobrar y Liberar Mesa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Asignar Mesa / Sentar Comensales */}
      {mesaAsignar && (
        <div className="fixed inset-0 z-50 bg-coffee-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-cream-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-black text-coffee-800 mb-1">
              Asignar Mesa {mesaAsignar.codigo}
            </h3>
            <p className="text-xs text-coffee-400 mb-5">
              Confirmar comensales y marcar la mesa como ocupada en el salón.
            </p>

            <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 mb-5 text-center">
              <span className="text-3xl block mb-1">👥</span>
              <p className="text-xs font-semibold text-coffee-700">
                La mesa pasará a estado <strong>ocupada</strong>
              </p>
              <p className="text-[11px] text-coffee-300 mt-1">
                Los comensales podrán ordenar escaneando el código QR de la mesa.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setMesaAsignar(null)}
                className="btn-secondary text-xs flex-1 py-2"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleActivateMesa(mesaAsignar)}
                disabled={actionId === mesaAsignar.id}
                className="btn-primary text-xs flex-1 py-2"
              >
                {actionId === mesaAsignar.id ? 'Asignando...' : 'Confirmar Ingreso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
