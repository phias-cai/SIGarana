// src/context/AuthContext.jsx - VERSIÓN DEFINITIVA
// ✅ FIX DEFINITIVO: NO recargar datos en SIGNED_IN si ya tenemos datos
// ✅ Ignora hot reload de Vite
// ✅ Solo recarga si realmente cambió el usuario

import { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  
  const loadingUserRef = useRef(false);
  const currentUserIdRef = useRef(null);
  const initializedRef = useRef(false);
  const dataLoadedRef = useRef(false);

  // ==========================================
  // 🚀 CARGAR DATOS (QUERIES DIRECTAS)
  // ==========================================

  const loadUserData = async (authUser) => {
    if (loadingUserRef.current && currentUserIdRef.current === authUser?.id) {
      console.log('⏭️ Already loading for this user, skipping...');
      return;
    }

    console.log('🔄 loadUserData for:', authUser?.email);

    if (!authUser) {
      loadingUserRef.current = false;
      currentUserIdRef.current = null;
      dataLoadedRef.current = false;
      setUser(null);
      setProfile(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      loadingUserRef.current = true;
      currentUserIdRef.current = authUser.id;

      const startTime = Date.now();

      // Helper: Query con timeout
      const queryWithTimeout = (promise, timeoutMs = 10000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Query timeout (${timeoutMs}ms)`)), timeoutMs)
          )
        ]);
      };

      // ⚡ Query 1: Perfil SIN departamento (más rápido)
      console.log('📡 Loading profile...');
      const { data: profileData, error: profileError } = await queryWithTimeout(
        supabase
          .from('profile')
          .select('id, email, full_name, username, role, department_id, is_active, avatar_url, phone')
          .eq('id', authUser.id)
          .single(),
        10000
      );

      if (profileError) throw profileError;

      console.log('✅ Profile loaded');

      // Cargar departamento aparte (si tiene)
      if (profileData?.department_id) {
        console.log('📡 Loading department...');
        const { data: deptData } = await queryWithTimeout(
          supabase
            .from('department')
            .select('id, name, code')
            .eq('id', profileData.department_id)
            .single(),
          5000
        );
        
        if (deptData) {
          profileData.department = deptData;
          console.log('✅ Department loaded');
        }
      }

      // ⚡ Query 2: Permisos (optimizada con timeout)
      console.log('📡 Loading permissions...');
      const { data: userPerms, error: permsError } = await queryWithTimeout(
        supabase
          .from('user_permission')
          .select('permission_id')
          .eq('user_id', authUser.id)
          .eq('is_active', true),
        10000
      );

      if (permsError) throw permsError;

      let permissionCodes = [];

      if (userPerms && userPerms.length > 0) {
        const permIds = userPerms.map(p => p.permission_id);
        
        const { data: perms, error: codesError } = await queryWithTimeout(
          supabase
            .from('permission')
            .select('code')
            .in('id', permIds),
          10000
        );

        if (codesError) throw codesError;
        
        permissionCodes = perms?.map(p => p.code) || [];
      }

      console.log('✅ Permissions loaded:', permissionCodes.length);

      const elapsed = Date.now() - startTime;
      console.log(`✅ All data loaded in ${elapsed}ms`);

      // Preparar datos finales
      const finalProfile = profileData || {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.email.split('@')[0],
        role: 'usuario',
        is_active: true
      };

      setUser(authUser);
      setProfile(finalProfile);
      setPermissions(permissionCodes);
      dataLoadedRef.current = true;

      console.log('✅ User data loaded successfully');
      console.log('   Profile:', finalProfile?.full_name, '| Role:', finalProfile?.role);
      console.log('   Permissions:', permissionCodes?.length);

    } catch (error) {
      console.error('❌ Error in loadUserData:', error);
      
      // Fallback
      setUser(authUser);
      setProfile({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.email.split('@')[0],
        role: 'usuario',
        is_active: true
      });
      setPermissions([]);
      dataLoadedRef.current = true;
    } finally {
      loadingUserRef.current = false;
      setLoading(false);
    }
  };

  // ==========================================
  // 🔐 AUTENTICACIÓN
  // ==========================================

  const login = async (email, password) => {
    try {
      console.log('🔑 Login for:', email);
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

      loadingUserRef.current = false;
      currentUserIdRef.current = null;
      initializedRef.current = false;
      dataLoadedRef.current = false;

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
          console.error('❌ Error getting session:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('✅ Initial session found:', session.user.email);
          await loadUserData(session.user);
          initializedRef.current = true;
        } else {
          console.log('ℹ️ No initial session');
          setLoading(false);
          initializedRef.current = true;
        }
      } catch (error) {
        console.error('❌ Initialize error:', error);
        if (mounted) {
          setLoading(false);
          initializedRef.current = true;
        }
      }
    };

    initialize();

    // Listener solo para eventos NUEVOS
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔔 Auth event:', event, '| Initialized:', initializedRef.current, '| DataLoaded:', dataLoadedRef.current);

      // Ignorar INITIAL_SESSION (ya lo maneja initialize)
      if (event === 'INITIAL_SESSION') {
        console.log('⏭️ Skipping INITIAL_SESSION');
        return;
      }

      // Ignorar SIGNED_IN si aún no hemos terminado de inicializar
      if (event === 'SIGNED_IN' && !initializedRef.current) {
        console.log('⏭️ Skipping SIGNED_IN (still initializing)');
        return;
      }

      // ✅ FIX DEFINITIVO: Si ya tenemos datos cargados, NUNCA recargar en SIGNED_IN
      if (event === 'SIGNED_IN' && session?.user) {
        // Verificar si ya tenemos datos cargados (sin importar el ID)
        if (dataLoadedRef.current && currentUserIdRef.current) {
          console.log('✅ SIGNED_IN - data already loaded, ignoring (Hot Reload?)');
          // NO hacer nada, mantener datos actuales
          return;
        }
        
        // Solo cargar si NO hay datos
        if (!loadingUserRef.current) {
          console.log('✅ SIGNED_IN - loading user data (first time)');
          await loadUserData(session.user);
        } else {
          console.log('⏭️ SIGNED_IN - already loading, skipping');
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('✅ SIGNED_OUT - clearing data');
        loadingUserRef.current = false;
        currentUserIdRef.current = null;
        initializedRef.current = false;
        dataLoadedRef.current = false;
        setUser(null);
        setProfile(null);
        setPermissions([]);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('✅ TOKEN_REFRESHED - keeping session');
        // NO recargar datos, solo mantener sesión activa
      }
    });

    // ✅ Timeout mejorado: Solo fuerza loading=false, NO borra datos
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        if (dataLoadedRef.current) {
          console.log('⚠️ Timeout - but data is loaded, just forcing loading=false');
          setLoading(false);
        } else if (!loadingUserRef.current) {
          console.warn('⚠️ Timeout - no data loaded and not loading, forcing false');
          setLoading(false);
        }
      }
    }, 15000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []); // Sin dependencias para evitar re-renders

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