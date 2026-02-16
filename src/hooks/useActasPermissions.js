// src/hooks/useActasPermissions.js
// Hook ESPECÍFICO para validar permisos en módulo Actas

import { useAuth } from '@/context/AuthContext';

export const useActasPermissions = () => {
  const { user, profile } = useAuth();

  /**
   * Valida si el usuario puede EDITAR un acta
   * 
   * REGLAS:
   * - Creador: Puede editar solo sus actas en estado 'draft'
   * - Admin/Gerencia: Puede editar cualquier acta que NO esté 'archived'
   * - Otros usuarios: NO pueden editar
   */
  const canEditActa = (acta, userId, role) => {
    if (!acta || !userId) return false;
    
    // Actas archivadas NO se pueden editar
    if (acta.status === 'archived') return false;
    
    // Admin y Gerencia pueden editar cualquier acta no archivada
    if (role === 'admin' || role === 'gerencia') {
      return true;
    }
    
    // Creador puede editar solo si está en draft
    if (acta.created_by === userId && acta.status === 'draft') {
      return true;
    }
    
    return false;
  };

  /**
   * Valida si el usuario puede ARCHIVAR actas
   * Solo Admin y Gerencia
   */
  const canArchiveActa = (role) => {
    return role === 'admin' || role === 'gerencia';
  };

  /**
   * Valida si el usuario puede ELIMINAR actas permanentemente
   * Solo Admin
   */
  const canDeleteActa = (role) => {
    return role === 'admin';
  };

  /**
   * Valida si el usuario puede DESCARGAR actas
   * Todos los usuarios autenticados
   */
  const canDownloadActa = () => {
    return !!user;
  };

  /**
   * Valida si el usuario puede VER detalles del acta
   */
  const canViewActa = (acta, userId, role) => {
    if (!acta) return false;
    
    // Admin y Gerencia pueden ver todas
    if (role === 'admin' || role === 'gerencia') {
      return true;
    }
    
    // Todos pueden ver actas aprobadas
    if (acta.status === 'approved') {
      return true;
    }
    
    // Creador puede ver sus propias actas
    if (acta.created_by === userId) {
      return true;
    }
    
    return false;
  };

  /**
   * Valida si el usuario puede APROBAR actas
   * Solo Gerencia y Admin
   */
  const canApproveActa = (role) => {
    return role === 'admin' || role === 'gerencia';
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