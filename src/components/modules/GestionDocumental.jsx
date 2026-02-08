// src/components/modules/GestionDocumental.jsx
// ✅ VERSIÓN ACTUALIZADA - Con PorArea integrado

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import ListadoMaestro from './GestionDocumental/ListadoMaestro';
import FormularioCreacion from './GestionDocumental/FormularioCreacion';
import PorArea from './GestionDocumental/PorArea';
import { 
  FileText, 
  FolderOpen,
  Building2,
  FileStack,
  ArrowLeft,
  Plus,
  CheckSquare
} from 'lucide-react';

export default function GestionDocumental() {
  const { permissions } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [lastCreatedDocument, setLastCreatedDocument] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      setLoadingData(true);
      
      const { data: types, error: typesError } = await supabase
        .from('document_type')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (typesError) throw typesError;
      setDocumentTypes(types || []);

      const { data: procs, error: procsError } = await supabase
        .from('process')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (procsError) throw procsError;
      setProcesses(procs || []);

    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const canView = permissions?.includes('gestion_documental:view') || 
                  permissions?.includes('*:*:*');
  const canCreate = permissions?.includes('gestion_documental:create') || 
                    permissions?.includes('*:*:*');

  if (!canView) {
    return (
      <div className="p-6">
        <Card className="border-2 border-red-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Acceso Denegado</h3>
            <p className="text-sm text-gray-600">
              No tienes permisos para acceder a la Gestión Documental.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCardClick = (view) => {
    setActiveView(view);
  };

  const handleBack = () => {
    setShowSuccessMessage(false);
    setLastCreatedDocument(null);
    setActiveView('dashboard');
  };

  const handleCreateSuccess = (document) => {
    setLastCreatedDocument(document);
    setShowSuccessMessage(true);
    
    setTimeout(() => {
      setShowSuccessMessage(false);
      setActiveView('listado');
    }, 3000);
  };

  const handleCreateCancel = () => {
    setActiveView('dashboard');
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              className="border-2 hover:shadow-lg transition-all cursor-pointer"
              style={{ borderColor: '#6dbd96' }}
              onClick={() => handleCardClick('formatos')}
            >
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: '#6dbd96' }} />
                <h3 className="text-xl font-bold mb-2" style={{ color: '#2e5244' }}>
                  Formatos
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Plantillas y formatos del sistema
                </p>
                <Badge style={{ backgroundColor: '#6dbd96', color: 'white' }}>
                  FO - PR - GU
                </Badge>
              </CardContent>
            </Card>

            <Card 
              className="border-2 hover:shadow-lg transition-all cursor-pointer"
              style={{ borderColor: '#2e5244' }}
              onClick={() => handleCardClick('listado')}
            >
              <CardContent className="p-6 text-center">
                <FileStack className="h-12 w-12 mx-auto mb-4" style={{ color: '#2e5244' }} />
                <h3 className="text-xl font-bold mb-2" style={{ color: '#2e5244' }}>
                  Listado Maestro
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Todos los documentos controlados
                </p>
                <Badge style={{ backgroundColor: '#2e5244', color: 'white' }}>
                  Ver Todo
                </Badge>
              </CardContent>
            </Card>

            <Card 
              className="border-2 hover:shadow-lg transition-all cursor-pointer"
              style={{ borderColor: '#6f7b2c' }}
              onClick={() => handleCardClick('areas')}
            >
              <CardContent className="p-6 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4" style={{ color: '#6f7b2c' }} />
                <h3 className="text-xl font-bold mb-2" style={{ color: '#2e5244' }}>
                  Por Área
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Documentos por departamento
                </p>
                <Badge style={{ backgroundColor: '#6f7b2c', color: 'white' }}>
                  8 Áreas
                </Badge>
              </CardContent>
            </Card>

            <Card 
              className="border-2 hover:shadow-lg transition-all cursor-pointer"
              style={{ borderColor: '#d97706' }}
              onClick={() => handleCardClick('procedimientos')}
            >
              <CardContent className="p-6 text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-4" style={{ color: '#d97706' }} />
                <h3 className="text-xl font-bold mb-2" style={{ color: '#2e5244' }}>
                  Procedimientos
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ver todos los procedimientos
                </p>
                <Badge style={{ backgroundColor: '#d97706', color: 'white' }}>
                  PR - MN
                </Badge>
              </CardContent>
            </Card>

            {canCreate && (
              <Card 
                className="border-2 border-dashed hover:shadow-lg transition-all cursor-pointer"
                style={{ borderColor: '#6dbd96' }}
                onClick={() => handleCardClick('create')}
              >
                <CardContent className="p-6 text-center">
                  <Plus className="h-12 w-12 mx-auto mb-4" style={{ color: '#6dbd96' }} />
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#2e5244' }}>
                    Crear Nuevo
                  </h3>
                  <p className="text-sm text-gray-600">
                    Agregar documento al sistema
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      
      case 'formatos':
        return (
          <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
            <CardContent className="p-8 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4" style={{ color: '#6dbd96' }} />
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#2e5244' }}>
                Biblioteca de Formatos
              </h3>
              <p className="text-gray-600 mb-6">
                Próximamente: Acceso rápido a plantillas y formatos
              </p>
            </CardContent>
          </Card>
        );
      
      case 'create':
        return (
          <div className="space-y-6">
            {showSuccessMessage && lastCreatedDocument && (
              <Card className="border-2" style={{ borderColor: '#6dbd96', backgroundColor: '#f0fdf4' }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckSquare className="h-6 w-6 flex-shrink-0" style={{ color: '#6dbd96' }} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-800 mb-1">
                        ¡Documento creado exitosamente!
                      </h4>
                      <p className="text-sm text-green-700">
                        <span className="font-medium">{lastCreatedDocument.name}</span> ha sido agregado al sistema.
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Código generado: <span className="font-mono font-bold">{lastCreatedDocument.code}</span>
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
        return <PorArea />;
      
      case 'procedimientos':
        return (
          <Card className="border-2" style={{ borderColor: '#d97706' }}>
            <CardContent className="p-8 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4" style={{ color: '#d97706' }} />
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#2e5244' }}>
                Todos los Procedimientos
              </h3>
              <p className="text-gray-600 mb-6">
                Próximamente: Lista completa con búsqueda avanzada
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
              Gestión Documental
            </h2>
            <p className="text-sm mt-1" style={{ color: '#6f7b2c' }}>
              {activeView === 'dashboard' 
                ? 'Sistema de control y gestión de documentos' 
                : activeView === 'listado' 
                ? 'Listado maestro de documentos controlados'
                : activeView === 'create'
                ? 'Crear nuevo documento'
                : activeView === 'formatos'
                ? 'Biblioteca de formatos y plantillas'
                : activeView === 'areas'
                ? 'Documentos organizados por área y proceso'
                : 'Lista de procedimientos del sistema'
              }
            </p>
          </div>
        </div>

        {activeView === 'dashboard' && canCreate && (
          <Button
            onClick={() => setActiveView('create')}
            style={{ backgroundColor: '#6dbd96', color: 'white' }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Documento
          </Button>
        )}
      </div>

      {renderActiveView()}
    </div>
  );
}