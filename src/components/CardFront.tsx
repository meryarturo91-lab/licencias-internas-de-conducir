/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LicenseData } from '../types';
import { LogoCMP, LogoGRP } from './Logos';

interface CardFrontProps {
  data: LicenseData;
  id?: string;
}

// Format date helper: YYYY-MM-DD -> DD/MM/YYYY
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-- / -- / ----';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

/**
 * html2canvas-compatible checkbox.
 * Uses display:inline-block + position:absolute SVG instead of
 * flex items-center (which html2canvas ignores, causing misalignment).
 */
const Checkbox: React.FC<{ checked: boolean; color?: string; size?: number }> = ({
  checked,
  color = '#1e293b',
  size = 13,
}) => (
  <span
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      width: `${size}px`,
      height: `${size}px`,
      border: `1px solid ${checked ? color : '#94a3b8'}`,
      borderRadius: '2px',
      backgroundColor: checked ? color : 'white',
      position: 'relative',
      flexShrink: 0,
      boxSizing: 'border-box',
    }}
  >
    {checked && (
      <svg
        viewBox="0 0 10 10"
        style={{
          position: 'absolute',
          top: '2px',
          left: '2px',
          width: `${size - 5}px`,
          height: `${size - 5}px`,
          stroke: 'white',
          strokeWidth: 2.5,
          fill: 'none',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        } as React.CSSProperties}
      >
        <path d="M2,5 L4.5,7.5 L8.5,3" />
      </svg>
    )}
  </span>
);

