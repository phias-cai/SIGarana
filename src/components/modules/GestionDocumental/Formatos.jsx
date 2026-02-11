// src/components/modules/GestionDocumental/Formatos.jsx
// 📋 FORMATOS - Espacios ULTRA reducidos

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocuments, useProcesses } from '@/hooks/useDocuments';
import { useFileDownload } from '@/hooks/useFileDownload';
import DocumentViewerModal from './DocumentViewerModal';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { 
  FileText, 
  Eye,
  Download,
  Search,
  Filter,
  Loader2,
  ClipboardList,
  BookMarked,
  FileSpreadsheet,
  X,
  Grid3x3,
  List
} from 'lucide-react';

const FORMAT_TYPES = {
  'FO': { code: 'FO', name: 'Formatos', color: '#6dbd96', icon: ClipboardList },
  'GU': { code: 'GU', name: 'Guías', color: '#6f7b2c', icon: BookMarked },
  'RE': { code: 'RE', name: 'Registros', color: '#2e5244', icon: FileSpreadsheet }
};

export default function Formatos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [documentToView, setDocumentToView] = useState(null);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);

  const { documents = [], loading } = useDocuments({});
  const { processes = [] } = useProcesses();
  const { downloadDocument, downloading } = useFileDownload();

  const formatDocuments = useMemo(() => {
    return documents.filter(doc => {
      const typeCode = doc.document_type?.code || doc.document_type_code;
      return ['FO', 'GU', 'RE'].includes(typeCode);
    });
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return formatDocuments.filter(doc => {
      const typeCode = doc.document_type?.code || doc.document_type_code;
      
      const matchesSearch = !searchTerm || 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesProcess = !selectedProcess || doc.process_id === selectedProcess;
      const matchesType = !selectedType || typeCode === selectedType;
      
      return matchesSearch && matchesProcess && matchesType;
    });
  }, [formatDocuments, searchTerm, selectedProcess, selectedType]);

  const stats = useMemo(() => {
    const byType = {};
    formatDocuments.forEach(doc => {
      const typeCode = doc.document_type?.code || doc.document_type_code;
      byType[typeCode] = (byType[typeCode] || 0) + 1;
    });
    return byType;
  }, [formatDocuments]);

  const handleViewDocument = (doc) => {
    setDocumentToView(doc);
    setIsViewerModalOpen(true);
  };

  const handleDownload = async (doc) => {
    await downloadDocument(doc);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedProcess(null);
    setSelectedType(null);
  };

  const FormatCardList = ({ doc, index }) => {
    const typeCode = doc.document_type?.code || doc.document_type_code;
    const typeConfig = FORMAT_TYPES[typeCode] || FORMAT_TYPES['FO'];
    const Icon = typeConfig.icon;
    const process = processes.find(p => p.id === doc.process_id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02 }}
      >
        <Card className="overflow-hidden border hover:shadow-md transition-all">
          <div className="flex items-center">
            <div className="w-1 h-full" style={{ backgroundColor: typeConfig.color }} />
            <div 
              className="w-12 flex items-center justify-center py-2"
              style={{ backgroundColor: `${typeConfig.color}08` }}
            >
              <Icon className="h-5 w-5" style={{ color: typeConfig.color }} />
            </div>

            <div className="flex-1 p-2 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge 
                      className="font-mono text-xs py-0 h-5"
                      style={{ backgroundColor: typeConfig.color, color: 'white' }}
                    >
                      {doc.code}
                    </Badge>
                    <Badge variant="outline" className="text-xs py-0 h-5">
                      v{doc.version || 1}
                    </Badge>
                    {process && (
                      <Badge variant="secondary" className="text-xs py-0 h-5">
                        {process.code}
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-medium text-xs text-gray-900 line-clamp-1 mb-0.5">
                    {doc.name}
                  </h3>

                  {process && (
                    <p className="text-xs text-gray-500">
                      {process.name}
                    </p>
                  )}
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDocument(doc)}
                    disabled={!doc.file_path}
                    className="h-7 w-7 p-0"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    disabled={downloading === doc.id || !doc.file_path}
                    className="h-7 w-7 p-0"
                  >
                    {downloading === doc.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  const FormatCardGrid = ({ doc, index }) => {
    const typeCode = doc.document_type?.code || doc.document_type_code;
    const typeConfig = FORMAT_TYPES[typeCode] || FORMAT_TYPES['FO'];
    const Icon = typeConfig.icon;
    const process = processes.find(p => p.id === doc.process_id);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.02 }}
      >
        <Card className="overflow-hidden border hover:shadow-md transition-all h-full flex flex-col">
          <div 
            className="h-12 flex items-center justify-center"
            style={{ backgroundColor: `${typeConfig.color}10` }}
          >
            <Icon className="h-6 w-6" style={{ color: typeConfig.color }} />
          </div>

          <div className="p-2 flex-1 flex flex-col">
            <div className="flex items-center gap-1 mb-1.5">
              <Badge 
                className="font-mono text-xs py-0 h-4"
                style={{ backgroundColor: typeConfig.color, color: 'white' }}
              >
                {doc.code}
              </Badge>
              <Badge variant="outline" className="text-xs py-0 h-4">
                v{doc.version || 1}
              </Badge>
            </div>

            <h3 className="font-medium text-xs text-gray-900 line-clamp-2 flex-1 mb-1.5">
              {doc.name}
            </h3>

            {process && (
              <p className="text-xs text-gray-500 mb-2 truncate">
                {process.code}
              </p>
            )}

            <div className="flex gap-1 mt-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewDocument(doc)}
                disabled={!doc.file_path}
                className="flex-1 h-7 text-xs"
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(doc)}
                disabled={downloading === doc.id || !doc.file_path}
                className="flex-1 h-7 text-xs"
              >
                {downloading === doc.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold text-[#2e5244]">Formatos</h2>
            <Badge variant="secondary" className="text-xs">
              {filteredDocuments.length} de {formatDocuments.length}
            </Badge>
          </div>
          <p className="text-xs text-gray-600 mt-0.5">Biblioteca de formatos</p>
        </div>

        <div className="flex gap-2">
          {Object.entries(FORMAT_TYPES).map(([code, config]) => {
            const count = stats[code] || 0;
            if (count === 0) return null;
            
            return (
              <div
                key={code}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                style={{ backgroundColor: `${config.color}12` }}
              >
                <config.icon className="h-3.5 w-3.5" style={{ color: config.color }} />
                <span className="font-bold text-xs" style={{ color: config.color }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="p-2">
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            <div className="flex gap-0.5 border rounded-lg p-0.5">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 w-7 p-0"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-7 w-7 p-0"
              >
                <Grid3x3 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1 h-8 text-xs"
            >
              <Filter className="h-3.5 w-3.5" />
              {(selectedProcess || selectedType) && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {(selectedProcess ? 1 : 0) + (selectedType ? 1 : 0)}
                </Badge>
              )}
            </Button>

            {(searchTerm || selectedProcess || selectedType) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 w-8 p-0">
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div>
                    <label className="text-xs font-medium mb-1 block text-[#2e5244]">Proceso</label>
                    <select
                      value={selectedProcess || ''}
                      onChange={(e) => setSelectedProcess(e.target.value || null)}
                      className="w-full border rounded-lg px-2 py-1.5 text-xs bg-white"
                    >
                      <option value="">Todos</option>
                      {processes.map(proc => (
                        <option key={proc.id} value={proc.id}>
                          {proc.code} - {proc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1 block text-[#2e5244]">Tipo</label>
                    <select
                      value={selectedType || ''}
                      onChange={(e) => setSelectedType(e.target.value || null)}
                      className="w-full border rounded-lg px-2 py-1.5 text-xs bg-white"
                    >
                      <option value="">Todos</option>
                      {Object.values(FORMAT_TYPES).map(type => (
                        <option key={type.code} value={type.code}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#6dbd96]" />
            <p className="text-xs font-medium text-[#2e5244]">Cargando...</p>
          </div>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="p-6 text-center">
          <ClipboardList className="h-10 w-10 mx-auto mb-2 text-gray-300" />
          <h3 className="text-sm font-semibold text-gray-700 mb-1">No hay formatos</h3>
          <p className="text-xs text-gray-500">
            {searchTerm || selectedProcess || selectedType ? 'Ajusta los filtros' : 'Aún no hay registros'}
          </p>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="space-y-2">
          {filteredDocuments.map((doc, index) => (
            <FormatCardList key={doc.id} doc={doc} index={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {filteredDocuments.map((doc, index) => (
            <FormatCardGrid key={doc.id} doc={doc} index={index} />
          ))}
        </div>
      )}

      {documentToView && (
        <DocumentViewerModal
          isOpen={isViewerModalOpen}
          onClose={() => {
            setIsViewerModalOpen(false);
            setDocumentToView(null);
          }}
          document={documentToView}
        />
      )}
    </div>
  );
}