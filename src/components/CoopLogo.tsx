'use client';

import React from 'react';

interface Props {
  className?: string;
  size?: number;
}

export default function CoopLogo({ className = 'w-10 h-10', size = 40 }: Props) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Círculo exterior con resplandor dorado institucional */}
      <circle cx="50" cy="50" r="47" fill="#063D32" stroke="#F5B942" strokeWidth="3" />
      <circle cx="50" cy="50" r="43" fill="#071E18" stroke="#00A878" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
      
      {/* Símbolo de los dos pinos gemelos del cooperativismo universal */}
      {/* Pino izquierdo (Verde esmeralda vibrante) */}
      <path 
        d="M38 72 L38 58 L28 58 L38 42 L32 42 L43 24 L54 42 L48 42 L58 58 L48 58 L48 72 Z" 
        fill="#00A878" 
      />
      {/* Pino derecho (Verde principal con profundidad) */}
      <path 
        d="M58 72 L58 58 L48 58 L58 42 L52 42 L63 24 L74 42 L68 42 L78 58 L68 58 L68 72 Z" 
        fill="#008F68" 
      />
      
      {/* Espiga de trigo central en oro */}
      <path 
        d="M50 74 L50 28" 
        stroke="#F5B942" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      <ellipse cx="44" cy="38" rx="2.8" ry="4.5" transform="rotate(-30 44 38)" fill="#F5B942" />
      <ellipse cx="56" cy="38" rx="2.8" ry="4.5" transform="rotate(30 56 38)" fill="#F5B942" />
      <ellipse cx="43" cy="48" rx="2.8" ry="4.5" transform="rotate(-30 43 48)" fill="#FCD34D" />
      <ellipse cx="57" cy="48" rx="2.8" ry="4.5" transform="rotate(30 57 48)" fill="#FCD34D" />
      <ellipse cx="45" cy="58" rx="2.5" ry="4" transform="rotate(-30 45 58)" fill="#F5B942" />
      <ellipse cx="55" cy="58" rx="2.5" ry="4" transform="rotate(30 55 58)" fill="#F5B942" />

      {/* Base sólida de la cooperativa en oro */}
      <rect x="30" y="72" width="40" height="4.5" rx="2.25" fill="#F5B942" />
    </svg>
  );
}
