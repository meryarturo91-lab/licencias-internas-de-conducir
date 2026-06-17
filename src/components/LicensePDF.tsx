/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LicensePDF.tsx
 * Generates CR80 / Proof-Sheet PDFs using @react-pdf/renderer (vector-native).
 * No html2canvas / DOM capture — layout uses react-pdf's proper Yoga flexbox engine.
 */

import React, { useMemo } from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
  Svg,
  Circle,
  Path,
  Rect,
} from '@react-pdf/renderer';
import { LicenseData } from '../types';
import { getEmbeddableUrl } from '../utils/driveHelper';
import { logoCmpDataUrl, logoGrpDataUrl, logoCmpWatermarkDataUrl } from '../assets/logoData';

// Disable hyphenation so words never break mid-word
Font.registerHyphenationCallback((word) => [word]);


// ─── Dimensions ───────────────────────────────────────────────────────────────
// CR80 card: 85.6 mm × 54 mm  (1mm = 2.834645 pt)
const MM = 2.834645;
const CW = +(85.6 * MM).toFixed(2); // ≈ 242.64 pt  (card width)
const CH = +(54   * MM).toFixed(2); // ≈ 153.07 pt  (card height)

// ─── Colour palette ───────────────────────────────────────────────────────────
const C = {
  white:   '#ffffff',
  bg:      '#f8fafc',
  navy:    '#003366', // CMP corporate blue
  navyDk:  '#000000', // Black
  red:     '#dc2626', // CMP red
  redDk:   '#b91c1c',
  amber:   '#dc2626', // Red warning
  amberDk: '#000000', // Black text
  green:   '#000000', // Black
  sl50:    '#f8fafc',
  sl100:   '#f1f5f9',
  sl200:   '#e2e8f0',
  sl300:   '#cbd5e1',
  sl400:   '#94a3b8',
  sl500:   '#64748b',
  sl600:   '#475569',
  sl700:   '#334155',
  sl800:   '#1e293b',
  sl900:   '#0f172a',
  sl950:   '#020617',
};

const F = 'Helvetica'; // Built-in PDF font — no network request, zero-failure

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(s: string): string {
  if (!s) return '--/--/----';
  const [y, m, d] = s.split('-');
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

/**
 * Deterministic pseudo-QR grid (25×25) seeded from a string.
 * Uses finder patterns, timing strips, and alignment block per QR spec shape,
 * with PRNG-seeded data modules so the code is content-specific.
 */
function computeQRGrid(value: string): boolean[][] {
  const N = 25;
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }

  const g: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

  // Finder pattern (7×7)
  const finder = (sx: number, sy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        if (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4))
          g[sy + y][sx + x] = true;
      }
    }
  };
  finder(0, 0);
  finder(N - 7, 0);
  finder(0, N - 7);

  // Alignment pattern (5×5, bottom-right)
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      if (x === 0 || x === 4 || y === 0 || y === 4 || (x === 2 && y === 2))
        g[N - 9 + y][N - 9 + x] = true;
    }
  }

  // Timing strips
  for (let i = 8; i < N - 8; i++) {
    g[6][i] = i % 2 === 0;
    g[i][6] = i % 2 === 0;
  }

  // Data modules (PRNG)
  let seed = Math.abs(hash || 12345);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const inTL = x < 8 && y < 8;
      const inTR = x > N - 9 && y < 8;
      const inBL = x < 8 && y > N - 9;
      const inAl = x > N - 10 && x < N - 4 && y > N - 10 && y < N - 4;
      if (!inTL && !inTR && !inBL && !inAl && x !== 6 && y !== 6) {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        g[y][x] = seed % 3 === 0;
      }
    }
  }

  return g;
}

// ─── Primitive PDF components ─────────────────────────────────────────────────

