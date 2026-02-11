// src/components/modules/GestionDocumental/Procedimientos.jsx
// 📑 PROCEDIMIENTOS - Espacios ULTRA reducidos

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
  X
} from 'lucide-react';

export default function Procedimientos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [documentToView, setDocumentToView] = useState(null);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);

  const { documents = [], loading } = useDocuments({});
  const { processes = [] } = useProcesses();
  const { downloadDocument, downloading } = useFileDownload();

  const procedureDocuments = useMemo(() => {
    return documents.filter(doc => {
      const typeCode = doc.document_type?.code || doc.document_type_code;
      return typeCode === 'PR';
    });
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return procedureDocuments.filter(doc => {
      const matchesSearch = !searchTerm || 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesProcess = !selectedProcess || doc.process_id === selectedProcess;
      
      return matchesSearch && matchesProcess;
    });
  }, [procedureDocuments, searchTerm, selectedProcess]);

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
  };

  const ProcedureCard = ({ doc, index }) => {
    const process = processes.find(p => p.id === doc.process_id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02 }}
      >
        <Card className="overflow-hidden border hover:shadow-md transition-all">
          <div className="flex items-center">
            <div className="w-1 h-full bg-[#2e5244]" />
            <div className="w-12 flex items-center justify-center bg-[#2e524408] py-2">
              <FileText className="h-5 w-5 text-[#2e5244]" />
            </div>

            <div className="flex-1 p-2 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge className="font-mono text-xs bg-[#2e5244] text-white py-0 h-5">
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

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl font-bold text-[#2e5244]">
            Procedimientos
          </h2>
          <Badge variant="secondary" className="text-xs">
            {filteredDocuments.length} de {procedureDocuments.length}
          </Badge>
        </div>
        <p className="text-xs text-gray-600 mt-0.5">
          Procedimientos operativos
        </p>
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1 h-8 text-xs"
            >
              <Filter className="h-3.5 w-3.5" />
              {selectedProcess && <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">1</Badge>}
            </Button>

            {(searchTerm || selectedProcess) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 w-8 p-0"
              >
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
                <div className="pt-2 border-t">
                  <label className="text-xs font-medium mb-1 block text-[#2e5244]">
                    Proceso
                  </label>
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
          <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            No hay procedimientos
          </h3>
          <p className="text-xs text-gray-500">
            {searchTerm || selectedProcess ? 'Ajusta los filtros' : 'Aún no hay registros'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc, index) => (
            <ProcedureCard key={doc.id} doc={doc} index={index} />
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