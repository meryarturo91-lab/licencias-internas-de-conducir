/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { getEmbeddableUrl } from '../utils/driveHelper';
import { logoCmpDataUrl, logoGrpDataUrl } from '../assets/logoData';

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
  customUrl?: string;
}

export const LogoCMP: React.FC<LogoProps> = ({ className = 'h-7', style, customUrl }) => {
  const finalSrc = customUrl && !customUrl.includes('1a1LBVqQ5R58') ? getEmbeddableUrl(customUrl) : logoCmpDataUrl;

  if (finalSrc) {
    return (
      <img
        src={finalSrc}
        alt="CMP Logo"
        className={`${className} w-auto object-contain shrink-0`}
        style={{ height: '28px', minHeight: '28px', ...style }}
        referrerPolicy="no-referrer"
        onError={(e) => {
          // If the custom URL fails to load, let people know or hide broken img
          console.warn('Custom CMP logo failed to load, falling back to SVG.');
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  // Beautiful high-fidelity vector trademark for CMP
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 110 28"
      className={`${className} shrink-0`}
      style={{ height: '28px', width: '110px', minHeight: '28px', ...style }}
    >
      <defs>
        <linearGradient id="cmpTriangleGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {/* 3 Corporate Geological Triangles (Minería/Cerros/Pilas de Hierro) */}
      <g transform="translate(1, 2)">
        {/* Triangle left (Blue Earth) */}
        <path d="M4,20 L13,4 L22,20 Z" fill="#003366" />
        {/* Triangle right (Golden Ore) */}
        <path d="M16,22 L24,8 L32,22 Z" fill="url(#cmpTriangleGrad)" />
        {/* Triangle center overlapping (Sustentabilidad Verde/Gris) */}
        <path d="M10,22 L18,10 L26,22 Z" fill="#475569" opacity="0.9" />
      </g>

      {/* Typography: "cmp" */}
      <text
        x="38"
        y="17"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="17"
        fill="#003366"
        letterSpacing="-1px"
      >
        cmp
      </text>

      {/* Subtext representation */}
      <text
        x="38"
        y="23"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize="5.5"
        fill="#64748b"
        letterSpacing="0.8px"
      >
        COMPAÑÍA MINERA
      </text>
    </svg>
  );
};

export const LogoGRP: React.FC<LogoProps> = ({ className = 'h-7', style, customUrl }) => {
  const finalSrc = customUrl && !customUrl.includes('1sUNCKNbtxCel') ? getEmbeddableUrl(customUrl) : logoGrpDataUrl;

  if (finalSrc) {
    return (
      <img
        src={finalSrc}
        alt="GRP Logo"
        className={`${className} w-auto object-contain shrink-0`}
        style={{ height: '28px', minHeight: '28px', ...style }}
        referrerPolicy="no-referrer"
        onError={(e) => {
          console.warn('Custom GRP logo failed to load, falling back to SVG.');
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  // Beautiful high-fidelity vector seal for GRP (Gestión de Riesgos de Procesos)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 110 28"
      className={`${className} shrink-0`}
      style={{ height: '28px', width: '110px', minHeight: '28px', ...style }}
    >
      <defs>
        <linearGradient id="grpCircleGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      
      {/* Circle Seal containing shield & leaf representing Safety & Sostenibilidad */}
      <g transform="translate(1, 1)">
        <circle cx="13" cy="13" r="12" fill="url(#grpCircleGrad)" />
        {/* Shield outline */}
        <path d="M13,6 L18,8 L18,13 C18,16.5 15.5,18.5 13,19.5 C10.5,18.5 8,16.5 8,13 L8,8 Z" fill="#ffffff" opacity="0.25" />
        {/* Inner checkmark / safety leaf */}
        <path d="M10,13 L12,15 L16,10" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* Typography: "GRP" */}
      <text
        x="32"
        y="17"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="15"
        fill="#334155"
        letterSpacing="-0.5px"
      >
        GRP
      </text>

      {/* Subtext: RISCOS & ECO */}
      <text
        x="32"
        y="23"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="5.2"
        fill="#10b981"
        letterSpacing="0.5px"
      >
        SEGURIDAD & BIENESTAR
      </text>
    </svg>
  );
};
