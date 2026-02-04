// src/hooks/useFileDownload.js
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para descargar archivos desde Supabase Storage
 */
export function useFileDownload() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Descarga un archivo desde Supabase Storage
   * @param {string} filePath - Ruta del archivo en storage (ej: "documents/RE-GS-33_v1.xlsx")
   * @param {string} fileName - Nombre con el que se descargará (ej: "RE-GS-33_Reporte_Actos_Inseguros_v1.xlsx")
   */
  const downloadFile = async (filePath, fileName) => {
    try {
      setDownloading(true);
      setError(null);

      console.log('📥 Iniciando descarga:', { filePath, fileName });

      // 1️⃣ Descargar archivo desde Supabase Storage
      const { data, error: downloadError } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (downloadError) {
        throw new Error(`Error al descargar: ${downloadError.message}`);
      }

      if (!data) {
        throw new Error('No se pudo obtener el archivo');
      }

      console.log('✅ Archivo descargado, tamaño:', data.size, 'bytes');

      // 2️⃣ Crear URL temporal del blob
      const url = window.URL.createObjectURL(data);

      // 3️⃣ Crear elemento <a> invisible y hacer click
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // 4️⃣ Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Descarga completada:', fileName);

      return { success: true };

    } catch (err) {
      console.error('❌ Error en descarga:', err);
      setError(err.message);
      return { success: false, error: err.message };

    } finally {
      setDownloading(false);
    }
  };

  /**
   * Descarga directamente usando el documento completo
   * @param {object} document - Objeto documento con file_path y code
   */
  const downloadDocument = async (document) => {
    if (!document.file_path) {
      setError('El documento no tiene archivo asociado');
      return { success: false, error: 'Sin archivo' };
    }

    // Generar nombre descriptivo para la descarga
    const extension = document.file_path.split('.').pop();
    const fileName = `${document.code}_${document.name.replace(/[^a-zA-Z0-9]/g, '_')}_v${document.version}.${extension}`;

    return downloadFile(document.file_path, fileName);
  };

  return {
    downloadFile,
    downloadDocument,
    downloading,
    error
  };
}