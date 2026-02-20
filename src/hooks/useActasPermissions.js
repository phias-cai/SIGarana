// src/hooks/useActasPermissions.js
// Hook ESPECÍFICO para validar permisos en módulo Actas

import { useAuth } from '@/context/AuthContext';

export const useActasPermissions = () => {
  const { user, profile, hasPermission } = useAuth();

  /**
   * Valida si el usuario puede EDITAR un acta
   * 
   * REGLAS:
   * - Admin/Gerencia: Pueden editar cualquier acta NO archivada
   * - Usuario con auditorias:actas_edit_all: Puede editar todas las actas NO archivadas
   * - Usuario con auditorias:actas_edit: Puede editar solo sus actas en draft
   * - Actas archivadas NO se pueden editar
   */
  const canEditActa = (acta, userId, role) => {
    if (!acta || !userId) return false;
    
    // Actas archivadas NO se pueden editar
    if (acta.status === 'archived') return false;
    
    // Admin y Gerencia pueden editar cualquier acta no archivada
    if (role === 'admin' || role === 'gerencia') {
      return true;
    }
    
    // Usuario con permiso edit_all puede editar cualquier acta
    if (hasPermission('auditorias:actas_edit_all')) {
      return true;
    }
    
    // Usuario con permiso edit puede editar solo sus actas en draft
    if (hasPermission('auditorias:actas_edit') && 
        acta.created_by === userId && 
        acta.status === 'draft') {
      return true;
    }
    
    return false;
  };

  /**
   * Valida si el usuario puede ARCHIVAR actas
   * 
   * REGLAS:
   * - Admin/Gerencia: Siempre pueden archivar
   * - Usuario con auditorias:actas_archive: Puede archivar
   */
  const canArchiveActa = (role) => {
    if (role === 'admin' || role === 'gerencia') {
      return true;
    }
    
    return hasPermission('auditorias:actas_archive');
  };

  /**
   * Valida si el usuario puede ELIMINAR actas permanentemente
   * 
   * REGLAS:
   * - Admin: Siempre puede eliminar
   * - Usuario con auditorias:actas_delete: Puede eliminar
   */
  const canDeleteActa = (role) => {
    if (role === 'admin') {
      return true;
    }
    
    return hasPermission('auditorias:actas_delete');
  };

  /**
   * Valida si el usuario puede DESCARGAR actas
   * 
   * REGLAS:
   * - Todos los usuarios autenticados con auditorias:actas_download
   * - Admin/Gerencia siempre pueden
   */
  const canDownloadActa = (role) => {
    if (role === 'admin' || role === 'gerencia') {
      return true;
    }
    
    return hasPermission('auditorias:actas_download');
  };

  /**
   * Valida si el usuario puede VER detalles del acta
   * 
   * REGLAS:
   * - Admin/Gerencia: Ven todas las actas
   * - Usuario con auditorias:actas_view_all: Ve todas las actas
   * - Usuario con auditorias:actas_view: Ve actas aprobadas + sus propias actas
   * - Creador: Siempre ve sus propias actas
   */
  const canViewActa = (acta, userId, role) => {
    if (!acta) return false;
    
    // Admin y Gerencia pueden ver todas
    if (role === 'admin' || role === 'gerencia') {
      return true;
    }
    
    // Usuario con view_all puede ver todas
    if (hasPermission('auditorias:actas_view_all')) {
      return true;
    }
    
    // Creador puede ver sus propias actas
    if (acta.created_by === userId) {
      return true;
    }
    
    // Usuario con view puede ver actas aprobadas
    if (hasPermission('auditorias:actas_view') && acta.status === 'approved') {
      return true;
    }
    
    return false;
  };

  /**
   * Valida si el usuario puede APROBAR actas
   * 
   * REGLAS:
   * - Admin/Gerencia: Siempre pueden aprobar
   * - Usuario con auditorias:actas_approve: Puede aprobar
   */
  const canApproveActa = (role) => {
    if (role === 'admin' || role === 'gerencia') {
      return true;
    }
    
    return hasPermission('auditorias:actas_approve');
  };

  return {
    canEditActa,
    canArchiveActa,
    canDeleteActa,
    canDownloadActa,
    canViewActa,
    canApproveActa,
    user,
    profile,
    role: profile?.role,
    userId: user?.id
  };
};