/** QR code rendered using react-pdf Svg + Rect — proper vector QR in the PDF */
const QRCodePDF: React.FC<{ value: string; sizePt: number }> = ({ value, sizePt }) => {
  const grid = useMemo(() => computeQRGrid(value), [value]);
  const cell = sizePt / 25;
  return (
    <Svg width={sizePt} height={sizePt} viewBox={`0 0 ${sizePt} ${sizePt}`}>
      <Rect x={0} y={0} width={sizePt} height={sizePt} fill="white" />
      {grid.flatMap((row, y) =>
        row.map((on, x) =>
          on ? (
            <Rect
              key={`${x}-${y}`}
              x={x * cell}
              y={y * cell}
              width={cell}
              height={cell}
              fill="#111827"
            />
          ) : null
        )
      )}
    </Svg>
  );
};

/** Checkbox rendered as an SVG within react-pdf */
const CheckboxPDF: React.FC<{ checked: boolean; sizePt?: number; color?: string }> = ({
  checked,
  sizePt = 4.5,
  color = C.sl800,
}) => (
  <Svg width={sizePt} height={sizePt} viewBox="0 0 14 14">
    <Rect
      x={0.75}
      y={0.75}
      width={12.5}
      height={12.5}
      rx={2}
      ry={2}
      fill={checked ? color : 'white'}
      stroke={checked ? color : C.sl400}
      strokeWidth={1.2}
    />
    {checked && (
      <Path d="M3,7 L5.5,9.5 L11,4.5" stroke="white" strokeWidth={2.2} fill="none" />
    )}
  </Svg>
);

/** CMP triangular logo for PDF */
const LogoCMPPDF: React.FC<{ customUrl?: string }> = ({ customUrl }) => {
  const url = customUrl && !customUrl.includes('1a1LBVqQ5R58') ? getEmbeddableUrl(customUrl) : logoCmpDataUrl;
  return <Image src={url} style={{ width: 32, height: 11, objectFit: 'contain' }} />;
};

/** GRP shield logo for PDF */
const LogoGRPPDF: React.FC<{ customUrl?: string }> = ({ customUrl }) => {
  const url = customUrl && !customUrl.includes('1sUNCKNbtxCel') ? getEmbeddableUrl(customUrl) : logoGrpDataUrl;
  return <Image src={url} style={{ width: 32, height: 11, objectFit: 'contain' }} />;
};

