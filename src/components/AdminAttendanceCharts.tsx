'use client';

import React, { useState } from 'react';
import { AttendanceRecord, Profile } from '@/types';

interface Props {
  records: AttendanceRecord[];
  employees: Profile[];
}

export default function AdminAttendanceCharts({ records, employees }: Props) {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'mes'>('7d');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Generar los últimos 7 días con nombres en español
  const daysCount = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 30;
  
  const lastDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const isoDate = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('es-PY', { weekday: 'short' });
    // Capitalizar primera letra
    const label = dayName.charAt(0).toUpperCase() + dayName.slice(1, 3);
    
    // Contar empleados únicos que marcaron entrada en este día (con validación segura)
    const dayRecords = (records || []).filter(r => (r?.timestamp_local || '').startsWith(isoDate) && r?.record_type === 'entrada');
    const uniqueEmployees = new Set(dayRecords.map(r => r?.employee_id || r?.employee?.id)).size;
    const ausentes = Math.max(0, employees.length - uniqueEmployees);

    return {
      date: isoDate,
      label,
      presentes: uniqueEmployees,
      ausentes,
    };
  });

  // Datos para el Resumen General (del día actual)
  const todayIso = new Date().toISOString().split('T')[0];
  const todayEntradas = (records || []).filter(r => (r?.timestamp_local || '').startsWith(todayIso) && r?.record_type === 'entrada');
  const todayPresentes = new Set(todayEntradas.map(r => r.employee_id || r.employee?.id)).size;
  const totalEmployees = Math.max(employees.length, 1);
  const todayAusentes = Math.max(0, totalEmployees - todayPresentes);
  const attendanceRate = Math.round((todayPresentes / totalEmployees) * 100);

  // Dimensiones para el SVG Line Chart
  const svgWidth = 560;
  const svgHeight = 180;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const maxVal = Math.max(...lastDays.map(d => d.presentes), totalEmployees, 4);

  // Coordenadas de los puntos
  const points = lastDays.map((d, index) => {
    const x = paddingX + (index / (lastDays.length - 1)) * chartW;
    const y = svgHeight - paddingY - (d.presentes / maxVal) * chartH;
    return { x, y, ...d };
  });

  // Generar curva suave Bezier
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? i : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = createSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  // Cálculos para el Donut Chart
  const donutRadius = 54;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const strokeDashoffset = donutCircumference - (attendanceRate / 100) * donutCircumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      
      {/* Gráfico 1: Asistencia en el Tiempo (Toma 2 columnas en pantallas grandes) */}
      <div className="lg:col-span-2 bg-[#101E1A] rounded-3xl p-5 border border-[#203B30] shadow-xl relative overflow-hidden flex flex-col justify-between">
        
        {/* Encabezado del gráfico */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-[#00A878] font-bold text-sm">📊</span>
            <h3 className="text-white font-bold text-sm tracking-tight">
              Asistencia en el Tiempo
            </h3>
          </div>

          <div className="flex items-center space-x-4">
            {/* Leyenda */}
            <div className="flex items-center space-x-3 text-[11px] font-medium text-[#A5B4AC]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00A878]"></span>
                Presentes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-stone-500"></span>
                Ausentes
              </span>
            </div>

            {/* Selector de periodo */}
            <div className="flex items-center bg-[#162720] p-1 rounded-xl border border-[#203B30] text-[11px]">
              <button
                onClick={() => setTimeframe('7d')}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                  timeframe === '7d' 
                    ? 'bg-[#00A878] text-white shadow-sm' 
                    : 'text-[#A5B4AC] hover:text-white'
                }`}
              >
                7 días
              </button>
              <button
                onClick={() => setTimeframe('30d')}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                  timeframe === '30d' 
                    ? 'bg-[#00A878] text-white shadow-sm' 
                    : 'text-[#A5B4AC] hover:text-white'
                }`}
              >
                30 días
              </button>
              <button
                onClick={() => setTimeframe('mes')}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                  timeframe === 'mes' 
                    ? 'bg-[#00A878] text-white shadow-sm' 
                    : 'text-[#A5B4AC] hover:text-white'
                }`}
              >
                Mes
              </button>
            </div>
          </div>
        </div>

        {/* Contenedor del SVG interactivo */}
        <div className="w-full h-48 relative">
          <svg 
            viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="emeraldAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00A878" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#00A878" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Líneas de cuadrícula horizontal */}
            {[0, 1, 2, 3, 4].map((step) => {
              const yPos = svgHeight - paddingY - (step / 4) * chartH;
              const val = Math.round((step / 4) * maxVal);
              return (
                <g key={step}>
                  <line
                    x1={paddingX}
                    y1={yPos}
                    x2={svgWidth - paddingX}
                    y2={yPos}
                    stroke="#203B30"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                    opacity="0.6"
                  />
                  <text
                    x={paddingX - 12}
                    y={yPos + 3}
                    textAnchor="end"
                    fill="#A5B4AC"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Relleno del área bajo la curva */}
            <path d={areaPath} fill="url(#emeraldAreaGradient)" />

            {/* Línea de la curva con resplandor */}
            <path 
              d={linePath} 
              fill="none" 
              stroke="#00A878" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              className="drop-shadow-[0_2px_8px_rgba(0,168,120,0.5)]"
            />

            {/* Puntos y etiquetas del eje X */}
            {points.map((pt, i) => (
              <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                {/* Punto exterior */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIndex === i ? 6 : 4}
                  fill="#071512"
                  stroke="#00A878"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />
                {/* Punto interior */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIndex === i ? 3 : 2}
                  fill="#F5F7F5"
                />

                {/* Etiqueta del día en el eje X */}
                <text
                  x={pt.x}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  fill={hoveredIndex === i ? '#00A878' : '#A5B4AC'}
                  fontSize="11"
                  fontWeight="600"
                >
                  {pt.label}
                </text>
              </g>
            ))}
          </svg>

          {/* Tooltip flotante al pasar el cursor */}
          {hoveredIndex !== null && (
            <div 
              className="absolute z-10 bg-[#071512] border border-[#00A878] rounded-xl px-2.5 py-1 text-[11px] shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
                top: `${(points[hoveredIndex].y / svgHeight) * 100 - 10}%`,
              }}
            >
              <div className="font-bold text-white">{points[hoveredIndex].label} ({points[hoveredIndex].date})</div>
              <div className="text-[#00A878] font-mono font-bold">Presentes: {points[hoveredIndex].presentes}</div>
              <div className="text-stone-400 font-mono">Ausentes: {points[hoveredIndex].ausentes}</div>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico 2: Resumen General (Donut Chart y métricas) */}
      <div className="bg-[#101E1A] rounded-3xl p-5 border border-[#203B30] shadow-xl relative overflow-hidden flex flex-col justify-between">
        
        <h3 className="text-white font-bold text-sm tracking-tight mb-2">
          Resumen General
        </h3>

        <div className="flex items-center justify-between gap-4 my-auto">
          
          {/* SVG Donut Chart */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
              {/* Pista de fondo */}
              <circle
                cx="65"
                cy="65"
                r={donutRadius}
                fill="transparent"
                stroke="#162720"
                strokeWidth="12"
              />
              {/* Arco de progreso verde esmeralda */}
              <circle
                cx="65"
                cy="65"
                r={donutRadius}
                fill="transparent"
                stroke="#00A878"
                strokeWidth="12"
                strokeDasharray={donutCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(0,168,120,0.5)]"
              />
            </svg>

            {/* Texto en el centro del Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-white font-mono tracking-tight leading-none">
                {attendanceRate}%
              </span>
              <span className="text-[10px] font-bold text-[#00A878] uppercase tracking-wider mt-1">
                Asistencia
              </span>
            </div>
          </div>

          {/* Desglose de Estadísticas */}
          <div className="flex-1 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#203B30]">
              <span className="flex items-center gap-2 text-[#A5B4AC]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00A878]"></span>
                Presentes:
              </span>
              <span className="text-white font-black text-sm">
                {todayPresentes}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#203B30]">
              <span className="flex items-center gap-2 text-[#A5B4AC]">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-500"></span>
                Ausentes:
              </span>
              <span className="text-stone-300 font-black text-sm">
                {todayAusentes}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[#A5B4AC]">
                Total:
              </span>
              <span className="text-white font-black text-base">
                {employees.length}
              </span>
            </div>
          </div>

        </div>

        <div className="pt-2 border-t border-[#203B30] text-[11px] text-[#A5B4AC] text-center">
          Nómina oficial de Cooperativa Chinokue Ltda
        </div>

      </div>

    </div>
  );
}
