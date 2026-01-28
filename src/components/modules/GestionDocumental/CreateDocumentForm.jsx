// src/hooks/useDocumentUpload.js
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para manejar la creación y upload de documentos
 */
export function useDocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  /**
   * Valida el tipo de archivo
   */
  const validateFile = (file) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
    
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
      throw new Error('Tipo de archivo no permitido. Solo se aceptan PDF, Word y Excel.');
    }

    // Máximo 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 10MB.');
    }

    return true;
  };

  /**
   * Genera la ruta del archivo en Storage
   */
  const generateStoragePath = (documentCode, versionNumber, fileName) => {
    // Obtener extensión
    const extension = fileName.split('.').pop();
    
    // Obtener tipo de documento (PR, FO, GU, etc.)
    const docType = documentCode.split('-')[0].toLowerCase();
    
    // Mapear tipo a carpeta
    const folderMap = {
      'pr': 'procedures',
      'fo': 'formats',
      'gu': 'guides',
      'in': 'instructions',
      'ma': 'manuals'
    };
    
    const folder = folderMap[docType] || 'other';
    
    // Estructura: documents/procedures/PR-GC-01/v1/PR-GC-01-v1.docx
    return `${folder}/${documentCode}/v${versionNumber}/${documentCode}-v${versionNumber}.${extension}`;
  };

  /**
   * Sube el archivo a Supabase Storage
   */
  const uploadFile = async (file, storagePath) => {
    try {
      setProgress(30);

      const { data, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      setProgress(60);
      return data;
    } catch (err) {
      throw new Error(`Error al subir archivo: ${err.message}`);
    }
  };

  /**
   * Crea el documento en la base de datos
   */
  const createDocument = async (documentData) => {
    try {
      const { data, error: dbError } = await supabase.rpc('create_document_with_version', {
        p_name: documentData.name,
        p_objective: documentData.objective,
        p_scope: documentData.scope,
        p_document_type_id: documentData.documentTypeId,
        p_process_id: documentData.processId,
        p_responsible_user_id: documentData.responsibleUserId,
        p_file_path: documentData.filePath,
        p_file_name: documentData.fileName,
        p_file_size: documentData.fileSize,
        p_mime_type: documentData.mimeType
      });

      if (dbError) {
        throw dbError;
      }

      return data;
    } catch (err) {
      throw new Error(`Error al crear documento: ${err.message}`);
    }
  };

  /**
   * Función principal para crear documento completo
   */
  const createDocumentWithFile = async (formData, file) => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      // 1. Validar archivo
      setProgress(10);
      validateFile(file);

      // 2. Generar código de documento usando la función SQL
      setProgress(20);
      const { data: codeData, error: codeError } = await supabase.rpc('generate_document_code', {
        type_code: formData.documentTypeCode,
        process_code: formData.processCode
      });

      if (codeError) {
        throw new Error(`Error al generar código: ${codeError.message}`);
      }

      const documentCode = codeData;

      // 3. Generar ruta de almacenamiento
      const storagePath = generateStoragePath(documentCode, 1, file.name);

      // 4. Subir archivo a Storage
      await uploadFile(file, storagePath);

      // 5. Crear documento en BD
      setProgress(80);
      const document = await createDocument({
        name: formData.name,
        objective: formData.objective,
        scope: formData.scope,
        documentTypeId: formData.documentTypeId,
        processId: formData.processId,
        responsibleUserId: formData.responsibleUserId,
        filePath: storagePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      });

      setProgress(100);
      
      return {
        success: true,
        document,
        code: documentCode
      };

    } catch (err) {
      console.error('Error creating document:', err);
      setError(err.message);
      
      return {
        success: false,
        error: err.message
      };
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return {
    uploading,
    progress,
    error,
    createDocumentWithFile
  };
}

/**
 * Hook para obtener opciones de responsables
 */
export function useResponsibleUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('id, full_name, email, role')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, loadUsers };
}