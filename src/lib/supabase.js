import { createClient } from '@supabase/supabase-js';

// 🔐 Credenciales desde variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables existan
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
  );
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persiste la sesión en localStorage
    persistSession: true,
    // Detecta automáticamente si la sesión cambió en otra pestaña
    autoRefreshToken: true,
    // Detecta si el usuario está autenticado
    detectSessionInUrl: true,
  },
});

// 🎨 Colores del tema (reutilizables)
export const THEME_COLORS = {
  primary: '#2e5244',      // Verde oscuro
  secondary: '#6dbd96',    // Verde claro
  accent: '#6f7b2c',       // Verde oliva
  background: '#dedecc',   // Beige
  white: '#ffffff',
  border: '#dedecc',
};

// 📋 Constantes de roles
export const ROLES = {
  ADMIN: 'admin',
  GERENCIA: 'gerencia',
  USUARIO: 'usuario',
};

// 📋 Módulos del sistema (debe coincidir con la BD)
export const MODULES = {
  GESTION_DOCUMENTAL: 'gestion_documental',
  CLIENTES_VENTAS: 'clientes_ventas',
  INVENTARIO: 'inventario',
  CMI: 'cmi',
  AUDITORIAS: 'auditorias',
  SST_BIENESTAR: 'sst_bienestar',
  USUARIOS: 'usuarios',
  CONFIGURACION: 'configuracion',
};