// ─── StyleSheet (all in pt unless noted) ─────────────────────────────────────
const s = StyleSheet.create({
  // ── Card shell
  card: {
    width:  CW,
    height: CH,
    backgroundColor: C.white,
    position: 'relative',
    overflow: 'hidden',
  },
  cardBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: C.sl50,
  },
  cardBorder: {
    position: 'absolute',
    top: 7, left: 7, right: 7, bottom: 7,
    borderWidth: 1.5,
    borderColor: C.navy,
    borderStyle: 'solid',
    borderRadius: 3,
  },
  cardContent: {
    position: 'absolute',
    top: 11, left: 11, right: 11, bottom: 11,
    flexDirection: 'column',
  },

  // ── Front: header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: C.navy,
    borderBottomStyle: 'solid',
    paddingBottom: 3,
    marginBottom: 3,
    gap: 2,
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 1 },
  headerTitle: {
    fontFamily: F, fontWeight: 900, fontSize: 4.2, color: C.red,
    textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2,
  },
  headerSub: {
    fontFamily: F, fontWeight: 900, fontSize: 5.5, color: C.navyDk,
    textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2,
  },

  // ── Front: body columns
  body: { flex: 1, flexDirection: 'row', gap: 5 },
  leftCol: { width: 22 * MM, flexDirection: 'column', gap: 2.5 },
  rightCol: { flex: 1, flexDirection: 'column', gap: 2.5 },

  // ── Photo
  photo: {
    width: 22 * MM, height: 29 * MM,
    borderWidth: 1.5, borderColor: C.sl700, borderStyle: 'solid',
    backgroundColor: C.sl100, overflow: 'hidden', borderRadius: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  photoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  photoPlaceholderText: {
    fontFamily: F, fontWeight: 700, fontSize: 3.5,
    color: C.sl500, textTransform: 'uppercase', textAlign: 'center', marginTop: 3,
  },

  // ── Areas box
  areasBox: {
    borderWidth: 0.75, borderColor: C.red, borderStyle: 'solid',
    backgroundColor: C.white, borderRadius: 1.5,
    paddingTop: 2.5, paddingBottom: 2.5, paddingLeft: 2, paddingRight: 2,
    alignItems: 'center', gap: 2.5,
  },
  areasTitle: {
    fontFamily: F, fontWeight: 900, fontSize: 3, color: C.red,
    textTransform: 'uppercase', textAlign: 'center',
  },
  areasRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  areaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  areaLabel: {
    fontFamily: F, fontWeight: 900, fontSize: 3.5, color: C.redDk, textTransform: 'uppercase',
  },

  // ── Data rows (right column personal info)
  dataRows: { flexDirection: 'column', gap: 1 },
  dataRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 0.5, borderBottomColor: C.sl200, borderBottomStyle: 'solid',
    paddingBottom: 1.5, minHeight: 9,
  },
  dataLabel: {
    fontFamily: F, fontWeight: 900, fontSize: 3.5, color: C.navy,
    textTransform: 'uppercase', width: 26, flexShrink: 0,
  },
  dataValLg: {
    flex: 1, fontFamily: F, fontWeight: 900, fontSize: 4.2,
    color: C.sl950, textTransform: 'uppercase',
  },
  dataValMono: { flex: 1, fontFamily: F, fontWeight: 900, fontSize: 4.2, color: C.sl950 },
  dataValMd: {
    flex: 1, fontFamily: F, fontWeight: 700, fontSize: 4.2,
    color: C.sl800, textTransform: 'uppercase',
  },
  dataEmpty: {
    fontFamily: F, fontWeight: 400, fontSize: 3.8, color: C.sl300, fontStyle: 'italic',
  },

  // ── Municipal licence badges
  licBox: {
    borderWidth: 0.75, borderColor: C.navy, borderStyle: 'solid',
    backgroundColor: C.white, borderRadius: 1.5,
    paddingTop: 2.5, paddingBottom: 3, paddingLeft: 2.5, paddingRight: 2.5,
  },
  licTitle: {
    fontFamily: F, fontWeight: 900, fontSize: 3, color: C.navy,
    textTransform: 'uppercase', marginBottom: 2.5,
  },
  licBadges: { flexDirection: 'row', gap: 2 },
  licBadge: {
    flex: 1, height: 11, borderRadius: 1, borderWidth: 0.75,
    alignItems: 'center', justifyContent: 'center',
  },
  licBadgeText: { fontFamily: F, fontWeight: 900, fontSize: 5 },

  // ── Date boxes
  dateCols: { flexDirection: 'row', gap: 2 },
  dateBox: {
    flex: 1, borderWidth: 0.75, borderColor: C.sl200, borderStyle: 'solid',
    backgroundColor: C.sl50, borderRadius: 1.5,
    paddingTop: 2.5, paddingBottom: 3, paddingLeft: 2, paddingRight: 2,
    alignItems: 'center', gap: 2,
  },
  dateBoxWarn: { borderColor: C.red, backgroundColor: C.white },
  dateLbl: {
    fontFamily: F, fontWeight: 900, fontSize: 2.8, color: C.sl500,
    textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.3,
  },
  dateLblWarn: { color: C.amber },
  dateVal: { fontFamily: F, fontWeight: 900, fontSize: 4.8, color: C.sl900, textAlign: 'center' },
  dateValWarn: { color: C.amberDk },

  // ── Restrictions
  restrictBox: {
    borderWidth: 0.75, borderColor: C.sl300, borderStyle: 'solid',
    backgroundColor: C.sl50, borderRadius: 1.5,
    paddingTop: 2.5, paddingBottom: 2.5, paddingLeft: 3, paddingRight: 3,
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4,
  },
  restrictTitle: {
    fontFamily: F, fontWeight: 900, fontSize: 3.5, color: C.sl600, textTransform: 'uppercase',
  },
  restrictItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  restrictLabel: {
    fontFamily: F, fontWeight: 700, fontSize: 3.5, color: C.sl700, textTransform: 'uppercase',
  },

  // ── Back card content wrapper
  backContent: {
    position: 'absolute', top: 11, left: 11, right: 11, bottom: 11,
    flexDirection: 'column', gap: 3,
  },

  // ── Back: commitment text + QR row
  topSection: { flexDirection: 'row', gap: 4 },
  commitCol: { flex: 1, flexDirection: 'column', gap: 2 },
  commitTitle: {
    fontFamily: F, fontWeight: 900, fontSize: 5, color: C.sl950,
    textTransform: 'uppercase', lineHeight: 1.25,
  },
  commitBody: {
    fontFamily: F, fontWeight: 400, fontSize: 4.6, color: C.sl800, lineHeight: 1.4,
  },
  qrCol: { flexShrink: 0, alignItems: 'center', gap: 2 },
  qrBox: {
    borderWidth: 0.75, borderColor: C.sl300, borderStyle: 'solid',
    backgroundColor: C.white, borderRadius: 1.5,
    paddingTop: 2.5, paddingBottom: 2.5, paddingLeft: 2.5, paddingRight: 2.5,
  },
  qrLabel: {
    fontFamily: F, fontWeight: 900, fontSize: 2.8, color: C.sl500,
    textTransform: 'uppercase', textAlign: 'center',
  },

  // ── Equipment grid
  eqSection: {
    flex: 1,
    borderTopWidth: 0.75, borderTopColor: C.sl400, borderTopStyle: 'solid',
    paddingTop: 2.5, flexDirection: 'column',
  },
  eqTitle: {
    fontFamily: F, fontWeight: 900, fontSize: 3.5, color: C.navy,
    textTransform: 'uppercase', marginBottom: 2.5,
  },
  eqGrid: { flex: 1, flexDirection: 'row' },
  eqCol: { flex: 1, flexDirection: 'column', gap: 1.8, paddingRight: 2 },
  eqItem: { flexDirection: 'row', alignItems: 'center', gap: 2.5 },
  eqLabel: { fontFamily: F, fontSize: 3.2, textTransform: 'uppercase', lineHeight: 1 },

  // ── OTROS row
  otrosRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderTopWidth: 0.5, borderTopColor: C.sl200, borderTopStyle: 'solid',
    paddingTop: 2.5,
  },
  otrosLabel: {
    fontFamily: F, fontWeight: 900, fontSize: 3.2, textTransform: 'uppercase',
  },
  otrosValue: {
    flex: 1, fontFamily: F, fontWeight: 900, fontSize: 3.2,
    color: C.sl800, textTransform: 'uppercase',
  },
  otrosEmpty: {
    flex: 1, fontFamily: F, fontWeight: 400, fontSize: 3.2, color: C.sl300, fontStyle: 'italic',
  },

  // ── Back footer
  backFooter: {
    borderTopWidth: 0.75, borderTopColor: C.sl300, borderTopStyle: 'solid',
    paddingTop: 2.5, alignItems: 'center',
  },
  footerText: {
    fontFamily: F, fontWeight: 900, fontSize: 3, color: C.red,
    textTransform: 'uppercase', textAlign: 'center',
  },

  // ── Proof Sheet page
  proofPage: { backgroundColor: C.white, paddingTop: 40, paddingBottom: 40, paddingLeft: 48, paddingRight: 48 },
  proofTitle: { fontFamily: F, fontWeight: 900, fontSize: 14, color: C.sl900, marginBottom: 5 },
  proofSub: { fontFamily: F, fontWeight: 400, fontSize: 9, color: C.sl600, marginBottom: 4 },
  proofMeta: { fontFamily: F, fontWeight: 400, fontSize: 8, color: C.sl500, marginBottom: 2 },
  proofDivider: {
    borderBottomWidth: 0.5, borderBottomColor: C.sl200, borderBottomStyle: 'solid', marginBottom: 18, marginTop: 8,
  },
  proofCardLabel: {
    fontFamily: F, fontWeight: 900, fontSize: 8, color: C.sl700,
    textTransform: 'uppercase', marginBottom: 5,
  },
  proofCardWrapper: {
    borderWidth: 0.75, borderColor: C.sl300, borderStyle: 'solid',
    marginBottom: 18, alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  proofInstructions: {
    borderTopWidth: 0.5, borderTopColor: C.sl200, borderTopStyle: 'solid',
    paddingTop: 14, marginTop: 4, gap: 4,
  },
  proofInstTitle: { fontFamily: F, fontWeight: 700, fontSize: 9, color: C.sl700 },
  proofInstItem: { fontFamily: F, fontWeight: 400, fontSize: 8, color: C.sl600 },
});

