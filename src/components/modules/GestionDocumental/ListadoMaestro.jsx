// src/components/modules/GestionDocumental/ListadoMaestro.jsx
import React, { useState } from 'react';
import { useDocuments, useDocumentTypes, useProcesses } from '@/hooks/useDocuments';
import { useFileDownload } from '@/hooks/useFileDownload';
import ApprovalModal from './ApprovalModal';
import EditDocumentModal from './EditDocumentModal'; // ⬅️ UN SOLO MODAL PARA TODO
import DocumentViewerModal from './DocumentViewerModal'; // ⬅️ NUEVO: Modal para visualizar documentos
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { 
  FileText, 
  Search,
  Plus,
  Eye,
  Edit,
  Download,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Loader2
} from 'lucide-react';

export default function ListadoMaestro({ onCreateNew, onEdit, onView }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedProcesses, setExpandedProcesses] = useState({});
  
  // Estados para el modal de aprobación
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  
  // ⬅️ UN SOLO MODAL PARA EDITAR (metadatos Y/O archivo)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState(null);

  // ⬅️ NUEVO: Modal para visualizar documentos
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [documentToView, setDocumentToView] = useState(null);

  const { 
    documents = [], 
    loading = false, 
    error = null, 
    stats = { total: 0, byStatus: { draft: 0, pending_approval: 0, published: 0, archived: 0 } }, 
    refresh = () => {} 
  } = useDocuments({
    searchTerm,
    documentTypeId: selectedType,
    processId: selectedProcess,
    status: selectedStatus
  }) || {};

  const { documentTypes = [] } = useDocumentTypes() || {};
  const { processes = [] } = useProcesses() || {};
  const { downloadDocument, downloading } = useFileDownload();

  // Función para abrir modal de aprobación
  const handleOpenApprovalModal = (document) => {
    console.log('📄 Abriendo modal de aprobación para:', document.code);
    setSelectedDocument(document);
    setIsApprovalModalOpen(true);
  };

  // Función para cerrar modal de aprobación
  const handleCloseApprovalModal = () => {
    setIsApprovalModalOpen(false);
    setSelectedDocument(null);
  };

  // Función cuando se aprueba/rechaza exitosamente
  const handleApprovalSuccess = () => {
    console.log('✅ Aprobación/Rechazo exitoso, refrescando listado...');
    refresh();
  };

  // ⬅️ NUEVO: Función para abrir modal de edición
  // Se usa tanto para EDITAR (✏️) como para CAMBIAR ARCHIVO (🔄)
  const handleOpenEditModal = (document) => {
    console.log('📝 Abriendo modal de edición para:', document.code);
    setDocumentToEdit(document);
    setIsEditModalOpen(true);
  };

  // ⬅️ NUEVO: Abrir modal de visualización
  const handleOpenViewerModal = (document) => {
    console.log('👁️ Abriendo visor para:', document.code);
    setDocumentToView(document);
    setIsViewerModalOpen(true);
  };

  // ⬅️ NUEVO: Función para cerrar modal de edición
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setDocumentToEdit(null);
  };

  // ⬅️ NUEVO: Función cuando se edita exitosamente
  const handleEditSuccess = () => {
    console.log('✅ Edición exitosa, refrescando listado...');
    refresh();
  };

  // Filtrar documentos archivados ⬅️ NUEVO: Excluir archivados del listado
  const activeDocuments = documents.filter(doc => doc.status !== 'archived');

  // Agrupar documentos por proceso (solo documentos activos)
  const groupedByProcess = activeDocuments.reduce((acc, doc) => {
    const processName = doc?.process?.name || 'Sin Proceso';
    if (!acc[processName]) {
      acc[processName] = [];
    }
    acc[processName].push(doc);
    return acc;
  }, {});

  const toggleProcess = (processId) => {
    setExpandedProcesses(prev => ({
      ...prev,
      [processId]: !prev[processId]
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    Object.keys(groupedByProcess).forEach(key => {
      allExpanded[key] = true;
    });
    setExpandedProcesses(allExpanded);
  };

  const collapseAll = () => {
    setExpandedProcesses({});
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType(null);
    setSelectedProcess(null);
    setSelectedStatus(null);
  };

  const getStatusBadge = (status) => {
    const configs = {
      draft: { label: 'BORRADOR', color: '#6f7b2c', bg: '#f0f4e8' },
      pending_approval: { label: 'PENDIENTE', color: '#d97706', bg: '#fef3c7' },
      published: { label: 'PUBLICADO', color: '#059669', bg: '#d1fae5' },
      archived: { label: 'ARCHIVADO', color: '#6b7280', bg: '#f3f4f6' }
    };
    const config = configs[status] || configs.draft;
    return (
      <Badge style={{ backgroundColor: config.bg, color: config.color, border: `1px solid ${config.color}` }}>
        {config.label}
      </Badge>
    );
  };

  if (error) {
    return (
      <Card className="border-2 border-red-200">
        <CardContent className="p-6">
          <p className="text-red-600">Error: {error}</p>
          <Button onClick={refresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Total Documentos</p>
            <p className="text-2xl font-bold" style={{ color: '#2e5244' }}>{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="border-2" style={{ borderColor: '#d97706' }}>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Pendientes Aprobación</p>
            <p className="text-2xl font-bold" style={{ color: '#d97706' }}>
              {stats.byStatus.pending_approval}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2" style={{ borderColor: '#059669' }}>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Publicados</p>
            <p className="text-2xl font-bold" style={{ color: '#059669' }}>
              {stats.byStatus.published}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2" style={{ borderColor: '#6f7b2c' }}>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Borradores</p>
            <p className="text-2xl font-bold" style={{ color: '#6f7b2c' }}>
              {stats.byStatus.draft}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle style={{ color: '#2e5244' }}>Listado Maestro de Documentos</CardTitle>
              <p className="text-sm text-gray-600">Vista centralizada del sistema documental SIG</p>
            </div>
            <Button onClick={onCreateNew} style={{ backgroundColor: '#2e5244' }} className="text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por código, nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="shrink-0"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros {showFilters ? '▼' : '▶'}
            </Button>

            <Button onClick={refresh} variant="outline" className="shrink-0">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo</label>
                <select
                  value={selectedType || ''}
                  onChange={(e) => setSelectedType(e.target.value || null)}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="">Todos</option>
                  {documentTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Proceso</label>
                <select
                  value={selectedProcess || ''}
                  onChange={(e) => setSelectedProcess(e.target.value || null)}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="">Todos</option>
                  {processes.map(proc => (
                    <option key={proc.id} value={proc.id}>{proc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Estado</label>
                <select
                  value={selectedStatus || ''}
                  onChange={(e) => setSelectedStatus(e.target.value || null)}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="">Todos</option>
                  <option value="draft">Borrador</option>
                  <option value="pending_approval">Pendiente</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" size="sm" className="w-full">
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={expandAll} variant="ghost" size="sm">
              Expandir Todo
            </Button>
            <Button onClick={collapseAll} variant="ghost" size="sm">
              Contraer Todo
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#6dbd96' }} />
                <span className="ml-3 text-gray-600">Cargando documentos...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center p-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No se encontraron documentos</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase" style={{ color: '#2e5244' }}>
                  <tr>
                    <th className="p-3 text-left border-b font-bold" style={{ borderColor: '#dedecc' }}></th>
                    <th className="p-3 text-left border-b font-bold" style={{ borderColor: '#dedecc' }}>Código</th>
                    <th className="p-3 text-left border-b font-bold" style={{ borderColor: '#dedecc' }}>Nombre Documento</th>
                    <th className="p-3 text-center border-b font-bold" style={{ borderColor: '#dedecc' }}>Tipo</th>
                    <th className="p-3 text-center border-b font-bold" style={{ borderColor: '#dedecc' }}>Versión</th>
                    <th className="p-3 text-center border-b font-bold" style={{ borderColor: '#dedecc' }}>Fecha Creación</th>
                    <th className="p-3 text-left border-b font-bold" style={{ borderColor: '#dedecc' }}>Responsable</th>
                    <th className="p-3 text-left border-b font-bold" style={{ borderColor: '#dedecc' }}>Ubicación</th>
                    <th className="p-3 text-center border-b font-bold" style={{ borderColor: '#dedecc' }}>Magnético</th>
                    <th className="p-3 text-center border-b font-bold" style={{ borderColor: '#dedecc' }}>Físico</th>
                    <th className="p-3 text-center border-b font-bold" style={{ borderColor: '#dedecc' }}>Ret. Central</th>
                    <th className="p-3 text-center border-b font-bold" style={{ borderColor: '#dedecc' }}>Ret. Gestión</th>
                    <th className="p-3 text-center border-b font-bold" style={{ borderColor: '#dedecc' }}>Cons. Total</th>
                    <th className="p-3 text-center border-b font-bold" style={{ borderColor: '#dedecc' }}>Selección</th>
                    <th className="p-3 text-center border-b font-bold" style={{ borderColor: '#dedecc' }}>Eliminación</th>
                    <th className="p-3 text-center border-b font-bold" style={{ borderColor: '#dedecc' }}>Fecha Cambio</th>
                    <th className="p-3 text-left border-b font-bold" style={{ borderColor: '#dedecc' }}>Motivo Cambio</th>
                    <th className="p-3 text-center border-b font-bold" style={{ borderColor: '#dedecc' }}>Estado</th>
                    <th className="p-3 text-center border-b font-bold" style={{ borderColor: '#dedecc' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedByProcess).map(([processName, processDocs]) => (
                    <React.Fragment key={processName}>
                      {/* Fila de encabezado de proceso */}
                      <tr 
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleProcess(processName)}
                        style={{ backgroundColor: '#f0f4e8' }}
                      >
                        <td colSpan="19" className="p-3 border-b" style={{ borderColor: '#dedecc' }}>
                          <div className="flex items-center gap-2">
                            {expandedProcesses[processName] ? (
                              <ChevronDown className="h-4 w-4" style={{ color: '#2e5244' }} />
                            ) : (
                              <ChevronRight className="h-4 w-4" style={{ color: '#2e5244' }} />
                            )}
                            <FileText className="h-4 w-4" style={{ color: '#6dbd96' }} />
                            <span className="font-bold" style={{ color: '#2e5244' }}>
                              {processName}
                            </span>
                            <span className="text-xs text-gray-600 ml-2">
                              ({processDocs.length} documento{processDocs.length !== 1 ? 's' : ''})
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Filas de documentos */}
                      {expandedProcesses[processName] && processDocs.map((doc) => {
                        // 🔍 Validación de datos para prevenir errores de renderizado
                        if (typeof doc.created_by_profile !== 'undefined' && typeof doc.created_by_profile !== 'string') {
                          console.warn('⚠️ created_by_profile es un objeto:', doc.created_by_profile);
                        }
                        
                        return (
                        <tr 
                          key={doc.id} 
                          className="hover:bg-gray-50 transition-colors border-b"
                          style={{ borderColor: '#dedecc' }}
                        >
                          <td className="p-2"></td>

                          {/* CÓDIGO */}
                          <td className="p-2 border-r">
                            <span className="font-mono text-xs font-bold" style={{ color: '#2e5244' }}>
                              {doc.code}
                            </span>
                          </td>

                          {/* NOMBRE */}
                          <td className="p-2 border-r">
                            <div>
                              <p className="font-medium text-sm" style={{ color: '#2e5244' }}>
                                {doc.name}
                              </p>
                              {doc.objective && (
                                <p className="text-xs text-gray-600 line-clamp-1 mt-1">
                                  {doc.objective}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* TIPO */}
                          <td className="p-2 text-center border-r">
                            <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#f0f4e8', color: '#6f7b2c' }}>
                              {doc.document_type?.code || doc.document_type_code || '-'}
                            </span>
                          </td>

                          {/* VERSIÓN */}
                          <td className="p-2 text-center border-r">
                            <span className="text-xs font-medium" style={{ color: '#6f7b2c' }}>
                              v{String(doc.version || doc.current_version || 1).padStart(2, '0')}
                            </span>
                          </td>

                          {/* FECHA CREACIÓN */}
                          <td className="p-2 text-center text-xs text-gray-600 border-r">
                            {(() => {
                              try {
                                const date = doc.change_date || doc.created_at;
                                return date ? new Date(date).toLocaleDateString('es-CO') : '-';
                              } catch (e) {
                                return '-';
                              }
                            })()}
                          </td>

                          {/* RESPONSABLE */}
                          <td className="p-2 text-xs text-gray-600 border-r">
                            {doc.responsible || (typeof doc.created_by_profile === 'object' ? doc.created_by_profile?.full_name : doc.created_by_profile) || 'Por definir'}
                          </td>

                          {/* UBICACIÓN */}
                          <td className="p-2 text-xs text-gray-600 border-r">
                            {doc.storage_location || '-'}
                          </td>

                          {/* TIPO ARCHIVO: MAGNÉTICO */}
                          <td className="p-2 text-center border-r">
                            {doc.file_type_magnetic ? (
                              <span className="text-green-600 font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>

                          {/* TIPO ARCHIVO: FÍSICO */}
                          <td className="p-2 text-center border-r">
                            {doc.file_type_physical ? (
                              <span className="text-green-600 font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>

                          {/* RETENCIÓN: CENTRAL (años) */}
                          <td className="p-2 text-center text-xs border-r">
                            {doc.retention_central || '-'}
                          </td>

                          {/* RETENCIÓN: GESTIÓN */}
                          <td className="p-2 text-center border-r">
                            {doc.retention_management ? (
                              <span className="text-green-600 font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>

                          {/* DISPOSICIÓN: CONSERVACIÓN TOTAL */}
                          <td className="p-2 text-center border-r">
                            {doc.disposition_total_conservation ? (
                              <span className="text-green-600 font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>

                          {/* DISPOSICIÓN: SELECCIÓN */}
                          <td className="p-2 text-center border-r">
                            {doc.disposition_selection ? (
                              <span className="text-green-600 font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>

                          {/* DISPOSICIÓN: ELIMINACIÓN */}
                          <td className="p-2 text-center border-r">
                            {doc.disposition_elimination ? (
                              <span className="text-green-600 font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>

                          {/* FECHA DE CAMBIO */}
                          <td className="p-2 text-center text-xs text-gray-600 border-r">
                            {(() => {
                              try {
                                return doc.change_date ? new Date(doc.change_date).toLocaleDateString('es-CO') : '-';
                              } catch (e) {
                                return '-';
                              }
                            })()}
                          </td>

                          {/* MOTIVO DE CAMBIO */}
                          <td className="p-2 text-xs text-gray-600 border-r">
                            {doc.change_reason ? (
                              <span className="line-clamp-2" title={doc.change_reason}>
                                {doc.change_reason}
                              </span>
                            ) : '-'}
                          </td>

                          {/* ESTADO - Badge clickeable si está pendiente */}
                          <td className="p-2 text-center border-r">
                            {doc.status === 'pending_approval' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenApprovalModal(doc);
                                }}
                                className="hover:scale-105 transition-transform cursor-pointer"
                                title="Click para revisar y aprobar/rechazar"
                              >
                                {getStatusBadge(doc.status)}
                              </button>
                            ) : (
                              getStatusBadge(doc.status)
                            )}
                          </td>

                          {/* ACCIONES */}
                          <td className="p-2">
                            <div className="flex items-center justify-center space-x-1">
                              {/* Botón VER */}
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleOpenViewerModal(doc)}
                                className="h-7 w-7 p-0"
                                title="Ver documento"
                              >
                                <Eye className="h-3 w-3" style={{ color: '#6dbd96' }} />
                              </Button>

                              {/* Botón EDITAR - Usa el MISMO modal */}
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleOpenEditModal(doc)}
                                className="h-7 w-7 p-0"
                                title="Editar metadatos y/o archivo"
                              >
                                <Edit className="h-3 w-3" style={{ color: '#2e5244' }} />
                              </Button>

                              {/* Botón CAMBIAR ARCHIVO - Usa el MISMO modal */}
                              {doc.status === 'published' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleOpenEditModal(doc)}
                                  className="h-7 w-7 p-0"
                                  title="Cambiar archivo (requiere aprobación)"
                                >
                                  <RefreshCw className="h-3 w-3" style={{ color: '#d97706' }} />
                                </Button>
                              )}

                              {/* Botón DESCARGAR */}
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => downloadDocument(doc)}
                                disabled={downloading || !doc.file_path}
                                className="h-7 w-7 p-0"
                                title={
                                  !doc.file_path 
                                    ? "No hay archivo disponible" 
                                    : downloading 
                                      ? "Descargando..." 
                                      : "Descargar archivo"
                                }
                              >
                                {downloading ? (
                                  <Loader2 className="h-3 w-3 animate-spin" style={{ color: '#6f7b2c' }} />
                                ) : (
                                  <Download className="h-3 w-3" style={{ color: '#6f7b2c' }} />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          {documents.length > 0 && (
            <div className="text-xs text-gray-600 text-center pt-2 border-t" style={{ borderColor: '#dedecc' }}>
              Mostrando {documents.length} documento{documents.length !== 1 ? 's' : ''} de {stats.total} total
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Aprobación */}
      <ApprovalModal
        document={selectedDocument}
        isOpen={isApprovalModalOpen}
        onClose={handleCloseApprovalModal}
        onSuccess={handleApprovalSuccess}
      />

      {/* ⬅️ UN SOLO MODAL para editar TODO (metadatos y/o archivo) */}
      <EditDocumentModal
        document={documentToEdit}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
      />

      {/* ⬅️ NUEVO: Modal para visualizar documentos */}
      <DocumentViewerModal
        document={documentToView}
        isOpen={isViewerModalOpen}
        onClose={() => {
          setIsViewerModalOpen(false);
          setDocumentToView(null);
        }}
      />
    </div>
  );
}