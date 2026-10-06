/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MunicipalLicenses {
  A1: boolean;
  A2: boolean;
  A3: boolean;
  A4: boolean;
  A5: boolean;
  B: boolean;
  D: boolean;
}

export interface Restrictions {
  lentes: boolean;
  audifonos: boolean;
  otros: boolean;
  otrosTexto: string;
}

export interface AuthorizedAreas {
  areaMina: boolean;
  areaPlanta: boolean;
}

export interface AuthorizedEquipment {
  camioneta: boolean;
  camionTolva: boolean;
  camionPluma: boolean;
  camionAljibe: boolean;
  lubricador: boolean;
  tractoCamion: boolean;
  manlift: boolean;
  excavadora: boolean;
  retroExcavadora: boolean;
  minicargador: boolean;
  gruaHorquilla: boolean;
  grua: boolean;
  rodillo: boolean;
  puenteGrua: boolean;
  perforadora: boolean;
  caex: boolean;
  cargadorFrontal: boolean;
  cfWa1200: boolean;
  bulldozer: boolean;
  wheeldozer: boolean;
  motoniveladora: boolean;
}

export interface LicenseData {
  nombreCompleto: string;
  cargo: string;
  empresa: string;
  rut: string;
  fotoUrl: string | null;
  licenciasMunicipales: MunicipalLicenses;
  lmValidaHasta: string;
  licInternaOtorgadaEl: string;
  vencePsict: string;
  restricciones: Restrictions;
  areasAutorizadas: AuthorizedAreas;
  equiposAutorizados: AuthorizedEquipment;
  equiposOtros: boolean;
  equiposOtrosTexto: string;
  logoCmpUrl: string;
  logoGrpUrl: string;
  logoWatermarkUrl: string;
  linkCentroDocumental: string;
}

export const INITIAL_LICENSE_DATA: LicenseData = {
  nombreCompleto: '',
  cargo: '',
  empresa: '',
  rut: '',
  fotoUrl: null,
  licenciasMunicipales: {
    A1: false,
    A2: false,
    A3: false,
    A4: false,
    A5: false,
    B: false,
    D: false,
  },
  lmValidaHasta: '',
  licInternaOtorgadaEl: '',
  vencePsict: '',
  restricciones: {
    lentes: false,
    audifonos: false,
    otros: false,
    otrosTexto: '',
  },
  areasAutorizadas: {
    areaMina: false,
    areaPlanta: false,
  },
  equiposAutorizados: {
    camioneta: false,
    camionTolva: false,
    camionPluma: false,
    camionAljibe: false,
    lubricador: false,
    tractoCamion: false,
    manlift: false,
    excavadora: false,
    retroExcavadora: false,
    minicargador: false,
    gruaHorquilla: false,
    grua: false,
    rodillo: false,
    puenteGrua: false,
    perforadora: false,
    caex: false,
    cargadorFrontal: false,
    cfWa1200: false,
    bulldozer: false,
    wheeldozer: false,
    motoniveladora: false,
  },
  equiposOtros: false,
  equiposOtrosTexto: '',
  logoCmpUrl: 'https://drive.google.com/file/d/1a1LBVqQ5R58mCHRU4x6EWcKuA2JvXK0O/view?usp=sharing',
  logoGrpUrl: 'https://drive.google.com/file/d/1sUNCKNbtxCel0kDjYA8QedXc3jD4Ze3R/view?usp=drive_link',
  logoWatermarkUrl: 'https://drive.google.com/file/d/1a1LBVqQ5R58mCHRU4x6EWcKuA2JvXK0O/view?usp=drive_link',
  linkCentroDocumental: '',
};

export const DEMO_LICENSE_DATA: LicenseData = {
  nombreCompleto: 'ANDRÉS IGNACIO REYES SALINAS',
  cargo: 'OPERADOR ESPECIALISTA CAEX',
  empresa: 'INGENIERÍA Y SERVICIOS MINEROS S.A.',
  rut: '17.432.891-K',
  fotoUrl: null, // We can set a base64 or let them upload, we will place a sample portrait SVG or visual placeholder
  licenciasMunicipales: {
    A1: false,
    A2: true,
    A3: false,
    A4: false,
    A5: false,
    B: true,
    D: true,
  },
  lmValidaHasta: '2028-11-20',
  licInternaOtorgadaEl: '2026-06-15',
  vencePsict: '2027-06-15',
  restricciones: {
    lentes: true,
    audifonos: false,
    otros: false,
    otrosTexto: '',
  },
  areasAutorizadas: {
    areaMina: true,
    areaPlanta: false,
  },
  equiposAutorizados: {
    camioneta: true,
    camionTolva: false,
    camionPluma: false,
    camionAljibe: false,
    lubricador: false,
    tractoCamion: false,
    manlift: false,
    excavadora: false,
    retroExcavadora: false,
    minicargador: true,
    gruaHorquilla: true,
    grua: false,
    rodillo: false,
    puenteGrua: false,
    perforadora: false,
    caex: true,
    cargadorFrontal: true,
    cfWa1200: false,
    bulldozer: false,
    wheeldozer: false,
    motoniveladora: false,
  },
  equiposOtros: true,
  equiposOtrosTexto: 'ALZA HOMBRE telescópico',
  logoCmpUrl: 'https://drive.google.com/file/d/1a1LBVqQ5R58mCHRU4x6EWcKuA2JvXK0O/view?usp=sharing',
  logoGrpUrl: 'https://drive.google.com/file/d/1sUNCKNbtxCel0kDjYA8QedXc3jD4Ze3R/view?usp=drive_link',
  logoWatermarkUrl: 'https://drive.google.com/file/d/1a1LBVqQ5R58mCHRU4x6EWcKuA2JvXK0O/view?usp=drive_link',
  linkCentroDocumental: 'http://centro-documental.cmp.local/licencias',
};