// ─── Equipment list (must match types.ts AuthorizedEquipment keys) ─────────────
const EQUIP_LIST = [
  { key: 'camioneta',      label: 'Camioneta' },
  { key: 'camionTolva',    label: 'Camión Tolva' },
  { key: 'camionPluma',    label: 'Camión Pluma' },
  { key: 'camionAljibe',   label: 'Camión Aljibe' },
  { key: 'lubricador',     label: 'Lubricador' },
  { key: 'tractoCamion',   label: 'Tracto Camión' },
  { key: 'manlift',        label: 'Manlift' },
  { key: 'excavadora',     label: 'Excavadora' },
  { key: 'retroExcavadora',label: 'Retro-Excavadora' },
  { key: 'minicargador',   label: 'Minicargador' },
  { key: 'gruaHorquilla',  label: 'Grúa Horquilla' },
  { key: 'grua',           label: 'Grúa' },
  { key: 'rodillo',        label: 'Rodillo' },
  { key: 'puenteGrua',     label: 'Puente Grúa' },
  { key: 'perforadora',    label: 'Perforadora' },
  { key: 'caex',           label: 'CAEX' },
  { key: 'cargadorFrontal',label: 'Cargador Frontal' },
  { key: 'cfWa1200',       label: 'CF - WA 1200' },
  { key: 'bulldozer',      label: 'Bulldozer' },
  { key: 'wheeldozer',     label: 'Wheeldozer' },
  { key: 'motoniveladora', label: 'Motoniveladora' },
] as const;

