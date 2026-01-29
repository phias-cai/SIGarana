// =====================================================
// GENERADOR DE PLANTILLAS WORD - JavaScript
// =====================================================
// Para usar en navegador con Supabase
// Incluye logo de Garana
// =====================================================

import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType, BorderStyle, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Generar plantilla Word con logo
 * 
 * @param {Object} params
 * @param {string} params.code - Código (ej: "PR-GS-06")
 * @param {string} params.name - Nombre del documento
 * @param {string} params.version - Versión (default: "1")
 * @param {string} params.logoUrl - URL del logo (Supabase Storage)
 * @returns {Promise<void>}
 */
export async function generateWordTemplate({ code, name, version = '1', logoUrl }) {
  try {
    // Obtener logo como buffer
    let logoBuffer = null;
    if (logoUrl) {
      const response = await fetch(logoUrl);
      logoBuffer = await response.arrayBuffer();
    }

    // Fecha actual
    const today = new Date().toLocaleDateString('es-CO');

    // Crear tabla de encabezado
    const headerTable = new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
      },
      rows: [
        // Fila 1: Logo | Título | CODIGO:
        new TableRow({
          children: [
            // LOGO (fusionado verticalmente)
            new TableCell({
              children: logoBuffer ? [
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: logoBuffer,
                      transformation: {
                        width: 80,
                        height: 80,
                      },
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ] : [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'GARANA',
                      bold: true,
                      size: 24,
                      color: '2E5244',
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              rowSpan: 8,
              width: { size: 15, type: WidthType.PERCENTAGE },
              verticalAlign: 'center',
            }),
            
            // TÍTULO (fusionado verticalmente)
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: name.toUpperCase(),
                      bold: true,
                      size: 24,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              rowSpan: 8,
              width: { size: 55, type: WidthType.PERCENTAGE },
              verticalAlign: 'center',
            }),
            
            // CÓDIGO (etiqueta)
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'CODIGO:', bold: true, size: 18 }),
                  ],
                }),
              ],
              width: { size: 30, type: WidthType.PERCENTAGE },
            }),
          ],
        }),

        // Fila 2: Código valor
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: code, bold: true, size: 20 }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          ],
        }),

        // Fila 3: VERSION:
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'VERSION:', bold: true, size: 18 }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // Fila 4: Versión valor
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: version, bold: true, size: 20 }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          ],
        }),

        // Fila 5: FECHA:
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'FECHA:', bold: true, size: 18 }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // Fila 6: Fecha valor
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: today, size: 18 }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          ],
        }),

        // Fila 7: PÁGINA:
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'PAGINA:', bold: true, size: 18 }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // Fila 8: Página valor
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: '1 de 1', size: 18 }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          ],
        }),
      ],
    });

    // Determinar tipo de documento
    const typeCode = code.split('-')[0];
    let contentParagraphs = [];

    if (typeCode === 'PR' || typeCode === 'IN') {
      // PROCEDIMIENTO O INSTRUCTIVO
      contentParagraphs = [
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: '1. OBJETIVO', bold: true, size: 24 }),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: '[Describa el objetivo de este documento]', 
              italics: true, 
              size: 22 
            }),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: '2. ALCANCE', bold: true, size: 24 }),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: '[Describa el alcance de este documento]', 
              italics: true, 
              size: 22 
            }),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: '3. CONTENIDO', bold: true, size: 24 }),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: '[Complete aquí el contenido del documento]', 
              italics: true, 
              size: 22 
            }),
          ],
        }),
      ];
    } else {
      // REGISTRO O FORMATO
      contentParagraphs = [
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Complete este documento según las necesidades de su proceso.', 
              italics: true, 
              size: 22 
            }),
          ],
        }),
      ];
    }

    // Crear documento completo
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            headerTable,
            ...contentParagraphs,
          ],
        },
      ],
    });

    // Generar y descargar
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${code}_Plantilla_v${version}.docx`);
    
    console.log('✅ Plantilla Word generada:', `${code}_Plantilla_v${version}.docx`);
    return true;

  } catch (error) {
    console.error('❌ Error generando plantilla Word:', error);
    throw error;
  }
}

// =====================================================
// EJEMPLO DE USO
// =====================================================

/*
import { generateWordTemplate } from './generateWordTemplate';
import { supabase } from './supabase';

async function handleDownloadTemplate() {
  // Obtener URL pública del logo desde Supabase Storage
  const { data } = supabase.storage
    .from('assets')
    .getPublicUrl('logo_garana.jpeg');
  
  const logoUrl = data.publicUrl;

  await generateWordTemplate({
    code: 'PR-GS-06',
    name: 'PROCEDIMIENTO DE AUDITORÍAS INTERNAS',
    version: '1',
    logoUrl: logoUrl,
  });
}
*/