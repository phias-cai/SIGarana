// src/hooks/useUserPermissions.js
// Hook COMPLETO para gestionar permisos de un usuario específico
// ✅ Incluye: asignación, revocación, consulta de permisos

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para gestionar permisos de un usuario específico
 * @param {string} userId - ID del usuario
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

  /**
   * Carga los permisos del usuario desde la BD
   */
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

      console.log('✅ Permisos cargados para usuario:', userId, '→', codes.length, 'permisos');

    } catch (err) {
      console.error('❌ Error loading user permissions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Asigna permisos a un usuario
   * @param {string[]} codes - Códigos de permisos a asignar
   * @param {string} notes - Notas opcionales
   */
  const assignPermissions = async (codes, notes = null) => {
    try {
      console.log('➕ Asignando permisos:', codes);

      const { data, error } = await supabase
        .rpc('assign_permissions_to_user', {
          p_user_id: userId,
          p_permission_codes: codes,
          p_notes: notes
        });

      if (error) throw error;

      await loadPermissions();

      console.log('✅ Permisos asignados correctamente');
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error assigning permissions:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Revoca permisos de un usuario
   * @param {string[]} codes - Códigos de permisos a revocar
   * @param {string} notes - Notas opcionales
   */
  const revokePermissions = async (codes, notes = null) => {
    try {
      console.log('➖ Revocando permisos:', codes);

      const { data, error } = await supabase
        .rpc('revoke_permissions_from_user', {
          p_user_id: userId,
          p_permission_codes: codes,
          p_notes: notes
        });

      if (error) throw error;

      await loadPermissions();

      console.log('✅ Permisos revocados correctamente');
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error revoking permissions:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {string} permissionCode - Código del permiso
   */
  const hasPermission = (permissionCode) => {
    return permissionCodes.includes(permissionCode);
  };

  return {
    // Estados
    permissions,
    permissionCodes,
    loading,
    error,
    
    // Funciones
    assignPermissions,
    revokePermissions,
    hasPermission,
    refresh: loadPermissions
  };
}