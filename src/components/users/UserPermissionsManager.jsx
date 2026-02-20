// src/components/users/UserPermissionsManager.jsx
// ✅ VERSIÓN MEJORADA con Accordion jerárquico y estructura escalable

import { useState } from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAvailablePermissions } from '@/hooks/useAvailablePermissions';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { Shield, ChevronRight, Check } from 'lucide-react';

/**
 * Componente para gestionar permisos de un usuario con estructura jerárquica
 */
export function UserPermissionsManager({ userId, userName, userRole, onSuccess }) {
  const [saving, setSaving] = useState(false);
  
  const { 
    permissions: userPermissions, 
    permissionCodes,
    loading: loadingUser,
    assignPermissions,
    revokePermissions
  } = useUserPermissions(userId);

  const { 
    permissionsByModule, 
    loading: loadingAvailable 
  } = useAvailablePermissions();

  /**
   * Organiza permisos en estructura jerárquica
   * TODOS los permisos van a submódulos
   * Si no tiene ":", va a submódulo "General"
   */
  const organizePermissions = (permissions) => {
    const submodules = {};

    permissions.forEach(perm => {
      // Detectar si tiene submódulo
      const parts = perm.code.split(':');
      
      if (parts.length > 2) {
        // Tiene submódulo: modulo:submodulo:accion
        const submoduleName = parts[1];
        
        if (!submodules[submoduleName]) {
          submodules[submoduleName] = [];
        }
        submodules[submoduleName].push(perm);
      } else {
        // Sin submódulo específico → va a "general"
        if (!submodules['general']) {
          submodules['general'] = [];
        }
        submodules['general'].push(perm);
      }
    });

    return { submodules };
  };

  /**
   * Obtiene nombre legible del submódulo
   */
  const getSubmoduleName = (code) => {
    const names = {
      // General
      'general': 'General',
      
      // Mejoramiento Continuo
      'actas': 'Actas de Reunión',
      'acciones_mejora': 'Acciones de Mejora',
      'hallazgos': 'Hallazgos',
      'actions': 'Acciones Correctivas',
      'findings': 'Hallazgos',
      
      // Gestión Documental
      'formatos': 'Formatos',
      'procedimientos': 'Procedimientos',
      'guias': 'Guías',
      'instructivos': 'Instructivos',
      
      // Planeación Estratégica
      'indicadores': 'Indicadores',
      'objetivos': 'Objetivos Estratégicos',
      'perspectivas': 'Perspectivas',
      
      // Seguridad y Bienestar
      'comite': 'Comité de Bienestar',
      'epps': 'EPPs',
      'capacitaciones': 'Capacitaciones',
      'examenes': 'Exámenes Médicos',
      
      // Clientes y Ventas
      'orders': 'Pedidos',
      
      // Inventario
      'products': 'Productos',
      'movements': 'Movimientos',
      'stock': 'Control de Stock',
      
      // Usuarios
      'permissions': 'Gestión de Permisos'
    };
    
    return names[code] || code.charAt(0).toUpperCase() + code.slice(1);
  };

  const handleTogglePermission = async (permissionCode, currentlyHas) => {
    setSaving(true);
    try {
      let result;
      if (currentlyHas) {
        result = await revokePermissions([permissionCode]);
      } else {
        result = await assignPermissions([permissionCode]);
      }

      if (result.success && onSuccess) {
        onSuccess();
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingUser || loadingAvailable) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
               style={{ borderColor: '#2e5244' }}></div>
          <p style={{ color: '#6f7b2c' }}>Cargando permisos...</p>
        </div>
      </div>
    );
  }

  // Si es admin, mostrar mensaje especial
  if (userRole === 'admin') {
    return (
      <div className="p-6 text-center">
        <Shield className="h-16 w-16 mx-auto mb-4" style={{ color: '#6f7b2c' }} />
        <h3 className="text-lg font-bold mb-2" style={{ color: '#2e5244' }}>
          Usuario Administrador
        </h3>
        <p className="text-sm text-gray-600">
          Los administradores tienen acceso completo a todos los módulos del sistema.
          No es necesario asignar permisos específicos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="text-base font-bold" style={{ color: '#2e5244' }}>
            Permisos de {userName}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {permissionCodes.length} permisos activos
          </p>
        </div>
        <Badge 
          variant="outline" 
          className="text-sm px-3 py-1"
          style={{ 
            borderColor: '#6dbd96',
            backgroundColor: '#f0f7f4',
            color: '#2e5244'
          }}
        >
          {userRole === 'gerencia' ? 'Gerencia' : 'Usuario'}
        </Badge>
      </div>

      {/* Accordion por Módulo */}
      <Accordion type="multiple" className="space-y-2">
        {Object.entries(permissionsByModule)
          .filter(([moduleCode]) => {
            // Ocultar módulos que aún no se usan
            const hiddenModules = ['clientes_ventas', 'inventario'];
            return !hiddenModules.includes(moduleCode);
          })
          .sort((a, b) => {
            const orderA = a[1].module?.display_order || 999;
            const orderB = b[1].module?.display_order || 999;
            return orderA - orderB;
          })
          .map(([moduleCode, { module, permissions }]) => {
            const organized = organizePermissions(permissions);
            const modulePermCount = permissions.filter(p => 
              permissionCodes.includes(p.code)
            ).length;

            return (
              <AccordionItem 
                key={moduleCode} 
                value={moduleCode}
                className="border-2 rounded-lg"
                style={{ borderColor: '#dedecc' }}
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold" style={{ color: '#2e5244' }}>
                        {module?.name || moduleCode}
                      </span>
                      {modulePermCount > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                          style={{
                            backgroundColor: '#6dbd9620',
                            color: '#2e5244'
                          }}
                        >
                          {modulePermCount} activos
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    
                    {/* SOLO Submódulos - TODO organizado aquí */}
                    {Object.keys(organized.submodules).length > 0 && (
                      <Accordion type="multiple" className="space-y-2">
                        {Object.entries(organized.submodules)
                          .sort((a, b) => {
                            // "general" siempre primero
                            if (a[0] === 'general') return -1;
                            if (b[0] === 'general') return 1;
                            return a[0].localeCompare(b[0]);
                          })
                          .map(([submoduleCode, subPerms]) => {
                            const subPermCount = subPerms.filter(p => 
                              permissionCodes.includes(p.code)
                            ).length;

                            return (
                              <AccordionItem 
                                key={submoduleCode}
                                value={submoduleCode}
                                className="border rounded"
                                style={{ borderColor: '#e5e7eb' }}
                              >
                                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm">
                                  <div className="flex items-center gap-2">
                                    <ChevronRight className="h-4 w-4" />
                                    <span className="font-medium" style={{ color: '#2e5244' }}>
                                      {getSubmoduleName(submoduleCode)}
                                    </span>
                                    {subPermCount > 0 && (
                                      <Badge 
                                        variant="secondary" 
                                        className="text-xs"
                                        style={{
                                          backgroundColor: '#6dbd9620',
                                          color: '#2e5244'
                                        }}
                                      >
                                        {subPermCount}/{subPerms.length}
                                      </Badge>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                
                                <AccordionContent className="px-3 pb-2">
                                  <div className="space-y-1">
                                    {subPerms.map(perm => {
                                      const hasPermission = permissionCodes.includes(perm.code);
                                      
                                      return (
                                        <div 
                                          key={perm.id} 
                                          className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50"
                                        >
                                          <Checkbox
                                            checked={hasPermission}
                                            onCheckedChange={() => handleTogglePermission(perm.code, hasPermission)}
                                            disabled={saving}
                                            className="mt-0.5"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <label className="text-sm cursor-pointer" style={{ color: '#2e5244' }}>
                                              {perm.name}
                                            </label>
                                            {perm.description && (
                                              <p className="text-xs text-gray-500 mt-0.5">
                                                {perm.description}
                                              </p>
                                            )}
                                          </div>
                                          {hasPermission && (
                                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      )}

                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
      </Accordion>
    </div>
  );
}