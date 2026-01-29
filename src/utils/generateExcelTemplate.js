// =====================================================
// GENERADOR DE PLANTILLAS EXCEL - JavaScript
// =====================================================
// Para usar en navegador con Supabase
// Incluye logo de Garana
// =====================================================

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Generar plantilla Excel con logo
 * 
 * @param {Object} params
 * @param {string} params.code - Código (ej: "RE-GS-33")
 * @param {string} params.name - Nombre del documento
 * @param {string} params.version - Versión (default: "1")
 * @param {string} params.logoUrl - URL del logo (Supabase Storage)
 * @returns {Promise<void>}
 */
export async function generateExcelTemplate({ code, name, version = '1', logoUrl }) {
  try {
    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Hoja1');

    // Configurar anchos de columnas
    worksheet.columns = [
      { width: 3 },   // A - margen
      { width: 12 },  // B - logo
      { width: 15 },  // C
      { width: 25 },  // D - título
      { width: 15 },  // E
      { width: 15 },  // F
      { width: 15 },  // G
      { width: 15 },  // H - código/fecha
      { width: 12 },  // I - versión/página
    ];

    // Configurar altura de filas del encabezado
    for (let i = 1; i <= 8; i++) {
      worksheet.getRow(i).height = 20;
    }

    // Fecha actual
    const today = new Date().toLocaleDateString('es-CO');

    // Estilos comunes
    const borderStyle = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    const headerFill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E9' },
    };

    // ===== COLUMNA B (LOGO) =====
    // Fusionar B1:B8
    worksheet.mergeCells('B1:B8');
    const logoCell = worksheet.getCell('B1');
    logoCell.border = borderStyle;
    logoCell.fill = headerFill;
    logoCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar logo si existe
    if (logoUrl) {
      try {
        // Obtener logo como buffer
        const response = await fetch(logoUrl);
        const logoBuffer = await response.arrayBuffer();
        
        // Agregar imagen al workbook
        const imageId = workbook.addImage({
          buffer: logoBuffer,
          extension: 'jpeg',
        });

        // Insertar imagen en la celda B1
        worksheet.addImage(imageId, {
          tl: { col: 1.1, row: 0.2 },  // Top-left
          br: { col: 1.9, row: 7.8 },  // Bottom-right
        });
      } catch (error) {
        console.warn('⚠️ Error agregando logo:', error);
        logoCell.value = 'GARANA';
        logoCell.font = { bold: true, size: 14, color: { argb: 'FF2E5244' } };
      }
    } else {
      logoCell.value = 'GARANA';
      logoCell.font = { bold: true, size: 14, color: { argb: 'FF2E5244' } };
    }

    // ===== COLUMNA C-G (TÍTULO) =====
    // Fusionar C1:G8
    worksheet.mergeCells('C1:G8');
    const titleCell = worksheet.getCell('C1');
    titleCell.value = name.toUpperCase();
    titleCell.font = { bold: true, size: 12 };
    titleCell.alignment = { 
      vertical: 'middle', 
      horizontal: 'center', 
      wrapText: true 
    };
    titleCell.border = borderStyle;
    titleCell.fill = headerFill;

    // ===== COLUMNA H (DATOS) =====
    const dataFields = [
      { row: 1, label: 'CODIGO:', value: code },
      { row: 3, label: 'VERSION:', value: version },
      { row: 5, label: 'FECHA:', value: today },
      { row: 7, label: 'PAGINA:', value: '1 de 1' },
    ];

    dataFields.forEach(({ row, label, value }) => {
      // Etiqueta
      const labelCell = worksheet.getCell(`H${row}`);
      labelCell.value = label;
      labelCell.font = { bold: true, size: 9 };
      labelCell.alignment = { vertical: 'top', horizontal: 'left' };
      labelCell.border = borderStyle;

      // Valor
      const valueCell = worksheet.getCell(`H${row + 1}`);
      valueCell.value = value;
      valueCell.font = { bold: label === 'CODIGO:' || label === 'VERSION:', size: 10 };
      valueCell.alignment = { vertical: 'middle', horizontal: 'center' };
      valueCell.border = borderStyle;
    });

    // ===== CONTENIDO SEGÚN TIPO =====
    const typeCode = code.split('-')[0];

    if (typeCode === 'RE') {
      // REGISTRO
      // Fila 10: Título sección
      worksheet.mergeCells('C10:H10');
      const seccionCell = worksheet.getCell('C10');
      seccionCell.value = 'IDENTIFICACIÓN';
      seccionCell.font = { bold: true, size: 11 };
      seccionCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFBBDEFB' },
      };
      seccionCell.alignment = { horizontal: 'center' };

      // Fila 11: Campos
      worksheet.getCell('C11').value = 'Nombre de quien reporta:';
      worksheet.getCell('C11').font = { size: 10 };
      
      worksheet.getCell('G11').value = 'Reporte N°:';
      worksheet.getCell('G11').font = { size: 10 };

      worksheet.getCell('C12').value = 'Fecha:';
      worksheet.getCell('C12').font = { size: 10 };

      // Fila 15: Descripción
      worksheet.mergeCells('C15:H15');
      const descripCell = worksheet.getCell('C15');
      descripCell.value = 'DESCRIPCIÓN';
      descripCell.font = { bold: true, size: 11 };
      descripCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFBBDEFB' },
      };
      descripCell.alignment = { horizontal: 'center' };

      // Fila 21: Observaciones
      worksheet.mergeCells('C21:H21');
      const obsCell = worksheet.getCell('C21');
      obsCell.value = 'OBSERVACIONES';
      obsCell.font = { bold: true, size: 11 };
      obsCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFBBDEFB' },
      };
      obsCell.alignment = { horizontal: 'center' };

    } else if (typeCode === 'IN') {
      // INSTRUCTIVO
      // Fila 10: Headers
      worksheet.getCell('D10').value = 'PASO';
      worksheet.getCell('D10').font = { bold: true, size: 10 };
      worksheet.getCell('D10').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF9C4' },
      };
      worksheet.getCell('D10').alignment = { horizontal: 'center' };

      worksheet.mergeCells('E10:F10');
      worksheet.getCell('E10').value = 'DESCRIPCIÓN';
      worksheet.getCell('E10').font = { bold: true, size: 10 };
      worksheet.getCell('E10').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF9C4' },
      };
      worksheet.getCell('E10').alignment = { horizontal: 'center' };

      worksheet.getCell('G10').value = 'RESPONSABLE';
      worksheet.getCell('G10').font = { bold: true, size: 10 };
      worksheet.getCell('G10').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF9C4' },
      };
      worksheet.getCell('G10').alignment = { horizontal: 'center' };

      // Filas 11-15: Pasos numerados
      for (let i = 1; i <= 5; i++) {
        const row = 10 + i;
        worksheet.getCell(`D${row}`).value = i;
        worksheet.getCell(`D${row}`).alignment = { horizontal: 'center' };
      }

    } else {
      // FORMATO GENÉRICO
      worksheet.mergeCells('C10:H10');
      const genericCell = worksheet.getCell('C10');
      genericCell.value = 'Complete este documento según las necesidades de su proceso';
      genericCell.font = { italic: true, size: 10 };
      genericCell.alignment = { horizontal: 'center' };
    }

    // Generar y descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `${code}_Plantilla_v${version}.xlsx`);

    console.log('✅ Plantilla Excel generada:', `${code}_Plantilla_v${version}.xlsx`);
    return true;

  } catch (error) {
    console.error('❌ Error generando plantilla Excel:', error);
    throw error;
  }
}

// =====================================================
// EJEMPLO DE USO
// =====================================================

/*
import { generateExcelTemplate } from './generateExcelTemplate';
import { supabase } from './supabase';

async function handleDownloadTemplate() {
  // Obtener URL pública del logo desde Supabase Storage
  const { data } = supabase.storage
    .from('assets')
    .getPublicUrl('logo_garana.jpeg');
  
  const logoUrl = data.publicUrl;

  await generateExcelTemplate({
    code: 'RE-GS-33',
    name: 'REPORTE DE ACTOS Y CONDICIONES INSEGURAS',
    version: '1',
    logoUrl: logoUrl,
  });
}
*/