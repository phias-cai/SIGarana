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
        .select('code, name, created_by')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      console.log('📄 Documento encontrado:', document);

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
          p_message: `Tu documento "${document.name}" (${document.code}) ha sido aprobado y está ahora publicado.`,
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
   * - ELIMINA el documento de la BD (no lo cambia a draft)
   * - Crea notificación para el creador con el motivo
   * - El archivo en Storage queda huérfano (se puede limpiar después)
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

      // 1. Obtener información del documento antes de eliminar
      const { data: document, error: fetchError } = await supabase
        .from('document')
        .select('code, name, created_by, file_path')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      console.log('📄 Documento encontrado:', document);

      // 2. Crear notificación ANTES de eliminar usando función SQL
      // IMPORTANTE: Pasamos documentId porque el documento todavía existe en este momento
      const { data: notificationId, error: notificationError } = await supabase
        .rpc('create_approval_notification', {
          p_user_id: document.created_by,
          p_type: 'rejected',  // ⬅️ Tipo correcto según CHECK constraint
          p_title: '❌ Documento Rechazado',
          p_message: `Tu documento "${document.name}" (${document.code}) ha sido rechazado.\n\nMotivo: ${reason}`,
          p_document_id: documentId  // ⬅️ Pasamos el ID antes de eliminar
        });

      if (notificationError) {
        console.warn('⚠️ Error creando notificación:', notificationError);
        // Continuamos igual
      } else {
        console.log('🔔 Notificación creada con ID:', notificationId);
        console.log('📧 Notificación enviada a user_id:', document.created_by);
      }

      // 3. ELIMINAR el documento de la BD
      const { error: deleteError } = await supabase
        .from('document')
        .delete()
        .eq('id', documentId);

      if (deleteError) throw deleteError;

      console.log('🗑️ Documento eliminado de BD');

      // TODO: Opcional - Eliminar archivo de Storage
      // if (document.file_path) {
      //   await supabase.storage
      //     .from('documents')
      //     .remove([document.file_path]);
      // }

      return { success: true, data: document };

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