import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, type Producto, type Pedido, type PedidoEstado } from '../api'
import { useSocket } from '../hooks/useSocket'
import EstadoBadge from '../components/EstadoBadge'

interface CartItem {
  producto: Producto
  cantidad: number
}

export default function MesaCliente() {
  const { codigo } = useParams<{ codigo: string }>()
  const mesaCodigo = codigo || 'MESA-1'

  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activePedido, setActivePedido] = useState<Pedido | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')

  // Load public products
  const fetchMenu = useCallback(async () => {
    try {
      const data = await api.productos.listPublic()
      setProductos(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  // Listen to socket updates for customer's active order
  useSocket(
    useCallback(
      (channel: string) => {
        if (activePedido && channel.startsWith('pedido:')) {
          api.pedidos
            .get(activePedido.id)
            .then((updated) => setActivePedido(updated))
            .catch(() => {})
        }
      },
      [activePedido]
    )
  )

  const addToCart = (producto: Producto) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.producto.id === producto.id)
      if (existing) {
        return prev.map((item) =>
          item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      }
      return [...prev, { producto, cantidad: 1 }]
    })
  }

  const updateQuantity = (productoId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.producto.id === productoId) {
            const newQty = item.cantidad + delta
            return newQty > 0 ? { ...item, cantidad: newQty } : null
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    )
  }

  const totalCart = cart.reduce((s, i) => s + i.producto.precio * i.cantidad, 0)
  const totalCount = cart.reduce((s, i) => s + i.cantidad, 0)

  const handleEnviarPedido = async () => {
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      const newPedido = await api.pedidos.create({
        mesa_id: mesaCodigo,
        items: cart.map((i) => ({
          producto_id: i.producto.id,
          cantidad: i.cantidad,
          precio_unitario: Number(i.producto.precio),
        })),
      })
      setActivePedido(newPedido)
      setCart([])
      setDrawerOpen(false)
    } catch (err: any) {
      alert('Error al enviar pedido: ' + (err?.message || 'Error de conexión'))
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = productos.filter(
    (p) =>
      p.disponible &&
      (p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(search.toLowerCase())))
  )

  return (
    <div className="min-h-screen bg-cream-100 pb-24 text-coffee-700">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-cream-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-peach-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            AG
          </div>
          <div>
            <h1 className="font-bold text-sm text-coffee-700 leading-tight">ArisGourmet</h1>
            <p className="text-[11px] text-coffee-300">Menú Digital en Mesa</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-200 text-coffee-700 text-xs font-mono font-bold">
          <span>📍</span>
          <span>{mesaCodigo}</span>
        </div>
      </header>

      {/* Active order live tracker */}
      {activePedido && (
        <div className="mx-4 mt-4 p-4 rounded-2xl bg-white border-2 border-peach-400 shadow-md animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-peach-600 uppercase tracking-wide">
              Tu Pedido en Marcha
            </span>
            <EstadoBadge estado={activePedido.estado} />
          </div>

          <p className="text-xs text-coffee-400 mb-3">
            Comanda #{activePedido.id.slice(0, 8)} • Recibido por cocina
          </p>

          {/* Stepper tracker */}
          <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-semibold text-coffee-300">
            {[
              { id: 'pendiente', label: 'Enviado' },
              { id: 'aceptado', label: 'Aceptado' },
              { id: 'preparando', label: 'Cocinando' },
              { id: 'listo', label: 'Listo' },
            ].map((step, idx) => {
              const orderStates: PedidoEstado[] = ['pendiente', 'aceptado', 'preparando', 'listo', 'entregado']
              const currentIdx = orderStates.indexOf(activePedido.estado)
              const stepIdx = orderStates.indexOf(step.id as PedidoEstado)
              const isPastOrCurrent = currentIdx >= stepIdx

              return (
                <div key={step.id} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                      isPastOrCurrent
                        ? 'bg-peach-500 text-white font-bold shadow-xs'
                        : 'bg-cream-200 text-coffee-300'
                    }`}
                  >
                    {isPastOrCurrent ? '✓' : idx + 1}
                  </div>
                  <span className={isPastOrCurrent ? 'text-coffee-700 font-bold' : ''}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          {activePedido.estado === 'listo' && (
            <div className="mt-3 p-2 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg text-center animate-bounce">
              🎉 ¡Tu pedido está listo! El camarero lo llevará a tu mesa.
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pt-4">
        {/* Search */}
        <div className="bg-white p-3 rounded-2xl border border-cream-200 shadow-xs mb-5 flex items-center gap-2">
          <svg className="w-4 h-4 text-coffee-300 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar en la carta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent outline-none text-coffee-700 placeholder:text-coffee-300"
          />
        </div>

        {/* Menu list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12 border-dashed border-cream-300">
            <p className="text-sm font-semibold text-coffee-600 mb-1">No hay platillos disponibles</p>
            <p className="text-xs text-coffee-300">Consulta con el camarero sobre la carta de hoy.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => {
              const inCart = cart.find((i) => i.producto.id === p.id)
              return (
                <div
                  key={p.id}
                  className="card p-4 flex items-start justify-between gap-4 border border-cream-200 hover:border-peach-200 transition-colors shadow-xs"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-coffee-700 text-sm leading-snug mb-1">{p.nombre}</h3>
                    <p className="text-xs text-coffee-300 leading-relaxed mb-2.5">
                      {p.descripcion || 'Especialidad de la casa preparada al momento.'}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-peach-600 text-base">
                        ${Number(p.precio).toFixed(2)}
                      </span>
                      <span className="text-[11px] text-coffee-300 bg-cream-200 px-2 py-0.5 rounded-full">
                        ⏱ {p.tiempo_base_minutos || 10} min
                      </span>
                    </div>
                  </div>

                  {inCart ? (
                    <div className="flex items-center gap-2 bg-cream-200 p-1 rounded-xl">
                      <button
                        onClick={() => updateQuantity(p.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white font-bold text-xs text-coffee-700 shadow-xs flex items-center justify-center active:scale-95"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-coffee-700 px-1">{inCart.cantidad}</span>
                      <button
                        onClick={() => updateQuantity(p.id, 1)}
                        className="w-7 h-7 rounded-lg bg-peach-500 font-bold text-xs text-white shadow-xs flex items-center justify-center active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(p)}
                      className="btn-secondary text-xs px-3.5 py-1.5 self-center font-bold"
                    >
                      + Añadir
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom-4">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full bg-coffee-700 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between hover:bg-coffee-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-peach-500 text-white text-xs font-bold flex items-center justify-center">
                {totalCount}
              </span>
              <span className="text-xs font-semibold text-cream-200 uppercase tracking-wider">
                Ver Pedido
              </span>
            </div>
            <span className="font-bold text-base text-cream-100">${totalCart.toFixed(2)} ➔</span>
          </button>
        </div>
      )}

      {/* Modal / Drawer Carrito */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-coffee-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200 mb-4">
              <div>
                <h3 className="font-bold text-lg text-coffee-700">Tu Pedido</h3>
                <p className="text-xs text-coffee-300">Mesa {mesaCodigo}</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-coffee-300 hover:text-coffee-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-cream-100 pr-1 space-y-2 mb-4">
              {cart.map((item) => (
                <div key={item.producto.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-coffee-700">{item.producto.nombre}</p>
                    <p className="text-xs text-peach-600 font-bold">
                      ${(item.producto.precio * item.cantidad).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-cream-200 p-1 rounded-xl">
                    <button
                      onClick={() => updateQuantity(item.producto.id, -1)}
                      className="w-6 h-6 rounded-lg bg-white font-bold text-xs text-coffee-700 shadow-xs flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-coffee-700 px-1">{item.cantidad}</span>
                    <button
                      onClick={() => updateQuantity(item.producto.id, 1)}
                      className="w-6 h-6 rounded-lg bg-peach-500 font-bold text-xs text-white shadow-xs flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-cream-200 mb-4">
              <div className="flex justify-between items-center text-sm font-bold text-coffee-700 mb-1">
                <span>Total Estimado</span>
                <span className="text-xl font-extrabold text-peach-600">${totalCart.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-coffee-300">
                Se enviará directamente a los monitores de cocina.
              </p>
            </div>

            <button
              onClick={handleEnviarPedido}
              disabled={submitting || cart.length === 0}
              className="btn-primary w-full py-3.5 text-sm font-bold shadow-md"
            >
              {submitting ? 'Enviando a cocina...' : 'Confirmar y Enviar a Cocina'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
