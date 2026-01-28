// src/hooks/useNotifications.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook para gestionar notificaciones del usuario actual
 */
export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      
      // Suscribirse a cambios en tiempo real
      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notification',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) return;

      // Obtener notificaciones (últimas 50)
      const { data, error: fetchError } = await supabase
        .from('notification')
        .select(`
          *,
          document:document_id (
            id,
            code,
            name,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setNotifications(data || []);
      
      // Contar no leídas
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);

    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error: updateError } = await supabase
        .rpc('mark_notification_read', {
          p_notification_id: notificationId
        });

      if (updateError) throw updateError;

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      return { success: true };
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { success: false, error: err.message };
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data, error: updateError } = await supabase
        .rpc('mark_all_notifications_read');

      if (updateError) throw updateError;

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);

      return { success: true, count: data };
    } catch (err) {
      console.error('Error marking all as read:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const { error: deleteError } = await supabase
        .from('notification')
        .delete()
        .eq('id', notificationId);

      if (deleteError) throw deleteError;

      // Actualizar estado local
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting notification:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications
  };
}

/**
 * Hook para obtener notificaciones de un tipo específico
 */
export function useNotificationsByType(type) {
  const { notifications } = useNotifications();
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    if (type) {
      setFiltered(notifications.filter(n => n.type === type));
    } else {
      setFiltered(notifications);
    }
  }, [notifications, type]);

  return filtered;
}

/**
 * Hook para obtener notificaciones pendientes de aprobación (solo gerencia)
 */
export function useApprovalNotifications() {
  const { user, profile } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Solo cargar si es gerencia o admin
    if (profile?.role === 'gerencia' || profile?.role === 'admin') {
      loadApprovals();
    } else {
      setApprovals([]);
      setLoading(false);
    }
  }, [profile?.role]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener documentos pendientes de aprobación
      const { data, error: fetchError } = await supabase
        .from('document')
        .select(`
          *,
          document_type:document_type_id (*),
          process:process_id (*),
          requester:updated_by (
            id,
            full_name,
            email
          )
        `)
        .eq('status', 'pending_approval')
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      setApprovals(data || []);

    } catch (err) {
      console.error('Error loading approvals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (documentId) => {
    try {
      const { error: updateError } = await supabase
        .from('document')
        .update({ 
          status: 'published',
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // Recargar
      await loadApprovals();

      return { success: true };
    } catch (err) {
      console.error('Error approving document:', err);
      return { success: false, error: err.message };
    }
  };

  const reject = async (documentId, reason) => {
    try {
      const { error: updateError } = await supabase
        .from('document')
        .update({ 
          status: 'draft',
          change_reason: reason,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // Recargar
      await loadApprovals();

      return { success: true };
    } catch (err) {
      console.error('Error rejecting document:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    approvals,
    loading,
    error,
    approve,
    reject,
    refresh: loadApprovals
  };
}