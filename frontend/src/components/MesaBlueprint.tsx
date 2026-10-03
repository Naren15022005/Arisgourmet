import React from 'react'
import type { Mesa } from '../api'

interface MesaBlueprintProps {
  mesa: Mesa
  selected?: boolean
  onClick?: () => void
  consumo?: number
  capacity?: number // 2, 4, 6
}

export function getMesaCapacity(codigo: string): number {
  const upper = codigo.toUpperCase()
  if (upper.includes('TERRAZA') || upper.includes('FAMILIAR') || upper.includes('GRANDE')) {
    return 6
  }
  const digits = codigo.replace(/\D/g, '')
  const num = parseInt(digits, 10)
  if (!isNaN(num)) {
    if (num >= 10) return 6
    if (num === 1 || num === 4 || num === 5 || num === 6) return 2
  }
  return 4
}

export const MesaBlueprint: React.FC<MesaBlueprintProps> = ({
  mesa,
  selected = false,
  onClick,
  consumo = 0,
  capacity,
}) => {
  const caps = capacity ?? getMesaCapacity(mesa.codigo)
  const isOcupada = mesa.estado === 'ocupada'
  const isReservada = mesa.estado === 'reservada'
  const isLibre = mesa.estado === 'libre'

  // Estilos visuales exactos a la imagen de referencia:
  // - Ocupada / Activa: trazo rojo/coral claro con relleno suave y sillas contorneadas
  // - Libre: relleno gris neutro suave arquitectónico (#eef2f6 / #e2e8f0)
  // - Reservada: tono ámbar cálido
  const tableStyles = isOcupada
    ? 'border-2 border-rose-400 bg-rose-50/30 text-rose-800'
    : isReservada
    ? 'border-2 border-amber-400 bg-amber-50/40 text-amber-900'
    : 'border-2 border-slate-300 bg-[#eef2f6] text-slate-700 hover:border-slate-400'

  const chairStyles = isOcupada
    ? 'border border-rose-400 bg-rose-100/50'
    : isReservada
    ? 'border border-amber-300 bg-amber-100/60'
    : 'border border-slate-300 bg-[#dfe5ec]'

  const displayNum = mesa.numero || mesa.codigo.replace(/\D/g, '') || mesa.codigo

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 focus:outline-hidden cursor-pointer ${
        selected ? 'ring-2 ring-offset-2 ring-coffee-800 scale-105 shadow-sm' : 'hover:scale-102'
      }`}
      title={`${mesa.codigo} (${mesa.estado}) - ${caps} sillas`}
    >
      {/* 2 SILLAS (Mesa cuadrada con sillas laterales) */}
      {caps === 2 && (
        <div className="relative flex items-center justify-center py-2">
          {/* Silla Izquierda */}
          <div className={`w-3.5 h-8 -mr-1 rounded-l-md transition-colors ${chairStyles}`} />

          {/* Tablero Mesa Cuadrada */}
          <div
            className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-xs transition-colors z-10 ${tableStyles}`}
          >
            <span className="text-sm font-semibold tracking-tight">{displayNum}</span>
            {isOcupada && consumo > 0 && (
              <span className="text-[10px] font-mono font-medium opacity-90 mt-0.5">
                ${Math.round(consumo)}
              </span>
            )}
          </div>

          {/* Silla Derecha */}
          <div className={`w-3.5 h-8 -ml-1 rounded-r-md transition-colors ${chairStyles}`} />
        </div>
      )}

      {/* 4 SILLAS (Mesa cuadrada con sillas en los 4 costados) */}
      {caps === 4 && (
        <div className="relative flex flex-col items-center justify-center">
          {/* Silla Superior */}
          <div className={`w-8 h-3.5 -mb-1 rounded-t-md transition-colors ${chairStyles}`} />

          <div className="flex items-center justify-center">
            {/* Silla Izquierda */}
            <div className={`w-3.5 h-8 -mr-1 rounded-l-md transition-colors ${chairStyles}`} />

            {/* Tablero Mesa Cuadrada */}
            <div
              className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-xs transition-colors z-10 ${tableStyles}`}
            >
              <span className="text-sm font-semibold tracking-tight">{displayNum}</span>
              {isOcupada && consumo > 0 && (
                <span className="text-[10px] font-mono font-medium opacity-90 mt-0.5">
                  ${Math.round(consumo)}
                </span>
              )}
            </div>

            {/* Silla Derecha */}
            <div className={`w-3.5 h-8 -ml-1 rounded-r-md transition-colors ${chairStyles}`} />
          </div>

          {/* Silla Inferior */}
          <div className={`w-8 h-3.5 -mt-1 rounded-b-md transition-colors ${chairStyles}`} />
        </div>
      )}

      {/* 6 SILLAS (Mesa rectangular alargada con 3 sillas arriba y 3 abajo) */}
      {caps === 6 && (
        <div className="relative flex flex-col items-center justify-center">
          {/* 3 Sillas Superiores */}
          <div className="flex gap-4 -mb-1 z-0">
            <div className={`w-7 h-3.5 rounded-t-md transition-colors ${chairStyles}`} />
            <div className={`w-7 h-3.5 rounded-t-md transition-colors ${chairStyles}`} />
            <div className={`w-7 h-3.5 rounded-t-md transition-colors ${chairStyles}`} />
          </div>

          {/* Tablero Mesa Rectangular */}
          <div
            className={`w-40 h-20 rounded-2xl flex flex-col items-center justify-center shadow-xs transition-colors z-10 ${tableStyles}`}
          >
            <span className="text-sm font-semibold tracking-tight">{displayNum}</span>
            {isOcupada && consumo > 0 && (
              <span className="text-[10px] font-mono font-medium opacity-90 mt-0.5">
                ${Math.round(consumo)}
              </span>
            )}
          </div>

          {/* 3 Sillas Inferiores */}
          <div className="flex gap-4 -mt-1 z-0">
            <div className={`w-7 h-3.5 rounded-b-md transition-colors ${chairStyles}`} />
            <div className={`w-7 h-3.5 rounded-b-md transition-colors ${chairStyles}`} />
            <div className={`w-7 h-3.5 rounded-b-md transition-colors ${chairStyles}`} />
          </div>
        </div>
      )}

      {/* Etiqueta inferior con código y estado sutil */}
      <div className="mt-2 text-center">
        <span className="text-[11px] font-medium text-coffee-800 block truncate max-w-[120px]">
          {mesa.codigo}
        </span>
        <span
          className={`text-[9px] uppercase tracking-wider font-semibold ${
            isOcupada
              ? 'text-rose-600'
              : isLibre
              ? 'text-slate-500'
              : 'text-amber-700'
          }`}
        >
          {mesa.estado}
        </span>
      </div>
    </button>
  )
}