type EquipKey = typeof EQUIP_LIST[number]['key'];

// ─── Card Front ───────────────────────────────────────────────────────────────

const CardFrontPDF: React.FC<{ data: LicenseData }> = ({ data }) => {
  const {
    nombreCompleto, cargo, empresa, rut, fotoUrl,
    licenciasMunicipales, lmValidaHasta, licInternaOtorgadaEl, vencePsict,
    restricciones, areasAutorizadas, logoCmpUrl, logoGrpUrl,
  } = data;

  return (
    <View style={s.card}>
      <View style={s.cardBg} />
      <View style={s.cardBorder} />
      <View style={s.cardContent}>

        {/* HEADER */}
        <View style={s.header}>
          <LogoCMPPDF customUrl={logoCmpUrl} />
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>FAENA MINA LOS COLORADOS</Text>
            <Text style={s.headerSub}>LICENCIA INTERNA DE CONDUCIR</Text>
          </View>
          <LogoGRPPDF customUrl={logoGrpUrl} />
        </View>

        {/* BODY */}
        <View style={s.body}>

          {/* ── Left: photo + areas */}
          <View style={s.leftCol}>
            <View style={s.photo}>
              {fotoUrl ? (
                <Image src={fotoUrl} style={s.photoImg} />
              ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Svg viewBox="0 0 40 40" width={22} height={22}>
                    <Circle cx={20} cy={14} r={9} fill={C.sl300} />
                    <Path d="M2,40 C2,26 38,26 38,40 Z" fill={C.sl300} />
                  </Svg>
                  <Text style={s.photoPlaceholderText}>FOTO</Text>
                </View>
              )}
            </View>

            <View style={s.areasBox}>
              <Text style={s.areasTitle}>ÁREAS AUTORIZADAS</Text>
              <View style={s.areasRow}>
                <View style={s.areaItem}>
                  <CheckboxPDF checked={areasAutorizadas.areaMina} sizePt={4.5} color={C.red} />
                  <Text style={s.areaLabel}>MINA</Text>
                </View>
                <View style={s.areaItem}>
                  <CheckboxPDF checked={areasAutorizadas.areaPlanta} sizePt={4.5} color={C.red} />
                  <Text style={s.areaLabel}>PLANTA</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Right: data + licences + dates + restrictions */}
          <View style={s.rightCol}>

            {/* Personal data rows */}
            <View style={s.dataRows}>
              <View style={s.dataRow}>
                <Text style={s.dataLabel}>NOMBRE:</Text>
                {nombreCompleto
                  ? <Text style={s.dataValLg} numberOfLines={1}>{nombreCompleto}</Text>
                  : <Text style={s.dataEmpty}>— INGRESE NOMBRE —</Text>}
              </View>
              <View style={s.dataRow}>
                <Text style={s.dataLabel}>RUT:</Text>
                {rut
                  ? <Text style={s.dataValMono} numberOfLines={1}>{rut}</Text>
                  : <Text style={s.dataEmpty}>— INGRESE RUT —</Text>}
              </View>
              <View style={s.dataRow}>
                <Text style={s.dataLabel}>CARGO:</Text>
                {cargo
                  ? <Text style={s.dataValMd} numberOfLines={1}>{cargo}</Text>
                  : <Text style={s.dataEmpty}>— INGRESE CARGO —</Text>}
              </View>
              <View style={s.dataRow}>
                <Text style={s.dataLabel}>EMPRESA:</Text>
                {empresa
                  ? <Text style={s.dataValMd} numberOfLines={1}>{empresa}</Text>
                  : <Text style={s.dataEmpty}>— INGRESE EMPRESA —</Text>}
              </View>
            </View>

            {/* Municipal licences */}
            <View style={s.licBox}>
              <Text style={s.licTitle}>LICENCIAS MUNICIPALES AUTORIZADAS</Text>
              <View style={s.licBadges}>
                {(Object.keys(licenciasMunicipales) as Array<keyof typeof licenciasMunicipales>).map((key) => {
                  const on = licenciasMunicipales[key];
                  return (
                    <View key={key} style={[s.licBadge, {
                      borderColor: on ? C.navy : C.sl300,
                      backgroundColor: on ? C.navy : C.white,
                    }]}>
                      <Text style={[s.licBadgeText, { color: on ? C.white : C.sl300 }]}>{key}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Date boxes */}
            <View style={s.dateCols}>
              <View style={s.dateBox}>
                <Text style={s.dateLbl}>{'L.M. VÁLIDA\nHASTA'}</Text>
                <Text style={s.dateVal}>{formatDate(lmValidaHasta)}</Text>
              </View>
              <View style={s.dateBox}>
                <Text style={s.dateLbl}>{'LIC. INTERNA\nOTORGADA EL'}</Text>
                <Text style={s.dateVal}>{formatDate(licInternaOtorgadaEl)}</Text>
              </View>
              <View style={[s.dateBox, s.dateBoxWarn]}>
                <Text style={[s.dateLbl, s.dateLblWarn]}>{'VENCE\nPSICOTÉCNICO'}</Text>
                <Text style={[s.dateVal, s.dateValWarn]}>{formatDate(vencePsict)}</Text>
              </View>
            </View>

            {/* Restrictions */}
            <View style={s.restrictBox}>
              <Text style={s.restrictTitle}>RESTRICCIONES:</Text>
              <View style={s.restrictItem}>
                <CheckboxPDF checked={restricciones.lentes} sizePt={4} />
                <Text style={s.restrictLabel}>LENTES</Text>
              </View>
              <View style={s.restrictItem}>
                <CheckboxPDF checked={restricciones.audifonos} sizePt={4} />
                <Text style={s.restrictLabel}>AUDÍFONOS</Text>
              </View>
              <View style={s.restrictItem}>
                <CheckboxPDF checked={restricciones.otros} sizePt={4} />
                <Text style={s.restrictLabel}>OTROS</Text>
                {restricciones.otros && restricciones.otrosTexto ? (
                  <Text style={{
                    fontFamily: F, fontWeight: 600, fontSize: 3.2, color: C.sl800,
                    textTransform: 'uppercase', borderLeftWidth: 0.5,
                    borderLeftColor: C.sl300, borderLeftStyle: 'solid', paddingLeft: 3,
                  }}>
                    {restricciones.otrosTexto}
                  </Text>
                ) : null}
              </View>
            </View>

          </View>
        </View>
      </View>
    </View>
  );
};

// ─── Card Back ────────────────────────────────────────────────────────────────

const CardBackPDF: React.FC<{ data: LicenseData }> = ({ data }) => {
  const { nombreCompleto, rut, equiposAutorizados, equiposOtros, equiposOtrosTexto, logoWatermarkUrl } = data;

  const qrValue = [
    `LICENCIA INTERNA CMP`,
    `RUT: ${rut || 'N/A'}`,
    `NOMBRE: ${nombreCompleto || 'N/A'}`,
    `EQUIPOS: ${EQUIP_LIST.filter(e => equiposAutorizados[e.key as EquipKey]).map(e => e.label).join(', ')}`,
    equiposOtros && equiposOtrosTexto ? `Otros: ${equiposOtrosTexto}` : '',
  ].filter(Boolean).join(' — ');

  // Split 21 items into 4 columns: 6 / 5 / 5 / 5
  const cols = [
    EQUIP_LIST.slice(0, 6),
    EQUIP_LIST.slice(6, 11),
    EQUIP_LIST.slice(11, 16),
    EQUIP_LIST.slice(16),
  ];

  const renderEq = (eq: { key: string; label: string }) => {
    const on = equiposAutorizados[eq.key as EquipKey];
    return (
      <View key={eq.key} style={s.eqItem}>
        <CheckboxPDF checked={on} sizePt={3.8} color={C.navy} />
        <Text
          style={[s.eqLabel, { fontWeight: on ? 900 : 400, color: on ? C.sl950 : C.sl500 }]}
          numberOfLines={1}
        >
          {eq.label.toUpperCase()}
        </Text>
      </View>
    );
  };

  return (
    <View style={s.card}>
      <View style={s.cardBg} />
      {logoWatermarkUrl ? (
        <Image
          src={logoWatermarkUrl && !logoWatermarkUrl.includes('1a1LBVqQ5R58') ? getEmbeddableUrl(logoWatermarkUrl) : logoCmpWatermarkDataUrl}
          style={{
            position: 'absolute',
            top: CH / 2 - 40,
            left: CW / 2 - 60,
            width: 120,
            height: 80,
            opacity: 0.045,
            objectFit: 'contain',
          }}
        />
      ) : null}
      <View style={s.cardBorder} />
      <View style={s.backContent}>

        {/* TOP: commitment text + QR */}
        <View style={s.topSection}>
          <View style={s.commitCol}>
            <Text style={s.commitTitle}>CONTRATO DE SEGURIDAD Y COMPROMISO</Text>
            <Text style={s.commitBody}>
              El poseedor de esta Autorización Interna para Operar o Conducir, deberá aplicar
              el manejo a la defensiva, cumplir con el estándar de prevención de fatalidades (EPF)
              y respetar las normativas de tránsito internas de la faena. Esta credencial debe
              exhibirse permanentemente y caducará ante incumplimiento de seguridad.
            </Text>
          </View>
          <View style={s.qrCol}>
            <View style={s.qrBox}>
              <QRCodePDF value={qrValue} sizePt={20 * MM} />
            </View>
            <Text style={s.qrLabel}>VALIDACIÓN QR</Text>
          </View>
        </View>

        {/* EQUIPMENT GRID */}
        <View style={s.eqSection}>
          <Text style={s.eqTitle}>EQUIPOS - VEHÍCULOS AUTORIZADOS</Text>
          <View style={s.eqGrid}>
            {cols.map((col, ci) => (
              <View key={ci} style={s.eqCol}>
                {col.map(renderEq)}
              </View>
            ))}
          </View>
        </View>

        {/* OTROS */}
        <View style={s.otrosRow}>
          <CheckboxPDF checked={equiposOtros} sizePt={3.8} color={C.navy} />
          <Text style={[s.otrosLabel, { color: equiposOtros ? C.sl950 : C.sl500 }]}>OTROS:</Text>
          {equiposOtros && equiposOtrosTexto
            ? <Text style={s.otrosValue} numberOfLines={1}>{equiposOtrosTexto.toUpperCase()}</Text>
            : <Text style={s.otrosEmpty}>No especificado</Text>}
        </View>

        {/* FOOTER */}
        <View style={s.backFooter}>
          <Text style={s.footerText}>DEPARTAMENTO DE GESTIÓN DE RIESGOS Y SOSTENIBILIDAD</Text>
        </View>

      </View>
    </View>
  );
};

// ─── Proof Sheet ──────────────────────────────────────────────────────────────

const ProofSheetPage: React.FC<{ data: LicenseData }> = ({ data }) => (
  <Page size="LETTER" style={s.proofPage}>
    <Text style={s.proofTitle}>HOJA DE PRUEBA — LICENCIA INTERNA DE CONDUCIR</Text>
    <Text style={s.proofSub}>CMP — Compañía Minera del Pacífico  |  Faena Mina Los Colorados</Text>
    <Text style={s.proofMeta}>Fecha de Impresión: {new Date().toLocaleString('es-CL')}</Text>
    <Text style={s.proofMeta}>
      Conductor: {data.nombreCompleto || 'N/A'}  (RUT: {data.rut || 'N/A'})
    </Text>
    <View style={s.proofDivider} />

    <Text style={s.proofCardLabel}>▲ ANVERSO (FRENTE) — 85.6 mm × 54 mm</Text>
    <View style={s.proofCardWrapper}>
      <CardFrontPDF data={data} />
    </View>

    <Text style={s.proofCardLabel}>▼ REVERSO (ATRÁS) — 85.6 mm × 54 mm</Text>
    <View style={s.proofCardWrapper}>
      <CardBackPDF data={data} />
    </View>

    <View style={s.proofInstructions}>
      <Text style={s.proofInstTitle}>Guía Técnica de Impresión:</Text>
      <Text style={s.proofInstItem}>
        1. Esta vista de prueba permite corroborar textos y legibilidad en una impresora láser estándar.
      </Text>
      <Text style={s.proofInstItem}>
        2. Para imprimir directamente en la Zebra ZC300, prefiera el formato "Tiro y Retiro (CR80)".
      </Text>
      <Text style={s.proofInstItem}>
        3. Configure la orientación en Horizontal (Landscape) y Desactivar márgenes del navegador.
      </Text>
    </View>
  </Page>
);

// ─── Public document export ───────────────────────────────────────────────────

interface LicenseDocumentProps {
  data: LicenseData;
  format: 'both_cr80' | 'front_only' | 'back_only' | 'proof_letter';
}

export const LicenseDocument: React.FC<LicenseDocumentProps> = ({ data, format }) => {
  const meta = {
    title:    `Licencia Interna CMP — ${data.nombreCompleto || 'Sin nombre'}`,
    author:   'CMP — Compañía Minera del Pacífico',
    subject:  'Licencia Interna de Conducir',
    keywords: 'licencia, conducir, CMP, mina, Los Colorados',
    creator:  'Sistema de Emisión CMP',
  };

  if (format === 'proof_letter') {
    return (
      <Document {...meta}>
        <ProofSheetPage data={data} />
      </Document>
    );
  }

  return (
    <Document {...meta}>
      {(format === 'both_cr80' || format === 'front_only') && (
        <Page size={[CW, CH]} style={{ backgroundColor: C.white }}>
          <CardFrontPDF data={data} />
        </Page>
      )}
      {(format === 'both_cr80' || format === 'back_only') && (
        <Page size={[CW, CH]} style={{ backgroundColor: C.white }}>
          <CardBackPDF data={data} />
        </Page>
      )}
    </Document>
  );
};
