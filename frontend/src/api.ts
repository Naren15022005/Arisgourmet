const BASE = import.meta.env.VITE_API_URL ?? ''

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('access_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    // Try refresh
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
        if (refreshRes.ok) {
          const data = await refreshRes.json()
          if (data.access_token) {
            localStorage.setItem('access_token', data.access_token)
            if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
            headers['Authorization'] = `Bearer ${data.access_token}`
            const retryRes = await fetch(`${BASE}${path}`, { ...options, headers })
            if (!retryRes.ok) throw new ApiError(retryRes.status, await retryRes.text())
            return retryRes.json() as Promise<T>
          }
        }
      } catch {
        // refresh failed
      }
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/login'
    throw new ApiError(401, 'Unauthorized')
  }

  if (!res.ok) {
    const body = await res.text()
    throw new ApiError(res.status, body)
  }

  const text = await res.text()
  return text ? (JSON.parse(text) as T) : ({} as T)
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

// ── Auth ────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  nombre: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
}

export interface UserProfile {
  id: string
  email: string
  nombre: string
  restaurante_id: string
  role: string
}

export const api = {
  auth: {
    register: (payload: RegisterPayload) =>
      request<{ id: string; email: string; nombre: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...payload, role: 'admin' }),
      }),
    login: (payload: LoginPayload) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    logout: () =>
      request<{ success: boolean }>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: localStorage.getItem('refresh_token') }),
      }),
  },

  // ── Mesas ──────────────────────────────────────────────────────────────────
  mesas: {
    list: () => request<Mesa[]>('/api/mesas'),
    activate: (codigo_qr: string) =>
      request<Mesa>('/api/mesas/activate', { method: 'POST', body: JSON.stringify({ codigo_qr }) }),
    release: (codigo_qr: string) =>
      request<Mesa>('/api/mesas/release', { method: 'POST', body: JSON.stringify({ codigo_qr }) }),
  },

  // ── Pedidos ────────────────────────────────────────────────────────────────
  pedidos: {
    list: (mesa_id?: string) => {
      const qs = mesa_id ? `?mesa_id=${mesa_id}` : ''
      return request<Pedido[]>(`/api/pedidos${qs}`)
    },
    create: (payload: CreatePedidoPayload) =>
      request<Pedido>('/api/pedidos', { method: 'POST', body: JSON.stringify(payload) }),
    updateEstado: (id: string, estado: PedidoEstado) =>
      request<Pedido>(`/api/pedidos/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
      }),
    cancel: (id: string) =>
      request<Pedido>(`/api/pedidos/${id}/cancelar`, { method: 'PATCH' }),
  },

  // ── Productos ──────────────────────────────────────────────────────────────
  productos: {
    list: () => request<Producto[]>('/api/productos/admin'),
    create: (payload: CreateProductoPayload) =>
      request<Producto>('/api/productos', { method: 'POST', body: JSON.stringify(payload) }),
    toggle: (id: string) => request<Producto>(`/api/productos/${id}/toggle`, { method: 'PATCH' }),
  },
}

// ── Domain types ─────────────────────────────────────────────────────────────

export interface Mesa {
  id: string
  codigo: string
  numero: number
  estado: 'libre' | 'ocupada' | 'reservada'
  restaurante_id: string
}

export type PedidoEstado =
  | 'pendiente'
  | 'aceptado'
  | 'preparando'
  | 'listo'
  | 'entregado'
  | 'cancelado'

export interface ItemPedido {
  id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
}

export interface Pedido {
  id: string
  mesa_id: string
  restaurante_id?: string
  estado: PedidoEstado
  items: ItemPedido[]
  created_at: string
  updated_at: string
}

export interface Producto {
  id: string
  nombre: string
  descripcion?: string
  precio: number
  disponible: boolean
  tiempo_base_minutos: number
  restaurante_id?: string
}

export interface CreatePedidoPayload {
  mesa_id: string
  restaurante_id?: string
  items: { producto_id: string; cantidad: number; precio_unitario: number }[]
}

export interface CreateProductoPayload {
  nombre: string
  descripcion?: string
  precio: number
  disponible?: boolean
  tiempo_base_minutos?: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getTokenPayload(): UserProfile | null {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      id: payload.sub,
      email: payload.email,
      nombre: payload.nombre ?? payload.email,
      restaurante_id: payload.restaurante_id,
      role: payload.role,
    }
  } catch {
    return null
  }
}
