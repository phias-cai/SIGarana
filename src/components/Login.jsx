import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { THEME_COLORS } from '@/lib/supabase';

export default function Login() {
  // ==========================================
  // 📊 ESTADO
  // ==========================================
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  // ==========================================
  // 🎯 HANDLERS
  // ==========================================

  /**
   * Manejar submit del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (!result.success) {
        setError(result.error);
      }
      // Si success = true, el AuthContext redirigirá automáticamente
    } catch (err) {
      setError('Error inesperado al iniciar sesión');
      console.error('Error en login:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Autocompletar credenciales de prueba
   */
  const fillDemoCredentials = (role) => {
    if (role === 'admin') {
      setEmail('admin@garana.com');
      setPassword('admin123');
    } else if (role === 'gerencia') {
      setEmail('gerencia@garana.com');
      setPassword('gerencia123');
    } else if (role === 'usuario') {
      setEmail('ana.ospina@garana.com');
      setPassword('usuario123');
    }
    setError('');
  };

  // ==========================================
  // 🎨 RENDER
  // ==========================================

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4" 
      style={{ backgroundColor: THEME_COLORS.background }}
    >
      <div className="w-full max-w-md space-y-8">
        {/* ============================================ */}
        {/* Logo and Title */}
        {/* ============================================ */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: THEME_COLORS.primary }}
            >
              <span 
                className="font-bold text-white" 
                style={{ fontSize: '32px' }}
              >
                SIG
              </span>
            </div>
          </div>
          <h1 
            className="text-3xl font-bold" 
            style={{ color: THEME_COLORS.primary }}
          >
            SIGarana
          </h1>
          <p 
            className="text-sm" 
            style={{ color: THEME_COLORS.accent }}
          >
            Sistema Integrado de Gestión
          </p>
        </div>

        {/* ============================================ */}
        {/* Login Card */}
        {/* ============================================ */}
        <Card 
          className="border-2" 
          style={{ borderColor: THEME_COLORS.secondary }}
        >
          <CardHeader>
            <CardTitle style={{ color: THEME_COLORS.primary }}>
              Iniciar Sesión
            </CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ============================================ */}
              {/* Error Alert */}
              {/* ============================================ */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* ============================================ */}
              {/* Email Field */}
              {/* ============================================ */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail 
                    className="absolute left-3 top-3 h-4 w-4" 
                    style={{ color: THEME_COLORS.accent }} 
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@garana.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* ============================================ */}
              {/* Password Field */}
              {/* ============================================ */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock 
                    className="absolute left-3 top-3 h-4 w-4" 
                    style={{ color: THEME_COLORS.accent }} 
                  />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* ============================================ */}
              {/* Submit Button */}
              {/* ============================================ */}
              <Button 
                type="submit" 
                className="w-full text-white"
                style={{ backgroundColor: THEME_COLORS.primary }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </Button>

              {/* ============================================ */}
              {/* Demo Credentials */}
              {/* ============================================ */}
              <div 
                className="mt-6 p-4 rounded-lg" 
                style={{ backgroundColor: THEME_COLORS.background }}
              >
                <p 
                  className="text-xs font-medium mb-3" 
                  style={{ color: THEME_COLORS.primary }}
                >
                  Credenciales de prueba:
                </p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('admin')}
                    className="w-full text-left px-3 py-2 rounded border hover:bg-white/50 transition-colors"
                    style={{ borderColor: THEME_COLORS.secondary }}
                    disabled={isLoading}
                  >
                    <p className="text-xs font-medium" style={{ color: THEME_COLORS.primary }}>
                      👑 Administrador
                    </p>
                    <p className="text-xs" style={{ color: THEME_COLORS.accent }}>
                      admin@garana.com / admin123
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('gerencia')}
                    className="w-full text-left px-3 py-2 rounded border hover:bg-white/50 transition-colors"
                    style={{ borderColor: THEME_COLORS.secondary }}
                    disabled={isLoading}
                  >
                    <p className="text-xs font-medium" style={{ color: THEME_COLORS.primary }}>
                      💼 Gerencia
                    </p>
                    <p className="text-xs" style={{ color: THEME_COLORS.accent }}>
                      gerencia@garana.com / gerencia123
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('usuario')}
                    className="w-full text-left px-3 py-2 rounded border hover:bg-white/50 transition-colors"
                    style={{ borderColor: THEME_COLORS.secondary }}
                    disabled={isLoading}
                  >
                    <p className="text-xs font-medium" style={{ color: THEME_COLORS.primary }}>
                      👤 Usuario SST
                    </p>
                    <p className="text-xs" style={{ color: THEME_COLORS.accent }}>
                      ana.ospina@garana.com / usuario123
                    </p>
                  </button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ============================================ */}
        {/* Footer */}
        {/* ============================================ */}
        <div 
          className="text-center text-xs" 
          style={{ color: THEME_COLORS.accent }}
        >
          <p>© 2026 Garana Art - Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
}