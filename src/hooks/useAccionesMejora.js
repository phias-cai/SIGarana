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

// ── Helper: obtener emails de gerencia ────────────────────────────────────────
const getGerenciaEmails = async () => {
  const { data } = await supabase
    .from('profile')
    .select('email, full_name')
    .in('role', ['admin', 'gerencia'])
    .eq('is_active', true);
  return data || [];
};

// ── Helper: enviar email silencioso ──────────────────────────────────────────
const sendEmail = async (to, type, data) => {
  try {
    await supabase.functions.invoke('send-document-notification', {
      body: { type, to, data },
    });
    console.log(`📧 Email [${type}] enviado a: ${to}`);
  } catch (err) {
    console.warn(`⚠️ Email no enviado a ${to}:`, err.message);
  }
};

// ── Hook principal ────────────────────────────────────────────────────────────
export function useAccionesMejora() {
  const { user, profile } = useAuth();
  const [acciones, setAcciones] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  // ── Cargar (excluye archivadas) ───────────────────────────────────────────
  const fetchAcciones = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('improvement_action')
        .select('*')
        .neq('status', 'archived')
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

      const pm = {};
      (profiles || []).forEach(p => { pm[p.id] = p; });

      setAcciones(data.map(a => ({
        ...a,
        responsible:       pm[a.responsible_id] || null,
        responsible_name:  pm[a.responsible_id]?.full_name || '—',
        responsible_email: pm[a.responsible_id]?.email     || null,
        auditor:           pm[a.auditor_id]     || null,
        creator:           pm[a.created_by]     || null,
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

  // ── Eliminar (DELETE físico — solo admin/gerencia por RLS) ────────────────
  const deleteAccion = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('improvement_action')
        .delete()
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
  //  'completed'        → SI: archiva + email a responsable y gerencia
  //  'pending_solution' → NO: NO archiva, solo nota + email a responsable y gerencia
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
        // ── Seguimiento pendiente: NO archivar ───────────────────────────
        const { error: updateError } = await supabase
          .from('improvement_action')
          .update({
            closure_type,
            closure_reason,
            closure_approved: 'NO',
          })
          .eq('id', accionId);

        if (updateError) throw updateError;
      }

      // ── Preparar datos del email ─────────────────────────────────────
      const emailData = {
        consecutive:      accion?.consecutive         || '—',
        finding:          accion?.finding_description || '—',
        responsible_name: accion?.responsible_name    || 'Responsable',
        closure_reason,
        reviewed_by:      profile?.full_name          || 'Administrador',
        closure_type:     closure_type === 'completed'
                          ? 'Cierre definitivo ✅'
                          : 'En espera de solución 🕐',
        proposed_date:    accion?.proposed_date
          ? new Date(accion.proposed_date).toLocaleDateString('es-CO')
          : 'Sin fecha',
      };

      const emailType = closure_type === 'completed'
        ? 'accion_mejora_cierre_definitivo'
        : 'accion_mejora_seguimiento_pendiente';

      // ── Email al responsable ─────────────────────────────────────────
      if (accion?.responsible_email) {
        await sendEmail(accion.responsible_email, emailType, emailData);
      }

      // ── Email a gerencia (sin duplicar si ya es responsable) ─────────
      const gerencia = await getGerenciaEmails();
      for (const g of gerencia) {
        if (g.email !== accion?.responsible_email) {
          await sendEmail(g.email, emailType, emailData);
        }
      }

      await fetchAcciones();
      return { success: true };

    } catch (err) {
      console.error('❌ Error cerrando acción:', err);
      throw err;
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

// ── Hook perfiles (selector de responsable) ───────────────────────────────────
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