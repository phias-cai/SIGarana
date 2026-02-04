// =====================================================
// generateWordTemplate.js - VERSIÓN FINAL
// Agrega página de instrucciones al inicio del Word
// =====================================================

import { saveAs } from 'file-saver';

export const generateWordTemplate = async ({ code, version, name }) => {
  try {
    console.log('📝 Generando plantilla Word con instrucciones...');
    
    // URL de la plantilla en Supabase Storage
    const templateUrl = 'https://wnsnymxabmxswnpcpvoj.supabase.co/storage/v1/object/public/templates/plantilla_indecon_word.docx';
    
    // Descargar la plantilla
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error('No se pudo descargar la plantilla Word');
    }
    
    const blob = await response.blob();
    
    // Cargar con JSZip para modificar el contenido
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(blob);
    
    // Leer el document.xml
    const docXml = await zip.file('word/document.xml').async('string');
    
    // Preparar fecha actual
    const today = new Date();
    const fechaFormateada = today.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const versionFormateada = String(version).padStart(2, '0');
    
    // Crear página de instrucciones en formato XML de Word
    const instruccionesXml = `
      <w:p>
        <w:pPr>
          <w:spacing w:before="480" w:after="240"/>
          <w:jc w:val="center"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:b/>
            <w:sz w:val="40"/>
            <w:color w:val="2e5244"/>
          </w:rPr>
          <w:t>📋 INSTRUCCIONES</w:t>
        </w:r>
      </w:p>
      
      <w:p>
        <w:pPr>
          <w:spacing w:before="240" w:after="240"/>
          <w:jc w:val="center"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:sz w:val="26"/>
          </w:rPr>
          <w:t>Completa el ENCABEZADO del documento con estos valores:</w:t>
        </w:r>
      </w:p>
      
      <w:tbl>
        <w:tblPr>
          <w:tblStyle w:val="TableGrid"/>
          <w:tblW w:w="8000" w:type="dxa"/>
          <w:jc w:val="center"/>
          <w:tblBorders>
            <w:top w:val="single" w:sz="24" w:color="0066cc"/>
            <w:left w:val="single" w:sz="24" w:color="0066cc"/>
            <w:bottom w:val="single" w:sz="24" w:color="0066cc"/>
            <w:right w:val="single" w:sz="24" w:color="0066cc"/>
            <w:insideH w:val="single" w:sz="12" w:color="0066cc"/>
            <w:insideV w:val="single" w:sz="12" w:color="0066cc"/>
          </w:tblBorders>
        </w:tblPr>
        <w:tr>
          <w:tc>
            <w:tcPr>
              <w:shd w:val="clear" w:color="auto" w:fill="E6F2FF"/>
            </w:tcPr>
            <w:p>
              <w:pPr>
                <w:jc w:val="left"/>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:b/>
                  <w:sz w:val="28"/>
                  <w:color w:val="0066cc"/>
                </w:rPr>
                <w:t>CODIGO:</w:t>
              </w:r>
            </w:p>
          </w:tc>
          <w:tc>
            <w:tcPr>
              <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
            </w:tcPr>
            <w:p>
              <w:r>
                <w:rPr>
                  <w:b/>
                  <w:sz w:val="32"/>
                  <w:color w:val="008000"/>
                </w:rPr>
                <w:t>${code}</w:t>
              </w:r>
            </w:p>
          </w:tc>
        </w:tr>
        <w:tr>
          <w:tc>
            <w:tcPr>
              <w:shd w:val="clear" w:color="auto" w:fill="E6F2FF"/>
            </w:tcPr>
            <w:p>
              <w:pPr>
                <w:jc w:val="left"/>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:b/>
                  <w:sz w:val="28"/>
                  <w:color w:val="0066cc"/>
                </w:rPr>
                <w:t>VERSION:</w:t>
              </w:r>
            </w:p>
          </w:tc>
          <w:tc>
            <w:tcPr>
              <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
            </w:tcPr>
            <w:p>
              <w:r>
                <w:rPr>
                  <w:b/>
                  <w:sz w:val="32"/>
                  <w:color w:val="008000"/>
                </w:rPr>
                <w:t>${versionFormateada}</w:t>
              </w:r>
            </w:p>
          </w:tc>
        </w:tr>
        <w:tr>
          <w:tc>
            <w:tcPr>
              <w:shd w:val="clear" w:color="auto" w:fill="E6F2FF"/>
            </w:tcPr>
            <w:p>
              <w:pPr>
                <w:jc w:val="left"/>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:b/>
                  <w:sz w:val="28"/>
                  <w:color w:val="0066cc"/>
                </w:rPr>
                <w:t>FECHA:</w:t>
              </w:r>
            </w:p>
          </w:tc>
          <w:tc>
            <w:tcPr>
              <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
            </w:tcPr>
            <w:p>
              <w:r>
                <w:rPr>
                  <w:b/>
                  <w:sz w:val="32"/>
                  <w:color w:val="008000"/>
                </w:rPr>
                <w:t>${fechaFormateada}</w:t>
              </w:r>
            </w:p>
          </w:tc>
        </w:tr>
        <w:tr>
          <w:tc>
            <w:tcPr>
              <w:shd w:val="clear" w:color="auto" w:fill="E6F2FF"/>
            </w:tcPr>
            <w:p>
              <w:pPr>
                <w:jc w:val="left"/>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:b/>
                  <w:sz w:val="28"/>
                  <w:color w:val="0066cc"/>
                </w:rPr>
                <w:t>PAGINA:</w:t>
              </w:r>
            </w:p>
          </w:tc>
          <w:tc>
            <w:tcPr>
              <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
            </w:tcPr>
            <w:p>
              <w:r>
                <w:rPr>
                  <w:b/>
                  <w:sz w:val="32"/>
                  <w:color w:val="008000"/>
                </w:rPr>
                <w:t>1 de 1</w:t>
              </w:r>
            </w:p>
          </w:tc>
        </w:tr>
        <w:tr>
          <w:tc>
            <w:tcPr>
              <w:shd w:val="clear" w:color="auto" w:fill="E6F2FF"/>
            </w:tcPr>
            <w:p>
              <w:pPr>
                <w:jc w:val="left"/>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:b/>
                  <w:sz w:val="28"/>
                  <w:color w:val="0066cc"/>
                </w:rPr>
                <w:t>TÍTULO:</w:t>
              </w:r>
            </w:p>
          </w:tc>
          <w:tc>
            <w:tcPr>
              <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
            </w:tcPr>
            <w:p>
              <w:r>
                <w:rPr>
                  <w:b/>
                  <w:sz w:val="32"/>
                  <w:color w:val="008000"/>
                </w:rPr>
                <w:t>${name || 'Nombre del documento'}</w:t>
              </w:r>
            </w:p>
          </w:tc>
        </w:tr>
      </w:tbl>
      
      <w:p>
        <w:pPr>
          <w:spacing w:before="360" w:after="120"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:b/>
            <w:sz w:val="26"/>
            <w:color w:val="cc0000"/>
          </w:rPr>
          <w:t>⚠️ PASOS A SEGUIR:</w:t>
        </w:r>
      </w:p>
      
      <w:p>
        <w:pPr>
          <w:ind w:left="720"/>
          <w:spacing w:after="120"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:sz w:val="24"/>
          </w:rPr>
          <w:t>1. Ve a la siguiente página (con el logo INDECON)</w:t>
        </w:r>
      </w:p>
      
      <w:p>
        <w:pPr>
          <w:ind w:left="720"/>
          <w:spacing w:after="120"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:sz w:val="24"/>
          </w:rPr>
          <w:t>2. Haz doble clic en el ENCABEZADO (parte superior)</w:t>
        </w:r>
      </w:p>
      
      <w:p>
        <w:pPr>
          <w:ind w:left="720"/>
          <w:spacing w:after="120"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:sz w:val="24"/>
          </w:rPr>
          <w:t>3. Copia los valores resaltados en AMARILLO de la tabla</w:t>
        </w:r>
      </w:p>
      
      <w:p>
        <w:pPr>
          <w:ind w:left="720"/>
          <w:spacing w:after="120"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:sz w:val="24"/>
          </w:rPr>
          <w:t>4. Pégalos en las celdas correspondientes del encabezado</w:t>
        </w:r>
      </w:p>
      
      <w:p>
        <w:pPr>
          <w:ind w:left="720"/>
          <w:spacing w:after="120"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:sz w:val="24"/>
          </w:rPr>
          <w:t>5. Completa el CONTENIDO del documento</w:t>
        </w:r>
      </w:p>
      
      <w:p>
        <w:pPr>
          <w:ind w:left="720"/>
          <w:spacing w:after="240"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:sz w:val="24"/>
          </w:rPr>
          <w:t>6. BORRA ESTA PÁGINA antes de guardar</w:t>
        </w:r>
      </w:p>
      
      <w:p>
        <w:pPr>
          <w:spacing w:before="240" w:after="240"/>
          <w:jc w:val="center"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:sz w:val="24"/>
            <w:color w:val="008000"/>
          </w:rPr>
          <w:t>✅ Después de copiar, puedes eliminar esta página de instrucciones</w:t>
        </w:r>
      </w:p>
      
      <w:p>
        <w:r>
          <w:br w:type="page"/>
        </w:r>
      </w:p>`;
    
    // Insertar instrucciones al inicio del documento (después de <w:body>)
    const bodyStart = docXml.indexOf('<w:body>') + '<w:body>'.length;
    const updatedDocXml = 
      docXml.slice(0, bodyStart) + 
      instruccionesXml + 
      docXml.slice(bodyStart);
    
    // Actualizar el archivo en el ZIP
    zip.file('word/document.xml', updatedDocXml);
    
    // Generar el nuevo archivo
    const modifiedBlob = await zip.generateAsync({ type: 'blob' });
    
    // Guardar con nombre descriptivo
    const fileName = `${code}_Plantilla_v${versionFormateada}.docx`;
    saveAs(modifiedBlob, fileName);
    
    console.log('✅ Plantilla Word con instrucciones generada:', fileName);
    return { success: true, fileName };
    
  } catch (error) {
    console.error('❌ Error generando plantilla Word:', error);
    throw new Error(`Error al generar plantilla Word: ${error.message}`);
  }
};