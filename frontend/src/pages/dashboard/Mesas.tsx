import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { api, type Mesa } from '../../api'
import { useSocket } from '../../hooks/useSocket'

export default function MesasDashboard() {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todos' | 'libre' | 'ocupada' | 'reservada'>('todos')
  const [modalCreate, setModalCreate] = useState(false)
  const [codigoMesa, setCodigoMesa] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedMesaQR, setSelectedMesaQR] = useState<Mesa | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const fetchMesas = useCallback(async () => {
    try {
      const data = await api.mesas.list()
      setMesas(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMesas()
  }, [fetchMesas])

  useSocket(
    useCallback(
      (channel: string) => {
        if (channel.startsWith('mesa:')) fetchMesas()
      },
      [fetchMesas]
    )
  )

  const handleCreateMesa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigoMesa.trim()) return
    setSubmitting(true)
    try {
      await api.mesas.create(codigoMesa.trim().toUpperCase())
      setCodigoMesa('')
      setModalCreate(false)
      await fetchMesas()
    } catch (err: any) {
      alert('Error al crear mesa: ' + (err?.message || 'Error'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleEstado = async (mesa: Mesa) => {
    setActionId(mesa.id)
    try {
      if (mesa.estado === 'ocupada') {
        await api.mesas.release(mesa.codigo)
      } else {
        await api.mesas.activate(mesa.codigo)
      }
      await fetchMesas()
    } catch (err: any) {
      alert('Error al actualizar estado: ' + (err?.message || 'Error'))
    } finally {
      setActionId(null)
    }
  }

  const filtered = mesas.filter((m) => filter === 'todos' || m.estado === filter)

  const libres = mesas.filter((m) => m.estado === 'libre').length
  const ocupadas = mesas.filter((m) => m.estado === 'ocupada').length
  const reservadas = mesas.filter((m) => m.estado === 'reservada').length

  const getQRUrl = (codigo: string) => {
    const origin = window.location.origin
    const targetUrl = `${origin}/mesa/${encodeURIComponent(codigo)}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
      targetUrl
    )}`
  }

  return (
    <DashboardLayout title="Salón y Mesas">
      {/* Top action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-coffee-700">Control de Mesas y Códigos QR</h2>
          <p className="text-sm text-coffee-300">
            Monitorea el salón en tiempo real y descarga los códigos QR para que tus comensales ordenen.
          </p>
        </div>
        <button
          onClick={() => setModalCreate(true)}
          className="btn-primary flex items-center gap-2 self-start md:self-auto shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Mesa
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-coffee-300 font-medium uppercase tracking-wide mb-1">
            Total Mesas
          </p>
          <p className="text-3xl font-bold text-coffee-700">{mesas.length}</p>
          <span className="text-xs text-coffee-200">en el salón</span>
        </div>
        <div className="card">
          <p className="text-xs text-coffee-300 font-medium uppercase tracking-wide mb-1">Libres</p>
          <p className="text-3xl font-bold text-emerald-600">{libres}</p>
          <span className="text-xs text-coffee-200">disponibles</span>
        </div>
        <div className="card">
          <p className="text-xs text-coffee-300 font-medium uppercase tracking-wide mb-1">
            Ocupadas
          </p>
          <p className="text-3xl font-bold text-peach-600">{ocupadas}</p>
          <span className="text-xs text-coffee-200">comensales comiendo</span>
        </div>
        <div className="card">
          <p className="text-xs text-coffee-300 font-medium uppercase tracking-wide mb-1">
            Reservadas
          </p>
          <p className="text-3xl font-bold text-coffee-400">{reservadas}</p>
          <span className="text-xs text-coffee-200">apartadas</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-cream-200 pb-3">
        {(['todos', 'libre', 'ocupada', 'reservada'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              filter === st
                ? 'bg-coffee-700 text-cream-100 shadow-sm'
                : 'text-coffee-300 hover:text-coffee-600 hover:bg-cream-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Mesas Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 border-dashed border-cream-300">
          <h3 className="font-semibold text-coffee-700 mb-1">No hay mesas con este filtro</h3>
          <p className="text-xs text-coffee-300 mb-4">
            Puedes crear nuevas mesas para comenzar a recibir comensales.
          </p>
          <button onClick={() => setModalCreate(true)} className="btn-secondary text-xs">
            + Registrar Mesa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((mesa) => {
            const isOcupada = mesa.estado === 'ocupada'
            return (
              <div
                key={mesa.id}
                className={`card flex flex-col justify-between transition-all duration-200 border-2 ${
                  isOcupada
                    ? 'border-peach-300 bg-peach-50/30'
                    : 'border-cream-200 hover:border-coffee-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cream-200 text-coffee-700">
                      {mesa.codigo}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isOcupada
                          ? 'bg-peach-100 text-peach-700'
                          : mesa.estado === 'reservada'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOcupada
                            ? 'bg-peach-500 animate-pulse'
                            : mesa.estado === 'reservada'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      {mesa.estado.toUpperCase()}
                    </span>
                  </div>

                  <div className="my-4 flex items-center justify-center p-3 bg-white rounded-xl border border-cream-200">
                    <img
                      src={getQRUrl(mesa.codigo)}
                      alt={`QR ${mesa.codigo}`}
                      className="w-24 h-24 object-contain rounded"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-cream-200">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedMesaQR(mesa)}
                      className="btn-secondary text-xs px-2 py-1.5 flex items-center justify-center gap-1"
                      title="Ver e imprimir QR"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        />
                      </svg>
                      Ver QR
                    </button>
                    <a
                      href={`/mesa/${encodeURIComponent(mesa.codigo)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost text-xs px-2 py-1.5 flex items-center justify-center gap-1 text-center"
                    >
                      Abrir menú ↗
                    </a>
                  </div>

                  <button
                    onClick={() => handleToggleEstado(mesa)}
                    disabled={actionId === mesa.id}
                    className={`w-full text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                      isOcupada
                        ? 'bg-coffee-100 text-coffee-700 hover:bg-coffee-200'
                        : 'bg-peach-50 text-peach-600 hover:bg-peach-100 border border-peach-200'
                    }`}
                  >
                    {actionId === mesa.id
                      ? 'Procesando...'
                      : isOcupada
                      ? 'Liberar Mesa'
                      : 'Marcar Ocupada'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Nueva Mesa */}
      {modalCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-900/40 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6 bg-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200 mb-4">
              <h3 className="font-bold text-lg text-coffee-700">Registrar Mesa</h3>
              <button
                onClick={() => setModalCreate(false)}
                className="text-coffee-300 hover:text-coffee-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateMesa} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-coffee-600 uppercase tracking-wide mb-1.5">
                  Código o Identificador *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. MESA-3 o TERRAZA-1"
                  value={codigoMesa}
                  onChange={(e) => setCodigoMesa(e.target.value)}
                  className="input-field uppercase"
                />
                <p className="text-[11px] text-coffee-300 mt-1">
                  Este código identificará la mesa en los pedidos y generará el link del QR.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setModalCreate(false)}
                  className="btn-ghost text-xs"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs">
                  {submitting ? 'Creando...' : 'Crear Mesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visor e Impresión de QR */}
      {selectedMesaQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-900/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 bg-white shadow-2xl text-center">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200 mb-4">
              <span className="text-xs font-bold text-peach-600 uppercase tracking-wider">
                Tarjeta de Mesa para Imprimir
              </span>
              <button
                onClick={() => setSelectedMesaQR(null)}
                className="text-coffee-300 hover:text-coffee-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Printable Card */}
            <div
              id="printable-qr"
              className="p-8 border-2 border-dashed border-coffee-400 rounded-3xl bg-cream-50 my-2 flex flex-col items-center shadow-inner"
            >
              <p className="text-xs font-bold tracking-widest text-coffee-300 uppercase mb-1">
                ARISGOURMET
              </p>
              <h2 className="text-2xl font-black text-coffee-700 mb-1">{selectedMesaQR.codigo}</h2>
              <p className="text-xs text-coffee-400 mb-4">Escanea para ver la carta y ordenar</p>

              <div className="bg-white p-3 rounded-2xl shadow-sm border border-cream-300 mb-4">
                <img
                  src={getQRUrl(selectedMesaQR.codigo)}
                  alt="Código QR"
                  className="w-48 h-48 object-contain"
                />
              </div>

              <span className="text-[11px] font-mono text-coffee-300 bg-cream-200 px-3 py-1 rounded-full">
                {window.location.origin}/mesa/{selectedMesaQR.codigo}
              </span>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3 mt-4 border-t border-cream-200">
              <button
                onClick={() => window.print()}
                className="btn-primary text-xs flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Imprimir Tarjeta
              </button>
              <button onClick={() => setSelectedMesaQR(null)} className="btn-secondary text-xs">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
