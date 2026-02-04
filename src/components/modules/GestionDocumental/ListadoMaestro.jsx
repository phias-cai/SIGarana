// src/components/modules/GestionDocumental/ListadoMaestro.jsx
import { useState } from 'react';
import { useDocuments, useDocumentTypes, useProcesses } from '@/hooks/useDocuments';
import { useFileDownload } from '@/hooks/useFileDownload'; // ⬅️ NUEVO
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
  Loader2  // ⬅️ NUEVO
} from 'lucide-react';

export default function ListadoMaestro({ onCreateNew, onEdit, onView }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedProcesses, setExpandedProcesses] = useState({});

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
  
  // ⬅️ NUEVO: Hook para descargar archivos
  const { downloadDocument, downloading } = useFileDownload();

  // Agrupar documentos por proceso
  const groupedByProcess = documents.reduce((acc, doc) => {
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
              <Search className="absolute left-3 top-3 h-4 w-4" style={{ color: '#6f7b2c' }} />
              <Input
                placeholder="Buscar por código, nombre o responsable..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" style={{ borderColor: '#6dbd96' }} onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="outline" onClick={expandAll} size="sm">
              Expandir Todos
            </Button>
            <Button variant="outline" onClick={collapseAll} size="sm">
              Colapsar Todos
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: '#dedecc' }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block" style={{ color: '#2e5244' }}>
                    Tipo de Documento
                  </label>
                  <select
                    value={selectedType || ''}
                    onChange={(e) => setSelectedType(e.target.value || null)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Todos</option>
                    {documentTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name} ({type.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block" style={{ color: '#2e5244' }}>
                    Proceso
                  </label>
                  <select
                    value={selectedProcess || ''}
                    onChange={(e) => setSelectedProcess(e.target.value || null)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Todos</option>
                    {processes.map(proc => (
                      <option key={proc.id} value={proc.id}>{proc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block" style={{ color: '#2e5244' }}>
                    Estado
                  </label>
                  <select
                    value={selectedStatus || ''}
                    onChange={(e) => setSelectedStatus(e.target.value || null)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="draft">Borrador</option>
                    <option value="pending_approval">Pendiente</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Archivado</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </div>
            </div>
          )}

          {/* Table - EXACTAMENTE COMO EL EXCEL */}
          <div className="overflow-x-auto border rounded-lg" style={{ borderColor: '#dedecc' }}>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" style={{ color: '#6dbd96' }} />
                <p style={{ color: '#6f7b2c' }}>Cargando documentos...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-2" style={{ color: '#dedecc' }} />
                <p style={{ color: '#6f7b2c' }}>No se encontraron documentos</p>
                <Button variant="outline" className="mt-4" onClick={onCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primer documento
                </Button>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th className="text-left p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '80px' }}>
                      PROCESO
                    </th>
                    <th className="text-left p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '100px' }}>
                      CÓDIGO
                    </th>
                    <th className="text-left p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '200px' }}>
                      NOMBRE DEL DOCUMENTO
                    </th>
                    <th className="text-center p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '50px' }}>
                      VER
                    </th>
                    <th className="text-center p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '90px' }}>
                      FECHA
                    </th>
                    <th className="text-left p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '120px' }}>
                      RESPONSABLE
                    </th>
                    <th className="text-left p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '150px' }}>
                      UBICACIÓN
                    </th>
                    <th className="text-center p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '40px' }}>
                      M
                    </th>
                    <th className="text-center p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '40px' }}>
                      F
                    </th>
                    <th className="text-center p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '50px' }}>
                      CENT
                    </th>
                    <th className="text-center p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '40px' }}>
                      GEST
                    </th>
                    <th className="text-center p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '40px' }}>
                      CT
                    </th>
                    <th className="text-center p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '40px' }}>
                      S
                    </th>
                    <th className="text-center p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '40px' }}>
                      E
                    </th>
                    <th className="text-center p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '90px' }}>
                      F. CAMBIO
                    </th>
                    <th className="text-left p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '150px' }}>
                      MOTIVO CAMBIO
                    </th>
                    <th className="text-center p-2 font-semibold border-r" style={{ color: '#2e5244', minWidth: '80px' }}>
                      ESTADO
                    </th>
                    <th className="text-center p-2 font-semibold" style={{ color: '#2e5244', minWidth: '100px' }}>
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedByProcess).map(([processName, docs]) => (
                    <>
                      {/* Fila de proceso (header colapsable) */}
                      <tr 
                        key={`process-${processName}`}
                        className="cursor-pointer hover:bg-gray-50"
                        style={{ backgroundColor: '#e8f5f0' }}
                        onClick={() => toggleProcess(processName)}
                      >
                        <td colSpan="18" className="p-3 font-semibold" style={{ color: '#2e5244' }}>
                          <div className="flex items-center gap-2">
                            {expandedProcesses[processName] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="text-sm">
                              {processName.toUpperCase()}
                            </span>
                            <Badge 
                              variant="outline"
                              style={{ borderColor: '#6dbd96', color: '#2e5244', fontSize: '10px' }}
                            >
                              {docs.length} {docs.length === 1 ? 'documento' : 'documentos'}
                            </Badge>
                          </div>
                        </td>
                      </tr>

                      {/* Filas de documentos (si está expandido) */}
                      {expandedProcesses[processName] && docs.map((doc) => (
                        <tr 
                          key={doc.id}
                          className="border-b hover:bg-gray-50 transition-colors"
                          style={{ borderColor: '#dedecc' }}
                        >
                          {/* PROCESO */}
                          <td className="p-2 text-xs border-r" style={{ color: '#6f7b2c' }}>
                            {doc.process?.code || '-'}
                          </td>

                          {/* CÓDIGO */}
                          <td className="p-2 border-r">
                            <span className="font-mono font-medium text-xs" style={{ color: '#2e5244' }}>
                              {doc.code}
                            </span>
                          </td>

                          {/* NOMBRE */}
                          <td className="p-2 border-r">
                            <span className="text-xs" style={{ color: '#2e5244' }}>
                              {doc.name}
                            </span>
                          </td>

                          {/* VERSIÓN */}
                          <td className="p-2 text-center border-r">
                            <span className="text-xs font-medium" style={{ color: '#6f7b2c' }}>
                              v{String(doc.version).padStart(2, '0')}
                            </span>
                          </td>

                          {/* FECHA CREACIÓN */}
                          <td className="p-2 text-center text-xs text-gray-600 border-r">
                            {doc.change_date ? new Date(doc.change_date).toLocaleDateString('es-CO') : 
                             new Date(doc.created_at).toLocaleDateString('es-CO')}
                          </td>

                          {/* RESPONSABLE */}
                          <td className="p-2 text-xs text-gray-600 border-r">
                            {doc.created_by_profile?.full_name || 'Por definir'}
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
                            {doc.change_date ? new Date(doc.change_date).toLocaleDateString('es-CO') : '-'}
                          </td>

                          {/* MOTIVO DE CAMBIO */}
                          <td className="p-2 text-xs text-gray-600 border-r">
                            {doc.change_reason ? (
                              <span className="line-clamp-2" title={doc.change_reason}>
                                {doc.change_reason}
                              </span>
                            ) : '-'}
                          </td>

                          {/* ESTADO */}
                          <td className="p-2 text-center border-r">
                            {getStatusBadge(doc.status)}
                          </td>

                          {/* ACCIONES */}
                          <td className="p-2">
                            <div className="flex items-center justify-center space-x-1">
                              {/* Botón VER */}
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => onView && onView(doc)} 
                                className="h-7 w-7 p-0"
                                title="Ver detalles"
                              >
                                <Eye className="h-3 w-3" style={{ color: '#6dbd96' }} />
                              </Button>

                              {/* Botón EDITAR */}
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => onEdit && onEdit(doc)} 
                                className="h-7 w-7 p-0"
                                title="Editar documento"
                              >
                                <Edit className="h-3 w-3" style={{ color: '#2e5244' }} />
                              </Button>

                              {/* Botón DESCARGAR - ⬅️ MODIFICADO */}
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
                      ))}
                    </>
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
    </div>
  );
}