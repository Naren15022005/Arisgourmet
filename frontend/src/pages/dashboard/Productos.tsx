import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import {
  api,
  type Producto,
  type ProductoCategoria,
  type MenuDelDiaDetalles,
} from '../../api'

type TabType = 'menu_del_dia' | 'plato_fuerte' | 'extra' | 'bebida' | 'postre'

interface TabConfig {
  id: TabType
  label: string
  icon: string
  singular: string
  description: string
}

const TABS: TabConfig[] = [
  {
    id: 'menu_del_dia',
    label: 'Menú del Día',
    icon: '☀️',
    singular: 'Menú del Día',
    description: 'Oferta especial configurada a partir de los platillos, entradas y bebidas de la carta.',
  },
  {
    id: 'plato_fuerte',
    label: 'Platos Fuertes',
    icon: '🥩',
    singular: 'Plato Fuerte',
    description: 'Platos principales gourmet, carnes, pescados, pastas y especialidades.',
  },
  {
    id: 'extra',
    label: 'Extras y Entradas',
    icon: '🥗',
    singular: 'Extra o Entrada',
    description: 'Acompañamientos, ensaladas, tapas y porciones adicionales.',
  },
  {
    id: 'bebida',
    label: 'Bebidas',
    icon: '🍹',
    singular: 'Bebida',
    description: 'Jugos naturales, cócteles, vinos, cervezas y refrescos.',
  },
  {
    id: 'postre',
    label: 'Postres',
    icon: '🍰',
    singular: 'Postre',
    description: 'Dulces artesanales, tartas, helados y café de especialidad.',
  },
]

