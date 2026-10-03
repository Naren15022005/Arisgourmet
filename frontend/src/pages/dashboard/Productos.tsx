import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { api, type Producto } from '../../api'

export default function ProductosDashboard() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [tiempoMinutos, setTiempoMinutos] = useState('10')

  const fetchProductos = useCallback(async () => {
    try {
      const data = await api.productos.list()
      setProductos(data)
    } catch (err: any) {
      setError(err?.message || 'Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProductos()
  }, [fetchProductos])

  const handleToggle = async (p: Producto) => {
    setTogglingId(p.id)
    try {
      await api.productos.toggle(p.id)
      setProductos((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, disponible: !item.disponible } : item))
      )
    } catch (err: any) {
      alert('Error al cambiar disponibilidad: ' + (err?.message || 'Error'))
    } finally {
      setTogglingId(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !precio) return
    setSubmitting(true)
    try {
      await api.productos.create({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        precio: parseFloat(precio),
        tiempo_base_minutos: parseInt(tiempoMinutos, 10) || 10,
        disponible: true,
      })
      setNombre('')
      setDescripcion('')
      setPrecio('')
      setTiempoMinutos('10')
      setModalOpen(false)
      await fetchProductos()
    } catch (err: any) {
      alert('Error al crear producto: ' + (err?.message || 'Error'))
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(search.toLowerCase()))
  )

  const disponiblesCount = productos.filter((p) => p.disponible).length
  const agotadosCount = productos.length - disponiblesCount

  return (
    <DashboardLayout title="Menú y Catálogo de Platillos">
      {/* Top action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-coffee-700">Carta del Restaurante</h2>
          <p className="text-sm text-coffee-300">
            Administra los platillos, precios y disponibilidad en tiempo real para el menú QR.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center gap-2 self-start md:self-auto shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Platillo
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-coffee-300 font-medium uppercase tracking-wide mb-1">
            Total en Carta
          </p>
          <p className="text-3xl font-bold text-coffee-700">{productos.length}</p>
          <span className="text-xs text-coffee-200">platillos registrados</span>
        </div>
        <div className="card">
          <p className="text-xs text-coffee-300 font-medium uppercase tracking-wide mb-1">
            Disponibles
          </p>
          <p className="text-3xl font-bold text-peach-600">{disponiblesCount}</p>
          <span className="text-xs text-coffee-200">activos para pedir</span>
        </div>
        <div className="card">
          <p className="text-xs text-coffee-300 font-medium uppercase tracking-wide mb-1">
            Pausados / Agotados
          </p>
          <p className="text-3xl font-bold text-coffee-400">{agotadosCount}</p>
          <span className="text-xs text-coffee-200">ocultos en QR</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-card mb-6 flex items-center gap-3">
        <svg className="w-5 h-5 text-coffee-200 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Buscar platillo por nombre o ingrediente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm bg-transparent outline-none text-coffee-700 placeholder:text-coffee-200"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-coffee-300 hover:text-coffee-500 font-medium px-2 py-1"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="spinner" />
        </div>
      ) : error ? (
        <div className="card border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 border-dashed border-cream-300">
          <div className="w-12 h-12 rounded-full bg-cream-200 text-coffee-400 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-coffee-700 mb-1">No se encontraron platillos</h3>
          <p className="text-xs text-coffee-300 max-w-sm mx-auto mb-4">
            {search ? 'Intenta buscar con otro término.' : 'Comienza agregando tu primer producto a la carta digital.'}
          </p>
          <button onClick={() => setModalOpen(true)} className="btn-secondary text-xs">
            + Agregar Platillo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <div
              key={p.id}
              className={`card flex flex-col justify-between transition-all duration-150 ${
                !p.disponible ? 'opacity-60 bg-cream-50 border-cream-200' : 'hover:border-peach-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-coffee-700 text-base leading-snug">{p.nombre}</h3>
                  <span className="font-extrabold text-peach-600 text-lg">
                    ${Number(p.precio).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-coffee-300 line-clamp-2 mb-4 leading-relaxed">
                  {p.descripcion || 'Sin descripción detallada.'}
                </p>
              </div>

              <div className="pt-4 border-t border-cream-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      p.disponible ? 'bg-emerald-500' : 'bg-rose-400'
                    }`}
                  />
                  <span className="text-xs font-medium text-coffee-400">
                    {p.disponible ? 'Disponible' : 'Agotado'}
                  </span>
                  <span className="text-xs text-coffee-200 ml-1">
                    ⏱ {p.tiempo_base_minutos || 10} min
                  </span>
                </div>

                <button
                  onClick={() => handleToggle(p)}
                  disabled={togglingId === p.id}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    p.disponible
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {togglingId === p.id ? '...' : p.disponible ? 'Pausar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo Platillo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-900/40 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 bg-white shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-cream-200 mb-5">
              <h3 className="font-bold text-lg text-coffee-700">Nuevo Platillo</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-coffee-300 hover:text-coffee-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-coffee-600 uppercase tracking-wide mb-1.5">
                  Nombre del platillo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Hamburguesa Gourmet Angus"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-coffee-600 uppercase tracking-wide mb-1.5">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Ingredientes, preparación, acompañamientos..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="input-field resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-coffee-600 uppercase tracking-wide mb-1.5">
                    Precio ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="Ej. 14.50"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-coffee-600 uppercase tracking-wide mb-1.5">
                    Tiempo Prep. (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tiempoMinutos}
                    onChange={(e) => setTiempoMinutos(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-cream-200 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-ghost text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs"
                >
                  {submitting ? 'Guardando...' : 'Crear Platillo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
