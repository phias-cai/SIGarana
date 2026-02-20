// src/hooks/useAccionesMejora.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// ── Semáforo ──────────────────────────────────────────────────────────────────
export const getTrafficLight = (proposedDate, isClosed = false) => {
  if (isClosed) return { color: 'gray', label: 'Cerrada' };
  if (!proposedDate) return { color: 'gray', label: 'Sin fecha' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const proposed = new Date(proposedDate + 'T00:00:00');
  const diffDays = Math.ceil((proposed - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)  return { color: 'red',    label: `Vencida (${Math.abs(diffDays)}d)` };
  if (diffDays <= 7) return { color: 'yellow', label: `Vence en ${diffDays}d` };
  return               { color: 'green',  label: 'Vigente' };
};

// ── Hook principal ────────────────────────────────────────────────────────────
export function useAccionesMejora() {
  const { user, profile } = useAuth();
  const [acciones, setAcciones] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  // ── Cargar acciones (excluye archivadas) ──────────────────────────────────
  const fetchAcciones = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('improvement_action')
        .select('*')
        .neq('status', 'archived')   // archivadas (SI) no aparecen
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      if (!data || data.length === 0) { setAcciones([]); return; }

      const userIds = [...new Set([
        ...data.map(a => a.responsible_id),
        ...data.map(a => a.auditor_id),
        ...data.map(a => a.created_by),
        ...data.map(a => a.closed_by),
      ].filter(Boolean))];

      const { data: profiles } = await supabase
        .from('profile')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p; });

      setAcciones(data.map(accion => ({
        ...accion,
        responsible:       profileMap[accion.responsible_id] || null,
        responsible_name:  profileMap[accion.responsible_id]?.full_name || '—',
        responsible_email: profileMap[accion.responsible_id]?.email     || null,
        auditor:           profileMap[accion.auditor_id]     || null,
        creator:           profileMap[accion.created_by]     || null,
      })));

    } catch (err) {
      console.error('❌ Error cargando acciones:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Crear ─────────────────────────────────────────────────────────────────
  const createAccion = async (formData) => {
    try {
      const { data, error: insertError } = await supabase
        .from('improvement_action')
        .insert([{ ...formData, created_by: user.id }])
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchAcciones();
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error creando acción:', err);
      return { success: false, error: err.message };
    }
  };

  // ── Actualizar ────────────────────────────────────────────────────────────
  const updateAccion = async (id, formData) => {
    try {
      const { error: updateError } = await supabase
        .from('improvement_action')
        .update(formData)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchAcciones();
      return { success: true };
    } catch (err) {
      console.error('❌ Error actualizando acción:', err);
      return { success: false, error: err.message };
    }
  };

  // ── Eliminar (soft delete) ────────────────────────────────────────────────
  const deleteAccion = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('improvement_action')
        .update({ deleted_at: new Date().toISOString(), status: 'archived' })
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchAcciones();
      return { success: true };
    } catch (err) {
      console.error('❌ Error eliminando acción:', err);
      return { success: false, error: err.message };
    }
  };

  // ── Cerrar acción ─────────────────────────────────────────────────────────
  //
  //  'completed'        → Botón SI  → ARCHIVA la acción (desaparece de tabla)
  //  'pending_solution' → Botón NO  → NO archiva, guarda nota + envía email
  //
  const closeAccion = async (accionId, { closure_type, closure_reason }) => {
    try {
      const accion = acciones.find(a => a.id === accionId);

      if (closure_type === 'completed') {
        // ── Cierre definitivo: archivar ──────────────────────────────────
        const { error: updateError } = await supabase
          .from('improvement_action')
          .update({
            status:           'archived',
            is_closed:        true,
            closure_type,
            closure_reason,
            closure_approved: 'SI',
            closed_at:        new Date().toISOString(),
            closed_by:        user?.id ?? null,
            auditor_id:       user?.id ?? null,
          })
          .eq('id', accionId);

        if (updateError) throw updateError;

      } else {
        // ── Seguimiento pendiente: NO archivar, solo guardar nota ────────
        const { error: updateError } = await supabase
          .from('improvement_action')
          .update({
            closure_type,
            closure_reason,
            closure_approved: 'NO',
            // status e is_closed NO cambian — la acción sigue activa
          })
          .eq('id', accionId);

        if (updateError) throw updateError;

        // Enviar email al responsable
        if (accion?.responsible_email) {
          try {
            await supabase.functions.invoke('send-document-notification', {
              body: {
                type: 'accion_mejora_seguimiento_pendiente',
                to:   accion.responsible_email,
                data: {
                  consecutive:      accion.consecutive        || '—',
                  finding:          accion.finding_description || '—',
                  responsible_name: accion.responsible_name   || 'Responsable',
                  closure_reason,
                  reviewed_by:      profile?.full_name        || 'Administrador',
                  proposed_date:    accion.proposed_date
                    ? new Date(accion.proposed_date).toLocaleDateString('es-CO')
                    : 'Sin fecha',
                },
              },
            });
            console.log('📧 Email de seguimiento enviado a:', accion.responsible_email);
          } catch (emailErr) {
            // El email falla silenciosamente — la nota sí fue guardada
            console.warn('⚠️ Email no enviado:', emailErr.message);
          }
        }
      }

      await fetchAcciones();
      return { success: true };

    } catch (err) {
      console.error('❌ Error cerrando acción:', err);
      throw err; // El modal lo captura
    }
  };

  useEffect(() => { fetchAcciones(); }, []);

  return {
    acciones,
    loading,
    error,
    fetchAcciones,
    createAccion,
    updateAccion,
    deleteAccion,
    closeAccion,
  };
}

// ── Hook perfiles ─────────────────────────────────────────────────────────────
export function useProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profile')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name');
      setProfiles(data || []);
      setLoading(false);
    };
    fetchProfiles();
  }, []);

  return { profiles, loading };
}