import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, ROLES } from '@/lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // 🔄 FUNCIONES AUXILIARES (REALES - SUPABASE)
  // ==========================================

  /**
   * Obtener perfil REAL desde Supabase
   */
  const fetchUserProfile = async (userId) => {
    console.log('🔍 [REAL] Loading profile for user ID:', userId);

    try {
      const { data, error } = await supabase
        .from('profile')
        .select(`
          *,
          department:department_id (
            id,
            name,
            code
          )
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      console.log('✅ [REAL] Profile loaded:', data);
      return data;
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      return null;
    }
  };

  /**
   * Obtener permisos REALES desde Supabase
   */
  const fetchUserPermissions = async (userId) => {
    console.log('🔍 [REAL] Loading permissions for user ID:', userId);

    try {
      // Usar la función RPC que ya existe
      const { data, error } = await supabase.rpc('get_user_permissions', {
        user_id: userId
      });

      if (error) throw error;

      console.log('✅ [REAL] Permissions loaded:', data);
      return data || [];
    } catch (error) {
      console.error('❌ Error loading permissions:', error);
      return [];
    }
  };

  /**
   * Cargar datos del usuario
   */
  const loadUserData = async (authUser) => {
    console.log('🔄 loadUserData for:', authUser?.email);

    if (!authUser) {
      setUser(null);
      setProfile(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      const userProfile = await fetchUserProfile(authUser.id);
      const userPermissions = await fetchUserPermissions(authUser.id);

      setUser(authUser);
      setProfile(userProfile);
      setPermissions(userPermissions);
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      setUser(authUser);
      setProfile(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 🔐 AUTENTICACIÓN
  // ==========================================

  const login = async (email, password) => {
    try {
      console.log('🔐 Login for:', email);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('✅ Login successful');
      return { data, error: null };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      setPermissions([]);
      console.log('✅ Logged out');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  // ==========================================
  // 🎯 HELPER FUNCTIONS
  // ==========================================

  const isAdmin = profile?.role === 'admin';
  const isGerencia = profile?.role === 'gerencia';

  const hasPermission = (permissionCode) => {
    // Admin tiene acceso a todo
    if (isAdmin) return true;
    
    // Verificar si tiene el permiso específico
    return permissions.includes(permissionCode);
  };

  const hasAnyPermission = (permissionCodes) => {
    if (isAdmin) return true;
    return permissionCodes.some(code => permissions.includes(code));
  };

  // ==========================================
  // 🔄 EFECTOS
  // ==========================================

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth event:', event);
      
      if (session?.user) {
        await loadUserData(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setPermissions([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ==========================================
  // 📤 PROVIDER VALUE
  // ==========================================

  const value = {
    user,
    profile,
    permissions,
    loading,
    login,
    logout,
    isAdmin,
    isGerencia,
    hasPermission,
    hasAnyPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}