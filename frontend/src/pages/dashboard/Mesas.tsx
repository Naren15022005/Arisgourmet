import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { api, type Mesa, type Pedido, getTokenPayload } from '../../api'
import { useSocket } from '../../hooks/useSocket'
import { MesaBlueprint, getMesaCapacity } from '../../components/MesaBlueprint'

interface MesaCanvasCardProps {
  mesa: Mesa
  capacity: number
  isSelected: boolean
  isDragOver: boolean
  onSelect: (mesa: Mesa) => void
  onUpdateCapacity: (mesaId: string, delta: number) => void
  onDragOverCard: (mesaId: string) => void
  onDragLeaveCard: (mesaId: string) => void
}

const MesaCanvasCard = React.memo<MesaCanvasCardProps>(
  ({
    mesa,
    capacity,
    isSelected,
    isDragOver,
    onSelect,
    onUpdateCapacity,
    onDragOverCard,
    onDragLeaveCard,
  }) => {
    const handleClick = useCallback(() => onSelect(mesa), [onSelect, mesa])
    const handleAddChair = useCallback(() => onUpdateCapacity(mesa.id, 1), [onUpdateCapacity, mesa.id])
    const handleRemoveChair = useCallback(() => onUpdateCapacity(mesa.id, -1), [onUpdateCapacity, mesa.id])

    return (
      <div
        className="relative flex items-center justify-center will-change-transform"
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          e.dataTransfer.dropEffect = 'copy'
          onDragOverCard(mesa.id)
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return
          onDragLeaveCard(mesa.id)
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDragLeaveCard(mesa.id)
          const type = e.dataTransfer.getData('text/plain')
          if (type === 'chair') {
            onUpdateCapacity(mesa.id, 1)
          }
        }}
      >
        <MesaBlueprint
          mesa={mesa}
          capacity={capacity}
          selected={isSelected}
          isDragOver={isDragOver}
          onClick={handleClick}
          onAddChair={handleAddChair}
          onRemoveChair={handleRemoveChair}
        />
      </div>
    )
  },
  (prev, next) => {
    return (
      prev.mesa.id === next.mesa.id &&
      prev.mesa.codigo === next.mesa.codigo &&
      prev.mesa.estado === next.mesa.estado &&
      prev.mesa.capacidad === next.mesa.capacidad &&
      prev.capacity === next.capacity &&
      prev.isSelected === next.isSelected &&
      prev.isDragOver === next.isDragOver
    )
  }
)

