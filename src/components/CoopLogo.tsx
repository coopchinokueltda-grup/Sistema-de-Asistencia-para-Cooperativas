'use client';

import React from 'react';

interface Props {
  className?: string;
  size?: number;
}

export default function CoopLogo({ className = 'w-9 h-9', size = 36 }: Props) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Círculo exterior con borde dorado sutil */}
      <circle cx="50" cy="50" r="46" fill="#061a12" stroke="#d97706" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="#059669" strokeWidth="1" strokeDasharray="3 3" />
      
      {/* Símbolo de los dos pinos del cooperativismo entrelazados con espiga */}
      <path 
        d="M37 68 L37 54 L27 54 L37 38 L31 38 L42 22 L53 38 L47 38 L57 54 L47 54 L47 68 Z" 
        fill="#10b981" 
      />
      <path 
        d="M57 68 L57 54 L47 54 L57 38 L51 38 L62 22 L73 38 L67 38 L77 54 L67 54 L67 68 Z" 
        fill="#047857" 
      />
      
      {/* Espiga de trigo dorada de producción agrícola */}
      <path 
        d="M50 72 Q50 48 50 28" 
        stroke="#f59e0b" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      <ellipse cx="44" cy="38" rx="3" ry="5" transform="rotate(-30 44 38)" fill="#f59e0b" />
      <ellipse cx="56" cy="38" rx="3" ry="5" transform="rotate(30 56 38)" fill="#f59e0b" />
      <ellipse cx="43" cy="48" rx="3" ry="5" transform="rotate(-30 43 48)" fill="#fbbf24" />
      <ellipse cx="57" cy="48" rx="3" ry="5" transform="rotate(30 57 48)" fill="#fbbf24" />
      <ellipse cx="45" cy="58" rx="2.5" ry="4.5" transform="rotate(-30 45 58)" fill="#f59e0b" />
      <ellipse cx="55" cy="58" rx="2.5" ry="4.5" transform="rotate(30 55 58)" fill="#f59e0b" />

      {/* Base institucional */}
      <rect x="33" y="68" width="34" height="4" rx="2" fill="#d97706" />
    </svg>
  );
}
