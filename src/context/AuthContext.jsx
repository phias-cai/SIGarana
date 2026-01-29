// src/context/AuthContext.jsx - VERSIÓN OPTIMIZADA SIN JOINS
// ✅ Queries simples y rápidas sin JOINs
// ✅ Timeouts más largos (15 segundos)
// ✅ Carga en paralelo

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
  const withTimeout = (promise, timeoutMs = 15000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
      ),
    ]);
  };

  // ==========================================
  // 🔍 FETCH FUNCTIONS - SIN JOINS
  // ==========================================

  /**
   * Obtener perfil del usuario (SIN JOIN)
   * ✅ Query más simple y rápida
   */
  const fetchUserProfile = async (userId) => {
    try {
      console.log('🔄 fetchUserProfile for:', userId);

      // Query simple sin JOIN
      const { data: profileData, error } = await withTimeout(
        supabase
          .from('profile')
          .select('*')
          .eq('id', userId)
          .single(),
        15000
      );

      if (error) throw error;

      console.log('✅ Profile loaded:', profileData);

      // Si tiene department_id, cargarlo por separado
      if (profileData.department_id) {
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
          // No es crítico, continuar sin departamento
        }
      }

      return profileData;
    } catch (error) {
      console.error('❌ Error fetching profile:', error.message);
      return null;
    }
  };

  /**
   * Obtener permisos del usuario (SIN JOIN)
   * ✅ Carga en 2 pasos: IDs primero, luego códigos
   */
  const fetchUserPermissions = async (userId) => {
    try {
      console.log('🔄 fetchUserPermissions for:', userId);

      // Paso 1: Obtener IDs de permisos (query simple)
      const { data: userPerms, error: userPermsError } = await withTimeout(
        supabase
          .from('user_permission')
          .select('permission_id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .or('expires_at.is.null,expires_at.gt.now()'),
        15000
      );

      if (userPermsError) throw userPermsError;

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
        10000
      );

      if (permsError) throw permsError;

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
   * ✅ SIEMPRE resuelve el loading
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
      // Cargar perfil y permisos en paralelo
      const [userProfile, userPermissions] = await Promise.all([
        fetchUserProfile(authUser.id),
        fetchUserPermissions(authUser.id),
      ]);

      setUser(authUser);
      setProfile(userProfile);
      setPermissions(userPermissions);

      console.log('✅ User data loaded successfully');
      console.log('   Profile:', userProfile?.full_name, '| Role:', userProfile?.role);
      console.log('   Permissions:', userPermissions.length, 'total');
    } catch (error) {
      console.error('❌ Unexpected error in loadUserData:', error);
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
      setLoading(false);
      return { data: null, error };
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
    if (isAdmin) return true;
    return permissions.includes(permissionCode);
  };

  const hasAnyPermission = (permissionCodes) => {
    if (isAdmin) return true;
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

    // Timeout de seguridad (20 segundos)
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ Loading timeout - forcing loading = false');
        setLoading(false);
      }
    }, 20000);

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