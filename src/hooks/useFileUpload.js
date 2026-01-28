// src/hooks/useFileUpload.js
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook personalizado para manejar upload de archivos a Supabase Storage
 */
export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  /**
   * Valida el tipo de archivo
   */
  const validateFile = (file) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    const maxSize = 10 * 1024 * 1024; // 10 MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no permitido. Solo se aceptan Word, Excel y PDF.'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo es muy grande. Máximo 10 MB.'
      };
    }

    return { valid: true };
  };

  /**
   * Genera el path del archivo en Storage
   * Formato: tipo/codigo/version/nombre-archivo.ext
   */
  const generateFilePath = (documentCode, versionNumber, fileName) => {
    // Obtener el tipo del código (PR, FO, GU, etc.)
    const type = documentCode.split('-')[0].toLowerCase();
    
    // Tipo de carpeta según código
    const folderMap = {
      'pr': 'procedures',
      'fo': 'formats',
      'gu': 'guides',
      'in': 'instructions',
      'ma': 'manuals'
    };

    const folder = folderMap[type] || 'documents';
    
    // Limpiar nombre de archivo (quitar caracteres especiales)
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Path: tipo/codigo/vX/archivo.ext
    return `${folder}/${documentCode}/v${versionNumber}/${cleanFileName}`;
  };

  /**
   * Sube un archivo a Supabase Storage
   */
  const uploadFile = async (file, documentCode, versionNumber = 1) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Validar archivo
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generar path
      const filePath = generateFilePath(documentCode, versionNumber, file.name);

      // Subir archivo
      const { data, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // No sobrescribir si ya existe
        });

      if (uploadError) {
        // Si el archivo ya existe, generar nombre único
        if (uploadError.message.includes('already exists')) {
          const timestamp = Date.now();
          const newFileName = `${file.name.split('.')[0]}_${timestamp}.${file.name.split('.').pop()}`;
          const newFilePath = generateFilePath(documentCode, versionNumber, newFileName);
          
          const { data: retryData, error: retryError } = await supabase.storage
            .from('documents')
            .upload(newFilePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (retryError) throw retryError;
          
          setProgress(100);
          return {
            success: true,
            filePath: retryData.path,
            fileName: newFileName,
            fileSize: file.size,
            mimeType: file.type
          };
        }
        
        throw uploadError;
      }

      setProgress(100);
      return {
        success: true,
        filePath: data.path,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      };

    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setUploading(false);
    }
  };

  /**
   * Obtiene una URL firmada para descargar un archivo
   */
  const getFileUrl = async (filePath, expiresIn = 3600) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;

      return {
        success: true,
        url: data.signedUrl
      };
    } catch (err) {
      console.error('Error getting file URL:', err);
      return {
        success: false,
        error: err.message
      };
    }
  };

  /**
   * Elimina un archivo de Storage
   */
  const deleteFile = async (filePath) => {
    try {
      const { error } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      console.error('Error deleting file:', err);
      return {
        success: false,
        error: err.message
      };
    }
  };

  return {
    uploadFile,
    getFileUrl,
    deleteFile,
    validateFile,
    uploading,
    progress,
    error
  };
}