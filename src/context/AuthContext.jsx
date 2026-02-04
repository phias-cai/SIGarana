// src/context/AuthContext.jsx - OPTIMIZADO PARA ADMIN
// ✅ Detecta admin ANTES de cargar permisos
// ✅ Evita cargar 45 permisos innecesariamente

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // 🔧 UTILIDAD: Promise con timeout
  // ==========================================
  const withTimeout = (promise, timeoutMs = 20000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
      ),
    ]);
  };

  // ==========================================
  // 🔍 FETCH FUNCTIONS - OPTIMIZADAS
  // ==========================================

  /**
   * Obtener perfil del usuario
   * ✅ Query simple sin JOIN
   */
  const fetchUserProfile = async (userId) => {
    try {
      console.log('🔄 fetchUserProfile for:', userId);

      const { data: profileData, error } = await withTimeout(
        supabase
          .from('profile')
          .select('id, email, full_name, username, role, department_id, is_active, avatar_url, phone')
          .eq('id', userId)
          .single(),
        20000
      );

      if (error) {
        console.error('❌ Error in profile query:', error);
        throw error;
      }

      console.log('✅ Profile loaded:', profileData);

      // Si tiene department_id, cargarlo por separado (opcional)
      if (profileData?.department_id) {
        try {
          const { data: deptData } = await withTimeout(
            supabase
              .from('department')
              .select('id, name, code')
              .eq('id', profileData.department_id)
              .single(),
            10000
          );

          if (deptData) {
            profileData.department = deptData;
            console.log('✅ Department loaded:', deptData.name);
          }
        } catch (deptError) {
          console.warn('⚠️ Could not load department:', deptError.message);
        }
      }

      return profileData;
    } catch (error) {
      console.error('❌ Error fetching profile:', error.message);
      return null;
    }
  };

  /**
   * Obtener permisos del usuario
   * ✅ OPTIMIZACIÓN: Si es admin, no hace query
   */
  const fetchUserPermissions = async (userId, userRole) => {
    try {
      console.log('🔄 fetchUserPermissions for:', userId);

      // ⚡ OPTIMIZACIÓN: Si es admin o gerencia, retornar wildcard
      if (userRole === 'admin' || userRole === 'gerencia') {
        console.log('✨ User is', userRole, '- returning wildcard permissions');
        return ['*:*:*'];
      }

      // Paso 1: Obtener IDs de permisos
      const { data: userPerms, error: userPermsError } = await withTimeout(
        supabase
          .from('user_permission')
          .select('permission_id')
          .eq('user_id', userId)
          .eq('is_active', true),
        20000
      );

      if (userPermsError) {
        console.error('❌ Error in user_permission query:', userPermsError);
        throw userPermsError;
      }

      if (!userPerms || userPerms.length === 0) {
        console.log('ℹ️ No permissions found for user');
        return [];
      }

      const permissionIds = userPerms.map(p => p.permission_id).filter(Boolean);
      console.log(`✅ Found ${permissionIds.length} permission IDs`);

      // Paso 2: Obtener códigos de permisos
      const { data: permissions, error: permsError } = await withTimeout(
        supabase
          .from('permission')
          .select('code')
          .in('id', permissionIds),
        15000
      );

      if (permsError) {
        console.error('❌ Error in permission query:', permsError);
        throw permsError;
      }

      const permissionCodes = permissions?.map(p => p.code).filter(Boolean) || [];
      console.log('✅ Permissions loaded:', permissionCodes.length, 'total');
      
      return permissionCodes;
    } catch (error) {
      console.error('❌ Error fetching permissions:', error.message);
      return [];
    }
  };

  /**
   * Cargar datos del usuario
   * ✅ Carga perfil primero, luego permisos (para detectar admin)
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
      // 1. Cargar perfil primero
      const userProfile = await fetchUserProfile(authUser.id);

      // 2. Cargar permisos (optimizado para admin)
      const userPermissions = await fetchUserPermissions(authUser.id, userProfile?.role);

      // Si el perfil falló, usar datos mínimos
      const finalProfile = userProfile || {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.email.split('@')[0],
        role: 'usuario',
        is_active: true
      };

      setUser(authUser);
      setProfile(finalProfile);
      setPermissions(userPermissions || []);

      console.log('✅ User data loaded successfully');
      console.log('   Profile:', finalProfile?.full_name, '| Role:', finalProfile?.role);
      console.log('   Permissions:', userPermissions?.length || 0, 'total');
    } catch (error) {
      console.error('❌ Unexpected error in loadUserData:', error);
      
      setUser(authUser);
      setProfile({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.email.split('@')[0],
        role: 'usuario',
        is_active: true
      });
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
      return { success: true, data, error: null };
    } catch (error) {
      console.error('❌ Login error:', error);
      setLoading(false);
      return { success: false, data: null, error: error.message };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      setLoading(true);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setProfile(null);
      setPermissions([]);

      console.log('✅ Logged out');
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 🎯 HELPER FUNCTIONS
  // ==========================================

  const isAdmin = profile?.role === 'admin';
  const isGerencia = profile?.role === 'gerencia';

  const hasPermission = (permissionCode) => {
    if (isAdmin || isGerencia) return true;
    return permissions.includes(permissionCode);
  };

  const hasAnyPermission = (permissionCodes) => {
    if (isAdmin || isGerencia) return true;
    return permissionCodes.some((code) => permissions.includes(code));
  };

  // ==========================================
  // 🔄 EFECTOS
  // ==========================================

  useEffect(() => {
    console.log('🚀 AuthContext: Initializing...');

    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('❌ Error getting initial session:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('✅ Initial session found:', session.user.email);
          await loadUserData(session.user);
        } else {
          console.log('ℹ️ No initial session');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error initializing:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    // Listener de cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔔 Auth event:', event, session?.user?.email || 'no user');

      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserData(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setPermissions([]);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Token refreshed');
        // Solo recargar si cambió el usuario
        if (user?.id !== session.user.id) {
          await loadUserData(session.user);
        }
      } else if (session?.user) {
        await loadUserData(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setPermissions([]);
        setLoading(false);
      }
    });

    // Timeout de seguridad
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ Loading timeout - forcing loading = false');
        setLoading(false);
      }
    }, 25000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
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
};