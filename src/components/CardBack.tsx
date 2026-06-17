/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LicenseData } from '../types';
import { QRCodeSVG } from './QRCodeMock';
import { getEmbeddableUrl } from '../utils/driveHelper';
import { logoCmpWatermarkDataUrl } from '../assets/logoData';

interface CardBackProps {
  data: LicenseData;
  id?: string;
}

export const CardBack: React.FC<CardBackProps> = ({ data, id }) => {
  const {
    nombreCompleto,
    rut,
    equiposAutorizados,
    equiposOtros,
    equiposOtrosTexto,
    logoWatermarkUrl,
  } = data;

  const equipmentList: { key: keyof typeof equiposAutorizados; label: string }[] = [
    { key: 'camioneta', label: 'Camioneta' },
    { key: 'camionTolva', label: 'Camión Tolva' },
    { key: 'camionPluma', label: 'Camión Pluma' },
    { key: 'camionAljibe', label: 'Camión Aljibe' },
    { key: 'lubricador', label: 'Lubricador' },
    { key: 'tractoCamion', label: 'Tracto Camión' },
    { key: 'manlift', label: 'Manlift' },
    { key: 'excavadora', label: 'Excavadora' },
    { key: 'retroExcavadora', label: 'Retro-Excavadora' },
    { key: 'minicargador', label: 'Minicargador' },
    { key: 'gruaHorquilla', label: 'Grúa Horquilla' },
    { key: 'grua', label: 'Grúa' },
    { key: 'rodillo', label: 'Rodillo' },
    { key: 'puenteGrua', label: 'Puente Grúa' },
    { key: 'perforadora', label: 'Perforadora' },
    { key: 'caex', label: 'CAEX' },
    { key: 'cargadorFrontal', label: 'Cargador Frontal' },
    { key: 'cfWa1200', label: 'CF - WA 1200' },
    { key: 'bulldozer', label: 'Bulldozer' },
    { key: 'wheeldozer', label: 'Wheeldozer' },
    { key: 'motoniveladora', label: 'Motoniveladora' },
  ];

  const qrValue = `LICENCIA INTERNA CMP - RUT: ${rut || 'N/A'} - NOMBRE: ${nombreCompleto || 'N/A'} - EQUIPOS: ${
    equipmentList
      .filter((eq) => equiposAutorizados[eq.key])
      .map((eq) => eq.label)
      .join(', ')
  }${equiposOtros && equiposOtrosTexto ? `, Otros (${equiposOtrosTexto})` : ''}`;

  const col1 = equipmentList.slice(0, 6);
  const col2 = equipmentList.slice(6, 11);
  const col3 = equipmentList.slice(11, 16);
  const col4 = equipmentList.slice(16);

  /**
   * html2canvas-compatible equipment item.
   * Uses display:inline-block + verticalAlign:middle instead of flex items-center,
   * which html2canvas does not render correctly (items end up at flex-start).
   */
  const renderEquipmentItem = (eq: typeof equipmentList[0]) => {
    const isChecked = equiposAutorizados[eq.key];
    return (
      <div key={eq.key} style={{ display: 'block', height: '14px', whiteSpace: 'nowrap', marginBottom: '1px', boxSizing: 'border-box' }}>
        {/* Checkbox box */}
        <span style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          width: '10px',
          height: '10px',
          borderRadius: '2px',
          border: `1px solid ${isChecked ? '#1e3a8a' : '#cbd5e1'}`,
          backgroundColor: isChecked ? '#1e3a8a' : 'white',
          position: 'relative',
          flexShrink: 0,
          boxSizing: 'border-box',
        }}>
          {isChecked && (
            <svg
              viewBox="0 0 10 10"
              style={{
                position: 'absolute',
                top: '1px',
                left: '1px',
                width: '6px',
                height: '6px',
                stroke: 'white',
                strokeWidth: 2.5,
                fill: 'none',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              } as React.CSSProperties}
            >
              <path d="M2.2,5 L4.2,7 L7.8,3" />
            </svg>
          )}
        </span>
        {/* Label — verticalAlign:middle aligns with the checkbox box */}
        <span style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          fontSize: '7.2px',
          lineHeight: '14px',
          textTransform: 'uppercase',
          userSelect: 'none',
          paddingLeft: '4px',
          fontWeight: isChecked ? 900 : 700,
          color: isChecked ? '#020617' : '#64748b',
        }}>
          {eq.label}
        </span>
      </div>
    );
  };

  return (
    <div
      id={id || 'card-back-capture'}
      className="relative w-[535px] h-[337px] overflow-hidden select-none border border-slate-300 rounded-lg shadow-md flex flex-col justify-between pt-3.5 px-3.5 pb-2 font-sans"
      style={{ boxSizing: 'border-box', width: '535px', height: '337px', backgroundColor: 'white' }}
    >
      {/* Blue perimeter border — explicit top/right/bottom/left (inset shorthand not parsed by html2canvas) */}
      <div
        className="absolute border-2 border-blue-900 rounded pointer-events-none z-10 opacity-95"
        style={{ top: '8px', right: '8px', bottom: '8px', left: '8px' }}
      />

      {/* Background */}
      <div className="absolute inset-0 bg-slate-50 pointer-events-none" />

      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.045] pointer-events-none select-none z-10">
        {logoWatermarkUrl ? (
          <img
            src={logoWatermarkUrl && !logoWatermarkUrl.includes('1a1LBVqQ5R58') ? getEmbeddableUrl(logoWatermarkUrl) : logoCmpWatermarkDataUrl}
            alt="Watermark"
            className="w-[280px] h-auto -rotate-12 object-contain"
            referrerPolicy="no-referrer"
          />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" className="w-[300px] h-auto -rotate-12">
            <text x="50%" y="60%" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="75" fill="#003366" letterSpacing="-4px">
              cmp
            </text>
          </svg>
        )}
      </div>

      {/* ── TOP: Commitment text + QR ── */}
      {/* maxHeight + overflow:hidden ensures QR never bleeds into the grid below */}
      <div className="relative z-20 flex gap-2.5 pt-1.5 px-1.5" style={{ maxHeight: '100px', overflow: 'hidden' }}>

        {/* Commitment text */}
        <div className="flex-1 text-[8.5px] text-slate-800 leading-[1.25] text-left pr-1 overflow-hidden">
          <p className="font-black text-slate-950 uppercase tracking-tight text-[10px] mb-1 leading-normal">
            CONTRATO DE SEGURIDAD Y COMPROMISO
          </p>
          <p className="text-[7.8px] leading-[1.25]">
            El poseedor de esta &ldquo;Autorización Interna&rdquo; para Operar o Conducir, deberá aplicar el manejo a la defensiva, cumplir con el estándar de prevención de fatalidades conducción de vehículo y operación de equipos (EPF) y respetar estrictamente las normativas de tránsito internas de la faena. Esta credencial debe exhibirse permanentemente y caducará de forma inmediata ante incumplimiento de seguridad.
          </p>
        </div>

        {/* QR Code — explicit fixed width/height + overflow:hidden prevents corner clipping */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <div
            className="border border-slate-300 bg-white shadow-xs rounded-sm"
            style={{ width: '72px', height: '72px', overflow: 'hidden', padding: '3px', boxSizing: 'border-box' }}
          >
            <QRCodeSVG value={qrValue} size={64} />
          </div>
          <span className="text-[6.5px] font-black text-slate-500 tracking-tighter uppercase" style={{ display: 'block', lineHeight: '10px', marginTop: '3px', textAlign: 'center' }}>
            VALIDACIÓN QR
          </span>
        </div>

      </div>

      {/* ── EQUIPMENT GRID ── */}
      <div className="relative z-20 mx-1.5 px-2 border-t border-b border-slate-400/40 bg-white/70 flex-1 mt-1 mb-1 flex flex-col justify-between" style={{ overflow: 'hidden', paddingTop: '5px', paddingBottom: '4px' }}>
        <div>
          <span className="text-[7.5px] font-black text-blue-900 uppercase tracking-wider" style={{ display: 'block', lineHeight: '12px', marginBottom: '4px' }}>
            EQUIPOS - VEHÍCULOS AUTORIZADOS
          </span>

          {/* 4-column layout — fixed widths avoid flex shrink issues */}
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <div style={{ width: '110px', flexShrink: 0 }}>{col1.map(renderEquipmentItem)}</div>
            <div style={{ width: '110px', flexShrink: 0 }}>{col2.map(renderEquipmentItem)}</div>
            <div style={{ width: '110px', flexShrink: 0 }}>{col3.map(renderEquipmentItem)}</div>
            <div style={{ width: '110px', flexShrink: 0 }}>{col4.map(renderEquipmentItem)}</div>
          </div>
        </div>

        {/* OTROS row — inline-block + vertical-align for alignment */}
        <div className="border-t border-dashed border-slate-200" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', paddingTop: '4px', marginTop: '3px' }}>
          {/* OTROS checkbox */}
          <span style={{
            display: 'inline-block', verticalAlign: 'middle',
            width: '10px', height: '10px', borderRadius: '2px',
            border: `1px solid ${equiposOtros ? '#1e3a8a' : '#cbd5e1'}`,
            backgroundColor: equiposOtros ? '#1e3a8a' : 'white',
            position: 'relative', boxSizing: 'border-box',
          }}>
            {equiposOtros && (
              <svg viewBox="0 0 10 10" style={{ position: 'absolute', top: '1px', left: '1px', width: '6px', height: '6px', stroke: 'white', strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as React.CSSProperties}>
                <path d="M2.2,5 L4.2,7 L7.8,3" />
              </svg>
            )}
          </span>
          <span
            className={`text-[6.8px] font-extrabold uppercase ${equiposOtros ? 'text-slate-950' : 'text-slate-500'}`}
            style={{ display: 'inline-block', verticalAlign: 'middle', paddingLeft: '4px', paddingRight: '4px', lineHeight: '12px' }}
          >
            OTROS:
          </span>
          <span
            className="text-[6.8px] text-slate-800 uppercase font-black tracking-tight border-b border-dotted border-slate-300"
            style={{ display: 'inline-block', verticalAlign: 'middle', lineHeight: '12px', paddingBottom: '1px', maxWidth: '360px', overflow: 'hidden', whiteSpace: 'nowrap' }}
          >
            {equiposOtros && equiposOtrosTexto ? (
              equiposOtrosTexto
            ) : (
              <span className="text-slate-300 italic font-normal">No especificado</span>
            )}
          </span>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="relative z-20 text-center" style={{ paddingBottom: '6px' }}>
        <span className="text-[7.5px] font-black text-red-600 tracking-wider uppercase" style={{ display: 'block', lineHeight: '12px' }}>
          DEPARTAMENTO DE GESTIÓN DE RIESGOS Y SOSTENIBILIDAD
        </span>
      </div>
    </div>
  );
};
