// ===================================================================
// generateExcelTemplate.js - VERSIÓN CON PLANTILLA REAL
// Usa la plantilla Excel real subida por el usuario
// Fecha: Enero 29, 2026
// ===================================================================

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// URL de la plantilla base en Supabase Storage
// ⚠️ IMPORTANTE: Debes subir plantilla_indecon_excel.xlsx a este bucket primero
const TEMPLATE_URL = 'https://wnsnymxabmxswnpcpvoj.supabase.co/storage/v1/object/public/templates/plantilla_indecon_excel.xlsx';

/**
 * Genera plantilla Excel usando plantilla real de INDECON
 * 
 * Estructura de la plantilla:
 * - Q1: "CODIGO: " -> Se rellena con código del documento
 * - R1: "VERSION:" -> Se rellena con versión
 * - Q2: "FECHA:" -> Se rellena con fecha actual
 * - R2: "PAGINA" -> Se rellena con "1 de 1"
 * - C1:P2 (combinado): Se rellena con título del documento
 * - Columna A-B: Logo INDECON (ya está en la plantilla)
 * 
 * @param {Object} params - Parámetros
 * @param {string} params.code - Código del documento (ej: RE-GS-33)
 * @param {string} params.name - Nombre del documento
 * @param {number} params.version - Versión (default: 1)
 * @param {string} params.processName - Nombre del proceso/área
 * @returns {Promise<boolean>} - True si se generó exitosamente
 */
export const generateExcelTemplate = async ({
  code,
  name,
  version = 1,
  processName = ''
}) => {
  try {
    console.log('📄 Generando plantilla Excel...', { code, name, version, processName });
    
    // 1. Descargar plantilla base
    console.log('⬇️  Descargando plantilla base...');
    const response = await fetch(TEMPLATE_URL);
    
    if (!response.ok) {
      throw new Error(`No se pudo cargar la plantilla base. Status: ${response.status}. 
      
⚠️ ASEGÚRATE DE HABER SUBIDO plantilla_indecon_excel.xlsx A SUPABASE STORAGE:
1. Ve a: https://supabase.com/dashboard/project/kjuonbdlqnmnzkbwdcko/storage/buckets
2. Abre el bucket "templates" (créalo si no existe, debe ser PÚBLICO)
3. Sube el archivo plantilla_indecon_excel.xlsx
4. Verifica que la URL sea accesible en el navegador`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    
    console.log('✅ Plantilla cargada correctamente');
    
    // 2. Obtener la primera hoja
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('No se pudo encontrar la primera hoja en la plantilla');
    }
    
    console.log('📝 Rellenando campos dinámicos...');
    
    // 3. RELLENAR CAMPOS DINÁMICOS
    
    // --- Título del documento (C1:P2 está combinado) ---
    const titleCell = worksheet.getCell('C1');
    if (processName) {
      // Si hay nombre de proceso, mostrarlo
      titleCell.value = `${processName.toUpperCase()}\n${name.toUpperCase()}`;
    } else {
      titleCell.value = name.toUpperCase();
    }
    // Asegurar que el texto tenga saltos de línea habilitados
    titleCell.alignment = {
      ...titleCell.alignment,
      wrapText: true,
      vertical: 'middle',
      horizontal: 'center'
    };
    
    // --- Código (Q1) ---
    const codeCell = worksheet.getCell('Q1');
    // La plantilla tiene "CODIGO: \n", agregamos el código después
    codeCell.value = `CODIGO: ${code}`;
    codeCell.alignment = {
      ...codeCell.alignment,
      vertical: 'middle',
      horizontal: 'left'
    };
    
    // --- Versión (R1) ---
    const versionCell = worksheet.getCell('R1');
    versionCell.value = `VERSION: ${String(version).padStart(2, '0')}`;
    versionCell.alignment = {
      ...versionCell.alignment,
      vertical: 'middle',
      horizontal: 'left'
    };
    
    // --- Fecha (Q2) ---
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    
    const dateCell = worksheet.getCell('Q2');
    dateCell.value = `FECHA: ${formattedDate}`;
    dateCell.alignment = {
      ...dateCell.alignment,
      vertical: 'middle',
      horizontal: 'left'
    };
    
    // --- Página (R2) ---
    const pageCell = worksheet.getCell('R2');
    pageCell.value = 'PAGINA: 1 de 1';
    pageCell.alignment = {
      ...pageCell.alignment,
      vertical: 'middle',
      horizontal: 'left'
    };
    
    console.log('✅ Campos dinámicos rellenados');
    
    // 4. Generar y descargar archivo
    console.log('💾 Generando archivo final...');
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    const filename = `${code}_Plantilla_v${version}.xlsx`;
    saveAs(blob, filename);
    
    console.log(`✅ Plantilla Excel generada: ${filename}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error al generar plantilla Excel:', error);
    throw error;
  }
};

export default generateExcelTemplate;