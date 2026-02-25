import type { PedidoEstado } from '../api'

const labels: Record<PedidoEstado, string> = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  preparando: 'Preparando',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

const classes: Record<PedidoEstado, string> = {
  pendiente: 'badge-pendiente',
  aceptado: 'badge-aceptado',
  preparando: 'badge-preparando',
  listo: 'badge-listo',
  entregado: 'badge-entregado',
  cancelado: 'badge-cancelado',
}

export default function EstadoBadge({ estado }: { estado: PedidoEstado }) {
  return <span className={classes[estado]}>{labels[estado]}</span>
}
