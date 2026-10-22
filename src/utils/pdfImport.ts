/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * pdfImport.ts
 * Permite volver a cargar en el formulario un PDF descargado desde la aplicación.
 *
 * 1. PDFs nuevos: al generarlos se anexa al final del archivo un comentario PDF
 *    con todos los datos (JSON en base64, incluida la foto). Se restauran exactos.
 * 2. PDFs antiguos (sin datos incrustados): se leen el texto, los checkboxes y la
 *    foto directamente del contenido del PDF con pdf.js.
 */

import { LicenseData, INITIAL_LICENSE_DATA } from '../types';

const MARKER = '%CMP-LICENCIA-DATA-V1:';

// ─── Incrustar datos ─────────────────────────────────────────────────────────

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

function base64ToUtf8(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** Anexa los datos del formulario al final del PDF (los visores ignoran comentarios tras %%EOF). */
export function embedLicenseData(pdfBlob: Blob, data: LicenseData): Blob {
  const trailer = `\n${MARKER}${utf8ToBase64(JSON.stringify(data))}\n%%EOF\n`;
  return new Blob([pdfBlob, trailer], { type: 'application/pdf' });
}

/** Rellena claves faltantes con los valores iniciales (por si el tipo cambia en el futuro). */
function withDefaults(partial: Partial<LicenseData>): LicenseData {
  const d = INITIAL_LICENSE_DATA;
  return {
    ...d,
    ...partial,
    licenciasMunicipales: { ...d.licenciasMunicipales, ...partial.licenciasMunicipales },
    restricciones: { ...d.restricciones, ...partial.restricciones },
    areasAutorizadas: { ...d.areasAutorizadas, ...partial.areasAutorizadas },
    equiposAutorizados: { ...d.equiposAutorizados, ...partial.equiposAutorizados },
  };
}

function extractEmbeddedData(bytes: Uint8Array): LicenseData | null {
  const text = new TextDecoder('latin1').decode(bytes);
  const start = text.lastIndexOf(MARKER);
  if (start < 0) return null;
  const end = text.indexOf('\n', start);
  const b64 = text.slice(start + MARKER.length, end < 0 ? undefined : end).trim();
  try {
    return withDefaults(JSON.parse(base64ToUtf8(b64)));
  } catch {
    return null;
  }
}

// ─── Lectura de PDFs antiguos (sin datos incrustados) ─────────────────────────

/** Debe coincidir con EQUIP_LIST de LicensePDF.tsx */
const EQUIP_LABELS: Record<string, keyof LicenseData['equiposAutorizados']> = {
  'CAMIONETA': 'camioneta',
  'CAMIÓN TOLVA': 'camionTolva',
  'CAMIÓN PLUMA': 'camionPluma',
  'CAMIÓN ALJIBE': 'camionAljibe',
  'LUBRICADOR': 'lubricador',
  'TRACTO CAMIÓN': 'tractoCamion',
  'MANLIFT': 'manlift',
  'EXCAVADORA': 'excavadora',
  'RETRO-EXCAVADORA': 'retroExcavadora',
  'MINICARGADOR': 'minicargador',
  'GRÚA HORQUILLA': 'gruaHorquilla',
  'GRÚA': 'grua',
  'RODILLO': 'rodillo',
  'PUENTE GRÚA': 'puenteGrua',
  'PERFORADORA': 'perforadora',
  'CAEX': 'caex',
  'CARGADOR FRONTAL': 'cargadorFrontal',
  'CF - WA 1200': 'cfWa1200',
  'BULLDOZER': 'bulldozer',
  'WHEELDOZER': 'wheeldozer',
  'MOTONIVELADORA': 'motoniveladora',
};

interface TextRun {
  text: string;
  size: number;
  color: string;
  /** Se dibujó una marca de check (trazo blanco) justo antes de este texto */
  checked: boolean;
  /** Imagen dibujada más recientemente antes de este texto */
  lastImage: { id: string; page: any } | null;
}

function colorKey(args: any[]): string {
  const a = args[0];
  if (typeof a === 'string') return a.toLowerCase();
  const [r, g, b] = a && a.length === 3 ? Array.from(a as ArrayLike<number>) : (args as number[]);
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function pdfDateToIso(s: string | undefined): string {
  const m = s?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

async function imageToDataUrl(page: any, id: string): Promise<string | null> {
  const store = id.startsWith('g_') ? page.commonObjs : page.objs;
  const img: any = await new Promise((resolve) => {
    try { store.get(id, resolve); } catch { resolve(null); }
  });
  if (!img || !img.width || !img.height) return null;

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  if (img.bitmap) {
    ctx.drawImage(img.bitmap, 0, 0);
  } else if (img.data) {
    const px = img.width * img.height;
    const rgba = new Uint8ClampedArray(px * 4);
    const src: Uint8ClampedArray = img.data;
    if (src.length === px * 4) {
      rgba.set(src);
    } else if (src.length === px * 3) {
      for (let i = 0, j = 0; i < px; i++, j += 3) {
        rgba[i * 4] = src[j]; rgba[i * 4 + 1] = src[j + 1]; rgba[i * 4 + 2] = src[j + 2]; rgba[i * 4 + 3] = 255;
      }
    } else {
      return null;
    }
    ctx.putImageData(new ImageData(rgba, img.width, img.height), 0, 0);
  } else {
    return null;
  }
  return canvas.toDataURL('image/jpeg', 0.92);
}

async function extractLegacyData(bytes: Uint8Array, current: LicenseData): Promise<LicenseData> {
  const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
  // Ejecuta pdf.js en el hilo principal: evita depender de Web Workers (file:// en Electron)
  (globalThis as any).pdfjsWorker ??= await import('pdfjs-dist/build/pdf.worker.mjs');

  const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false }).promise;
  const OPS = pdfjs.OPS;
  const breakOps = new Set<number>([
    OPS.constructPath, OPS.fill, OPS.eoFill, OPS.stroke, OPS.fillStroke, OPS.eoFillStroke,
    OPS.closeStroke, OPS.closeFillStroke, OPS.closeEOFillStroke, OPS.paintImageXObject,
    OPS.setStrokeRGBColor,
  ]);

  const runs: TextRun[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const ops = await page.getOperatorList();
    let color = '#000000';
    let size = 0;
    let strokeWhite = false;
    let broken = true;
    let lastImage: TextRun['lastImage'] = null;

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      const args = ops.argsArray[i];
      if (fn === OPS.setFillRGBColor) color = colorKey(args);
      else if (fn === OPS.setFont) size = args[1];
      else if (fn === OPS.setStrokeRGBColor && colorKey(args) === '#ffffff') strokeWhite = true;
      else if (fn === OPS.paintImageXObject) lastImage = { id: args[0], page };

      if (fn === OPS.showText) {
        const str = (args[0] as any[])
          .map((g) => (typeof g === 'number' ? '' : g?.unicode ?? ''))
          .join('')
          .trim();
        if (!str) continue;
        const prev = runs[runs.length - 1];
        if (!broken && prev && prev.size === size && prev.color === color) {
          // Mismo bloque de texto partido en varias líneas
          prev.text += (prev.text.endsWith('-') ? '' : ' ') + str;
        } else {
          runs.push({ text: str, size, color, checked: strokeWhite, lastImage });
        }
        strokeWhite = false;
        broken = false;
      } else if (breakOps.has(fn)) {
        broken = true;
      }
    }
    broken = true;
  }

  const idx = (pred: (r: TextRun) => boolean, from = 0) => {
    for (let i = from; i < runs.length; i++) if (pred(runs[i])) return i;
    return -1;
  };
  const after = (label: string) => {
    const i = idx((r) => r.text === label);
    return i >= 0 ? runs[i + 1] : undefined;
  };
  const value = (label: string) => {
    const t = after(label)?.text ?? '';
    return /^— INGRESE/.test(t) ? '' : t;
  };

  const result = withDefaults({
    linkCentroDocumental: current.linkCentroDocumental,
  });

  result.nombreCompleto = value('NOMBRE:');
  result.rut = value('RUT:');
  result.cargo = value('CARGO:');
  result.empresa = value('EMPRESA:');

  const dateAfter = (re: RegExp) => {
    const i = idx((r) => re.test(r.text));
    return i >= 0 ? pdfDateToIso(runs[i + 1]?.text) : '';
  };
  result.lmValidaHasta = dateAfter(/^L\.M\. VÁLIDA/);
  result.licInternaOtorgadaEl = dateAfter(/^LIC\. INTERNA/);
  result.vencePsict = dateAfter(/^VENCE/);

  // Licencias municipales: el texto del badge es blanco cuando está activa
  const licStart = idx((r) => r.text === 'LICENCIAS MUNICIPALES AUTORIZADAS');
  if (licStart >= 0) {
    for (const key of Object.keys(result.licenciasMunicipales) as Array<keyof LicenseData['licenciasMunicipales']>) {
      const i = idx((r) => r.text === key, licStart);
      if (i >= 0) result.licenciasMunicipales[key] = runs[i].color === '#ffffff';
    }
  }

  const checkedOf = (label: string, from = 0) => {
    const i = idx((r) => r.text === label, from);
    return i >= 0 && runs[i].checked;
  };
  result.areasAutorizadas.areaMina = checkedOf('MINA');
  result.areasAutorizadas.areaPlanta = checkedOf('PLANTA');

  const restStart = idx((r) => r.text === 'RESTRICCIONES:');
  if (restStart >= 0) {
    result.restricciones.lentes = checkedOf('LENTES', restStart);
    result.restricciones.audifonos = checkedOf('AUDÍFONOS', restStart);
    const oi = idx((r) => r.text === 'OTROS', restStart);
    if (oi >= 0) {
      result.restricciones.otros = runs[oi].checked;
      const next = runs[oi + 1];
      if (result.restricciones.otros && next && Math.abs(next.size - 3.2) < 0.01) {
        result.restricciones.otrosTexto = next.text;
      }
    }
  }

  for (const r of runs) {
    const key = EQUIP_LABELS[r.text];
    if (key) result.equiposAutorizados[key] = r.checked;
  }
  const eo = idx((r) => r.text === 'OTROS:');
  if (eo >= 0) {
    result.equiposOtros = runs[eo].checked;
    const t = runs[eo + 1]?.text ?? '';
    result.equiposOtrosTexto = result.equiposOtros && t !== 'No especificado' ? t : '';
  }

  // Foto: la última imagen dibujada antes del recuadro "ÁREAS AUTORIZADAS"
  // (antes van los logos). Si aparece el texto "FOTO" no había fotografía.
  const areas = idx((r) => r.text === 'ÁREAS AUTORIZADAS');
  const header = idx((r) => r.text === 'LICENCIA INTERNA DE CONDUCIR');
  const hasPlaceholder = areas >= 0 && runs.slice(Math.max(header, 0), areas).some((r) => r.text === 'FOTO');
  const photoRef = areas >= 0 ? runs[areas].lastImage : null;
  if (photoRef && !hasPlaceholder) {
    result.fotoUrl = await imageToDataUrl(photoRef.page, photoRef.id);
  }

  await doc.destroy();

  if (!result.nombreCompleto && !result.rut) {
    throw new Error('El PDF no parece ser una licencia generada por esta aplicación.');
  }
  return result;
}

// ─── API pública ─────────────────────────────────────────────────────────────

export interface ImportedLicense {
  data: LicenseData;
  /** 'embedded' = datos exactos; 'legacy' = reconstruidos desde el contenido del PDF */
  source: 'embedded' | 'legacy';
}

export async function importLicensePdf(file: File, current: LicenseData): Promise<ImportedLicense> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const embedded = extractEmbeddedData(bytes);
  if (embedded) return { data: embedded, source: 'embedded' };
  return { data: await extractLegacyData(bytes, current), source: 'legacy' };
}
