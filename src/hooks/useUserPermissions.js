// src/hooks/useUserPermissions.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para gestionar permisos de un usuario específico
 */
export function useUserPermissions(userId) {
  const [permissions, setPermissions] = useState([]);
  const [permissionCodes, setPermissionCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      loadPermissions();
    } else {
      setPermissions([]);
      setPermissionCodes([]);
      setLoading(false);
    }
  }, [userId]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: permError } = await supabase
        .rpc('get_user_permissions_detailed', {
          p_user_id: userId
        });

      if (permError) throw permError;

      setPermissions(data || []);
      
      const codes = (data || [])
        .filter(p => p.is_active)
        .map(p => p.permission_code);
      setPermissionCodes(codes);

    } catch (err) {
      console.error('❌ Error loading user permissions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const assignPermissions = async (permissionCodes, notes = null) => {
    try {
      const { data, error } = await supabase
        .rpc('assign_permissions_to_user', {
          p_user_id: userId,
          p_permission_codes: permissionCodes,
          p_notes: notes
        });

      if (error) throw error;

      await loadPermissions();

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error assigning permissions:', err);
      return { success: false, error: err.message };
    }
  };

  const revokePermissions = async (permissionCodes, notes = null) => {
    try {
      const { data, error } = await supabase
        .rpc('revoke_permissions_from_user', {
          p_user_id: userId,
          p_permission_codes: permissionCodes,
          p_notes: notes
        });

      if (error) throw error;

      await loadPermissions();

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error revoking permissions:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    permissions,
    permissionCodes,
    loading,
    error,
    assignPermissions,
    revokePermissions,
    refresh: loadPermissions
  };
}