export const CardFront: React.FC<CardFrontProps> = ({ data, id }) => {
  const {
    nombreCompleto,
    cargo,
    empresa,
    rut,
    fotoUrl,
    licenciasMunicipales,
    lmValidaHasta,
    licInternaOtorgadaEl,
    vencePsict,
    restricciones,
    areasAutorizadas,
    logoCmpUrl,
    logoGrpUrl,
  } = data;

  return (
    <div
      id={id || 'card-front-capture'}
      className="relative w-[535px] h-[337px] bg-white overflow-hidden select-none border border-slate-300 rounded-lg shadow-md flex flex-col p-3.5 font-sans"
      style={{ boxSizing: 'border-box', width: '535px', height: '337px' }}
    >
      {/* Blue perimeter border — explicit top/right/bottom/left instead of inset shorthand */}
      <div
        className="absolute border-2 border-blue-900 rounded pointer-events-none z-10 opacity-95"
        style={{ top: '8px', right: '8px', bottom: '8px', left: '8px' }}
      />

      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-tr from-slate-50 via-white to-slate-50 opacity-90 pointer-events-none" />

      {/* Security micro-pattern */}
      <div
        className="absolute pointer-events-none opacity-[0.03]"
        style={{
          top: '10px', right: '10px', bottom: '10px', left: '10px',
          backgroundImage: 'repeating-linear-gradient(45deg, #1e3a8a 0px, #1e3a8a 1px, transparent 1px, transparent 10px)',
        }}
      />

      {/* ── HEADER ── */}
      <div className="relative z-20 flex items-center justify-between gap-1 w-full border-b border-blue-900 pb-1.5 mt-1.5 px-1.5">
        <LogoCMP className="h-7" customUrl={logoCmpUrl} />
        <div className="flex-1 text-center px-1">
          <h1 className="text-[10px] font-black tracking-tight text-red-600 uppercase leading-normal">
            FAENA MINA LOS COLORADOS
          </h1>
          <h2 className="text-[11px] font-black tracking-wider text-blue-950 uppercase mt-0.5 leading-normal">
            LICENCIA INTERNA DE CONDUCIR
          </h2>
        </div>
        <LogoGRP className="h-7" customUrl={logoGrpUrl} />
      </div>

      {/* ── MAIN BODY ── */}
      <div className="relative z-20 flex gap-3 mt-2 px-1.5 flex-1 overflow-hidden">

        {/* ── LEFT COLUMN: Photo + Areas ── */}
        <div className="w-[104px] shrink-0 flex flex-col items-center justify-between">

          {/* Photo */}
          <div className="w-[102px] h-[122px] border-2 border-slate-700 bg-slate-100 flex items-center justify-center overflow-hidden shadow-inner relative rounded-sm">
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt="Foto Licencia"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-1 text-slate-400">
                <svg className="w-16 h-16 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.5 2 5.5 4.5 5.1 8H18.9C18.5 4.5 15.5 2 12 2Z" fill="#D97706" />
                  <rect x="11.2" y="1" width="1.6" height="2" fill="#92400E" rx="0.5" />
                  <ellipse cx="12" cy="4.5" rx="1.5" ry="1.2" fill="#FEF08A" />
                  <path d="M12 9c-2.2 0-4 1.8-4 4v1c0 .6.4 1 1 1h6c.6 0 1-.4 1-1v-1c0-2.2-1.8-4-4-4Z" />
                  <path d="M12 15c-3.3 0-6 2.7-6 6 0 .6.4 1 1 1h10c.6 0 1-.4 1-1 0-3.3-2.7-6-6-6Z" />
                </svg>
                <span className="text-[7.5px] font-semibold text-slate-500 uppercase tracking-tight text-center leading-normal mt-1">
                  CARGAR FOTO
                </span>
              </div>
            )}
          </div>

          {/* Authorized Areas — inline-block + vertical-align for checkbox alignment */}
          <div className="w-[102px] border border-red-200 bg-red-50/70 py-1 px-0.5 rounded-sm mt-1 shrink-0" style={{ textAlign: 'center' }}>
            <span className="text-[8px] font-black text-red-600 tracking-tight leading-normal uppercase" style={{ display: 'block', lineHeight: '12px', marginBottom: '3px' }}>
              ÁREAS AUTORIZADAS
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
              <div style={{ display: 'block', whiteSpace: 'nowrap' }}>
                <Checkbox checked={areasAutorizadas.areaMina} color="#dc2626" size={12} />
                <span style={{ display: 'inline-block', verticalAlign: 'middle', fontSize: '8px', fontWeight: 900, color: '#b91c1c', paddingLeft: '3px', lineHeight: '12px' }}>MINA</span>
              </div>
              <div style={{ display: 'block', whiteSpace: 'nowrap' }}>
                <Checkbox checked={areasAutorizadas.areaPlanta} color="#dc2626" size={12} />
                <span style={{ display: 'inline-block', verticalAlign: 'middle', fontSize: '8px', fontWeight: 900, color: '#b91c1c', paddingLeft: '3px', lineHeight: '12px' }}>PLANTA</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex-1 flex flex-col justify-between pl-1" style={{ minWidth: 0 }}>

          {/* Personal Data — lineHeight replaces flex items-center to fix text clipping in html2canvas */}
          <div className="flex flex-col gap-0.5 text-slate-800 mt-1 w-full shrink-0">
            {/* NOMBRE */}
            <div className="flex h-[19px] border-b border-slate-200 w-full" style={{ minWidth: 0, overflow: 'hidden' }}>
              <span className="w-[50px] font-black text-blue-900 tracking-wide text-[7.5px] uppercase shrink-0" style={{ lineHeight: '17px' }}>NOMBRE:</span>
              <span className="flex-1 font-black text-slate-950 tracking-tight uppercase text-[9.5px]" style={{ minWidth: 0, lineHeight: '17px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {nombreCompleto || <span className="text-slate-300 italic font-normal">-- INGRESE NOMBRE COMPLETO --</span>}
              </span>
            </div>
            {/* RUT */}
            <div className="flex h-[19px] border-b border-slate-200 w-full" style={{ minWidth: 0, overflow: 'hidden' }}>
              <span className="w-[50px] font-black text-blue-900 tracking-wide text-[7.5px] uppercase shrink-0" style={{ lineHeight: '17px' }}>RUT:</span>
              <span className="flex-1 font-black text-slate-950 uppercase text-[9.5px]" style={{ minWidth: 0, lineHeight: '17px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {rut || <span className="text-slate-300 italic font-normal">-- INGRESE RUT --</span>}
              </span>
            </div>
            {/* CARGO */}
            <div className="flex h-[19px] border-b border-slate-200 w-full" style={{ minWidth: 0, overflow: 'hidden' }}>
              <span className="w-[50px] font-black text-blue-900 tracking-wide text-[7.5px] uppercase shrink-0" style={{ lineHeight: '17px' }}>CARGO:</span>
              <span className="flex-1 font-bold text-slate-800 tracking-tight uppercase text-[8.5px]" style={{ minWidth: 0, lineHeight: '17px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {cargo || <span className="text-slate-300 italic font-normal">-- INGRESE CARGO --</span>}
              </span>
            </div>
            {/* EMPRESA */}
            <div className="flex h-[19px] border-b border-slate-200 w-full" style={{ minWidth: 0, overflow: 'hidden' }}>
              <span className="w-[50px] font-black text-blue-900 tracking-wide text-[7.5px] uppercase shrink-0" style={{ lineHeight: '17px' }}>EMPRESA:</span>
              <span className="flex-1 font-bold text-slate-800 tracking-tight uppercase text-[8.5px]" style={{ minWidth: 0, lineHeight: '17px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {empresa || <span className="text-slate-300 italic font-normal">-- INGRESE EMPRESA --</span>}
              </span>
            </div>
          </div>

          {/* Municipal Licenses — lineHeight: '21px' + display:block for vertical centering */}
          <div className="mt-1 border border-blue-900/40 bg-blue-50/30 p-1.5 rounded-sm shrink-0">
            <span className="text-[8px] font-extrabold text-blue-900 tracking-wider uppercase" style={{ display: 'block', lineHeight: '12px', marginBottom: '4px' }}>
              LICENCIAS MUNICIPALES AUTORIZADAS
            </span>
            <div className="flex gap-1.5">
              {(Object.keys(licenciasMunicipales) as Array<keyof typeof licenciasMunicipales>).map((key) => {
                const checked = licenciasMunicipales[key];
                return (
                  <div
                    key={key}
                    className={`flex-1 rounded-sm border font-black text-[9px] transition-colors ${
                      checked
                        ? 'bg-blue-900 border-blue-900 text-white'
                        : 'bg-white/70 border-slate-300 text-slate-300'
                    }`}
                    style={{ height: '21px', lineHeight: '21px', textAlign: 'center', display: 'block' }}
                  >
                    {key}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date Controls — block layout + explicit lineHeight, no flex centering */}
          <div className="flex gap-1 mt-1 shrink-0">
            {/* L.M. VÁLIDA HASTA */}
            <div className="flex-1 border border-slate-200 bg-slate-50 rounded-xs" style={{ minHeight: '38px', textAlign: 'center', padding: '4px 2px 5px', boxSizing: 'border-box' }}>
              <span className="text-[6.8px] font-black text-slate-500 tracking-tight uppercase" style={{ display: 'block', lineHeight: '10px' }}>
                L.M. VÁLIDA HASTA
              </span>
              <span className="text-[8.5px] font-black text-slate-900" style={{ display: 'block', lineHeight: '13px', marginTop: '4px' }}>
                {formatDate(lmValidaHasta)}
              </span>
            </div>
            {/* LIC. OTORGADA EL */}
            <div className="flex-1 border border-slate-200 bg-slate-50 rounded-xs" style={{ minHeight: '38px', textAlign: 'center', padding: '4px 2px 5px', boxSizing: 'border-box' }}>
              <span className="text-[6.8px] font-black text-slate-500 tracking-tight uppercase" style={{ display: 'block', lineHeight: '10px' }}>
                LIC. OTORGADA EL
              </span>
              <span className="text-[8.5px] font-black text-slate-900" style={{ display: 'block', lineHeight: '13px', marginTop: '4px' }}>
                {formatDate(licInternaOtorgadaEl)}
              </span>
            </div>
            {/* VENCE PSICT */}
            <div className="flex-1 border border-red-200 bg-red-50/50 rounded-xs" style={{ minHeight: '38px', textAlign: 'center', padding: '4px 2px 5px', boxSizing: 'border-box' }}>
              <span className="text-[6.8px] font-black text-red-700 tracking-tight uppercase" style={{ display: 'block', lineHeight: '10px' }}>
                VENCE PSICT.
              </span>
              <span className="text-[8.5px] font-black text-red-800" style={{ display: 'block', lineHeight: '13px', marginTop: '4px' }}>
                {formatDate(vencePsict)}
              </span>
            </div>
          </div>

          {/* Restrictions — inline-block + vertical-align for checkbox+label alignment */}
          <div className="border border-slate-300 bg-slate-50/80 p-1.5 rounded-sm mt-1 mb-1.5 shrink-0" style={{ minHeight: '29px' }}>
            <div style={{ display: 'block', whiteSpace: 'nowrap', lineHeight: '18px' }}>
              <span className="text-[8px] font-extrabold text-slate-600 uppercase tracking-wider" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', lineHeight: '18px' }}>
                RESTRICCIONES:
              </span>

              {/* LENTES */}
              <span style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', whiteSpace: 'nowrap' }}>
                <Checkbox checked={restricciones.lentes} size={13} />
                <span className="text-[8px] font-bold text-slate-700 uppercase" style={{ display: 'inline-block', verticalAlign: 'middle', paddingLeft: '4px', lineHeight: '18px' }}>LENTES</span>
              </span>

              {/* AUDÍFONOS */}
              <span style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', whiteSpace: 'nowrap' }}>
                <Checkbox checked={restricciones.audifonos} size={13} />
                <span className="text-[8px] font-bold text-slate-700 uppercase" style={{ display: 'inline-block', verticalAlign: 'middle', paddingLeft: '4px', lineHeight: '18px' }}>AUDÍFONOS</span>
              </span>

              {/* OTROS */}
              <span style={{ display: 'inline-block', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                <Checkbox checked={restricciones.otros} size={13} />
                <span className="text-[8px] font-bold text-slate-700 uppercase" style={{ display: 'inline-block', verticalAlign: 'middle', paddingLeft: '4px', lineHeight: '18px' }}>OTROS</span>
              </span>

              {restricciones.otros && restricciones.otrosTexto && (
                <span style={{ display: 'inline-block', verticalAlign: 'middle', borderLeft: '1px solid #cbd5e1', paddingLeft: '8px', marginLeft: '6px', fontSize: '8px', fontWeight: 600, color: '#1e293b', textTransform: 'uppercase', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px', lineHeight: '18px' }}>
                  {restricciones.otrosTexto}
                </span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
