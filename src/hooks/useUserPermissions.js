// src/hooks/useUserPermissions.js
// Hook COMPLETO para gestionar permisos de un usuario específico
// Incluye funciones de verificación para el módulo de actas

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

  // ============================================================================
  // FUNCIONES DE VERIFICACIÓN PARA ACTAS
  // ============================================================================

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {string} permissionCode - Código del permiso
   * @returns {boolean}
   */
  const hasPermission = (permissionCode) => {
    return permissionCodes.includes(permissionCode);
  };

  /**
   * Verifica si puede editar un acta específica
   * @param {object} acta - Objeto del acta
   * @param {string} currentUserId - ID del usuario actual
   * @param {string} userRole - Rol del usuario (admin, gerencia, usuario)
   * @returns {boolean}
   */
  const canEditActa = (acta, currentUserId, userRole) => {
    if (!acta) return false;
    
    // Admin puede editar cualquiera
    if (userRole === 'admin') return true;
    
    // No se puede editar archivadas (solo admin)
    if (acta.status === 'archived') return false;
    
    // Gerencia con permiso edit_all puede editar no archivadas
    if (userRole === 'gerencia' && hasPermission('auditorias:actas_edit_all')) {
      return true;
    }
    
    // Creador puede editar solo borradores propios
    if (acta.created_by === currentUserId && acta.status === 'draft') {
      return hasPermission('auditorias:actas_edit');
    }
    
    return false;
  };

  /**
   * Verifica si puede archivar un acta
   * ⭐ SOLO GERENCIA/ADMIN
   * @param {object} acta - Objeto del acta
   * @param {string} userRole - Rol del usuario
   * @returns {boolean}
   */
  const canArchiveActa = (acta, userRole) => {
    if (!acta) return false;
    
    // No se puede archivar algo ya archivado
    if (acta.status === 'archived') return false;
    
    // Solo gerencia/admin
    if (!['gerencia', 'admin'].includes(userRole)) return false;
    
    // Verificar permiso
    return hasPermission('auditorias:actas_archive');
  };

  /**
   * Verifica si puede eliminar un acta
   * ⭐ SOLO GERENCIA/ADMIN
   * @param {object} acta - Objeto del acta
   * @param {string} userRole - Rol del usuario
   * @returns {boolean}
   */
  const canDeleteActa = (acta, userRole) => {
    if (!acta) return false;
    
    // Solo gerencia/admin
    if (!['gerencia', 'admin'].includes(userRole)) return false;
    
    // Verificar permiso
    return hasPermission('auditorias:actas_delete');
  };

  /**
   * Verifica si puede aprobar un acta
   * @param {object} acta - Objeto del acta
   * @returns {boolean}
   */
  const canApproveActa = (acta) => {
    if (!acta) return false;
    
    // No se puede aprobar algo ya aprobado o archivado
    if (acta.status === 'approved' || acta.status === 'archived') return false;
    
    return hasPermission('auditorias:actas_approve');
  };

  /**
   * Verifica si puede descargar actas
   * @returns {boolean}
   */
  const canDownloadActa = () => {
    return hasPermission('auditorias:actas_download');
  };

  /**
   * Verifica si puede ver todas las actas
   * @returns {boolean}
   */
  const canViewAllActas = () => {
    return hasPermission('auditorias:actas_view_all');
  };

  // ============================================================================
  // RETURN CON TODAS LAS FUNCIONES
  // ============================================================================

  return {
    // Estado y datos
    permissions,
    permissionCodes,
    loading,
    error,
    
    // Funciones de gestión
    assignPermissions,
    revokePermissions,
    refresh: loadPermissions,
    
    // Funciones de verificación para actas
    hasPermission,
    canEditActa,
    canArchiveActa,
    canDeleteActa,
    canApproveActa,
    canDownloadActa,
    canViewAllActas,
  };
}