export default function ProductosDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()

  // 1. Pestaña activa persistida en URL y localStorage
  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    const fromUrl = searchParams.get('tab') as TabType
    if (TABS.some((t) => t.id === fromUrl)) return fromUrl
    try {
      const stored = localStorage.getItem('aris_menu_tab') as TabType
      if (TABS.some((t) => t.id === stored)) return stored
    } catch {}
    return 'menu_del_dia'
  })

  const setActiveTab = useCallback(
    (tab: TabType) => {
      setActiveTabState(tab)
      try {
        localStorage.setItem('aris_menu_tab', tab)
      } catch {}
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('tab', tab)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  useEffect(() => {
    const fromUrl = searchParams.get('tab') as TabType
    if (TABS.some((t) => t.id === fromUrl)) {
      if (fromUrl !== activeTab) {
        setActiveTabState(fromUrl)
        try {
          localStorage.setItem('aris_menu_tab', fromUrl)
        } catch {}
      }
    } else {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('tab', activeTab)
          return next
        },
        { replace: true }
      )
    }
  }, [searchParams, activeTab, setSearchParams])

  // Datos de productos
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Modal para Crear / Editar Producto individual
  const [modalItemOpen, setModalItemOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Producto | null>(null)
  const [itemNombre, setItemNombre] = useState('')
  const [itemDescripcion, setItemDescripcion] = useState('')
  const [itemPrecio, setItemPrecio] = useState('')
  const [itemTiempo, setItemTiempo] = useState('15')
  const [itemCategoria, setItemCategoria] = useState<TabType>('plato_fuerte')

  // Estado del Constructor de Menú del Día
  const [builderOpen, setBuilderOpen] = useState(false)
  const [menuDiaNombre, setMenuDiaNombre] = useState('Menú Ejecutivo del Día')
  const [menuDiaDescripcion, setMenuDiaDescripcion] = useState(
    'Incluye 1 plato fuerte a elección, acompañamiento o ensalada, bebida y postre del día.'
  )
  const [menuDiaPrecio, setMenuDiaPrecio] = useState('18.00')
  const [menuDiaTiempo, setMenuDiaTiempo] = useState('15')
  const [selectedPlatosFuertes, setSelectedPlatosFuertes] = useState<string[]>([])
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [selectedBebidas, setSelectedBebidas] = useState<string[]>([])
  const [selectedPostres, setSelectedPostres] = useState<string[]>([])

  const fetchProductos = useCallback(async () => {
    try {
      const data = await api.productos.list()
      setProductos(data)
    } catch (err: any) {
      console.error('Error al cargar productos', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProductos()
  }, [fetchProductos])

  // Segmentación por categorías
  const platosFuertes = useMemo(
    () => productos.filter((p) => (p.categoria || 'plato_fuerte') === 'plato_fuerte'),
    [productos]
  )
  const extras = useMemo(
    () => productos.filter((p) => p.categoria === 'extra'),
    [productos]
  )
  const bebidas = useMemo(
    () => productos.filter((p) => p.categoria === 'bebida'),
    [productos]
  )
  const postres = useMemo(
    () => productos.filter((p) => p.categoria === 'postre'),
    [productos]
  )
  const menusDelDia = useMemo(
    () => productos.filter((p) => p.categoria === 'menu_del_dia'),
    [productos]
  )
  const activeMenuDia = menusDelDia[0] || null

  // Abrir modal de creación para la categoría actual
  const handleOpenCreateModal = (cat?: TabType) => {
    const targetCat = cat && cat !== 'menu_del_dia' ? cat : activeTab === 'menu_del_dia' ? 'plato_fuerte' : activeTab
    setEditingItem(null)
    setItemNombre('')
    setItemDescripcion('')
    setItemPrecio('')
    setItemTiempo('15')
    setItemCategoria(targetCat)
    setModalItemOpen(true)
  }

  // Abrir modal de edición
  const handleOpenEditModal = (p: Producto) => {
    setEditingItem(p)
    setItemNombre(p.nombre)
    setItemDescripcion(p.descripcion || '')
    setItemPrecio(p.precio ? p.precio.toString() : '0')
    setItemTiempo(p.tiempo_base_minutos ? p.tiempo_base_minutos.toString() : '15')
    setItemCategoria((p.categoria as TabType) || 'plato_fuerte')
    setModalItemOpen(true)
  }

  // Guardar (crear o editar) producto individual
  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemNombre.trim() || !itemPrecio) return
    setSubmitting(true)
    try {
      const payload = {
        nombre: itemNombre.trim(),
        descripcion: itemDescripcion.trim() || undefined,
        precio: parseFloat(itemPrecio) || 0,
        tiempo_base_minutos: parseInt(itemTiempo, 10) || 15,
        categoria: itemCategoria,
      }
      if (editingItem) {
        await api.productos.update(editingItem.id, payload)
      } else {
        await api.productos.create({ ...payload, disponible: true })
      }
      setModalItemOpen(false)
      await fetchProductos()
    } catch (err: any) {
      alert('Error al guardar platillo: ' + (err?.message || 'Error'))
    } finally {
      setSubmitting(false)
    }
  }

  // Alternar disponibilidad
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

  // Eliminar producto
  const handleDelete = async (p: Producto) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${p.nombre}"?`)) return
    setDeletingId(p.id)
    try {
      await api.productos.delete(p.id)
      setProductos((prev) => prev.filter((item) => item.id !== p.id))
    } catch (err: any) {
      alert('Error al eliminar producto: ' + (err?.message || 'Error'))
    } finally {
      setDeletingId(null)
    }
  }

  // Abrir Constructor de Menú del Día
  const handleOpenMenuDiaBuilder = () => {
    if (activeMenuDia) {
      setMenuDiaNombre(activeMenuDia.nombre)
      setMenuDiaDescripcion(activeMenuDia.descripcion || '')
      setMenuDiaPrecio(activeMenuDia.precio ? activeMenuDia.precio.toString() : '18.00')
      setMenuDiaTiempo(
        activeMenuDia.tiempo_base_minutos ? activeMenuDia.tiempo_base_minutos.toString() : '15'
      )
      try {
        const parsed: MenuDelDiaDetalles = activeMenuDia.detalles_json
          ? JSON.parse(activeMenuDia.detalles_json)
          : {}
        setSelectedPlatosFuertes(parsed.platos_fuertes || [])
        setSelectedExtras(parsed.extras || [])
        setSelectedBebidas(parsed.bebidas || [])
        setSelectedPostres(parsed.postres || [])
      } catch {
        setSelectedPlatosFuertes([])
        setSelectedExtras([])
        setSelectedBebidas([])
        setSelectedPostres([])
      }
    } else {
      setMenuDiaNombre('Menú Ejecutivo del Día')
      setMenuDiaDescripcion(
        'Incluye 1 plato fuerte a elección, acompañamiento o ensalada, bebida y postre artesanal.'
      )
      setMenuDiaPrecio('18.00')
      setMenuDiaTiempo('15')
      setSelectedPlatosFuertes(platosFuertes.slice(0, 2).map((p) => p.id))
      setSelectedExtras(extras.slice(0, 1).map((p) => p.id))
      setSelectedBebidas(bebidas.slice(0, 1).map((p) => p.id))
      setSelectedPostres(postres.slice(0, 1).map((p) => p.id))
    }
    setBuilderOpen(true)
  }

  // Guardar Menú del Día configurado
  const handleSaveMenuDia = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!menuDiaNombre.trim() || !menuDiaPrecio) return
    setSubmitting(true)
    try {
      const detalles: MenuDelDiaDetalles = {
        platos_fuertes: selectedPlatosFuertes,
        extras: selectedExtras,
        bebidas: selectedBebidas,
        postres: selectedPostres,
        incluye_bebida: selectedBebidas.length > 0,
        incluye_postre: selectedPostres.length > 0,
      }
      const payload = {
        nombre: menuDiaNombre.trim(),
        descripcion: menuDiaDescripcion.trim() || undefined,
        precio: parseFloat(menuDiaPrecio) || 0,
        tiempo_base_minutos: parseInt(menuDiaTiempo, 10) || 15,
        categoria: 'menu_del_dia',
        detalles_json: JSON.stringify(detalles),
      }

      if (activeMenuDia) {
        await api.productos.update(activeMenuDia.id, payload)
      } else {
        await api.productos.create({ ...payload, disponible: true })
      }

      setBuilderOpen(false)
      await fetchProductos()
    } catch (err: any) {
      alert('Error al guardar Menú del Día: ' + (err?.message || 'Error'))
    } finally {
      setSubmitting(false)
    }
  }

  // Lista de items a mostrar según la pestaña activa
  const currentCategoryItems = useMemo(() => {
    let list: Producto[] = []
    if (activeTab === 'plato_fuerte') list = platosFuertes
    else if (activeTab === 'extra') list = extras
    else if (activeTab === 'bebida') list = bebidas
    else if (activeTab === 'postre') list = postres

    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
    )
  }, [activeTab, platosFuertes, extras, bebidas, postres, search])

  // Detalles parseados del Menú del Día activo
  const activeMenuDiaParsed = useMemo<MenuDelDiaDetalles>(() => {
    if (!activeMenuDia?.detalles_json) return {}
    try {
      return JSON.parse(activeMenuDia.detalles_json)
    } catch {
      return {}
    }
  }, [activeMenuDia])

  // Obtener producto por ID para la previsualización del combo
  const getProductById = useCallback(
    (id: string) => productos.find((p) => p.id === id),
    [productos]
  )

  return (
    <DashboardLayout title="Gestión de Menús y Carta">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <h1 className="text-2xl font-black text-coffee-800 tracking-tight">
              Menús y Carta Gourmet
            </h1>
          </div>
          <p className="text-xs text-coffee-400 mt-1 max-w-2xl">
            Crea tus platillos, bebidas y postres por categoría, y compone dinámicamente tu{' '}
            <strong className="text-peach-700">Menú del Día</strong> para la carta digital y QR de las mesas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'menu_del_dia' ? (
            <button
              onClick={handleOpenMenuDiaBuilder}
              className="btn-primary flex items-center gap-2 text-xs shadow-xs"
            >
              <span>✨</span>
              <span>{activeMenuDia ? 'Editar Menú del Día' : 'Crear Menú del Día'}</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenCreateModal()}
              className="btn-primary flex items-center gap-2 text-xs shadow-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Añadir {TABS.find((t) => t.id === activeTab)?.singular}</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Pestañas (Tabs) con persistencia en URL y LocalStorage */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-cream-200 shadow-2xs mb-6 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          let count = 0
          if (tab.id === 'menu_del_dia') count = activeMenuDia ? 1 : 0
          else if (tab.id === 'plato_fuerte') count = platosFuertes.length
          else if (tab.id === 'extra') count = extras.length
          else if (tab.id === 'bebida') count = bebidas.length
          else if (tab.id === 'postre') count = postres.length

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setSearch('')
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                isActive
                  ? 'bg-peach-500 text-white shadow-xs scale-[1.01]'
                  : 'text-coffee-500 hover:text-coffee-800 hover:bg-cream-100/70'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-cream-200 text-coffee-600'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Contenido de la Pestaña Activa */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <span className="spinner" />
          <p className="text-xs text-coffee-400 font-medium">Cargando catálogo...</p>
        </div>
      ) : activeTab === 'menu_del_dia' ? (
        /* ════════════════════════════════════════════════════════════════════════
           TAB: MENÚ DEL DÍA (Constructor & Vista Prominente)
           ════════════════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          {activeMenuDia ? (
            <div className="rounded-2xl bg-white border border-cream-300 shadow-sm overflow-hidden animate-fadeIn">
              {/* Banner Destacado del Menú del Día */}
              <div className="p-6 md:p-8 bg-gradient-to-r from-amber-500/10 via-peach-500/10 to-amber-500/5 border-b border-cream-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-[11px] font-bold shadow-2xs">
                      <span>☀️</span>
                      <span>OFERTA DE HOY ACTIVA</span>
                    </div>
                    <h2 className="text-2xl font-black text-coffee-800 tracking-tight">
                      {activeMenuDia.nombre}
                    </h2>
                    <p className="text-xs text-coffee-500 max-w-xl">
                      {activeMenuDia.descripcion || 'Menú completo con plato fuerte, acompañamiento y bebida.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-coffee-400">Precio Menú Completo</p>
                      <p className="text-3xl font-black text-peach-600">
                        ${Number(activeMenuDia.precio).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleOpenMenuDiaBuilder}
                        className="btn-secondary text-xs flex items-center gap-1.5 shadow-2xs"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleToggle(activeMenuDia)}
                        disabled={togglingId === activeMenuDia.id}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border ${
                          activeMenuDia.disponible
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-cream-200 text-coffee-400 border-cream-300 hover:bg-cream-300'
                        }`}
                      >
                        {activeMenuDia.disponible ? '✓ Disponible en QR' : 'Pausado en QR'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Componentes incluidos en este Menú del Día */}
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-cream-200 pb-3">
                  <h3 className="text-sm font-bold text-coffee-800 uppercase tracking-wider">
                    Composición del Menú del Día
                  </h3>
                  <span className="text-xs text-coffee-400">
                    Opciones configuradas para los comensales
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 1. Platos Fuertes */}
                  <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-coffee-700 flex items-center gap-1.5">
                          <span>🥩</span> Platos Fuertes
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cream-200 text-coffee-600 font-bold">
                          {activeMenuDiaParsed.platos_fuertes?.length || 0} opciones
                        </span>
                      </div>
                      <div className="space-y-1.5 mt-2">
                        {(activeMenuDiaParsed.platos_fuertes || []).length > 0 ? (
                          (activeMenuDiaParsed.platos_fuertes || []).map((id) => {
                            const p = getProductById(id)
                            return (
                              <div
                                key={id}
                                className="p-2 rounded-lg bg-white border border-cream-200 text-xs text-coffee-700 font-medium truncate flex items-center justify-between shadow-2xs"
                              >
                                <span className="truncate">{p?.nombre || 'Plato eliminado'}</span>
                                {p && <span className="text-[10px] text-coffee-400 font-mono">${Number(p.precio).toFixed(2)}</span>}
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-xs text-coffee-300 italic">Sin platos fuertes asignados</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Extras / Entradas */}
                  <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-coffee-700 flex items-center gap-1.5">
                          <span>🥗</span> Extras / Entradas
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cream-200 text-coffee-600 font-bold">
                          {activeMenuDiaParsed.extras?.length || 0} opciones
                        </span>
                      </div>
                      <div className="space-y-1.5 mt-2">
                        {(activeMenuDiaParsed.extras || []).length > 0 ? (
                          (activeMenuDiaParsed.extras || []).map((id) => {
                            const p = getProductById(id)
                            return (
                              <div
                                key={id}
                                className="p-2 rounded-lg bg-white border border-cream-200 text-xs text-coffee-700 font-medium truncate flex items-center justify-between shadow-2xs"
                              >
                                <span className="truncate">{p?.nombre || 'Extra eliminado'}</span>
                                {p && <span className="text-[10px] text-coffee-400 font-mono">${Number(p.precio).toFixed(2)}</span>}
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-xs text-coffee-300 italic">Sin extras asignados</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. Bebidas */}
                  <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-coffee-700 flex items-center gap-1.5">
                          <span>🍹</span> Bebidas
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cream-200 text-coffee-600 font-bold">
                          {activeMenuDiaParsed.bebidas?.length || 0} opciones
                        </span>
                      </div>
                      <div className="space-y-1.5 mt-2">
                        {(activeMenuDiaParsed.bebidas || []).length > 0 ? (
                          (activeMenuDiaParsed.bebidas || []).map((id) => {
                            const p = getProductById(id)
                            return (
                              <div
                                key={id}
                                className="p-2 rounded-lg bg-white border border-cream-200 text-xs text-coffee-700 font-medium truncate flex items-center justify-between shadow-2xs"
                              >
                                <span className="truncate">{p?.nombre || 'Bebida eliminada'}</span>
                                {p && <span className="text-[10px] text-coffee-400 font-mono">${Number(p.precio).toFixed(2)}</span>}
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-xs text-coffee-300 italic">Sin bebidas asignadas</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. Postres */}
                  <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-coffee-700 flex items-center gap-1.5">
                          <span>🍰</span> Postres
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cream-200 text-coffee-600 font-bold">
                          {activeMenuDiaParsed.postres?.length || 0} opciones
                        </span>
                      </div>
                      <div className="space-y-1.5 mt-2">
                        {(activeMenuDiaParsed.postres || []).length > 0 ? (
                          (activeMenuDiaParsed.postres || []).map((id) => {
                            const p = getProductById(id)
                            return (
                              <div
                                key={id}
                                className="p-2 rounded-lg bg-white border border-cream-200 text-xs text-coffee-700 font-medium truncate flex items-center justify-between shadow-2xs"
                              >
                                <span className="truncate">{p?.nombre || 'Postre eliminado'}</span>
                                {p && <span className="text-[10px] text-coffee-400 font-mono">${Number(p.precio).toFixed(2)}</span>}
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-xs text-coffee-300 italic">Sin postres asignados</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Estado vacío: no se ha configurado el menú del día todavía */
            <div className="p-12 text-center bg-white rounded-2xl border-2 border-dashed border-cream-300 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 text-3xl flex items-center justify-center">
                ☀️
              </div>
              <div className="max-w-md">
                <h3 className="text-lg font-bold text-coffee-800">
                  Aún no has configurado el Menú del Día
                </h3>
                <p className="text-xs text-coffee-400 mt-1">
                  Crea tu Menú del Día combinando los platos fuertes, extras, bebidas y postres que tienes
                  registrados en las otras pestañas.
                </p>
              </div>
              <button
                onClick={handleOpenMenuDiaBuilder}
                className="btn-primary flex items-center gap-2 text-xs shadow-sm mt-2"
              >
                <span>✨</span>
                <span>Configurar Menú del Día Ahora</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════════
           TABS DE CATEGORÍAS (Platos Fuertes, Extras, Bebidas, Postres)
           ════════════════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          {/* Barra de Filtro de Búsqueda y Añadir Rápido */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-cream-200 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder={`Buscar en ${TABS.find((t) => t.id === activeTab)?.label.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field text-xs pl-9 pr-3 py-2"
              />
              <svg
                className="w-4 h-4 text-coffee-300 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-coffee-400">
                {currentCategoryItems.length} {currentCategoryItems.length === 1 ? 'item' : 'items'}
              </span>
              <button
                onClick={() => handleOpenCreateModal(activeTab)}
                className="btn-primary text-xs flex items-center gap-1.5 shadow-2xs py-2 px-3"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Añadir {TABS.find((t) => t.id === activeTab)?.singular}</span>
              </button>
            </div>
          </div>

          {/* Grid de Platillos de la Categoría */}
          {currentCategoryItems.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-cream-200">
              <p className="text-3xl mb-2">{TABS.find((t) => t.id === activeTab)?.icon}</p>
              <h4 className="text-sm font-bold text-coffee-700">
                No hay elementos en {TABS.find((t) => t.id === activeTab)?.label}
              </h4>
              <p className="text-xs text-coffee-400 mt-1 max-w-sm mx-auto">
                Empieza agregando tu primer {TABS.find((t) => t.id === activeTab)?.singular.toLowerCase()} para
                que esté disponible en la carta y puedas incluirlo en el Menú del Día.
              </p>
              <button
                onClick={() => handleOpenCreateModal(activeTab)}
                className="btn-secondary text-xs mt-4"
              >
                + Crear {TABS.find((t) => t.id === activeTab)?.singular}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentCategoryItems.map((p) => {
                const isUsedInMenuDia =
                  activeMenuDiaParsed.platos_fuertes?.includes(p.id) ||
                  activeMenuDiaParsed.extras?.includes(p.id) ||
                  activeMenuDiaParsed.bebidas?.includes(p.id) ||
                  activeMenuDiaParsed.postres?.includes(p.id)

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-white border border-cream-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-bold text-coffee-800 leading-tight">
                          {p.nombre}
                        </h4>
                        <span className="text-sm font-black font-mono text-peach-600 shrink-0">
                          ${Number(p.precio).toFixed(2)}
                        </span>
                      </div>

                      <p className="text-xs text-coffee-400 line-clamp-2 mb-3 min-h-[2rem]">
                        {p.descripcion || 'Sin descripción detallada.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cream-100 text-coffee-600">
                          ⏱️ {p.tiempo_base_minutos || 15} min
                        </span>
                        {isUsedInMenuDia && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <span>☀️</span> En Menú del Día
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-cream-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggle(p)}
                        disabled={togglingId === p.id}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          p.disponible
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-cream-200 text-coffee-400 hover:bg-cream-300'
                        }`}
                        title="Alternar disponibilidad en carta"
                      >
                        {p.disponible ? 'Disponible' : 'Agotado'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-coffee-400 hover:text-coffee-700 hover:bg-cream-100 transition-colors"
                          title="Editar información"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p.id}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Eliminar de la carta"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
         MODAL: CONSTRUCTOR DE MENÚ DEL DÍA (COMPOSICIÓN DINÁMICA)
         ════════════════════════════════════════════════════════════════════════ */}
      {builderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-cream-300 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-cream-200 flex items-center justify-between bg-cream-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">☀️</span>
                <div>
                  <h3 className="font-black text-coffee-800 text-base">
                    Constructor del Menú del Día
                  </h3>
                  <p className="text-[11px] text-coffee-400">
                    Selecciona qué opciones de cada categoría formarán parte del menú especial.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBuilderOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-coffee-400 hover:text-coffee-700 hover:bg-cream-100 transition-colors text-lg"
              >
                &times;
              </button>
            </div>

            {/* Formulario Scrolleable */}
            <form onSubmit={handleSaveMenuDia} className="flex-1 overflow-y-auto scrollbar-none p-6 space-y-6">
              {/* 1. Datos Generales y Precio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-cream-50/60 border border-cream-200">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-coffee-700 mb-1">
                    Título de la Oferta / Menú del Día
                  </label>
                  <input
                    type="text"
                    required
                    value={menuDiaNombre}
                    onChange={(e) => setMenuDiaNombre(e.target.value)}
                    placeholder="ej: Menú Ejecutivo del Día, Menú Degustación"
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-coffee-700 mb-1">
                    Precio del Menú Completo ($)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={menuDiaPrecio}
                    onChange={(e) => setMenuDiaPrecio(e.target.value)}
                    className="input-field text-xs font-mono font-bold text-peach-600"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-coffee-700 mb-1">
                    Descripción / Condiciones de la oferta
                  </label>
                  <textarea
                    rows={2}
                    value={menuDiaDescripcion}
                    onChange={(e) => setMenuDiaDescripcion(e.target.value)}
                    placeholder="ej: Incluye plato fuerte a elección, acompañamiento o ensalada, bebida y postre."
                    className="input-field text-xs"
                  />
                </div>
              </div>

              {/* 2. Selector de Platos Fuertes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-coffee-800 flex items-center gap-1.5 uppercase tracking-wide">
                    <span>🥩</span> Platos Fuertes Elegibles ({selectedPlatosFuertes.length} seleccionados)
                  </label>
                  <span className="text-[11px] text-coffee-400">
                    Marca los platos fuertes disponibles en el menú
                  </span>
                </div>
                {platosFuertes.length === 0 ? (
                  <p className="text-xs text-coffee-400 bg-cream-50 p-3 rounded-lg border border-cream-200 italic">
                    No tienes platos fuertes creados. Agrega algunos en la pestaña &quot;Platos Fuertes&quot;.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {platosFuertes.map((p) => {
                      const isSelected = selectedPlatosFuertes.includes(p.id)
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPlatosFuertes((prev) =>
                              isSelected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                            )
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 select-none ${
                            isSelected
                              ? 'bg-peach-50 border-peach-400 ring-1 ring-peach-400 text-coffee-900 font-bold'
                              : 'bg-white border-cream-200 text-coffee-600 hover:border-cream-300'
                          }`}
                        >
                          <div className="truncate">
                            <p className="truncate">{p.nombre}</p>
                            <span className="text-[10px] text-coffee-400 font-mono">
                              Normal: ${Number(p.precio).toFixed(2)}
                            </span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-peach-500 border-peach-500 text-white font-bold'
                                : 'border-cream-300 bg-cream-50'
                            }`}
                          >
                            {isSelected && '✓'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 3. Selector de Extras / Entradas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-coffee-800 flex items-center gap-1.5 uppercase tracking-wide">
                    <span>🥗</span> Extras o Entradas ({selectedExtras.length} seleccionados)
                  </label>
                  <span className="text-[11px] text-coffee-400">
                    Opciones de acompañamiento o entrantes
                  </span>
                </div>
                {extras.length === 0 ? (
                  <p className="text-xs text-coffee-400 bg-cream-50 p-3 rounded-lg border border-cream-200 italic">
                    No tienes extras o entradas creadas. Agrega algunos en la pestaña &quot;Extras y Entradas&quot;.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {extras.map((p) => {
                      const isSelected = selectedExtras.includes(p.id)
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedExtras((prev) =>
                              isSelected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                            )
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 select-none ${
                            isSelected
                              ? 'bg-peach-50 border-peach-400 ring-1 ring-peach-400 text-coffee-900 font-bold'
                              : 'bg-white border-cream-200 text-coffee-600 hover:border-cream-300'
                          }`}
                        >
                          <div className="truncate">
                            <p className="truncate">{p.nombre}</p>
                            <span className="text-[10px] text-coffee-400 font-mono">
                              Normal: ${Number(p.precio).toFixed(2)}
                            </span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-peach-500 border-peach-500 text-white font-bold'
                                : 'border-cream-300 bg-cream-50'
                            }`}
                          >
                            {isSelected && '✓'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 4. Selector de Bebidas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-coffee-800 flex items-center gap-1.5 uppercase tracking-wide">
                    <span>🍹</span> Bebidas Incluidas ({selectedBebidas.length} seleccionadas)
                  </label>
                  <span className="text-[11px] text-coffee-400">
                    Bebidas a elegir para acompañar el menú
                  </span>
                </div>
                {bebidas.length === 0 ? (
                  <p className="text-xs text-coffee-400 bg-cream-50 p-3 rounded-lg border border-cream-200 italic">
                    No tienes bebidas creadas. Agrega algunas en la pestaña &quot;Bebidas&quot;.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {bebidas.map((p) => {
                      const isSelected = selectedBebidas.includes(p.id)
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedBebidas((prev) =>
                              isSelected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                            )
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 select-none ${
                            isSelected
                              ? 'bg-peach-50 border-peach-400 ring-1 ring-peach-400 text-coffee-900 font-bold'
                              : 'bg-white border-cream-200 text-coffee-600 hover:border-cream-300'
                          }`}
                        >
                          <div className="truncate">
                            <p className="truncate">{p.nombre}</p>
                            <span className="text-[10px] text-coffee-400 font-mono">
                              Normal: ${Number(p.precio).toFixed(2)}
                            </span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-peach-500 border-peach-500 text-white font-bold'
                                : 'border-cream-300 bg-cream-50'
                            }`}
                          >
                            {isSelected && '✓'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 5. Selector de Postres */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-coffee-800 flex items-center gap-1.5 uppercase tracking-wide">
                    <span>🍰</span> Postres Incluidos ({selectedPostres.length} seleccionados)
                  </label>
                  <span className="text-[11px] text-coffee-400">
                    Postres a elegir al finalizar
                  </span>
                </div>
                {postres.length === 0 ? (
                  <p className="text-xs text-coffee-400 bg-cream-50 p-3 rounded-lg border border-cream-200 italic">
                    No tienes postres creados. Agrega algunos en la pestaña &quot;Postres&quot;.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {postres.map((p) => {
                      const isSelected = selectedPostres.includes(p.id)
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPostres((prev) =>
                              isSelected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                            )
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 select-none ${
                            isSelected
                              ? 'bg-peach-50 border-peach-400 ring-1 ring-peach-400 text-coffee-900 font-bold'
                              : 'bg-white border-cream-200 text-coffee-600 hover:border-cream-300'
                          }`}
                        >
                          <div className="truncate">
                            <p className="truncate">{p.nombre}</p>
                            <span className="text-[10px] text-coffee-400 font-mono">
                              Normal: ${Number(p.precio).toFixed(2)}
                            </span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-peach-500 border-peach-500 text-white font-bold'
                                : 'border-cream-300 bg-cream-50'
                            }`}
                          >
                            {isSelected && '✓'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Botón de Enviar */}
              <div className="pt-4 border-t border-cream-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBuilderOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs flex items-center gap-2"
                >
                  {submitting ? <span className="spinner" /> : <span>💾</span>}
                  <span>Guardar y Publicar Menú del Día</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
         MODAL: CREAR / EDITAR PLATILLO O BEBIDA INDIVIDUAL
         ════════════════════════════════════════════════════════════════════════ */}
      {modalItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-cream-300 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-cream-200 flex items-center justify-between bg-cream-50/50">
              <h3 className="font-black text-coffee-800 text-base">
                {editingItem ? 'Editar Platillo o Bebida' : `Añadir a ${TABS.find((t) => t.id === itemCategoria)?.label}`}
              </h3>
              <button
                type="button"
                onClick={() => setModalItemOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-coffee-400 hover:text-coffee-700 hover:bg-cream-100 transition-colors text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-coffee-700 mb-1">
                  Categoría
                </label>
                <select
                  value={itemCategoria}
                  onChange={(e) => setItemCategoria(e.target.value as TabType)}
                  className="input-field text-xs"
                >
                  <option value="plato_fuerte">🥩 Plato Fuerte</option>
                  <option value="extra">🥗 Extra / Entrada</option>
                  <option value="bebida">🍹 Bebida</option>
                  <option value="postre">🍰 Postre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-coffee-700 mb-1">
                  Nombre del Platillo / Bebida
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Lomo Saltado Criollo, Limonada de Hierbabuena"
                  value={itemNombre}
                  onChange={(e) => setItemNombre(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-coffee-700 mb-1">
                  Descripción e Ingredientes
                </label>
                <textarea
                  rows={2}
                  placeholder="ej: Cortes selectos de lomo, cebolla morada, tomate y papas fritas."
                  value={itemDescripcion}
                  onChange={(e) => setItemDescripcion(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-coffee-700 mb-1">
                    Precio ($)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    placeholder="15.00"
                    value={itemPrecio}
                    onChange={(e) => setItemPrecio(e.target.value)}
                    className="input-field text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-coffee-700 mb-1">
                    Tiempo de Prep. (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="15"
                    value={itemTiempo}
                    onChange={(e) => setItemTiempo(e.target.value)}
                    className="input-field text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-cream-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalItemOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs flex items-center gap-2"
                >
                  {submitting && <span className="spinner" />}
                  <span>{editingItem ? 'Guardar Cambios' : 'Crear Platillo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
