import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para manejar acciones sobre documentos (aprobar/rechazar)
 * Usado principalmente por gerencia para gestionar documentos pendientes
 */
export const useDocumentActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Aprobar un documento
   * - Cambia estado a 'published'
   * - Archiva versión anterior si existe (parent_document_id)
   * - Crea notificación para el creador
   * - Actualiza fecha de cambio
   */
  const approveDocument = async (documentId) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🟢 Aprobando documento:', documentId);

      // 1. Obtener información del documento antes de actualizar
      const { data: document, error: fetchError } = await supabase
        .from('document')
        .select('code, name, version, created_by, parent_document_id') // ⬅️ AGREGADO: version y parent_document_id
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      console.log('📄 Documento encontrado:', document);

      // 1.5 ⬅️ NUEVO: Si tiene parent_document_id, archivar la versión anterior
      if (document.parent_document_id) {
        console.log('📦 Archivando versión anterior:', document.parent_document_id);
        
        const { error: archiveError } = await supabase
          .from('document')
          .update({
            status: 'archived',
            updated_at: new Date().toISOString()
          })
          .eq('id', document.parent_document_id);

        if (archiveError) {
          console.error('⚠️ Error archivando versión anterior:', archiveError);
          // No lanzar error, continuar con aprobación
        } else {
          console.log('✅ Versión anterior archivada correctamente');
        }
      }

      // 2. Actualizar estado del documento a 'published'
      const { error: updateError } = await supabase
        .from('document')
        .update({
          status: 'published',
          change_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      console.log('✅ Estado actualizado a published');

      // 3. Crear notificación para el creador usando función SQL
      const { data: notificationId, error: notificationError } = await supabase
        .rpc('create_approval_notification', {
          p_user_id: document.created_by,
          p_type: 'approved',  // ⬅️ Tipo correcto según CHECK constraint
          p_title: '✅ Documento Aprobado',
          p_message: `Tu documento "${document.name}" (${document.code}) versión ${document.version} ha sido aprobado y está ahora publicado.`,
          p_document_id: documentId
        });

      if (notificationError) {
        console.warn('⚠️ Error creando notificación:', notificationError);
        // No lanzamos error, la aprobación ya se hizo
      } else {
        console.log('🔔 Notificación creada con ID:', notificationId);
        console.log('📧 Notificación enviada a user_id:', document.created_by);
      }

      return { success: true, data: document };

    } catch (err) {
      console.error('❌ Error aprobando documento:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Rechazar un documento
   * - Si es NUEVO (v1, sin parent) → Cambiar a DRAFT (puede corregir)
   * - Si es EDICIÓN (v2+, con parent) → ELIMINAR (original sigue publicado)
   * - Crea notificación para el creador con el motivo
   */
  const rejectDocument = async (documentId, reason = '') => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔴 Rechazando documento:', documentId);
      console.log('📝 Motivo:', reason);

      // Validar que haya motivo
      if (!reason || reason.trim() === '') {
        throw new Error('El motivo del rechazo es obligatorio');
      }

      // 1. Obtener información del documento
      const { data: document, error: fetchError } = await supabase
        .from('document')
        .select('code, name, version, created_by, file_path, parent_document_id') // ⬅️ Agregado parent_document_id y version
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      console.log('📄 Documento encontrado:', document);

      // Detectar si es documento nuevo o edición
      const isNewDocument = !document.parent_document_id;
      const action = isNewDocument ? 'cambiar a borrador' : 'eliminar';
      
      console.log(`📋 Es documento ${isNewDocument ? 'NUEVO' : 'EDICIÓN'} → Acción: ${action}`);

      // 2. Crear notificación ANTES de modificar/eliminar
      const { data: notificationId, error: notificationError } = await supabase
        .rpc('create_approval_notification', {
          p_user_id: document.created_by,
          p_type: 'rejected',
          p_title: '❌ Documento Rechazado',
          p_message: `Tu documento "${document.name}" (${document.code}) versión ${document.version} ha sido rechazado.\n\nMotivo: ${reason}${isNewDocument ? '\n\nPuedes corregirlo y volver a enviarlo desde "Borradores".' : ''}`,
          p_document_id: documentId
        });

      if (notificationError) {
        console.warn('⚠️ Error creando notificación:', notificationError);
      } else {
        console.log('🔔 Notificación creada con ID:', notificationId);
        console.log('📧 Notificación enviada a user_id:', document.created_by);
      }

      // 3. Ejecutar acción según tipo de documento
      if (isNewDocument) {
        // DOCUMENTO NUEVO → Cambiar a DRAFT
        const { error: updateError } = await supabase
          .from('document')
          .update({
            status: 'draft',
            change_reason: `RECHAZADO: ${reason}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);

        if (updateError) throw updateError;

        console.log('📝 Documento cambiado a DRAFT (puede corregir y re-enviar)');
      } else {
        // EDICIÓN → ELIMINAR (el original sigue publicado)
        const { error: deleteError } = await supabase
          .from('document')
          .delete()
          .eq('id', documentId);

        if (deleteError) throw deleteError;

        console.log('🗑️ Edición eliminada (versión original sigue publicada)');
      }

      return { success: true, data: document, action };

    } catch (err) {
      console.error('❌ Error rechazando documento:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    approveDocument,
    rejectDocument,
    loading,
    error
  };
};