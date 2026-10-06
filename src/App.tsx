/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { pdf } from '@react-pdf/renderer';
import { LicenseDocument } from './components/LicensePDF';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Trash2, 
  Upload, 
  Printer, 
  Settings, 
  CheckCircle, 
  Info, 
  User, 
  Calendar, 
  ShieldCheck, 
  Wrench, 
  RotateCcw,
  Sparkles,
  HelpCircle,
  QrCode
} from 'lucide-react';
import { 
  LicenseData, 
  INITIAL_LICENSE_DATA, 
  DEMO_LICENSE_DATA, 
  MunicipalLicenses, 
  Restrictions, 
  AuthorizedAreas, 
  AuthorizedEquipment 
} from './types';
import { CardFront } from './components/CardFront';
import { CardBack } from './components/CardBack';
// printStyleHelper no longer needed — react-pdf renders independently of the DOM

export default function App() {
  const [data, setData] = useState<LicenseData>({
    ...INITIAL_LICENSE_DATA,
    licInternaOtorgadaEl: new Date().toISOString().split('T')[0] // Defaults to current date
  });

  const [pdfFormat, setPdfFormat] = useState<'both_cr80' | 'front_only' | 'back_only' | 'proof_letter'>('both_cr80');
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show status notification
  const triggerNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Preset loading handler
  const loadDemo = () => {
    setData(DEMO_LICENSE_DATA);
    triggerNotification('Datos de plantilla de prueba cargados correctamente.', 'info');
  };

  // Clear form handler
  const resetForm = () => {
    setData({
      ...INITIAL_LICENSE_DATA,
      licInternaOtorgadaEl: new Date().toISOString().split('T')[0]
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    triggerNotification('Formulario reestablecido a valores vacíos.', 'info');
  };

  // Text inputs & dates update handler
  const handleTextChange = (field: keyof LicenseData, value: string) => {
    setData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Structured togglers
  const toggleMunicipalLicense = (key: keyof MunicipalLicenses) => {
    setData((prev) => ({
      ...prev,
      licenciasMunicipales: {
        ...prev.licenciasMunicipales,
        [key]: !prev.licenciasMunicipales[key],
      },
    }));
  };

  const toggleRestriction = (key: keyof Omit<Restrictions, 'otrosTexto'>) => {
    setData((prev) => ({
      ...prev,
      restricciones: {
        ...prev.restricciones,
        [key]: !prev.restricciones[key],
      },
    }));
  };

  const handleRestrictionTextChange = (value: string) => {
    setData((prev) => ({
      ...prev,
      restricciones: {
        ...prev.restricciones,
        otrosTexto: value,
      },
    }));
  };

  const toggleArea = (key: keyof AuthorizedAreas) => {
    setData((prev) => ({
      ...prev,
      areasAutorizadas: {
        ...prev.areasAutorizadas,
        [key]: !prev.areasAutorizadas[key],
      },
    }));
  };

  const toggleEquipment = (key: keyof AuthorizedEquipment) => {
    setData((prev) => ({
      ...prev,
      equiposAutorizados: {
        ...prev.equiposAutorizados,
        [key]: !prev.equiposAutorizados[key],
      },
    }));
  };

  // Handle Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        triggerNotification('La imagen supera el límite de 2MB. Intente con un archivo optimizado.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setData((prev) => ({
          ...prev,
          fotoUrl: reader.result as string,
        }));
        triggerNotification('Fotografía del conductor cargada correctamente.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setData((prev) => ({
      ...prev,
      fotoUrl: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    triggerNotification('Fotografía removida.', 'info');
  };

  // ── PDF Generation (react-pdf — vector native, no DOM capture needed) ──────
  const generatePDF = async () => {
    setIsGenerating(true);
    triggerNotification('Generando PDF vectorial...', 'info');

    const suffixes: Record<typeof pdfFormat, string> = {
      both_cr80:    'tiro_retiro',
      front_only:   'anverso_solamente',
      back_only:    'reverso_solamente',
      proof_letter: 'hoja_prueba',
    };
    const messages: Record<typeof pdfFormat, string> = {
      both_cr80:    'Licencia PDF (Tiro y Retiro — CR80) descargada con éxito.',
      front_only:   'Licencia PDF (Solo Anverso — CR80) descargada con éxito.',
      back_only:    'Licencia PDF (Solo Reverso — CR80) descargada con éxito.',
      proof_letter: 'Hoja de Prueba (Tamaño Carta) construida con éxito.',
    };

    try {
      const filename = `${data.rut || 'sin_rut'}_licencia_interna`;

      // react-pdf renders directly to a Blob — no html2canvas / DOM involved
      const blob = await pdf(
        <LicenseDocument data={data} format={pdfFormat} />
      ).toBlob();

      // Trigger browser download
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `${filename}_${suffixes[pdfFormat]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      triggerNotification(messages[pdfFormat], 'success');

    } catch (error: any) {
      console.error('Error generando PDF con react-pdf:', error);
      triggerNotification(
        `Ocurrió un error al generar el PDF: ${error?.message || 'Error desconocido'}`,
        'error'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Equipment groupings for easier form visualization
  const equipmentCategories = [
    {
      title: 'Flota Transporte Liviano y Logística',
      items: [
        { key: 'camioneta', label: 'Camioneta' },
        { key: 'camionTolva', label: 'Camión Tolva' },
        { key: 'camionPluma', label: 'Camión Pluma' },
        { key: 'camionAljibe', label: 'Camión Aljibe' },
        { key: 'lubricador', label: 'Lubricador' },
        { key: 'tractoCamion', label: 'Tracto Camión' },
      ],
    },
    {
      title: 'Maquinaria Excavación y Movimiento Tierra',
      items: [
        { key: 'excavadora', label: 'Excavadora' },
        { key: 'retroExcavadora', label: 'Retro-Excavadora' },
        { key: 'minicargador', label: 'Minicargador' },
        { key: 'caex', label: 'CAEX (Dumper)' },
        { key: 'cargadorFrontal', label: 'Cargador Frontal' },
        { key: 'cfWa1200', label: 'CF - WA 1200' },
      ],
    },
    {
      title: 'Izaje, Perforación y Nivelación',
      items: [
        { key: 'manlift', label: 'Manlift' },
        { key: 'gruaHorquilla', label: 'Grúa Horquilla' },
        { key: 'grua', label: 'Grúa Móvil' },
        { key: 'rodillo', label: 'Rodillo Compactador' },
        { key: 'puenteGrua', label: 'Puente Grúa' },
        { key: 'perforadora', label: 'Perforadora' },
        { key: 'bulldozer', label: 'Bulldozer' },
        { key: 'wheeldozer', label: 'Wheeldozer' },
        { key: 'motoniveladora', label: 'Motoniveladora' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f2f4f7] text-slate-800 flex flex-col antialiased">
      
      {/* Dynamic Notifications Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg shadow-xl text-xs font-bold tracking-wide flex items-center gap-2 border ${
              notification.type === 'success' 
                ? 'bg-white border-emerald-300 text-slate-900 shadow-lg'
                : notification.type === 'error'
                ? 'bg-white border-rose-300 text-slate-900 shadow-lg'
                : 'bg-white border-blue-300 text-slate-900 shadow-lg'
            }`}
          >
            <Info className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main App Bar / Header */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-6 shrink-0 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-[#003366] text-white px-2.5 py-1.5 rounded font-black text-sm tracking-wider">
            CMP
          </div>
          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-slate-800 uppercase leading-none">
              SISTEMA DE EMISIÓN DE LICENCIAS INTERNAS
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 leading-none">
              FAENA MINA LOS COLORADOS · FORMATO DE TARJETA CR80
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadDemo}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded text-[11px] font-bold uppercase text-blue-900 transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Cargar Ejemplo
          </button>
          
          <button
            onClick={resetForm}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-bold uppercase text-slate-600 transition-all cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar Datos
          </button>
        </div>
      </header>

      {/* Main Content Workspace Grid (Split Left Form / Right Preview) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* Left Column: Form Section (Columna Formulario) */}
        <div className="lg:col-span-7 flex flex-col gap-6 overflow-y-auto pr-0 lg:pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          
          {/* Section 1: Personal Data */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <User className="w-4 h-4 text-[#003366]" />
              <h2 className="text-xs font-bold tracking-wider uppercase text-slate-700">
                1. Información del Conductor
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  Nombre Completo del Operador
                </label>
                <input
                  type="text"
                  placeholder="Ej: ANDRÉS IGNACIO REYES SALINAS"
                  value={data.nombreCompleto}
                  onChange={(e) => handleTextChange('nombreCompleto', e.target.value.toUpperCase())}
                  className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white uppercase transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  RUT (Cédula de Identidad)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 17.432.891-K"
                  value={data.rut}
                  onChange={(e) => handleTextChange('rut', e.target.value.toUpperCase())}
                  className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono font-bold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white uppercase transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  Cargo del Profesional
                </label>
                <input
                  type="text"
                  placeholder="Ej: OPERADOR ESPECIALISTA CAEX"
                  value={data.cargo}
                  onChange={(e) => handleTextChange('cargo', e.target.value.toUpperCase())}
                  className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white uppercase transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  Empresa Contratista / Mandatario
                </label>
                <input
                  type="text"
                  placeholder="Ej: INGENIERÍA Y SERVICIOS MINEROS S.A."
                  value={data.empresa}
                  onChange={(e) => handleTextChange('empresa', e.target.value.toUpperCase())}
                  className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white uppercase transition-all"
                />
              </div>
            </div>

            {/* Photo loader inside first section */}
            <div className="border-t border-slate-100 mt-5 pt-4">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 block mb-2.5">
                Fotografía Profesional del Operador (Relación 3:4 Recomendada)
              </span>
              
              <div className="flex flex-wrap items-center gap-4">
                {/* Photo representation indicator */}
                <div className="w-[60px] h-[72px] border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden rounded relative">
                  {data.fotoUrl ? (
                    <img src={data.fotoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-[11px] font-bold uppercase text-slate-700 cursor-pointer transition-all shadow-3xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      Subir Imagen
                    </button>
                    
                    {data.fotoUrl && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 hover:text-rose-900 border border-rose-200 rounded text-[11px] font-bold uppercase text-rose-700 cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover
                      </button>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <p className="text-[10px] text-slate-400 font-medium leading-normal">
                    Formatos JPG/PNG autorizados. El renderizador centrará y escalará la imagen automáticamente.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Municipal Licenses & Authorized Areas */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Municipal Licenses Column (5 cols) */}
              <div className="md:col-span-7 flex flex-col">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                  <Wrench className="w-4 h-4 text-[#003366]" />
                  <h2 className="text-xs font-bold tracking-wider uppercase text-slate-700">
                    2. Licencias Municipales
                  </h2>
                </div>
                
                <p className="text-[10px] text-slate-400 font-bold mb-3 uppercase tracking-wide">
                  Seleccione las clases activas en la credencial municipal vigente:
                </p>

                <div className="flex flex-wrap gap-2">
                  {(Object.keys(data.licenciasMunicipales) as Array<keyof MunicipalLicenses>).map((key) => {
                    const active = data.licenciasMunicipales[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleMunicipalLicense(key)}
                        className={`w-11 h-9 rounded border font-black text-xs transition-all flex items-center justify-center cursor-pointer ${
                          active
                            ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Authorized Areas Column (5 cols) */}
              <div className="md:col-span-5 flex flex-col">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                  <ShieldCheck className="w-4 h-4 text-[#003366]" />
                  <h2 className="text-xs font-bold tracking-wider uppercase text-slate-700">
                    3. Áreas Autorizadas
                  </h2>
                </div>

                <p className="text-[10px] text-slate-400 font-bold mb-3 uppercase tracking-wide">
                  Habilite las zonas geográficas operativas:
                </p>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => toggleArea('areaMina')}
                    className={`w-full py-2 px-3 border rounded flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                      data.areasAutorizadas.areaMina
                        ? 'bg-red-50 border-red-200 text-red-700 font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className="uppercase tracking-wide text-[10px]">Área Mina</span>
                    <span className="text-[9px] font-bold">{data.areasAutorizadas.areaMina ? '✅ HABILITADO' : '❌ DESHABILITADO'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleArea('areaPlanta')}
                    className={`w-full py-2 px-3 border rounded flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                      data.areasAutorizadas.areaPlanta
                        ? 'bg-red-50 border-red-200 text-red-700 font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className="uppercase tracking-wide text-[10px]">Área Planta</span>
                    <span className="text-[9px] font-bold">{data.areasAutorizadas.areaPlanta ? '✅ HABILITADO' : '❌ DESHABILITADO'}</span>
                  </button>
                </div>
              </div>

            </div>
          </section>

          {/* Section 3: Controls, Dates, Restrictions */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Calendar className="w-4 h-4 text-[#003366]" />
              <h2 className="text-xs font-bold tracking-wider uppercase text-slate-700">
                4. Fechas de Vencimiento y Control
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  Lic. Municipal Vence
                </label>
                <input
                  type="date"
                  value={data.lmValidaHasta}
                  onChange={(e) => handleTextChange('lmValidaHasta', e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  Otorgada el (Interna)
                </label>
                <input
                  type="date"
                  value={data.licInternaOtorgadaEl}
                  onChange={(e) => handleTextChange('licInternaOtorgadaEl', e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  Vence Psicotécnico
                </label>
                <input
                  type="date"
                  value={data.vencePsict}
                  onChange={(e) => handleTextChange('vencePsict', e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Restrictions Box */}
            <div className="border-t border-slate-100 pt-4">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 block mb-2.5">
                Restricciones Clínicas / Conducción
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <button
                  type="button"
                  onClick={() => toggleRestriction('lentes')}
                  className={`py-2 px-3 border rounded text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    data.restricciones.lentes
                      ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="uppercase text-[10px]">Uso de Lentes</span>
                  <span>{data.restricciones.lentes ? '✓' : ''}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleRestriction('audifonos')}
                  className={`py-2 px-3 border rounded text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    data.restricciones.audifonos
                      ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="uppercase text-[10px]">Audífonos</span>
                  <span>{data.restricciones.audifonos ? '✓' : ''}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleRestriction('otros')}
                  className={`py-2 px-3 border rounded text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    data.restricciones.otros
                      ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="uppercase text-[10px]">Otras Restricc.</span>
                  <span>{data.restricciones.otros ? '✓' : ''}</span>
                </button>

                {data.restricciones.otros && (
                  <input
                    type="text"
                    placeholder="EjLeve: Restricción Velocidad..."
                    value={data.restricciones.otrosTexto}
                    onChange={(e) => handleRestrictionTextChange(e.target.value.toUpperCase())}
                    className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white uppercase transition-all"
                  />
                )}
              </div>
            </div>
          </section>

          {/* Section 4: Authorized Equipments List (Categorized 21 Items) */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs mb-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Wrench className="w-4 h-4 text-[#003366]" />
              <h2 className="text-xs font-bold tracking-wider uppercase text-slate-700">
                5. Equipos y Vehículos de Maquinaria Autorizados
              </h2>
            </div>
            
            <p className="text-[10px] text-slate-400 font-bold mb-4 uppercase tracking-wide leading-normal">
              Controle los vehículos habilitados para el operador. Se distribuirán de forma proporcional en la matriz del reverso:
            </p>

            <div className="flex flex-col gap-5">
              {equipmentCategories.map((category, index) => (
                <div key={index} className="bg-slate-50/50 p-4 border border-slate-150 rounded-lg">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-700 mb-2.5 block">
                    {category.title}
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {category.items.map((item) => {
                      const active = data.equiposAutorizados[item.key as keyof AuthorizedEquipment];
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => toggleEquipment(item.key as keyof AuthorizedEquipment)}
                          className={`py-2 px-3 border rounded text-[11px] font-semibold text-left flex items-center justify-between cursor-pointer transition-all ${
                            active
                              ? 'bg-blue-50 border-blue-200 text-[#003366] font-bold shadow-3xs'
                              : 'bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <span className="uppercase truncate pr-1">{item.label}</span>
                          <span className={`${active ? 'text-blue-600 font-bold' : 'text-slate-300'}`}>
                            {active ? '✓' : '○'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Custom Other Equipment (Fila Otros Equipos) */}
              <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-lg flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setData(prev => ({ ...prev, equiposOtros: !prev.equiposOtros }))}
                  className={`py-2 px-3 border rounded text-[11px] font-bold uppercase flex items-center gap-2 cursor-pointer transition-all ${
                    data.equiposOtros
                      ? 'bg-blue-50 border-blue-200 text-[#003366] font-bold'
                      : 'bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span>{data.equiposOtros ? '✓' : '○'}</span>
                  <span>Habilitar Otros</span>
                </button>

                {data.equiposOtros && (
                  <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                    <input
                      type="text"
                      placeholder="Ej: ALZA HOMBRE TELESCÓPICO, PERFORADORA MANUAL..."
                      value={data.equiposOtrosTexto}
                      onChange={(e) => handleTextChange('equiposOtrosTexto', e.target.value.toUpperCase())}
                      className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white uppercase transition-all"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section: Link Centro Documental (QR del Reverso) */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs mb-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <QrCode className="w-4 h-4 text-[#003366]" />
              <h2 className="text-xs font-bold tracking-wider uppercase text-slate-700">
                Link Centro Documental CMP (QR del Reverso)
              </h2>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mb-3 uppercase tracking-wide leading-normal">
              Pegue el enlace interno del Centro Documental CMP. Se generará un QR escaneable junto al reverso de la licencia que abrirá este enlace (requiere estar conectado a la red CMP).
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                URL del Centro Documental
              </label>
              <input
                type="url"
                placeholder="http://centro-documental.cmp.local/..."
                value={data.linkCentroDocumental}
                onChange={(e) => handleTextChange('linkCentroDocumental', e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
              />
              {data.linkCentroDocumental && !/^https?:\/\//i.test(data.linkCentroDocumental.trim()) && (
                <p className="text-[10px] font-bold text-amber-600">
                  El enlace debería comenzar con http:// o https:// para que el celular lo abra como link.
                </p>
              )}
            </div>
          </section>

        </div>

        {/* Right Column: Sticky Live Preview & Print Panel (Lado derecho Previsualización) */}
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6">
          
          <div className="sticky top-6 flex flex-col gap-6">
            
            {/* Real-time Preview Container */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col items-center">
              <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-[#003366]" />
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-705">
                    Vista Previa Integrada (PVC CR80)
                  </span>
                </div>
                <div className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-mono font-bold text-slate-500">
                  85.6mm x 54mm · Escala Real
                </div>
              </div>

              {/* The dynamic stacked visual cards */}
              <div className="flex flex-col gap-6 w-full items-center py-5 bg-[#f8fafc] rounded-lg border border-slate-200/80 px-3 overflow-hidden">
                
                {/* FRONT PREVIEW */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                    ▲ ANVERSO (FRENTE)
                  </span>
                  <div className="scale-[0.82] sm:scale-95 md:scale-100 origin-center">
                    <CardFront data={data} id="card-front-display" />
                  </div>
                </div>

                {/* BACK PREVIEW */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                    ▼ REVERSO (ATRÁS)
                  </span>
                  <div className="scale-[0.82] sm:scale-95 md:scale-100 origin-center">
                    <CardBack data={data} id="card-back-display" />
                  </div>
                </div>

              </div>
            </div>

            {/* Print and Export Panel */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Settings className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold tracking-wider uppercase text-slate-700">
                  Panel de Generación y Descarga
                </h2>
              </div>

              {/* Selector de formato en React */}
              <div className="flex flex-col gap-1.5 mb-5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Formato de Salida de Impresión
                </label>
                <select
                  value={pdfFormat}
                  onChange={(e) => setPdfFormat(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white"
                >
                  <option value="both_cr80">Tiro y Retiro (2 Páginas CR80 individual para Zebra)</option>
                  <option value="front_only">Solo Anverso (1 Página CR80)</option>
                  <option value="back_only">Solo Reverso (1 Página CR80)</option>
                  <option value="proof_letter">Hoja de Pruebas (Instaladores / Tamaño Carta)</option>
                </select>
              </div>

              {/* Action trigger button */}
              <button
                type="button"
                disabled={isGenerating}
                onClick={generatePDF}
                className={`w-full py-3.5 rounded-lg font-black tracking-wider uppercase text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer ${
                  isGenerating
                    ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#003366] hover:bg-blue-900 border border-blue-700/20 text-white hover:scale-[1.005]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-400 border-t-slate-600"></div>
                    Procesando Exportación...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 text-white" />
                    Exportar / Generar Archivo PDF
                  </>
                )}
              </button>

              {/* Guidelines tips message */}
              <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex gap-3 text-[10.5px] leading-relaxed text-slate-600 shadow-3xs">
                <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1 font-bold">
                  <span className="text-slate-700 uppercase font-bold text-[10px]">
                    Ayuda Técnica Zebra ZC300
                  </span>
                  <p className="leading-normal font-medium text-slate-500">
                    Para impresión en PVC de borde a borde: descargue en <span className="text-blue-600 font-extrabold font-mono">Tiro y Retiro</span>. Cuando se abra el diálogo de impresión del navegador, configure <span className="text-[#003366] font-black">Márgenes: Ninguno / Cero</span> y <span className="text-[#003366] font-black">Escala: 100% de tamaño real</span>.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Hidden capture divs removed — react-pdf generates PDFs without DOM capture */}

    </div>
  );
}
