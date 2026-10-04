import React from 'react'
import type { Mesa } from '../api'

export interface MesaBlueprintProps {
  mesa: Mesa
  selected?: boolean
  onClick?: () => void
  consumo?: number
  capacity?: number
  isDragOver?: boolean
  onAddChair?: () => void
  onRemoveChair?: () => void
  showControls?: boolean
}

export function getMesaCapacity(codigo: string): number {
  const upper = codigo.toUpperCase()
  if (upper.includes('FAMILIAR') || upper.includes('GRANDE') || upper.includes('VIP')) {
    return 6
  }
  const digits = codigo.replace(/\D/g, '')
  const num = parseInt(digits, 10)
  if (!isNaN(num)) {
    if (num >= 10) return 6
    if (num === 1 || num === 2 || num === 3 || num === 4 || num === 5 || num === 6) return 2
    if (num === 7 || num === 8 || num === 9) return 4
  }
  return 4
}

// Silla superior (orientada hacia abajo, hacia la mesa)
export function ChairTop({
  x,
  y,
  width = 30,
  height = 20,
  stroke,
  fill,
  cushionFill,
}: {
  x: number
  y: number
  width?: number
  height?: number
  stroke: string
  fill: string
  cushionFill: string
}) {
  return (
    <g>
      <path
        d={`M ${x} ${y + height} L ${x} ${y + 6} Q ${x} ${y} ${x + 6} ${y} L ${x + width - 6} ${y} Q ${x + width} ${y} ${x + width} ${y + 6} L ${x + width} ${y + height}`}
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect
        x={x + 3}
        y={y + 5}
        width={width - 6}
        height={height - 4}
        rx="3"
        fill={cushionFill}
        stroke={stroke}
        strokeWidth="1"
        opacity="0.85"
      />
      <path
        d={`M ${x + 5} ${y + 4} Q ${x + width / 2} ${y + 7.5} ${x + width - 5} ${y + 4}`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </g>
  )
}

// Silla inferior (orientada hacia arriba, hacia la mesa)
export function ChairBottom({
  x,
  y,
  width = 30,
  height = 20,
  stroke,
  fill,
  cushionFill,
}: {
  x: number
  y: number
  width?: number
  height?: number
  stroke: string
  fill: string
  cushionFill: string
}) {
  return (
    <g>
      <path
        d={`M ${x} ${y} L ${x} ${y + height - 6} Q ${x} ${y + height} ${x + 6} ${y + height} L ${x + width - 6} ${y + height} Q ${x + width} ${y + height} ${x + width} ${y + height - 6} L ${x + width} ${y}`}
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect
        x={x + 3}
        y={y - 1}
        width={width - 6}
        height={height - 4}
        rx="3"
        fill={cushionFill}
        stroke={stroke}
        strokeWidth="1"
        opacity="0.85"
      />
      <path
        d={`M ${x + 5} ${y + height - 4} Q ${x + width / 2} ${y + height - 7.5} ${x + width - 5} ${y + height - 4}`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </g>
  )
}

// Silla lateral izquierda (orientada hacia la derecha, hacia la mesa)
export function ChairLeft({
  x,
  y,
  width = 20,
  height = 30,
  stroke,
  fill,
  cushionFill,
}: {
  x: number
  y: number
  width?: number
  height?: number
  stroke: string
  fill: string
  cushionFill: string
}) {
  return (
    <g>
      <path
        d={`M ${x + width} ${y} L ${x + 6} ${y} Q ${x} ${y} ${x} ${y + 6} L ${x} ${y + height - 6} Q ${x} ${y + height} ${x + 6} ${y + height} L ${x + width} ${y + height}`}
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect
        x={x + 5}
        y={y + 3}
        width={width - 4}
        height={height - 6}
        rx="3"
        fill={cushionFill}
        stroke={stroke}
        strokeWidth="1"
        opacity="0.85"
      />
      <path
        d={`M ${x + 4} ${y + 5} Q ${x + 7.5} ${y + height / 2} ${x + 4} ${y + height - 5}`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </g>
  )
}

// Silla lateral derecha (orientada hacia la izquierda, hacia la mesa)
export function ChairRight({
  x,
  y,
  width = 20,
  height = 30,
  stroke,
  fill,
  cushionFill,
}: {
  x: number
  y: number
  width?: number
  height?: number
  stroke: string
  fill: string
  cushionFill: string
}) {
  return (
    <g>
      <path
        d={`M ${x} ${y} L ${x + width - 6} ${y} Q ${x + width} ${y} ${x + width} ${y + 6} L ${x + width} ${y + height - 6} Q ${x + width} ${y + height} ${x + width - 6} ${y + height} L ${x} ${y + height}`}
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect
        x={x - 1}
        y={y + 3}
        width={width - 4}
        height={height - 6}
        rx="3"
        fill={cushionFill}
        stroke={stroke}
        strokeWidth="1"
        opacity="0.85"
      />
      <path
        d={`M ${x + width - 4} ${y + 5} Q ${x + width - 7.5} ${y + height / 2} ${x + width - 4} ${y + height - 5}`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </g>
  )
}

// Servicio de mesa / Plato individual en cada puesto
export function PlateSetting({ cx, cy, stroke, fill }: { cx: number; cy: number; stroke: string; fill: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="6.5" fill={fill} stroke={stroke} strokeWidth="1" opacity="0.6" />
      <circle cx={cx} cy={cy} r="3.8" fill="none" stroke={stroke} strokeWidth="0.8" opacity="0.4" />
    </g>
  )
}

export const MesaBlueprint = React.memo<MesaBlueprintProps>(
  ({
    mesa,
    selected = false,
    onClick,
    consumo = 0,
    capacity,
    isDragOver = false,
    onAddChair,
    onRemoveChair,
    showControls = true,
  }) => {
  const rawCaps = capacity ?? getMesaCapacity(mesa.codigo)
  const caps = Math.min(8, Math.max(2, Math.round(rawCaps)))
  const isOcupada = mesa.estado === 'ocupada'
  const isReservada = mesa.estado === 'reservada'

  const strokeColor = isOcupada ? '#f87171' : isReservada ? '#f59e0b' : '#cbd5e1'
  const tableFill = isOcupada ? '#fff1f2' : isReservada ? '#fffbeb' : selected ? '#f8fafc' : '#ffffff'
  const chairFill = isOcupada ? '#ffe4e6' : isReservada ? '#fef3c7' : '#f8fafc'
  const cushionFill = isOcupada ? '#fecdd3' : isReservada ? '#fde68a' : '#f1f5f9'
  const plateFill = isOcupada ? '#fff1f2' : isReservada ? '#fffbeb' : '#ffffff'
  const textColor = isOcupada ? '#dc2626' : isReservada ? '#d97706' : '#475569'

  const displayNum = mesa.numero || mesa.codigo.replace(/\D/g, '') || mesa.codigo

  return (
    <div
      onClick={onClick}
      className={`group/mesa relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-150 cursor-pointer select-none ${
        isDragOver
          ? 'ring-2 ring-peach-500 bg-peach-50/70 scale-105 shadow-md'
          : selected
          ? 'ring-2 ring-coffee-800 ring-offset-2 bg-cream-50/60 shadow-sm'
          : 'hover:bg-cream-100/40'
      }`}
      title={`Mesa ${mesa.codigo} (${mesa.estado}) - ${caps} sillas`}
    >
      {/* Controles de sillas (+ / -) flotantes al pasar el cursor o cuando está seleccionada */}
      {showControls && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute -top-3.5 flex items-center gap-1 z-10 px-2 py-0.5 rounded-full bg-white border shadow-sm transition-opacity ${
            selected || isDragOver ? 'opacity-100 border-coffee-400' : 'opacity-0 group-hover/mesa:opacity-100 border-cream-300'
          }`}
        >
          <button
            type="button"
            disabled={caps <= 2}
            onClick={onRemoveChair}
            className="w-4 h-4 rounded flex items-center justify-center text-xs font-bold text-coffee-600 hover:text-peach-700 hover:bg-cream-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Quitar silla (mínimo 2)"
          >
            -
          </button>
          <span className="text-[10px] font-bold text-coffee-800 tracking-tight font-mono px-1">
            {caps}p
          </span>
          <button
            type="button"
            disabled={caps >= 8}
            onClick={onAddChair}
            className="w-4 h-4 rounded flex items-center justify-center text-xs font-bold text-coffee-600 hover:text-peach-700 hover:bg-cream-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Añadir silla (máximo 8)"
          >
            +
          </button>
        </div>
      )}

      {/* Badge feedback al arrastrar sobre la mesa */}
      {isDragOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-peach-500/15 backdrop-blur-[1px] border-2 border-dashed border-peach-500 pointer-events-none">
          <span className="px-2.5 py-1 rounded-full bg-peach-600 text-white text-[11px] font-bold shadow-md animate-pulse">
            {caps >= 8 ? 'Máx. 8 sillas' : '+1 Silla'}
          </span>
        </div>
      )}

      <div className="relative flex items-center justify-center">
        {/* 2 PUESTOS: 1 izquierda, 1 derecha */}
        {caps === 2 && (
          <svg width="125" height="90" viewBox="0 0 125 90" className="overflow-visible">
            <ChairLeft x={8} y={30} width={20} height={30} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <rect x={32} y={15} width={60} height={60} rx="12" fill={tableFill} stroke={strokeColor} strokeWidth="1.6" />
            <PlateSetting cx={46} cy={45} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={78} cy={45} stroke={strokeColor} fill={plateFill} />
            <ChairRight x={96} y={30} width={20} height={30} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <text x={62} y={consumo > 0 ? 40 : 45} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="600" fill={textColor} fontFamily="system-ui, -apple-system, sans-serif">
              {displayNum}
            </text>
            {isOcupada && consumo > 0 && (
              <text x={62} y={52} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="700" fill={textColor} opacity="0.9" fontFamily="ui-monospace, monospace">
                ${Math.round(consumo)}
              </text>
            )}
          </svg>
        )}

        {/* 3 PUESTOS: 1 superior, 1 izquierda, 1 derecha */}
        {caps === 3 && (
          <svg width="125" height="115" viewBox="0 0 125 115" className="overflow-visible">
            <ChairTop x={47} y={6} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairLeft x={8} y={43} width={20} height={30} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <rect x={32} y={28} width={60} height={60} rx="12" fill={tableFill} stroke={strokeColor} strokeWidth="1.6" />
            <PlateSetting cx={62} cy={42} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={46} cy={58} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={78} cy={58} stroke={strokeColor} fill={plateFill} />
            <ChairRight x={96} y={43} width={20} height={30} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <text x={62} y={consumo > 0 ? 54 : 58} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="600" fill={textColor} fontFamily="system-ui, -apple-system, sans-serif">
              {displayNum}
            </text>
            {isOcupada && consumo > 0 && (
              <text x={62} y={66} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="700" fill={textColor} opacity="0.9" fontFamily="ui-monospace, monospace">
                ${Math.round(consumo)}
              </text>
            )}
          </svg>
        )}

        {/* 4 PUESTOS: 1 superior, 1 inferior, 1 izquierda, 1 derecha */}
        {caps === 4 && (
          <svg width="125" height="125" viewBox="0 0 125 125" className="overflow-visible">
            <ChairTop x={47} y={7} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairLeft x={7} y={47} width={20} height={30} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <rect x={32} y={32} width={60} height={60} rx="12" fill={tableFill} stroke={strokeColor} strokeWidth="1.6" />
            <PlateSetting cx={62} cy={45} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={62} cy={79} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={45} cy={62} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={79} cy={62} stroke={strokeColor} fill={plateFill} />
            <ChairRight x={97} y={47} width={20} height={30} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairBottom x={47} y={97} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <text x={62} y={consumo > 0 ? 58 : 62} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="600" fill={textColor} fontFamily="system-ui, -apple-system, sans-serif">
              {displayNum}
            </text>
            {isOcupada && consumo > 0 && (
              <text x={62} y={69} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="700" fill={textColor} opacity="0.9" fontFamily="ui-monospace, monospace">
                ${Math.round(consumo)}
              </text>
            )}
          </svg>
        )}

        {/* 5 PUESTOS: Mesa intermedia, 2 arriba, 2 abajo, 1 derecha */}
        {caps === 5 && (
          <svg width="155" height="125" viewBox="0 0 155 125" className="overflow-visible">
            <ChairTop x={28} y={7} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairTop x={75} y={7} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <rect x={22} y={32} width={95} height={60} rx="12" fill={tableFill} stroke={strokeColor} strokeWidth="1.6" />
            <PlateSetting cx={43} cy={45} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={90} cy={45} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={43} cy={79} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={90} cy={79} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={105} cy={62} stroke={strokeColor} fill={plateFill} />
            <ChairBottom x={28} y={97} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairBottom x={75} y={97} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairRight x={122} y={47} width={20} height={30} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <text x={69} y={consumo > 0 ? 58 : 62} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="600" fill={textColor} fontFamily="system-ui, -apple-system, sans-serif">
              {displayNum}
            </text>
            {isOcupada && consumo > 0 && (
              <text x={69} y={69} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="700" fill={textColor} opacity="0.9" fontFamily="ui-monospace, monospace">
                ${Math.round(consumo)}
              </text>
            )}
          </svg>
        )}

        {/* 6 PUESTOS: Mesa rectangular alargada con 3 sillas arriba y 3 abajo */}
        {caps === 6 && (
          <svg width="170" height="110" viewBox="0 0 170 110" className="overflow-visible">
            <ChairTop x={25} y={6} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairTop x={70} y={6} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairTop x={115} y={6} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <rect x={15} y={30} width={140} height={50} rx="12" fill={tableFill} stroke={strokeColor} strokeWidth="1.6" />
            <PlateSetting cx={40} cy={42} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={85} cy={42} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={130} cy={42} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={40} cy={68} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={85} cy={68} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={130} cy={68} stroke={strokeColor} fill={plateFill} />
            <ChairBottom x={25} y={84} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairBottom x={70} y={84} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairBottom x={115} y={84} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <text x={85} y={consumo > 0 ? 51 : 55} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="600" fill={textColor} fontFamily="system-ui, -apple-system, sans-serif">
              {displayNum}
            </text>
            {isOcupada && consumo > 0 && (
              <text x={85} y={62} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="700" fill={textColor} opacity="0.9" fontFamily="ui-monospace, monospace">
                ${Math.round(consumo)}
              </text>
            )}
          </svg>
        )}

        {/* 7 PUESTOS: 3 sillas arriba, 3 sillas abajo, 1 lateral derecha */}
        {caps === 7 && (
          <svg width="185" height="115" viewBox="0 0 185 115" className="overflow-visible">
            <ChairTop x={25} y={6} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairTop x={70} y={6} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairTop x={115} y={6} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <rect x={15} y={30} width={140} height={54} rx="12" fill={tableFill} stroke={strokeColor} strokeWidth="1.6" />
            <PlateSetting cx={40} cy={42} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={85} cy={42} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={130} cy={42} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={40} cy={70} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={85} cy={70} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={130} cy={70} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={143} cy={57} stroke={strokeColor} fill={plateFill} />
            <ChairBottom x={25} y={88} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairBottom x={70} y={88} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairBottom x={115} y={88} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairRight x={160} y={42} width={20} height={30} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <text x={85} y={consumo > 0 ? 53 : 57} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="600" fill={textColor} fontFamily="system-ui, -apple-system, sans-serif">
              {displayNum}
            </text>
            {isOcupada && consumo > 0 && (
              <text x={85} y={64} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="700" fill={textColor} opacity="0.9" fontFamily="ui-monospace, monospace">
                ${Math.round(consumo)}
              </text>
            )}
          </svg>
        )}

        {/* 8 PUESTOS: 3 sillas arriba, 3 sillas abajo, 1 izquierda, 1 derecha */}
        {caps === 8 && (
          <svg width="195" height="115" viewBox="0 0 195 115" className="overflow-visible">
            <ChairLeft x={3} y={42} width={20} height={30} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairTop x={37} y={6} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairTop x={82} y={6} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairTop x={127} y={6} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <rect x={27} y={30} width={140} height={54} rx="12" fill={tableFill} stroke={strokeColor} strokeWidth="1.6" />
            <PlateSetting cx={39} cy={57} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={52} cy={42} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={97} cy={42} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={142} cy={42} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={52} cy={70} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={97} cy={70} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={142} cy={70} stroke={strokeColor} fill={plateFill} />
            <PlateSetting cx={155} cy={57} stroke={strokeColor} fill={plateFill} />
            <ChairBottom x={37} y={88} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairBottom x={82} y={88} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairBottom x={127} y={88} width={30} height={20} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <ChairRight x={171} y={42} width={20} height={30} stroke={strokeColor} fill={chairFill} cushionFill={cushionFill} />
            <text x={97} y={consumo > 0 ? 53 : 57} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="600" fill={textColor} fontFamily="system-ui, -apple-system, sans-serif">
              {displayNum}
            </text>
            {isOcupada && consumo > 0 && (
              <text x={97} y={64} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="700" fill={textColor} opacity="0.9" fontFamily="ui-monospace, monospace">
                ${Math.round(consumo)}
              </text>
            )}
          </svg>
        )}
      </div>

      {/* Etiqueta sutil debajo de la mesa */}
      <div className="mt-2 text-center pointer-events-none">
        <span className="text-[11px] font-medium text-slate-700 block truncate max-w-[130px]">
          {mesa.codigo}
        </span>
        <div className="flex items-center justify-center gap-1.5 mt-0.5">
          <span
            className={`text-[9px] uppercase tracking-wider font-semibold ${
              isOcupada ? 'text-rose-600' : isReservada ? 'text-amber-600' : 'text-slate-400'
            }`}
          >
            {mesa.estado}
          </span>
          <span className="text-[9px] text-coffee-400 font-mono">
            • {caps} {caps === 1 ? 'silla' : 'sillas'}
          </span>
        </div>
      </div>
    </div>
  )
},
  (prev, next) => {
    return (
      prev.mesa.id === next.mesa.id &&
      prev.mesa.codigo === next.mesa.codigo &&
      prev.mesa.estado === next.mesa.estado &&
      prev.mesa.capacidad === next.mesa.capacidad &&
      prev.selected === next.selected &&
      prev.consumo === next.consumo &&
      prev.capacity === next.capacity &&
      prev.isDragOver === next.isDragOver &&
      prev.showControls === next.showControls
    )
  }
)
