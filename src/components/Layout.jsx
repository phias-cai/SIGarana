import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import NotificationBell from '../components/Layout/NotificationBell'; // ⬅️ AGREGAR
import { 
  FileText, 
  Target, 
  TrendingUp, 
  Shield, 
  Users, 
  Home,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Package
} from 'lucide-react';

// ✅ PERMISOS CORREGIDOS - Códigos reales de Supabase
const MODULES = [
  { id: 'home', name: 'Inicio', icon: Home, color: '#2e5244', permission: null },
  { id: 'gestionDocumental', name: 'Gestión Documental', icon: FileText, color: '#6dbd96', permission: 'gestion_documental:view' },
  { id: 'planeacionEstrategica', name: 'Planeación Estratégica', icon: Target, color: '#6f7b2c', permission: 'cmi:view' },
  { id: 'mejoramientoContinuo', name: 'Mejoramiento Continuo', icon: TrendingUp, color: '#2e5244', permission: 'auditorias:view' },
  { id: 'segBienestar', name: 'SST y Bienestar', icon: Shield, color: '#6dbd96', permission: 'sst_bienestar:view' },
  { id: 'inventario', name: 'Inventario', icon: Package, color: '#6f7b2c', permission: 'inventario:view' },
];

export default function Layout({ children, currentModule, onModuleChange }) {
  const { user, profile, permissions, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleModuleClick = (moduleId) => {
    onModuleChange(moduleId);
    setSidebarOpen(false);
  };

  // ✅ Función corregida - Verifica permisos directamente
  const canAccessModule = (module) => {
    // Inicio siempre visible
    if (module.permission === null) return true;
    
    // Admin puede ver todo
    if (profile?.role === 'admin') return true;
    
    // Verificar si tiene el permiso específico
    const hasAccess = permissions && permissions.includes(module.permission);
    console.log(`🔍 ${module.name}: permiso="${module.permission}", tieneAcceso=${hasAccess}`);
    return hasAccess;
  };

  // Verificar si es admin
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#dedecc' }}>
      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ backgroundColor: '#2e5244' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b" style={{ borderColor: '#6dbd96' }}>
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#6dbd96' }}
              >
                <span className="font-bold text-white text-lg">SIG</span>
              </div>
              <div>
                <h2 className="text-white">SIGarana</h2>
                <p className="text-xs" style={{ color: '#6dbd96' }}>Sistema Integrado</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {MODULES.map((module) => {
              if (!canAccessModule(module)) return null;
              
              const Icon = module.icon;
              const isActive = currentModule === module.id;
              
              return (
                <button
                  key={module.id}
                  onClick={() => handleModuleClick(module.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-5 w-5 text-white" />
                  <span className="flex-1 text-left text-white text-sm">{module.name}</span>
                  {isActive && <ChevronRight className="h-4 w-4 text-white" />}
                </button>
              );
            })}

            {isAdmin && (
              <button
                onClick={() => handleModuleClick('usuarios')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  currentModule === 'usuarios' ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <Users className="h-5 w-5 text-white" />
                <span className="flex-1 text-left text-white text-sm">Gestión de Usuarios</span>
                {currentModule === 'usuarios' && <ChevronRight className="h-4 w-4 text-white" />}
              </button>
            )}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t" style={{ borderColor: '#6dbd96' }}>
            <div className="flex items-center space-x-3 mb-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#6dbd96' }}
              >
                <span className="text-white font-medium">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{profile?.full_name || user?.email}</p>
                <p className="text-xs truncate" style={{ color: '#6dbd96' }}>
                  {profile?.role === 'admin' ? 'Administrador' : 
                   profile?.role === 'gerencia' ? 'Gerencia' : 'Usuario'}
                </p>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b" style={{ borderColor: '#6dbd96' }}>
  <div className="px-4 py-4 flex items-center justify-between">
    <div className="flex items-center space-x-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      <div>
        <h1 style={{ color: '#2e5244' }}>
          {MODULES.find(m => m.id === currentModule)?.name || 
           (currentModule === 'usuarios' ? 'Gestión de Usuarios' : 'Inicio')}
        </h1>
        <p className="text-sm" style={{ color: '#6f7b2c' }}>
          {profile?.department?.name || 'Sistema Integrado de Gestión'}
        </p>
      </div>
    </div>
    
    {/* ⬅️ CAMPANA CON NAVEGACIÓN CORREGIDA */}
    <NotificationBell onNavigate={onModuleChange} />
  </div>
</header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}