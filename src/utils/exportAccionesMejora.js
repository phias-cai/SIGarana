// src/utils/exportAccionesMejora.js
// ═══════════════════════════════════════════════════════════════════════
// Exportador Excel — Acciones de Mejora (RE-DP-10)
// ✅ Usa supabase.storage.download() igual que el resto del proyecto
// ═══════════════════════════════════════════════════════════════════════

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { supabase } from '@/lib/supabase';

const DATA_START_ROW = 9;

const BORDER = {
  top:    { style: 'thin', color: { argb: 'FFA6B8C2' } },
  left:   { style: 'thin', color: { argb: 'FFA6B8C2' } },
  bottom: { style: 'thin', color: { argb: 'FFA6B8C2' } },
  right:  { style: 'thin', color: { argb: 'FFA6B8C2' } },
};

const FILL_ODD  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
const FILL_EVEN = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F9F5' } };

const fmt = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const tick        = (val) => (val ? 'X' : '');
const statusLabel = (s)   => ({ open: 'Abierta', in_progress: 'En progreso', archived: 'Cerrada' }[s] || s || '-');

const styleCell = (cell, fill, hAlign = 'left') => {
  cell.fill      = fill;
  cell.font      = { name: 'Arial', size: 9 };
  cell.alignment = { horizontal: hAlign, vertical: 'middle', wrapText: true };
  cell.border    = BORDER;
};

// ═══════════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// @param {Array}    acciones   — filas enriquecidas de useAccionesMejora
// @param {Function} getProcess — (process_id) => nombre del proceso
// @param {string}   filename   — nombre del archivo sin extensión
// ═══════════════════════════════════════════════════════════════════════
export const exportAccionesMejora = async (
  acciones,
  getProcess,
  filename = 'AccionesMejora'
) => {
  try {
    console.log('📊 Descargando plantilla desde Supabase Storage...');

    // 1️⃣ Descargar plantilla — patrón del proyecto (sin CORS)
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('templates')
      .download('plantilla_acciones_mejora.xlsx');

    if (downloadError || !fileData) {
      throw new Error(
        `No se pudo descargar la plantilla: ${downloadError?.message}. ` +
        'Verifica que "plantilla_acciones_mejora.xlsx" exista en el bucket "templates".'
      );
    }

    console.log('✅ Plantilla descargada');

    // 2️⃣ Convertir Blob a ArrayBuffer y cargar con ExcelJS
    const arrayBuffer = await fileData.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(arrayBuffer);

    // Hoja principal "v3" (detectada al inspeccionar el archivo)
    const ws = wb.getWorksheet('v3') || wb.worksheets[0];
    if (!ws) throw new Error('No se encontró la hoja "v3" en la plantilla.');

    // 3️⃣ Actualizar FECHA en encabezado (celda P3)
    const today    = new Date();
    const fechaHoy = today.toLocaleDateString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    ws.getCell('P3').value = `FECHA:\n${fechaHoy}`;

    // 4️⃣ Limpiar filas de ejemplo que trae la plantilla
    for (let r = DATA_START_ROW; r <= ws.rowCount; r++) {
      ws.getRow(r).eachCell({ includeEmpty: true }, (cell) => { cell.value = null; });
    }

    console.log(`📝 Escribiendo ${acciones.length} fila(s) desde fila ${DATA_START_ROW}...`);

    // 5️⃣ Escribir filas de datos
    // Mapa de columnas según estructura real del formato RE-DP-10:
    // A=Consecutivo B=Fecha C=Proceso D=Auditoría E=QRS F=Satisfacción
    // G=Autocontrol H=Análisis riesgos I=Pto no conforme
    // J=Descripción hallazgo K=Corrección L=Correctiva M=Preventiva
    // N=Causas O=Descripción acciones P=Logros Q=Recursos R=Responsable
    // S=Fecha propuesta T=Criterios verificación U=Hallazgo verificación
    // V-W=espacios del formato X=Fecha verificación Y=Fecha eficacia
    // Z=Estado AA=SI AB=NO AC=Auditor

    acciones.forEach((a, idx) => {
      const rowNum = DATA_START_ROW + idx;
      const fill   = idx % 2 === 0 ? FILL_ODD : FILL_EVEN;
      const row    = ws.getRow(rowNum);
      row.height   = 30;

      const set = (col, val, align = 'left') => {
        const cell = row.getCell(col);
        cell.value = val ?? '';
        styleCell(cell, fill, align);
      };

      // IDENTIFICACIÓN
      set(1,  a.consecutive               || '—',   'center'); // A
      set(2,  fmt(a.created_at),                    'center'); // B
      set(3,  getProcess(a.process_id)    || '-');             // C
      set(4,  tick(a.origin_audit),                 'center'); // D
      set(5,  tick(a.origin_qrs),                   'center'); // E
      set(6,  tick(a.origin_satisfaction),          'center'); // F
      set(7,  tick(a.origin_autocontrol),           'center'); // G
      set(8,  tick(a.origin_risk_analysis),         'center'); // H
      set(9,  tick(a.origin_nonconforming),         'center'); // I
      // ANÁLISIS
      set(10, a.finding_description      || '-');             // J
      set(11, tick(a.action_correction),            'center'); // K
      set(12, tick(a.action_corrective),            'center'); // L
      set(13, tick(a.action_preventive),            'center'); // M
      set(14, a.causes                   || '-');             // N
      // PLAN DE ACCIÓN
      set(15, a.action_description       || '-');             // O
      set(16, a.expected_results         || '-');             // P
      set(17, a.resources_budget         || '-');             // Q
      set(18, a.responsible_name         || '—');             // R
      set(19, fmt(a.proposed_date),                 'center'); // S
      // VERIFICACIÓN
      set(20, a.verification_criteria   || '-');              // T
      set(21, a.verification_finding    || '-');              // U
      set(22, '',                                   'center'); // V — espacio
      set(23, '',                                   'center'); // W — espacio
      set(24, fmt(a.verification_date),             'center'); // X
      set(25, fmt(a.efficacy_date),                 'center'); // Y
      set(26, statusLabel(a.status),                'center'); // Z
      set(27, a.closure_approved === 'SI' ? 'X' : '', 'center'); // AA
      set(28, a.closure_approved === 'NO' ? 'X' : '', 'center'); // AB
      set(29, a.auditor?.full_name      || '—',    'center'); // AC

      row.commit();
    });

    // Fila vacía con borde si no hay datos
    if (acciones.length === 0) {
      const r = ws.getRow(DATA_START_ROW);
      r.height = 20;
      for (let c = 1; c <= 29; c++) { r.getCell(c).border = BORDER; }
      r.commit();
    }

    // 6️⃣ Exportar archivo
    console.log('💾 Generando archivo final...');
    const buffer = await wb.xlsx.writeBuffer();
    const blob   = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const stamp = fechaHoy.replace(/\//g, '-');
    saveAs(blob, `${filename}_${stamp}.xlsx`);

    console.log('✅ Excel exportado correctamente');
    return true;

  } catch (err) {
    console.error('❌ Error exportando Excel:', err);
    throw err;
  }
};

export default exportAccionesMejora;