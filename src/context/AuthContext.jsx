// src/context/AuthContext.jsx
// ✅ VERSIÓN COMPLETA CON FIX DE SESIONES
// ✅ Permisos :view automáticos
// ✅ Sin reloads automáticos
// ✅ Loading no se queda stuck

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({});

// ⭐ EXPORT DE useAuth (estaba faltando)
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
    // 🛡️ GUARD 1: Ya estamos cargando para este usuario
    if (loadingUserRef.current && currentUserIdRef.current === authUser?.id) {
      console.log('⏭️ Already loading for this user, skipping...');
      return;
    }
    
    // 🛡️ GUARD 2: Ya tenemos datos cargados para este usuario
    if (currentUserIdRef.current === authUser?.id && dataLoadedRef.current) {
      console.log('⏭️ Data already loaded for this user, skipping...');
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
      setLoading(false); // ⭐ IMPORTANTE: Poner loading false aquí

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
      setLoading(false); // ⭐ IMPORTANTE: Poner loading false incluso en error
    } finally {
      loadingUserRef.current = false;
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
    // Admin y Gerencia tienen acceso total
    if (isAdmin || isGerencia) return true;
    
    // Permisos :view automáticos para TODOS los usuarios
    if (permissionCode?.endsWith(':view')) {
      return true;
    }
    
    // Verificar permiso asignado en la BD
    return permissions.includes(permissionCode);
  };

  const hasAnyPermission = (permissionCodes) => {
    // Admin y Gerencia tienen acceso total
    if (isAdmin || isGerencia) return true;
    
    // Verificar si tiene al menos uno de los permisos
    return permissionCodes.some((code) => hasPermission(code));
  };

  // ==========================================
  // 🔄 EFECTOS - VERSIÓN MEJORADA SIN RELOADS
  // ==========================================

  useEffect(() => {
    console.log('🚀 AuthContext: Initializing...');

    let mounted = true;
    let initializationComplete = false;

    const initialize = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('❌ Error getting session:', error);
          setLoading(false);
          initializationComplete = true;
          return;
        }

        if (session?.user) {
          console.log('✅ Initial session found:', session.user.email);
          await loadUserData(session.user);
        } else {
          console.log('ℹ️ No initial session');
          setLoading(false);
        }
        
        initializationComplete = true;
        initializedRef.current = true;
      } catch (error) {
        console.error('❌ Initialize error:', error);
        if (mounted) {
          setLoading(false);
          initializationComplete = true;
          initializedRef.current = true;
        }
      }
    };

    initialize();

    // Listener MEJORADO - Maneja SIGNED_OUT y SIGNED_IN
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Durante inicialización, ignorar todos los eventos
      if (!mounted || !initializationComplete) {
        console.log(`⏭️ Skipping ${event} (still initializing)`);
        return;
      }

      console.log('🔔 Auth event:', event);

      // SIGNED_OUT - Limpiar datos
      if (event === 'SIGNED_OUT') {
        console.log('✅ SIGNED_OUT - clearing data');
        loadingUserRef.current = false;
        currentUserIdRef.current = null;
        dataLoadedRef.current = false;
        setUser(null);
        setProfile(null);
        setPermissions([]);
        setLoading(false);
      }
      
      // SIGNED_IN - Cargar datos del nuevo usuario
      if (event === 'SIGNED_IN' && session?.user) {
        // 🛡️ GUARD 1: Ya estamos cargando datos
        if (loadingUserRef.current) {
          console.log('⏭️ Already loading data, skipping SIGNED_IN');
          return;
        }
        
        // 🛡️ GUARD 2: Es el mismo usuario y datos ya cargados
        if (currentUserIdRef.current === session.user.id && dataLoadedRef.current) {
          console.log('⏭️ Same user with data loaded, skipping SIGNED_IN');
          return;
        }
        
        console.log('✅ SIGNED_IN - loading new user data:', session.user.email);
        setLoading(true);
        await loadUserData(session.user);
      }
    });

    // Timeout de seguridad MÁS CORTO
    const timeoutId = setTimeout(() => {
      if (mounted && loading && !dataLoadedRef.current) {
        console.warn('⚠️ Timeout - forcing loading=false');
        setLoading(false);
      }
    }, 8000); // 8 segundos en lugar de 15

    return () => {
      mounted = false;
      initializationComplete = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []); // Sin dependencias

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