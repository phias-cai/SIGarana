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

          {/* Table - OPTIMIZADO PARA NO SCROLL */}
          <div className="border rounded-lg overflow-hidden" style={{ fontSize: '85%', zoom: '0.75' }}>
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
              <table className="w-full text-xs table-auto">
                {/* ENCABEZADOS AGRUPADOS (como en Excel) */}
                <thead>
                  {/* Fila 1: Grupos principales */}
                  <tr className="bg-gray-100 text-xs uppercase" style={{ color: '#2e5244' }}>
                    <th rowSpan="2" className="p-1 text-left border font-bold w-4" style={{ borderColor: '#dedecc' }}></th>
                    <th colSpan="3" className="p-1 text-center border font-bold" style={{ borderColor: '#dedecc' }}>
                      IDENTIFICACIÓN
                    </th>
                    <th colSpan="3" className="p-1 text-center border font-bold" style={{ borderColor: '#dedecc' }}>
                      ARCHIVO
                    </th>
                    <th colSpan="3" className="p-1 text-center border font-bold" style={{ borderColor: '#dedecc' }}>
                      RETENCIÓN
                    </th>
                    <th colSpan="3" className="p-1 text-center border font-bold" style={{ borderColor: '#dedecc' }}>
                      DISPOSICIÓN
                    </th>
                    <th colSpan="3" className="p-1 text-center border font-bold" style={{ borderColor: '#dedecc' }}>
                      CAMBIOS
                    </th>
                    <th rowSpan="2" className="p-1 text-center border font-bold w-16" style={{ borderColor: '#dedecc' }}>
                      ESTADO
                    </th>
                    <th rowSpan="2" className="p-1 text-center border font-bold w-20" style={{ borderColor: '#dedecc' }}>
                      ACCIONES
                    </th>
                  </tr>
                  
                  {/* Fila 2: Columnas específicas */}
                  <tr className="bg-gray-50 text-[10px] uppercase" style={{ color: '#2e5244' }}>
                    {/* IDENTIFICACIÓN */}
                    <th className="p-1 text-left border font-medium w-20" style={{ borderColor: '#dedecc' }}>Código</th>
                    <th className="p-1 text-left border font-medium" style={{ borderColor: '#dedecc' }}>Nombre</th>
                    <th className="p-1 text-center border font-medium w-20" style={{ borderColor: '#dedecc' }}>Resp.</th>
                    
                    {/* ARCHIVO */}
                    <th className="p-1 text-center border font-medium w-12" style={{ borderColor: '#dedecc' }}>Tipo</th>
                    <th className="p-1 text-center border font-medium w-12" style={{ borderColor: '#dedecc' }}>Ver.</th>
                    <th className="p-1 text-center border font-medium w-16" style={{ borderColor: '#dedecc' }}>Fecha</th>
                    
                    {/* RETENCIÓN */}
                    <th className="p-1 text-center border font-medium w-12" style={{ borderColor: '#dedecc' }}>Cent.</th>
                    <th className="p-1 text-center border font-medium w-12" style={{ borderColor: '#dedecc' }}>Gest.</th>
                    <th className="p-1 text-center border font-medium w-12" style={{ borderColor: '#dedecc' }}>Tot.</th>
                    
                    {/* DISPOSICIÓN */}
                    <th className="p-1 text-center border font-medium w-12" style={{ borderColor: '#dedecc' }}>Sel.</th>
                    <th className="p-1 text-center border font-medium w-12" style={{ borderColor: '#dedecc' }}>Con.</th>
                    <th className="p-1 text-center border font-medium w-12" style={{ borderColor: '#dedecc' }}>Eli.</th>
                    
                    {/* CAMBIOS */}
                    <th className="p-1 text-center border font-medium w-16" style={{ borderColor: '#dedecc' }}>F. Camb.</th>
                    <th className="p-1 text-left border font-medium w-24" style={{ borderColor: '#dedecc' }}>Motivo</th>
                    <th className="p-1 text-center border font-medium w-20" style={{ borderColor: '#dedecc' }}>Ubic.</th>
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
                        <td colSpan="19" className="p-1.5 border" style={{ borderColor: '#dedecc' }}>
                          <div className="flex items-center gap-2">
                            {expandedProcesses[processName] ? (
                              <ChevronDown className="h-3.5 w-3.5" style={{ color: '#2e5244' }} />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" style={{ color: '#2e5244' }} />
                            )}
                            <FileText className="h-3.5 w-3.5" style={{ color: '#6dbd96' }} />
                            <span className="font-bold text-xs" style={{ color: '#2e5244' }}>
                              {processName}
                            </span>
                            <span className="text-[10px] text-gray-600 ml-1">
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
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* COLUMNA VACÍA */}
                          <td className="p-1 border" style={{ borderColor: '#dedecc' }}></td>

                          {/* === IDENTIFICACIÓN DE DOCUMENTOS === */}
                          
                          {/* CÓDIGO */}
                          <td className="p-1 border" style={{ borderColor: '#dedecc' }}>
                            <span className="font-mono text-[10px] font-bold" style={{ color: '#2e5244' }}>
                              {doc.code}
                            </span>
                          </td>

                          {/* NOMBRE */}
                          <td className="p-1 border max-w-[150px]" style={{ borderColor: '#dedecc' }}>
                            <p className="font-medium text-[10px] truncate" style={{ color: '#2e5244' }}>
                              {doc.name}
                            </p>
                          </td>

                          {/* RESPONSABLE */}
                          <td className="p-1 text-[10px] text-gray-600 border" style={{ borderColor: '#dedecc' }}>
                            <span className="truncate block max-w-[80px]">
                              {doc.responsible || (typeof doc.created_by_profile === 'object' ? doc.created_by_profile?.full_name : doc.created_by_profile) || '-'}
                            </span>
                          </td>

                          {/* === TIPO DE ARCHIVO === */}
                          
                          {/* TIPO */}
                          <td className="p-1 text-center border" style={{ borderColor: '#dedecc' }}>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: '#f0f4e8', color: '#6f7b2c' }}>
                              {doc.document_type?.code || doc.document_type_code || '-'}
                            </span>
                          </td>

                          {/* VERSIÓN */}
                          <td className="p-1 text-center border" style={{ borderColor: '#dedecc' }}>
                            <span className="text-[10px] font-medium" style={{ color: '#6f7b2c' }}>
                              v{String(doc.version || doc.current_version || 1).padStart(2, '0')}
                            </span>
                          </td>

                          {/* FECHA */}
                          <td className="p-1 text-center text-[10px] text-gray-600 border" style={{ borderColor: '#dedecc' }}>
                            {(() => {
                              try {
                                const date = doc.change_date || doc.created_at;
                                return date ? new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-';
                              } catch (e) {
                                return '-';
                              }
                            })()}
                          </td>

                          {/* === RETENCIÓN DOCUMENTAL === */}
                          
                          {/* CENTRAL (años) */}
                          <td className="p-1 text-center text-[10px] border" style={{ borderColor: '#dedecc' }}>
                            {doc.retention_central || '-'}
                          </td>

                          {/* GESTIÓN */}
                          <td className="p-1 text-center text-[10px] border" style={{ borderColor: '#dedecc' }}>
                            {doc.retention_management || '-'}
                          </td>

                          {/* TOTAL */}
                          <td className="p-1 text-center text-[10px] font-medium border" style={{ borderColor: '#dedecc', color: '#2e5244' }}>
                            {(parseInt(doc.retention_central || 0) + parseInt(doc.retention_management || 0)) || '-'}
                          </td>

                          {/* === DISPOSICIÓN FINAL === */}
                          
                          {/* SELECCIÓN */}
                          <td className="p-1 text-center border" style={{ borderColor: '#dedecc' }}>
                            {doc.disposition_selection ? (
                              <span className="text-green-600 font-bold text-xs">✓</span>
                            ) : (
                              <span className="text-gray-300 text-xs">-</span>
                            )}
                          </td>

                          {/* CONSERVACIÓN */}
                          <td className="p-1 text-center border" style={{ borderColor: '#dedecc' }}>
                            {doc.disposition_total_conservation ? (
                              <span className="text-green-600 font-bold text-xs">✓</span>
                            ) : (
                              <span className="text-gray-300 text-xs">-</span>
                            )}
                          </td>

                          {/* ELIMINACIÓN */}
                          <td className="p-1 text-center border" style={{ borderColor: '#dedecc' }}>
                            {doc.disposition_elimination ? (
                              <span className="text-red-600 font-bold text-xs">✗</span>
                            ) : (
                              <span className="text-gray-300 text-xs">-</span>
                            )}
                          </td>

                          {/* === CONTROL DE CAMBIOS === */}
                          
                          {/* FECHA CAMBIO */}
                          <td className="p-1 text-center text-[10px] text-gray-600 border" style={{ borderColor: '#dedecc' }}>
                            {(() => {
                              try {
                                const date = doc.change_date;
                                return date ? new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-';
                              } catch (e) {
                                return '-';
                              }
                            })()}
                          </td>

                          {/* MOTIVO CAMBIO */}
                          <td className="p-1 text-[10px] text-gray-600 border max-w-[100px]" style={{ borderColor: '#dedecc' }}>
                            <span className="truncate block">
                              {doc.change_reason || '-'}
                            </span>
                          </td>

                          {/* UBICACIÓN */}
                          <td className="p-1 text-[10px] text-gray-600 border" style={{ borderColor: '#dedecc' }}>
                            <span className="truncate block max-w-[80px]">
                              {doc.storage_location || '-'}
                            </span>
                          </td>

                          {/* === ESTADO === */}
                          <td className="p-1 text-center border" style={{ borderColor: '#dedecc' }}>
                            {(() => {
                              const statusConfig = {
                                draft: { bg: '#fef3c7', color: '#92400e', text: 'Borrador' },
                                pending_approval: { bg: '#dbeafe', color: '#1e40af', text: 'Pendiente' },
                                published: { bg: '#d1fae5', color: '#065f46', text: 'Publicado' },
                                archived: { bg: '#f3f4f6', color: '#4b5563', text: 'Archivado' }
                              };
                              const config = statusConfig[doc.status] || statusConfig.draft;
                              
                              // Si es pending_approval, hacer clickeable
                              if (doc.status === 'pending_approval') {
                                return (
                                  <Badge 
                                    className="text-[9px] px-1.5 py-0.5 font-medium cursor-pointer hover:opacity-80 transition-opacity"
                                    style={{ 
                                      backgroundColor: config.bg,
                                      color: config.color
                                    }}
                                    onClick={() => handleOpenApprovalModal(doc)}
                                    title="Click para aprobar/rechazar"
                                  >
                                    ✓ {config.text}
                                  </Badge>
                                );
                              }
                              
                              // Para otros estados, badge normal
                              return (
                                <Badge 
                                  className="text-[9px] px-1.5 py-0.5 font-medium"
                                  style={{ 
                                    backgroundColor: config.bg,
                                    color: config.color
                                  }}
                                >
                                  {config.text}
                                </Badge>
                              );
                            })()}
                          </td>

                          {/* === ACCIONES === */}
                          <td className="p-1 border" style={{ borderColor: '#dedecc' }}>
                            <div className="flex items-center justify-center gap-0.5">
                              {/* Ver */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenViewerModal(doc)}
                                className="h-6 w-6 p-0"
                                title="Ver documento"
                              >
                                <Eye className="h-3 w-3" style={{ color: '#6dbd96' }} />
                              </Button>

                              {/* Editar */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditModal(doc)}
                                className="h-6 w-6 p-0"
                                title="Editar"
                              >
                                <Edit className="h-3 w-3" style={{ color: '#6f7b2c' }} />
                              </Button>

                              {/* Descargar */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadDocument(doc)}
                                disabled={downloading === doc.id}
                                className="h-6 w-6 p-0"
                                title="Descargar"
                              >
                                {downloading === doc.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Download className="h-3 w-3" style={{ color: '#2e5244' }} />
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