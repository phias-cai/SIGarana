// src/app/components/users/CreateUserForm.jsx
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useDepartments } from '@/hooks/useDepartments';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2, UserPlus, CheckCircle } from 'lucide-react';

/**
 * Formulario para crear nuevos usuarios
 * SOLUCIÓN DEFINITIVA: signUp + re-login automático del admin
 */
export function CreateUserForm({ onSuccess, onCancel }) {
  const { departments } = useDepartments();
  const { user: currentAdmin } = useAuth(); // Admin actual
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    username: '',
    role: 'usuario',
    department_id: '',
    phone: ''
  });

  // Validaciones
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Email
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }

    // Confirm Password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Nombre completo
    if (!formData.full_name || formData.full_name.trim().length < 3) {
      newErrors.full_name = 'El nombre completo es requerido (mínimo 3 caracteres)';
    }

    // Username
    if (!formData.username || formData.username.trim().length < 3) {
      newErrors.username = 'El nombre de usuario es requerido (mínimo 3 caracteres)';
    } else if (!/^[a-z0-9._-]+$/.test(formData.username)) {
      newErrors.username = 'Solo letras minúsculas, números, puntos, guiones';
    }

    // Departamento
    if (!formData.department_id) {
      newErrors.department_id = 'Selecciona un departamento';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo al escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Pedir la contraseña del admin para re-login
    setShowPasswordPrompt(true);
  };

  const handleCreateWithPassword = async () => {
    if (!adminPassword) {
      setError('Por favor ingresa tu contraseña de administrador');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('🔄 Creando usuario...', formData.email);
      const adminEmail = currentAdmin?.email;

      // Paso 1: Verificar que el username esté disponible
      const { data: isAvailable, error: checkError } = await supabase
        .rpc('is_username_available', {
          p_username: formData.username.trim().toLowerCase()
        });

      if (checkError) {
        console.error('❌ Error verificando username:', checkError);
        throw checkError;
      }

      if (!isAvailable) {
        setErrors({ username: 'Este nombre de usuario ya está en uso' });
        setLoading(false);
        return;
      }

      console.log('✅ Username disponible');

      // Paso 2: Crear usuario (esto AUTO-LOGUEA al nuevo usuario)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name.trim()
          }
        }
      });

      if (authError) {
        console.error('❌ Error creando usuario:', authError);
        throw authError;
      }

      const newUserId = authData.user.id;
      console.log('✅ Usuario creado en Auth:', newUserId);

      // Paso 3: Actualizar perfil
      const { error: updateError } = await supabase
        .from('profile')
        .update({
          full_name: formData.full_name.trim(),
          username: formData.username.trim().toLowerCase(),
          role: formData.role,
          department_id: formData.department_id,
          phone: formData.phone.trim() || null
        })
        .eq('id', newUserId);

      if (updateError) {
        console.error('❌ Error actualizando perfil:', updateError);
        throw updateError;
      }

      console.log('✅ Perfil actualizado');

      // Paso 4: IMPORTANTE - Re-loguear al admin inmediatamente
      console.log('🔐 Re-logueando admin...', adminEmail);
      
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword
      });

      if (loginError) {
        console.error('❌ Error re-logueando admin:', loginError);
        // No lanzar error, solo avisar
        setError('Usuario creado pero hubo un problema re-iniciando tu sesión. Por favor inicia sesión manualmente.');
      } else {
        console.log('✅ Admin re-logueado exitosamente');
      }

      // Éxito
      setSuccess(true);
      setShowPasswordPrompt(false);
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess({
            user_id: newUserId,
            email: formData.email,
            full_name: formData.full_name,
            username: formData.username
          });
        }
      }, 1500);

    } catch (err) {
      console.error('❌ Error en handleSubmit:', err);
      
      if (err.message?.includes('email') || err.code === '23505') {
        setErrors({ email: 'Este email ya está registrado' });
      } else if (err.message?.includes('username')) {
        setErrors({ username: 'Este nombre de usuario ya existe' });
      } else if (err.message?.includes('User already registered')) {
        setErrors({ email: 'Este email ya está registrado' });
      } else {
        setError(err.message || 'Error al crear el usuario');
      }
    } finally {
      setLoading(false);
    }
  };

  // Si fue exitoso, mostrar mensaje de éxito
  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 mx-auto mb-4" style={{ color: '#6dbd96' }} />
        <h3 className="text-lg font-medium mb-2" style={{ color: '#2e5244' }}>
          ¡Usuario creado exitosamente!
        </h3>
        <p className="text-sm text-gray-600">
          El usuario {formData.full_name} ha sido agregado al sistema.
        </p>
        <p className="text-xs font-medium mt-2" style={{ color: '#2e5244' }}>
          ✅ Tu sesión permanece activa
        </p>
      </div>
    );
  }

  // Prompt de contraseña del admin
  if (showPasswordPrompt) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium mb-2" style={{ color: '#2e5244' }}>
            Confirma tu contraseña
          </h3>
          <p className="text-sm text-gray-600">
            Para crear el usuario y mantener tu sesión activa, necesitamos tu contraseña de administrador.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div>
          <Label htmlFor="admin_password">
            Tu contraseña de administrador
          </Label>
          <Input
            id="admin_password"
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
            disabled={loading}
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleCreateWithPassword();
              }
            }}
          />
          <p className="text-xs text-gray-500 mt-1">
            Email: {currentAdmin?.email}
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowPasswordPrompt(false);
              setAdminPassword('');
              setError(null);
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateWithPassword}
            disabled={loading || !adminPassword}
            style={{ backgroundColor: '#2e5244' }}
            className="text-white hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Usuario
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Formulario principal
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Información Básica */}
      <div className="space-y-4">
        <h3 className="font-medium" style={{ color: '#2e5244' }}>
          Información Básica
        </h3>

        {/* Email */}
        <div>
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="usuario@garana.com"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Nombre Completo */}
        <div>
          <Label htmlFor="full_name">
            Nombre Completo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="full_name"
            type="text"
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            placeholder="Juan Pérez"
            className={errors.full_name ? 'border-red-500' : ''}
          />
          {errors.full_name && (
            <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>
          )}
        </div>

        {/* Username */}
        <div>
          <Label htmlFor="username">
            Nombre de Usuario <span className="text-red-500">*</span>
          </Label>
          <Input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value.toLowerCase())}
            placeholder="juan.perez"
            className={errors.username ? 'border-red-500' : ''}
          />
          <p className="text-xs text-gray-500 mt-1">
            Solo letras minúsculas, números, puntos y guiones
          </p>
          {errors.username && (
            <p className="text-xs text-red-500 mt-1">{errors.username}</p>
          )}
        </div>

        {/* Contraseña */}
        <div>
          <Label htmlFor="password">
            Contraseña <span className="text-red-500">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className={errors.password ? 'border-red-500' : ''}
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password}</p>
          )}
        </div>

        {/* Confirmar Contraseña */}
        <div>
          <Label htmlFor="confirmPassword">
            Confirmar Contraseña <span className="text-red-500">*</span>
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            placeholder="Repite la contraseña"
            className={errors.confirmPassword ? 'border-red-500' : ''}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      {/* Información de Trabajo */}
      <div className="space-y-4">
        <h3 className="font-medium" style={{ color: '#2e5244' }}>
          Información de Trabajo
        </h3>

        {/* Rol */}
        <div>
          <Label htmlFor="role">
            Rol <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={formData.role} 
            onValueChange={(value) => handleChange('role', value)}
          >
            <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecciona un rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usuario">Usuario</SelectItem>
              <SelectItem value="gerencia">Gerencia</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-xs text-red-500 mt-1">{errors.role}</p>
          )}
        </div>

        {/* Departamento */}
        <div>
          <Label htmlFor="department">
            Departamento <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={formData.department_id} 
            onValueChange={(value) => handleChange('department_id', value)}
          >
            <SelectTrigger className={errors.department_id ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecciona un departamento" />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.department_id && (
            <p className="text-xs text-red-500 mt-1">{errors.department_id}</p>
          )}
        </div>

        {/* Teléfono (Opcional) */}
        <div>
          <Label htmlFor="phone">Teléfono (Opcional)</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+57 300 123 4567"
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          style={{ backgroundColor: '#2e5244' }}
          className="text-white hover:opacity-90"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Continuar
        </Button>
      </div>
    </form>
  );
}