export default function MesasDashboard() {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  const [viewMode, setViewModeState] = useState<'cards' | 'lista' | 'mesas'>(() => {
    // 1. Respetar parámetro en la URL (?tab= o ?view=)
    const param = searchParams.get('tab') || searchParams.get('view')
    if (param === 'cards' || param === 'lista' || param === 'mesas') {
      return param
    }
    // 2. Respetar última tab guardada en localStorage
    try {
      const stored = localStorage.getItem('aris_mesas_view_mode')
      if (stored === 'cards' || stored === 'lista' || stored === 'mesas') {
        return stored
      }
    } catch {}
    // 3. Fallback inicial
    return 'cards'
  })

  // Sincronizar tab con URL y localStorage al cambiar
  const setViewMode = useCallback((mode: 'cards' | 'lista' | 'mesas') => {
    setViewModeState(mode)
    try {
      localStorage.setItem('aris_mesas_view_mode', mode)
    } catch {}
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', mode)
      return next
    }, { replace: true })
  }, [setSearchParams])

  // Mantener sincronizado si cambia el parámetro de búsqueda (ej. volver o avanzar en historial)
  useEffect(() => {
    const param = searchParams.get('tab') || searchParams.get('view')
    if (param === 'cards' || param === 'lista' || param === 'mesas') {
      if (param !== viewMode) {
        setViewModeState(param)
        try {
          localStorage.setItem('aris_mesas_view_mode', param)
        } catch {}
      }
    } else {
      // Si la URL no tenía tab, reflejar la actual en la URL para que siempre se mantenga al recargar
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', viewMode)
        return next
      }, { replace: true })
    }
  }, [searchParams, viewMode, setSearchParams])
  const [selectedBlueprintMesa, setSelectedBlueprintMesa] = useState<Mesa | null>(null)
  const [manualToolsCollapsed, setManualToolsCollapsed] = useState<boolean | null>(null)
  const isSidebarCollapsed = manualToolsCollapsed !== null ? manualToolsCollapsed : selectedBlueprintMesa !== null

  const handleCloseCheckout = () => {
    setSelectedBlueprintMesa(null)
    setManualToolsCollapsed(null)
  }
  
  // Panel de creación por lote
  const [showGenerator, setShowGenerator] = useState(false)
  const [cantidad, setCantidad] = useState<number | ''>(7)
  const [prefijo, setPrefijo] = useState('MESA-')
  const [submitting, setSubmitting] = useState(false)

  // Acciones sobre mesas
  const [selectedMesaQR, setSelectedMesaQR] = useState<Mesa | null>(null)
  const [modalBatchPrint, setModalBatchPrint] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Pedidos y comanda de la mesa seleccionada para el Checkout Drawer
  const [mesaPedidos, setMesaPedidos] = useState<Pedido[]>([])
  const [loadingPedidos, setLoadingPedidos] = useState(false)

  // Capacidad de sillas por mesa (2 a 8), persistida en localStorage
  const [capacities, setCapacities] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('aris_mesas_capacities')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  const [dragOverMesaId, setDragOverMesaId] = useState<string | null>(null)
  const [isDraggingChair, setIsDraggingChair] = useState(false)
  const [isDraggingMesa, setIsDraggingMesa] = useState(false)
  const [isCanvasDragOver, setIsCanvasDragOver] = useState(false)
  const [isCreatingMesa, setIsCreatingMesa] = useState(false)

  // Obtener capacidad actual de una mesa (custom, backend o calculada de 2 a 8)
  const getCap = useCallback(
    (mesa: Mesa) => {
      if (capacities[mesa.id] !== undefined) {
        return Math.min(8, Math.max(2, capacities[mesa.id]))
      }
      if (mesa.capacidad !== undefined && mesa.capacidad > 0) {
        return Math.min(8, Math.max(2, mesa.capacidad))
      }
      return Math.min(8, Math.max(2, getMesaCapacity(mesa.codigo)))
    },
    [capacities]
  )

  // Modificar capacidad de sillas (rango 2 a 8) de forma INSTANTÁNEA (Optimistic UI 0ms)
  const handleUpdateCapacity = useCallback(
    (mesaId: string, delta: number) => {
      const mesa = mesas.find((m) => m.id === mesaId)
      const current =
        capacities[mesaId] ??
        (mesa?.capacidad && mesa.capacidad > 0
          ? mesa.capacidad
          : mesa
          ? getMesaCapacity(mesa.codigo)
          : 4)
      const updated = Math.min(8, Math.max(2, current + delta))
      if (updated === current) return

      // 1. Actualización 100% instantánea en estado y localStorage (0ms de latencia percibida)
      setCapacities((prev) => {
        const next = { ...prev, [mesaId]: updated }
        try {
          localStorage.setItem('aris_mesas_capacities', JSON.stringify(next))
        } catch (e) {
          console.error('Error saving capacities to localStorage', e)
        }
        return next
      })

      setMesas((prev) =>
        prev.map((m) => (m.id === mesaId ? { ...m, capacidad: updated } : m))
      )

      // 2. Persistir en backend en segundo plano sin bloquear el hilo principal
      if (!mesaId.startsWith('temp-')) {
        api.mesas.updateCapacidad(mesaId, updated).catch((err) => {
          console.error('Error al persistir capacidad en servidor:', err)
          // Revertir optimismo si hay fallo de red
          setCapacities((prev) => {
            const next = { ...prev, [mesaId]: current }
            try {
              localStorage.setItem('aris_mesas_capacities', JSON.stringify(next))
            } catch {}
            return next
          })
          setMesas((prev) =>
            prev.map((m) => (m.id === mesaId ? { ...m, capacidad: current } : m))
          )
        })
      }
    },
    [capacities, mesas]
  )

  // Total de sillas de todo el salón
  const totalSillasSalon = useMemo(() => {
    return mesas.reduce((acc, m) => acc + getCap(m), 0)
  }, [mesas, getCap])

  // Cargar pedidos y comanda activa al abrir el checkout de una mesa
  useEffect(() => {
    if (!selectedBlueprintMesa) {
      setMesaPedidos([])
      return
    }
    let isMounted = true
    setLoadingPedidos(true)
    api.pedidos
      .list(selectedBlueprintMesa.codigo || selectedBlueprintMesa.id)
      .then((data) => {
        if (isMounted) setMesaPedidos(data || [])
      })
      .catch((err) => {
        console.error('Error fetching mesa orders', err)
        if (isMounted) setMesaPedidos([])
      })
      .finally(() => {
        if (isMounted) setLoadingPedidos(false)
      })
    return () => {
      isMounted = false
    }
  }, [selectedBlueprintMesa])

  // Calcular el total consumido de la mesa activa
  const totalConsumoMesa = useMemo(() => {
    let sum = 0
    for (const p of mesaPedidos) {
      if (p.estado !== 'cancelado') {
        for (const item of p.items || []) {
          sum += (item.precio_unitario || 0) * (item.cantidad || 1)
        }
      }
    }
    return sum
  }, [mesaPedidos])

  // Acción de checkout: cobrar y liberar mesa
  const handleCheckoutMesa = async (mesa: Mesa) => {
    setActionId(mesa.id)
    try {
      await api.mesas.release(mesa.codigo)
      await fetchMesas()
      setSelectedBlueprintMesa(null)
    } catch {
      await handleToggleEstado(mesa)
      setSelectedBlueprintMesa(null)
    } finally {
      setActionId(null)
    }
  }

  const fetchMesas = useCallback(async () => {
    try {
      const data = await api.mesas.list()
      // Ordenar naturalmente por código o correlativo
      const sorted = [...data].sort((a, b) => {
        const numA = parseInt(a.codigo.replace(/\D/g, ''), 10)
        const numB = parseInt(b.codigo.replace(/\D/g, ''), 10)
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB
        return a.codigo.localeCompare(b.codigo, undefined, { numeric: true })
      })
      setMesas(sorted)

      // Sincronizar capacidades devueltas por el servidor si aún no están fijadas
      setCapacities((prev) => {
        const next = { ...prev }
        let changed = false
        for (const m of sorted) {
          if (m.capacidad !== undefined && next[m.id] === undefined) {
            next[m.id] = m.capacidad
            changed = true
          }
        }
        return changed ? next : prev
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMesas()
  }, [fetchMesas])

  useSocket(
    useCallback(
      (channel: string, payload: any) => {
        if (!payload) {
          if (channel.startsWith('mesa:')) fetchMesas()
          return
        }

        if (channel === 'mesa:CAPACIDAD_ACTUALIZADA') {
          const { id, capacidad } = payload
          if (id && capacidad !== undefined) {
            setCapacities((prev) => ({ ...prev, [id]: capacidad }))
            setMesas((prev) =>
              prev.map((m) => (m.id === id ? { ...m, capacidad } : m))
            )
          }
        } else if (channel === 'mesa:ACTIVADA' || channel === 'mesa:LIBERADA') {
          const { id, codigo, estado } = payload
          setMesas((prev) =>
            prev.map((m) =>
              m.id === id || m.codigo === codigo
                ? { ...m, estado: estado || (channel === 'mesa:ACTIVADA' ? 'ocupada' : 'libre') }
                : m
            )
          )
        } else if (channel === 'mesa:CREADA') {
          const newMesa = payload as Mesa
          if (newMesa && newMesa.id) {
            setMesas((prev) => {
              if (prev.some((m) => m.id === newMesa.id || m.codigo === newMesa.codigo)) {
                return prev.map((m) => (m.codigo === newMesa.codigo ? newMesa : m))
              }
              const updated = [...prev, newMesa]
              return updated.sort((a, b) => {
                const numA = parseInt(a.codigo.replace(/\D/g, ''), 10)
                const numB = parseInt(b.codigo.replace(/\D/g, ''), 10)
                if (!isNaN(numA) && !isNaN(numB)) return numA - numB
                return a.codigo.localeCompare(b.codigo, undefined, { numeric: true })
              })
            })
            if (newMesa.capacidad !== undefined) {
              setCapacities((prev) => ({ ...prev, [newMesa.id]: newMesa.capacidad! }))
            }
          }
        } else if (channel === 'mesa:ELIMINADA') {
          const { id } = payload
          if (id) {
            setMesas((prev) => prev.filter((m) => m.id !== id))
            setCapacities((prev) => {
              const next = { ...prev }
              delete next[id]
              return next
            })
          }
        } else if (channel.startsWith('mesa:') || channel.startsWith('pedido:')) {
          fetchMesas()
          if (selectedBlueprintMesa) {
            api.pedidos
              .list(selectedBlueprintMesa.codigo || selectedBlueprintMesa.id)
              .then((data) => setMesaPedidos(data || []))
              .catch(() => {})
          }
        }
      },
      [fetchMesas, selectedBlueprintMesa]
    ),
    fetchMesas
  )

  // Cerrar drawer o modales con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedBlueprintMesa) handleCloseCheckout()
        if (selectedMesaQR) setSelectedMesaQR(null)
        if (modalBatchPrint) setModalBatchPrint(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedBlueprintMesa, selectedMesaQR, modalBatchPrint])

  // Calcular el siguiente número correlativo disponible
  const nextStartNumber = useMemo(() => {
    let max = 0
    const cleanPrefix = (prefijo || 'MESA-').trim().toUpperCase()
    const escaped = cleanPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`^${escaped}(\\d+)$`, 'i')
    for (const m of mesas) {
      const match = m.codigo.match(regex)
      if (match) {
        const num = parseInt(match[1], 10)
        if (!isNaN(num) && num > max) max = num
      }
    }
    return max + 1
  }, [mesas, prefijo])

  const numCantidad = typeof cantidad === 'number' ? cantidad : parseInt(cantidad, 10) || 0
  const previewEndNumber = nextStartNumber + Math.max(0, numCantidad - 1)

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = typeof cantidad === 'number' ? cantidad : parseInt(cantidad, 10) || 0
    if (!num || num < 1) {
      alert('Por favor ingresa una cantidad válida de mesas (mínimo 1)')
      return
    }
    setSubmitting(true)
    try {
      await api.mesas.createBatch(num, prefijo)
      setShowGenerator(false)
      await fetchMesas()
    } catch (err: any) {
      alert('Error al generar mesas: ' + (err?.message || 'Error'))
    } finally {
      setSubmitting(false)
    }
  }

  // Crear una sola mesa consecutiva de forma ULTRA INSTANTÁNEA (0ms Optimistic UI)
  const handleCreateSingleMesa = async () => {
    if (isCreatingMesa) return
    setIsCreatingMesa(true)
    const cleanPrefix = (prefijo || 'MESA-').trim().toUpperCase()
    const nextCode = `${cleanPrefix}${nextStartNumber}`
    const tempId = `temp-${Date.now()}`

    // 1. Inserción optimista inmediata (0ms de latencia percibida)
    const optimisticMesa: Mesa = {
      id: tempId,
      codigo: nextCode,
      numero: nextStartNumber,
      estado: 'libre',
      restaurante_id: '',
      capacidad: 4,
    }

    setCapacities((prev) => ({ ...prev, [tempId]: 4 }))
    setMesas((prev) => {
      const updated = [...prev, optimisticMesa]
      return updated.sort((a, b) => {
        const numA = parseInt(a.codigo.replace(/\D/g, ''), 10)
        const numB = parseInt(b.codigo.replace(/\D/g, ''), 10)
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB
        return a.codigo.localeCompare(b.codigo, undefined, { numeric: true })
      })
    })

    // 2. Persistir en servidor en segundo plano
    try {
      const realMesa = await api.mesas.create(nextCode, 4)
      setCapacities((prev) => {
        const next = { ...prev, [realMesa.id]: 4 }
        delete next[tempId]
        try {
          localStorage.setItem('aris_mesas_capacities', JSON.stringify(next))
        } catch {}
        return next
      })
      setMesas((prev) => prev.map((m) => (m.id === tempId ? realMesa : m)))
    } catch (err: any) {
      // Revertir optimismo si falla
      setMesas((prev) => prev.filter((m) => m.id !== tempId))
      setCapacities((prev) => {
        const next = { ...prev }
        delete next[tempId]
        return next
      })
      alert('Error al crear mesa: ' + (err?.message || 'Error'))
    } finally {
      setIsCreatingMesa(false)
    }
  }

  // Alternar estado de mesa con respuesta optimista instantánea (0ms)
  const handleToggleEstado = async (mesa: Mesa) => {
    setActionId(mesa.id)
    const prevEstado = mesa.estado
    const nextEstado = mesa.estado === 'ocupada' ? 'libre' : 'ocupada'

    // 1. Actualización optimista inmediata en UI
    setMesas((prev) =>
      prev.map((m) => (m.id === mesa.id ? { ...m, estado: nextEstado } : m))
    )
    if (selectedBlueprintMesa?.id === mesa.id) {
      setSelectedBlueprintMesa((prev) => (prev ? { ...prev, estado: nextEstado } : null))
    }

    // 2. Sincronizar con backend en segundo plano
    try {
      if (prevEstado === 'ocupada') {
        await api.mesas.release(mesa.codigo)
      } else {
        await api.mesas.activate(mesa.codigo)
      }
    } catch (err: any) {
      // Revertir en caso de error
      setMesas((prev) =>
        prev.map((m) => (m.id === mesa.id ? { ...m, estado: prevEstado } : m))
      )
      if (selectedBlueprintMesa?.id === mesa.id) {
        setSelectedBlueprintMesa((prev) => (prev ? { ...prev, estado: prevEstado } : null))
      }
      alert('Error al actualizar estado: ' + (err?.message || 'Error'))
    } finally {
      setActionId(null)
    }
  }

  const handleDeleteMesa = async (mesa: Mesa) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la ${mesa.codigo}? Esta acción no se puede deshacer.`)) {
      return
    }
    setDeletingId(mesa.id)
    try {
      await api.mesas.delete(mesa.id)
      if (selectedMesaQR?.id === mesa.id) setSelectedMesaQR(null)
      await fetchMesas()
    } catch (err: any) {
      alert('Error al eliminar mesa: ' + (err?.message || 'Error'))
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = mesas
  const total = mesas.length
  const userProfile = getTokenPayload()
  const currentRestauranteId = userProfile?.restaurante_id
  const [restauranteSlug, setRestauranteSlug] = useState<string>(
    userProfile?.restaurante_slug || 'arisgourmet'
  )

  useEffect(() => {
    api.mesas
      .getRestaurante()
      .then((data) => {
        if (data?.slug) {
          setRestauranteSlug(data.slug)
        }
      })
      .catch(() => {})
  }, [])

  const getTargetMesaUrl = (codigo: string, restId?: string) => {
    const origin = window.location.origin
    // Priorizamos slug semántico amigable (?r=arisgourmet) sobre UUID interno de base de datos
    const tenantKey = restauranteSlug || restId || currentRestauranteId
    const query = tenantKey ? `?r=${encodeURIComponent(tenantKey)}` : ''
    return `${origin}/menu/mesa/${encodeURIComponent(codigo)}${query}`
  }

  const getQRUrl = (codigo: string, restId?: string) => {
    const targetUrl = getTargetMesaUrl(codigo, restId)
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
      targetUrl
    )}`
  }

  return (
    <DashboardLayout title="Salón y Mesas">
      {/* Barra superior de acciones: botón de añadir mesa en posición destacada */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className="btn-primary flex items-center gap-2 text-xs shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {showGenerator ? 'Cerrar Generador' : '+ Añadir Mesas'}
        </button>

        {/* Lado derecho: Selector de modo de vista e impresión */}
        <div className="flex flex-wrap items-center gap-3">
          {total > 0 && (
            <div className="inline-flex items-center p-1 rounded-xl bg-cream-200/80 border border-cream-300 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-coffee-800 shadow-2xs'
                    : 'text-coffee-500 hover:text-coffee-800'
                }`}
                title="Vista en Tarjetas con QR"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('lista')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'lista'
                    ? 'bg-white text-coffee-800 shadow-2xs'
                    : 'text-coffee-500 hover:text-coffee-800'
                }`}
                title="Vista en Tabla / Lista"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Lista</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('mesas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'mesas'
                    ? 'bg-white text-coffee-800 shadow-2xs'
                    : 'text-coffee-500 hover:text-coffee-800'
                }`}
                title="Vista arquitectónica simulada de Mesas"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Mesas</span>
              </button>
            </div>
          )}

          {total > 0 && (
            <button
              onClick={() => setModalBatchPrint(true)}
              className="btn-secondary flex items-center gap-2 text-xs shadow-sm"
              title="Ver e imprimir todos los códigos QR del salón"
            >
              <svg className="w-4 h-4 text-coffee-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir Todos los QRs
            </button>
          )}
        </div>
      </div>

      {/* Panel interactivo: Crear mesas por cantidad (Diseño minimalista y profesional) */}
      {showGenerator && (
        <div className="mb-6 rounded-lg bg-white border border-cream-200 shadow-xs overflow-hidden transition-all animate-fadeIn">
          {/* Encabezado sobrio */}
          <div className="px-5 py-3 border-b border-cream-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-coffee-800 tracking-tight">
                Generador de mesas en lote
              </span>
              <span className="text-[11px] text-coffee-400 font-mono hidden sm:inline">
                · Correlativo automático
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowGenerator(false)}
              className="w-6 h-6 rounded flex items-center justify-center text-coffee-400 hover:text-coffee-700 hover:bg-cream-100 transition-colors"
              title="Cerrar panel"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleCreateBatch} className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3.5">
              {/* Campo 1: Cantidad */}
              <div className="w-full sm:w-36 space-y-1">
                <label className="block text-[11px] font-semibold text-coffee-600 uppercase tracking-wider">
                  Cantidad
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={cantidad}
                    placeholder="1"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '')
                      if (raw === '') {
                        setCantidad('')
                        return
                      }
                      const parsed = parseInt(raw, 10)
                      setCantidad(Math.min(100, parsed))
                    }}
                    onBlur={() => {
                      if (cantidad === '' || cantidad < 1) {
                        setCantidad(1)
                      }
                    }}
                    className="w-full h-8.5 px-3 rounded-md border border-cream-300 bg-white text-xs font-semibold text-coffee-800 focus:outline-none focus:border-peach-500 focus:ring-1 focus:ring-peach-500 transition-colors"
                  />
                </div>
              </div>

              {/* Campo 2: Prefijo */}
              <div className="w-full sm:w-36 space-y-1">
                <label className="block text-[11px] font-semibold text-coffee-600 uppercase tracking-wider">
                  Prefijo
                </label>
                <input
                  type="text"
                  value={prefijo}
                  onChange={(e) => setPrefijo(e.target.value.toUpperCase())}
                  placeholder="MESA-"
                  className="w-full h-8.5 px-3 rounded-md border border-cream-300 bg-white text-xs font-mono font-medium text-coffee-800 uppercase focus:outline-none focus:border-peach-500 focus:ring-1 focus:ring-peach-500 transition-colors"
                />
              </div>

              {/* Resumen secuencial minimalista */}
              <div className="flex items-center gap-1.5 text-xs text-coffee-500 py-1 sm:py-0 sm:pb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[11px] text-coffee-400">Secuencia:</span>
                <span className="text-xs font-mono font-semibold text-coffee-700">
                  {(prefijo || 'MESA-').trim().toUpperCase()}{nextStartNumber}
                  {numCantidad > 1 && ` → ${(prefijo || 'MESA-').trim().toUpperCase()}${previewEndNumber}`}
                </span>
                <span className="text-[10px] text-coffee-400 font-mono">
                  ({numCantidad || 0} {numCantidad === 1 ? 'mesa' : 'mesas'})
                </span>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 sm:ml-auto pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => setShowGenerator(false)}
                  className="h-8.5 px-3 rounded-md border border-cream-200 text-coffee-600 hover:text-coffee-800 hover:bg-cream-100 text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submitting || !numCantidad || numCantidad < 1}
                  className="h-8.5 px-4 rounded-md bg-peach-500 hover:bg-peach-600 active:scale-98 text-white text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                >
                  {submitting ? (
                    <>
                      <span className="spinner w-3 h-3" />
                      Creando...
                    </>
                  ) : (
                    `Generar ${numCantidad || 0} ${numCantidad === 1 ? 'mesa' : 'mesas'}`
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}


      {/* Cuadrícula de mesas */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 border-2 border-dashed border-cream-300 bg-white">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-peach-50 flex items-center justify-center text-peach-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="font-bold text-lg text-coffee-700 mb-1">
            {total === 0 ? 'Aún no hay mesas en tu salón' : 'No hay mesas con este filtro'}
          </h3>
          <p className="text-xs text-coffee-300 max-w-md mx-auto mb-6">
            {total === 0
              ? 'Puedes crear las mesas de tu salón por cantidad (por ejemplo 7 mesas en orden). Cada una tendrá su código QR único listo para tus clientes.'
              : 'Prueba seleccionando otro filtro de estado para visualizar tus mesas.'}
          </p>
          <button
            onClick={() => setShowGenerator(true)}
            className="btn-primary text-xs shadow-md inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Crear Mesas Ahora
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* VISTA 1: CARDS */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((mesa) => {
            const isOcupada = mesa.estado === 'ocupada'
            const isReservada = mesa.estado === 'reservada'
            return (
              <div
                key={mesa.id}
                className={`relative flex flex-col justify-between p-4 rounded-xl bg-white border transition-colors group ${
                  isOcupada
                    ? 'border-peach-300 bg-peach-50/15 shadow-2xs'
                    : isReservada
                    ? 'border-amber-300 bg-amber-50/15 shadow-2xs'
                    : 'border-cream-300 hover:border-coffee-300 shadow-2xs'
                }`}
              >
                <div>
                  {/* Encabezado superior de la tarjeta */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-cream-100 text-coffee-800 border border-cream-200/90 tracking-wide">
                      {mesa.codigo}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                          isOcupada
                            ? 'bg-peach-50 text-peach-700 border border-peach-200'
                            : isReservada
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isOcupada
                              ? 'bg-peach-500 animate-pulse'
                              : isReservada
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        {mesa.estado.toUpperCase()}
                      </span>

                      {/* Botón eliminar */}
                      <button
                        onClick={() => handleDeleteMesa(mesa)}
                        disabled={deletingId === mesa.id}
                        className="w-6 h-6 rounded flex items-center justify-center text-coffee-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar mesa"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Visualización del código QR */}
                  <div
                    onClick={() => setSelectedMesaQR(mesa)}
                    className="my-2.5 py-3 px-2 flex flex-col items-center justify-center rounded-lg bg-cream-50/50 hover:bg-cream-100/60 border border-cream-200/70 hover:border-peach-300 cursor-pointer transition-colors group/qr"
                    title="Haz clic para ampliar o imprimir este QR"
                  >
                    <div className="p-2 bg-white rounded-lg border border-cream-200/90 shadow-2xs">
                      <img
                        src={getQRUrl(mesa.codigo)}
                        alt={`Código QR ${mesa.codigo}`}
                        className="w-24 h-24 object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-[11px] font-mono text-coffee-400 group-hover/qr:text-peach-600 transition-colors mt-2 flex items-center gap-1">
                      <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                      Ampliar QR
                    </span>
                  </div>

                  {/* Selector rápido de sillas en la tarjeta */}
                  <div className="flex items-center justify-between px-2.5 py-1 mb-2.5 rounded-lg bg-cream-50/80 border border-cream-200 text-xs">
                    <span className="text-[11px] text-coffee-500 font-medium flex items-center gap-1">
                      <svg className="w-3 h-3 text-coffee-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Sillas:
                    </span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <button
                        type="button"
                        disabled={getCap(mesa) <= 2}
                        onClick={() => handleUpdateCapacity(mesa.id, -1)}
                        className="w-4 h-4 rounded flex items-center justify-center font-bold text-coffee-600 hover:text-coffee-900 hover:bg-cream-200 disabled:opacity-30 transition-colors"
                        title="Quitar silla (mínimo 2)"
                      >
                        -
                      </button>
                      <span className="font-bold text-coffee-800 text-xs px-1">
                        {getCap(mesa)}
                      </span>
                      <button
                        type="button"
                        disabled={getCap(mesa) >= 8}
                        onClick={() => handleUpdateCapacity(mesa.id, 1)}
                        className="w-4 h-4 rounded flex items-center justify-center font-bold text-coffee-600 hover:text-coffee-900 hover:bg-cream-200 disabled:opacity-30 transition-colors"
                        title="Añadir silla (máximo 8)"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Acción de estado estática */}
                <div className="pt-2 border-t border-cream-200/80">
                  <button
                    onClick={() => handleToggleEstado(mesa)}
                    disabled={actionId === mesa.id}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 ${
                      isOcupada
                        ? 'bg-coffee-800 hover:bg-coffee-900 text-white'
                        : 'bg-white hover:bg-peach-50/70 text-coffee-700 hover:text-peach-700 border border-cream-300 hover:border-peach-300'
                    }`}
                  >
                    {actionId === mesa.id ? (
                      <span className="spinner w-3.5 h-3.5" />
                    ) : isOcupada ? (
                      <svg className="w-3.5 h-3.5 text-cream-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-peach-500/80" />
                    )}
                    {isOcupada ? 'Liberar Mesa' : 'Marcar Ocupada'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : viewMode === 'lista' ? (
        /* VISTA 2: LISTA / TABLA DETALLADA */
        <div className="rounded-xl bg-white border border-cream-300 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-cream-100/70 border-b border-cream-200 text-coffee-600 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Mesa</th>
                  <th className="py-3 px-4">Código QR</th>
                  <th className="py-3 px-4">Capacidad</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {filtered.map((mesa) => {
                  const isOcupada = mesa.estado === 'ocupada'
                  const isReservada = mesa.estado === 'reservada'
                  return (
                    <tr
                      key={mesa.id}
                      className="hover:bg-cream-50/60 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-cream-100 text-coffee-800 border border-cream-200 tracking-wide">
                          {mesa.codigo}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedMesaQR(mesa)}
                          className="flex items-center gap-2 group text-left"
                          title="Ampliar QR"
                        >
                          <div className="w-8 h-8 p-0.5 rounded bg-white border border-cream-200 shadow-2xs group-hover:border-peach-300 transition-colors shrink-0">
                            <img
                              src={getQRUrl(mesa.codigo)}
                              alt={`QR ${mesa.codigo}`}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                          <span className="text-[11px] font-mono text-coffee-400 group-hover:text-peach-600 transition-colors">
                            Ver QR ↗
                          </span>
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-cream-50 border border-cream-200 text-xs font-mono">
                          <button
                            type="button"
                            disabled={getCap(mesa) <= 2}
                            onClick={() => handleUpdateCapacity(mesa.id, -1)}
                            className="w-4 h-4 rounded flex items-center justify-center font-bold text-coffee-600 hover:text-coffee-900 hover:bg-cream-200 disabled:opacity-30 transition-colors"
                            title="Quitar silla (mínimo 2)"
                          >
                            -
                          </button>
                          <span className="font-bold text-coffee-800 px-1">
                            {getCap(mesa)} sillas
                          </span>
                          <button
                            type="button"
                            disabled={getCap(mesa) >= 8}
                            onClick={() => handleUpdateCapacity(mesa.id, 1)}
                            className="w-4 h-4 rounded flex items-center justify-center font-bold text-coffee-600 hover:text-coffee-900 hover:bg-cream-200 disabled:opacity-30 transition-colors"
                            title="Añadir silla (máximo 8)"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                            isOcupada
                              ? 'bg-peach-50 text-peach-700 border border-peach-200'
                              : isReservada
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOcupada
                                ? 'bg-peach-500 animate-pulse'
                                : isReservada
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          {mesa.estado.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleEstado(mesa)}
                            disabled={actionId === mesa.id}
                            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                              isOcupada
                                ? 'bg-coffee-800 hover:bg-coffee-900 text-white'
                                : 'bg-white hover:bg-peach-50/70 text-coffee-700 hover:text-peach-700 border border-cream-300 hover:border-peach-300'
                            }`}
                          >
                            {actionId === mesa.id
                              ? 'Procesando...'
                              : isOcupada
                              ? 'Liberar'
                              : 'Marcar Ocupada'}
                          </button>

                          <button
                            onClick={() => handleDeleteMesa(mesa)}
                            disabled={deletingId === mesa.id}
                            className="p-1.5 rounded-lg text-coffee-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Eliminar mesa"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISTA 3: MESAS (PLANO ARQUITECTÓNICO DEL SALÓN) */
        <div className="rounded-xl bg-white border border-cream-300 shadow-2xs overflow-hidden">
          {/* Encabezado minimalista del salón */}
          <div className="px-6 py-3 bg-white border-b border-cream-200 flex flex-wrap items-center justify-between gap-4">
            {/* Título y aforo */}
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-sm text-coffee-800 tracking-tight">
                Plano del Salón
              </h3>
              <span className="text-xs text-coffee-400 font-medium">
                {mesas.length} {mesas.length === 1 ? 'mesa' : 'mesas'} · {totalSillasSalon} puestos
              </span>
            </div>

            {/* Derecha: Leyenda minimalista */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span className="text-coffee-500 text-[11px]">Libre</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-coffee-500 text-[11px]">Ocupada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-coffee-500 text-[11px]">Reservada</span>
              </div>
            </div>
          </div>

          {/* Cuerpo: Panel Lateral de Herramientas + Lienzo Arquitectónico */}
          <div className="flex flex-col md:flex-row md:h-[600px] min-h-[520px] bg-[#f8f7f4] p-3 gap-3">
            {/* Lateral Minimalista: Herramientas de Arrastre (Colapsable a barra de iconos) */}
            <aside className={`transition-[width] duration-200 ease-in-out rounded-xl border border-cream-200 bg-white shadow-2xs flex flex-col justify-between shrink-0 select-none overflow-hidden md:h-full ${
              isSidebarCollapsed ? 'w-full md:w-16' : 'w-full md:w-56'
            }`}>
              <div className="flex flex-col h-full justify-between">
                <div>
                  {/* Encabezado limpio con borde suave separador y botón toggle - EXACTAMENTE h-14 */}
                  <div className={`h-14 border-b border-cream-200 flex items-center shrink-0 ${
                    isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'
                  }`}>
                    {!isSidebarCollapsed && (
                      <span className="text-[11px] font-bold text-coffee-500 uppercase tracking-wider">
                        Herramientas
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setManualToolsCollapsed(!isSidebarCollapsed)}
                      className="p-1.5 rounded-md text-coffee-400 hover:text-coffee-700 hover:bg-cream-100 transition-colors"
                      title={isSidebarCollapsed ? 'Expandir barra de herramientas' : 'Contraer a solo iconos'}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isSidebarCollapsed ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        )}
                      </svg>
                    </button>
                  </div>

                  {/* 1. Añadir Mesa y 2. Añadir Silla */}
                  <div className={`space-y-3 ${isSidebarCollapsed ? 'p-2.5' : 'p-3.5'}`}>
                    {/* 1. Añadir Mesa */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', 'new_mesa')
                        e.dataTransfer.effectAllowed = 'copy'
                        setIsDraggingMesa(true)
                      }}
                      onDragEnd={() => {
                        setIsDraggingMesa(false)
                        setIsCanvasDragOver(false)
                      }}
                      onClick={handleCreateSingleMesa}
                      className={`group rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                        isDraggingMesa
                          ? 'border-peach-400 bg-peach-50/50 shadow-xs'
                          : 'border-cream-300 hover:border-peach-300 hover:bg-cream-50/80 bg-white shadow-2xs'
                      } ${isSidebarCollapsed ? 'p-2 flex items-center justify-center' : 'p-3'}`}
                      title={`+ Mesa (${(prefijo || 'MESA-').trim().toUpperCase()}${nextStartNumber}) - Arrastra al plano o haz clic`}
                    >
                      {isSidebarCollapsed ? (
                        <div className="w-8.5 h-8.5 rounded-md bg-peach-50 border border-peach-200/80 flex items-center justify-center text-peach-600 group-hover:bg-peach-100/70 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="2" strokeDasharray="3 3" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v8m-4-4h8" />
                          </svg>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-8.5 h-8.5 rounded-md bg-peach-50 border border-peach-200/80 flex items-center justify-center text-peach-600 group-hover:bg-peach-100/70 transition-colors shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="2" strokeDasharray="3 3" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v8m-4-4h8" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-coffee-800">
                                + Mesa
                              </span>
                              <span className="text-[10px] font-mono text-peach-600 font-bold">
                                {`${(prefijo || 'MESA-').trim().toUpperCase()}${nextStartNumber}`}
                              </span>
                            </div>
                            <p className="text-[10px] text-coffee-400 truncate mt-0.5">
                              Arrastra al plano
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Añadir Silla */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', 'chair')
                        e.dataTransfer.effectAllowed = 'copy'
                        setIsDraggingChair(true)
                      }}
                      onDragEnd={() => {
                        setIsDraggingChair(false)
                        setDragOverMesaId(null)
                      }}
                      className={`group rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                        isDraggingChair
                          ? 'border-coffee-500 bg-cream-100 shadow-xs'
                          : 'border-cream-300 hover:border-coffee-400 hover:bg-cream-50/80 bg-white shadow-2xs'
                      } ${isSidebarCollapsed ? 'p-2 flex items-center justify-center' : 'p-3'}`}
                      title="Añadir Silla (2 a 8) - Arrastra hacia una mesa"
                    >
                      {isSidebarCollapsed ? (
                        <div className="w-8.5 h-8.5 rounded-md bg-cream-100 border border-cream-300 flex items-center justify-center text-coffee-700 group-hover:bg-cream-200/70 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-8.5 h-8.5 rounded-md bg-cream-100 border border-cream-300 flex items-center justify-center text-coffee-700 group-hover:bg-cream-200/70 transition-colors shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-coffee-800">
                                + Silla
                              </span>
                              <span className="text-[10px] font-mono text-coffee-500">
                                2 a 8
                              </span>
                            </div>
                            <p className="text-[10px] text-coffee-400 truncate mt-0.5">
                              Arrastra a una mesa
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acceso a Generador en Lote */}
                <div className={`border-t border-cream-200 shrink-0 ${isSidebarCollapsed ? 'p-2.5' : 'p-3'}`}>
                  <button
                    type="button"
                    onClick={() => setShowGenerator(true)}
                    className={`rounded-lg border border-cream-200 hover:border-cream-300 bg-cream-50/60 hover:bg-cream-100 text-coffee-600 hover:text-coffee-800 transition-colors flex items-center justify-center ${
                      isSidebarCollapsed ? 'w-full py-2.5 flex items-center justify-center' : 'w-full py-2 px-2.5 gap-1.5 text-[11px] font-medium'
                    }`}
                    title="Generador de mesas en lote"
                  >
                    <svg className="w-3.5 h-3.5 text-coffee-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    {!isSidebarCollapsed && <span>Generador en lote</span>}
                  </button>
                </div>
              </div>
            </aside>

            {/* Componente Checkout / Detalle de Mesa al lado de Herramientas */}
            {selectedBlueprintMesa && (
              <aside className="w-full md:w-80 rounded-xl border border-cream-200 bg-white shadow-2xs flex flex-col justify-between shrink-0 select-none animate-fadeIn overflow-hidden md:h-full">
                {/* Encabezado limpio con borde suave separador - EXACTAMENTE h-14 */}
                <div className="h-14 px-4 border-b border-cream-200 flex items-center justify-between gap-3 shrink-0">
                  <h3 className="font-bold text-sm text-coffee-800 font-mono tracking-tight truncate">
                    {selectedBlueprintMesa.codigo}
                  </h3>
                  <button
                    type="button"
                    onClick={handleCloseCheckout}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-coffee-400 hover:text-coffee-700 hover:bg-cream-100 transition-colors shrink-0"
                    title="Cerrar panel"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Contenido scrolleable del Checkout */}
                <div className="flex-1 overflow-y-auto scrollbar-none p-3.5 space-y-3">
                  {/* 1. Código QR Destacado */}
                  <div className="p-3.5 rounded-lg bg-cream-50/60 border border-cream-200 flex flex-col items-center text-center">
                    <div
                      onClick={() => setSelectedMesaQR(selectedBlueprintMesa)}
                      className="p-2.5 bg-white rounded-lg border border-cream-300 shadow-2xs cursor-pointer hover:border-peach-400 hover:shadow-xs transition-all group/qr"
                      title="Haz clic para ver o imprimir este QR"
                    >
                      <img
                        src={getQRUrl(selectedBlueprintMesa.codigo)}
                        alt={`QR ${selectedBlueprintMesa.codigo}`}
                        className="w-36 h-36 object-contain group-hover:scale-[1.02] transition-transform"
                      />
                    </div>
                    <div className="mt-2.5 w-full">
                      <a
                        href={getTargetMesaUrl(selectedBlueprintMesa.codigo, selectedBlueprintMesa.restaurante_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-mono text-peach-700 hover:text-peach-800 underline truncate block max-w-full"
                        title="Probar y abrir menú digital de esta mesa"
                      >
                        {getTargetMesaUrl(selectedBlueprintMesa.codigo, selectedBlueprintMesa.restaurante_id)}
                      </a>
                      <button
                        type="button"
                        onClick={() => setSelectedMesaQR(selectedBlueprintMesa)}
                        className="mt-1 text-xs text-peach-700 hover:text-peach-800 font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Ver / Imprimir QR</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 2. Capacidad y Gestión de Sillas */}
                  <div className="p-3 rounded-lg bg-white border border-cream-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[11px] font-bold text-coffee-800 uppercase tracking-wider">
                          Capacidad
                        </h4>
                        <p className="text-[10px] text-coffee-400">Puestos (2 a 8)</p>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cream-100 border border-cream-300 font-mono text-xs">
                        <button
                          type="button"
                          disabled={getCap(selectedBlueprintMesa) <= 2}
                          onClick={() => handleUpdateCapacity(selectedBlueprintMesa.id, -1)}
                          className="w-4 h-4 rounded flex items-center justify-center font-bold text-coffee-600 hover:text-coffee-900 disabled:opacity-30 transition-colors"
                          title="Quitar silla"
                        >
                          -
                        </button>
                        <span className="font-bold text-coffee-800 px-1 text-[11px]">
                          {getCap(selectedBlueprintMesa)} sillas
                        </span>
                        <button
                          type="button"
                          disabled={getCap(selectedBlueprintMesa) >= 8}
                          onClick={() => handleUpdateCapacity(selectedBlueprintMesa.id, 1)}
                          className="w-4 h-4 rounded flex items-center justify-center font-bold text-coffee-600 hover:text-coffee-900 disabled:opacity-30 transition-colors"
                          title="Añadir silla"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. Cuenta y Consumo */}
                  <div className="p-3 rounded-lg bg-white border border-cream-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-cream-200">
                      <h4 className="text-[11px] font-bold text-coffee-800 uppercase tracking-wider flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-peach-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Cuenta y Consumo
                      </h4>
                      <span className="text-xs font-mono font-bold text-coffee-800">
                        ${totalConsumoMesa.toFixed(2)}
                      </span>
                    </div>

                    {loadingPedidos ? (
                      <div className="py-3 flex flex-col items-center justify-center text-coffee-400 text-[11px]">
                        <span className="spinner w-3.5 h-3.5 mb-1.5" />
                        Consultando comanda...
                      </div>
                    ) : mesaPedidos.length > 0 ? (
                      <div className="space-y-2">
                        <div className="divide-y divide-cream-100 max-h-36 overflow-y-auto">
                          {mesaPedidos.map((ped) => (
                            <div key={ped.id} className="py-1.5 flex items-center justify-between text-[11px]">
                              <div>
                                <span className="font-mono font-bold text-coffee-700">
                                  Pedido #{ped.id.slice(0, 6)}
                                </span>
                                <span className="text-[9px] text-coffee-400 block">
                                  {ped.items?.length || 0} ítems • {ped.estado}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-coffee-800">
                                ${(
                                  ped.items?.reduce(
                                    (a, b) => a + (b.precio_unitario || 0) * (b.cantidad || 1),
                                    0
                                  ) || 0
                                ).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-cream-200 flex items-center justify-between text-xs">
                          <span className="font-bold text-coffee-800">Total:</span>
                          <span className="font-mono font-bold text-sm text-coffee-900">
                            ${totalConsumoMesa.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : selectedBlueprintMesa.estado === 'ocupada' ? (
                      <div className="py-2.5 px-2 rounded-md bg-cream-50 text-center">
                        <p className="text-[11px] text-coffee-600 font-medium">
                          Mesa sin comandas registradas
                        </p>
                      </div>
                    ) : (
                      <div className="py-2.5 px-2 rounded-md bg-emerald-50/60 border border-emerald-200/60 text-center">
                        <p className="text-[11px] text-emerald-800 font-semibold">
                          Mesa disponible
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pie del Checkout: Botones de Acción */}
                <div className="p-3 bg-white border-t border-cream-200 space-y-1.5 shrink-0">
                  {selectedBlueprintMesa.estado === 'ocupada' ? (
                    <>
                      <button
                        type="button"
                        disabled={actionId === selectedBlueprintMesa.id}
                        onClick={() => handleCheckoutMesa(selectedBlueprintMesa)}
                        className="w-full py-2 px-3 rounded-lg bg-peach-500 hover:bg-peach-600 text-white font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {actionId === selectedBlueprintMesa.id ? (
                          <span className="spinner w-3.5 h-3.5" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        )}
                        Cobrar {totalConsumoMesa > 0 ? `($${totalConsumoMesa.toFixed(2)})` : ''}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleEstado(selectedBlueprintMesa)}
                        className="w-full py-1.5 px-3 rounded-lg border border-cream-300 text-coffee-700 hover:bg-cream-100 font-medium text-[11px] transition-colors"
                      >
                        Liberar Mesa
                      </button>
                    </>
                  ) : selectedBlueprintMesa.estado === 'reservada' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleEstado(selectedBlueprintMesa)}
                        className="w-full py-2 px-3 rounded-lg bg-coffee-800 hover:bg-coffee-900 text-white font-bold text-xs shadow-2xs transition-colors"
                      >
                        Confirmar Llegada (Ocupar)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleEstado(selectedBlueprintMesa)}
                        className="w-full py-1.5 px-3 rounded-lg border border-cream-300 text-coffee-700 hover:bg-cream-100 font-medium text-[11px] transition-colors"
                      >
                        Cancelar Reserva
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleEstado(selectedBlueprintMesa)}
                      className="w-full py-2 px-3 rounded-lg bg-coffee-800 hover:bg-coffee-900 text-white font-bold text-xs shadow-2xs transition-colors"
                    >
                      Ocupar Mesa (Abrir Comanda)
                    </button>
                  )}

                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteMesa(selectedBlueprintMesa)
                        handleCloseCheckout()
                      }}
                      className="text-[11px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </button>

                    <button
                      type="button"
                      onClick={handleCloseCheckout}
                      className="text-[11px] text-coffee-400 hover:text-coffee-700 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </aside>
            )}

            {/* Lienzo Arquitectónico (Canvas) */}
            <div
              className={`flex-1 rounded-xl border border-cream-200 bg-[#faf9f6] p-8 md:h-full min-h-[460px] relative transition-all overflow-y-auto scrollbar-none ${
                isCanvasDragOver
                  ? 'bg-peach-50/50 ring-2 ring-inset ring-peach-400/60'
                  : ''
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
                if (!isCanvasDragOver) setIsCanvasDragOver(true)
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return
                setIsCanvasDragOver(false)
              }}
              onDrop={async (e) => {
                e.preventDefault()
                setIsCanvasDragOver(false)
                const type = e.dataTransfer.getData('text/plain')
                if (type === 'new_mesa') {
                  await handleCreateSingleMesa()
                }
              }}
            >
              {/* Indicador flotante sutil al arrastrar mesa sobre el lienzo */}
              {isCanvasDragOver && (
                <div className="absolute top-4 right-4 z-10 pointer-events-none px-3 py-1.5 rounded-lg bg-peach-500 text-white text-xs font-semibold shadow-md animate-fadeIn flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Suelta para crear {(prefijo || 'MESA-').trim().toUpperCase()}{nextStartNumber}</span>
                </div>
              )}

              {/* Cuadrícula armónica fluida con renderizado memoizado a 60 FPS */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-8 justify-items-center items-center">
                {filtered.map((mesa) => (
                  <MesaCanvasCard
                    key={mesa.id}
                    mesa={mesa}
                    capacity={getCap(mesa)}
                    isSelected={selectedBlueprintMesa?.id === mesa.id}
                    isDragOver={dragOverMesaId === mesa.id}
                    onSelect={(m) => {
                      setManualToolsCollapsed(null)
                      setSelectedBlueprintMesa(m)
                    }}
                    onUpdateCapacity={handleUpdateCapacity}
                    onDragOverCard={(id) => setDragOverMesaId((prev) => (prev === id ? prev : id))}
                    onDragLeaveCard={(id) => setDragOverMesaId((prev) => (prev === id ? null : prev))}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modal Individual: Visor e Impresión de QR */}
      {selectedMesaQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-900/60 backdrop-blur-sm animate-fadeIn">
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

            {/* Tarjeta imprimible con diseño exclusivo */}
            <div
              id="printable-qr"
              className="p-8 border-2 border-dashed border-coffee-400 rounded-3xl bg-cream-50 my-2 flex flex-col items-center shadow-inner"
            >
              <p className="text-xs font-bold tracking-widest text-coffee-300 uppercase mb-1">
                ARISGOURMET
              </p>
              <h2 className="text-2xl font-black text-coffee-700 mb-1">{selectedMesaQR.codigo}</h2>
              <p className="text-xs text-coffee-400 mb-4">Escanea para consultar la carta y ordenar</p>

              <div className="bg-white p-3 rounded-2xl shadow-sm border border-cream-300 mb-4">
                <img
                  src={getQRUrl(selectedMesaQR.codigo)}
                  alt={`QR ${selectedMesaQR.codigo}`}
                  className="w-48 h-48 object-contain"
                />
              </div>

              <a
                href={getTargetMesaUrl(selectedMesaQR.codigo, selectedMesaQR.restaurante_id)}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-peach-700 hover:text-peach-850 hover:underline bg-cream-200 px-3 py-1 rounded-full truncate max-w-full inline-block"
                title="Abrir menú digital de esta mesa en nueva pestaña"
              >
                {getTargetMesaUrl(selectedMesaQR.codigo, selectedMesaQR.restaurante_id)} ↗
              </a>
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

      {/* Modal Lote: Impresión masiva de todas las mesas */}
      {modalBatchPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="card w-full max-w-4xl p-6 bg-white shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200 mb-4">
              <div>
                <h3 className="font-bold text-lg text-coffee-700">Impresión de Todas las Mesas</h3>
                <p className="text-xs text-coffee-300">
                  {mesas.length} tarjetas de QR listas para colocar en cada mesa de tu establecimiento.
                </p>
              </div>
              <button
                onClick={() => setModalBatchPrint(false)}
                className="text-coffee-300 hover:text-coffee-600 text-xl font-bold leading-none p-1"
              >
                &times;
              </button>
            </div>

            {/* Hoja de impresión con cuadrícula */}
            <div className="overflow-y-auto flex-1 p-4 bg-cream-50 rounded-2xl border border-cream-300">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:grid-cols-3">
                {mesas.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 border-2 border-dashed border-coffee-300 rounded-2xl bg-white flex flex-col items-center text-center shadow-sm"
                  >
                    <span className="text-[10px] font-bold text-coffee-300 uppercase tracking-widest">
                      ARISGOURMET
                    </span>
                    <strong className="text-lg font-black text-coffee-700 mb-1">{m.codigo}</strong>
                    <div className="p-2 border border-cream-200 rounded-xl my-1 bg-white">
                      <img
                        src={getQRUrl(m.codigo, m.restaurante_id)}
                        alt={`QR ${m.codigo}`}
                        className="w-28 h-28 object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-[9px] text-coffee-400 font-mono mt-1">
                      Escanea para ordenar
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 mt-4 border-t border-cream-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-primary text-xs flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir Hoja Completa
              </button>
              <button onClick={() => setModalBatchPrint(false)} className="btn-secondary text-xs">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
