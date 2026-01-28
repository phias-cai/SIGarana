// src/components/users/UserPermissionsManager.jsx
import { useState } from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAvailablePermissions } from '@/hooks/useAvailablePermissions';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Shield, Check, X } from 'lucide-react';

/**
 * Componente para gestionar permisos de un usuario
 * @param {string} userId - ID del usuario
 * @param {string} userName - Nombre del usuario
 * @param {function} onSuccess - Callback al asignar/revocar permisos exitosamente
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
        <h3 className="text-lg mb-2" style={{ color: '#2e5244' }}>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg" style={{ color: '#2e5244' }}>
            Permisos de {userName}
          </h3>
          <p className="text-sm text-gray-600">
            {permissionCodes.length} permisos activos
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(permissionsByModule)
          .sort((a, b) => {
            const orderA = a[1].module?.display_order || 999;
            const orderB = b[1].module?.display_order || 999;
            return orderA - orderB;
          })
          .map(([moduleCode, { module, permissions }]) => (
            <Card key={moduleCode} className="border-2" style={{ borderColor: '#dedecc' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base" style={{ color: '#2e5244' }}>
                  {module?.name || moduleCode}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permissions.map(perm => {
                    const hasPermission = permissionCodes.includes(perm.code);
                    
                    return (
                      <div 
                        key={perm.id} 
                        className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={hasPermission}
                          onCheckedChange={() => handleTogglePermission(perm.code, hasPermission)}
                          disabled={saving}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <label className="text-sm cursor-pointer" style={{ color: '#2e5244' }}>
                              {perm.name}
                            </label>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ 
                                borderColor: hasPermission ? '#6dbd96' : '#dedecc',
                                color: hasPermission ? '#2e5244' : '#6f7b2c'
                              }}
                            >
                              {perm.action}
                            </Badge>
                          </div>
                          {perm.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {perm.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}