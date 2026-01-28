// src/components/modules/GestionDocumental.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import ListadoMaestro from './GestionDocumental/ListadoMaestro';
import FormularioCreacion from './GestionDocumental/FormularioCreacion';
import { 
  FileText, 
  FolderOpen,
  Building2,
  FileStack,
  ArrowLeft,
  Edit,
  Eye,
  CheckSquare,
  Plus
} from 'lucide-react';

export default function GestionDocumental() {
  const { permissions } = useAuth();
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, formatos, listado, areas, procedimientos, create
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [lastCreatedDocument, setLastCreatedDocument] = useState(null);

  // 🔥 Estado para datos maestros
  const [documentTypes, setDocumentTypes] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // 🔥 Cargar datos al montar
  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      setLoadingData(true);
      
      // Cargar tipos de documentos
      const { data: types, error: typesError } = await supabase
        .from('document_type')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (typesError) throw typesError;
      console.log('✅ Document types cargados:', types?.length || 0);
      setDocumentTypes(types || []);

      // Cargar procesos
      const { data: procs, error: procsError } = await supabase
        .from('process')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (procsError) throw procsError;
      console.log('✅ Processes cargados:', procs?.length || 0);
      setProcesses(procs || []);

    } catch (err) {
      console.error('❌ Error cargando datos:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Verificar permisos
  const canView = permissions?.includes('gestion_documental:view') || 
                  permissions?.includes('*:*:*');
  const canCreate = permissions?.includes('gestion_documental:create') || 
                    permissions?.includes('*:*:*');

  if (!canView) {
    return (
      <Card className="m-6">
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">No tienes permisos para ver este mÃ³dulo</p>
        </CardContent>
      </Card>
    );
  }

  // ConfiguraciÃ³n de submÃ³dulos
  const submodules = [
    {
      id: 'create',
      title: 'Crear Documento',
      description: 'Sube un nuevo documento al sistema',
      icon: Plus,
      color: '#6dbd96',
      bgColor: '#e8f5f0',
      features: ['Upload de archivo', 'Metadatos completos', 'CÃ³digo automÃ¡tico', 'Primera versiÃ³n'],
      requiresPermission: 'gestion_documental:create'
    },
    {
      id: 'listado',
      title: 'Listado Maestro',
      description: 'Vista centralizada de todos los documentos del sistema',
      icon: FileStack,
      color: '#2e5244',
      bgColor: '#e8f0ed',
      features: ['Ver todos los documentos', 'Buscar y filtrar', 'Descargar archivos', 'Control de versiones'],
      requiresPermission: 'gestion_documental:view'
    },
    {
      id: 'areas',
      title: 'Documentos por Ãrea',
      description: 'OrganizaciÃ³n de documentos por departamentos y procesos',
      icon: Building2,
      color: '#6f7b2c',
      bgColor: '#f4f5eb',
      features: ['G. Humana', 'G. ProducciÃ³n', 'G. Proveedores', 'G. Calidad y SST', 'G. Clientes', 'G. DirecciÃ³n', 'G. Administrativa'],
      requiresPermission: 'gestion_documental:view'
    },
    {
      id: 'procedimientos',
      title: 'Todos los Procedimientos',
      description: 'Lista completa de procedimientos con bÃºsqueda avanzada',
      icon: FileText,
      color: '#d97706',
      bgColor: '#fef3c7',
      features: ['Filtrar por Ã¡rea', 'BÃºsqueda rÃ¡pida', 'Ver vigencia', 'Historial de cambios'],
      requiresPermission: 'gestion_documental:view'
    }
  ];

  // Filtrar submÃ³dulos segÃºn permisos
  const availableSubmodules = submodules.filter(sub => {
    if (!sub.requiresPermission) return true;
    return permissions?.includes(sub.requiresPermission) || permissions?.includes('*:*:*');
  });

  // Handler para volver al dashboard
  const handleBack = () => {
    setActiveView('dashboard');
    setShowSuccessMessage(false);
  };

  // Handler para Ã©xito al crear documento
  const handleCreateSuccess = (result) => {
    setLastCreatedDocument(result);
    setShowSuccessMessage(true);
    
    // Auto-ocultar mensaje despuÃ©s de 10 segundos
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 10000);

    // Volver al listado maestro
    setTimeout(() => {
      setActiveView('listado');
    }, 2000);
  };

  // Handler para cancelar creaciÃ³n
  const handleCreateCancel = () => {
    setActiveView('dashboard');
  };

  // Renderizar contenido segÃºn vista activa
  const renderContent = () => {
    switch (activeView) {
      case 'create':
        return (
          <div className="space-y-4">
            {showSuccessMessage && lastCreatedDocument && (
              <Card className="border-2 border-green-500 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckSquare className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900">
                        Â¡Documento creado exitosamente!
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        CÃ³digo generado: <span className="font-mono font-bold">{lastCreatedDocument.code}</span>
                      </p>
                      <p className="text-xs text-green-600 mt-2">
                        Redirigiendo al listado maestro...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <FormularioCreacion 
              documentTypes={documentTypes}
              processes={processes}
              onSuccess={handleCreateSuccess}
              onCancel={handleCreateCancel}
            />
          </div>
        );
      
      case 'listado':
        return (
          <ListadoMaestro 
            onCreateNew={canCreate ? () => setActiveView('create') : null}
            onEdit={() => {}}
            onView={() => {}}
          />
        );
      
      case 'areas':
        return (
          <Card className="border-2" style={{ borderColor: '#6f7b2c' }}>
            <CardContent className="p-8 text-center">
              <Building2 className="h-16 w-16 mx-auto mb-4" style={{ color: '#6f7b2c' }} />
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#2e5244' }}>
                Documentos por Ãrea
              </h3>
              <p className="text-gray-600 mb-6">
                PrÃ³ximamente: Vista organizada por departamentos y procesos
              </p>
            </CardContent>
          </Card>
        );
      
      case 'procedimientos':
        return (
          <Card className="border-2" style={{ borderColor: '#d97706' }}>
            <CardContent className="p-8 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4" style={{ color: '#d97706' }} />
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#2e5244' }}>
                Todos los Procedimientos
              </h3>
              <p className="text-gray-600 mb-6">
                PrÃ³ximamente: Lista completa con bÃºsqueda avanzada
              </p>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header con breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {activeView !== 'dashboard' && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#2e5244' }}>
              GestiÃ³n Documental
            </h2>
            <p className="text-sm mt-1" style={{ color: '#6f7b2c' }}>
              {activeView === 'dashboard' 
                ? 'Sistema de gestiÃ³n centralizada del sistema documental SIG'
                : activeView === 'create'
                ? 'Crear nuevo documento'
                : submodules.find(s => s.id === activeView)?.title
              }
            </p>
          </div>
        </div>

        {/* BotÃ³n rÃ¡pido de crear */}
        {activeView === 'dashboard' && canCreate && (
          <Button
            onClick={() => setActiveView('create')}
            style={{ backgroundColor: '#6dbd96' }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear Documento
          </Button>
        )}
      </div>

      {/* Dashboard o Contenido del submÃ³dulo */}
      {activeView === 'dashboard' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableSubmodules.map((submodule) => {
            const Icon = submodule.icon;
            
            return (
              <Card 
                key={submodule.id}
                className="border-2 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{ 
                  borderColor: submodule.color,
                  backgroundColor: 'white'
                }}
                onClick={() => setActiveView(submodule.id)}
              >
                <CardContent className="p-6">
                  {/* Header del card */}
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: submodule.bgColor }}
                    >
                      <Icon className="h-8 w-8" style={{ color: submodule.color }} />
                    </div>
                    <Badge
                      style={{ 
                        backgroundColor: submodule.bgColor,
                        color: submodule.color,
                        border: `1px solid ${submodule.color}`
                      }}
                    >
                      {submodule.id === 'create' ? 'Nuevo' : 'Ver'}
                    </Badge>
                  </div>

                  {/* TÃ­tulo y descripciÃ³n */}
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#2e5244' }}>
                    {submodule.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {submodule.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2">
                    {submodule.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div 
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: submodule.color }}
                        />
                        <span className="text-xs text-gray-700">{feature}</span>
                      </div>
                    ))}
                    {submodule.features.length > 3 && (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: submodule.color }}
                        />
                        <span className="text-xs" style={{ color: submodule.color }}>
                          +{submodule.features.length - 3} mÃ¡s...
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer con botÃ³n */}
                  <div className="mt-6 pt-4 border-t" style={{ borderColor: submodule.bgColor }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Click para acceder
                      </span>
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110"
                        style={{ backgroundColor: submodule.bgColor }}
                      >
                        <Eye className="h-4 w-4" style={{ color: submodule.color }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Contenido del submÃ³dulo activo
        renderContent()
      )}

      {/* Info card cuando es dashboard */}
      {activeView === 'dashboard' && (
        <Card className="border-2" style={{ borderColor: '#dedecc', backgroundColor: '#dedecc' }}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#6dbd96' }}>
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: '#2e5244' }}>
                  Sistema de GestiÃ³n Documental
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Selecciona un submódulo para comenzar. Cada sección estÃ¡ diseÃ±ada para facilitar la gestiÃ³n
                  y organizaciÃ³n de la documentaciÃ³n del Sistema de GestiÃ³n Integral.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}