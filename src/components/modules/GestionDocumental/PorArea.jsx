// src/components/modules/GestionDocumental/PorArea.jsx
// 🎯 MÍNIMO ESPACIO + DISTRIBUCIÓN HORIZONTAL

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocuments, useProcesses } from '@/hooks/useDocuments';
import { useFileDownload } from '@/hooks/useFileDownload';
import DocumentViewerModal from './DocumentViewerModal';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { 
  FileText, 
  Eye,
  Download,
  X,
  ChevronLeft,
  Loader2
} from 'lucide-react';

// 🎨 CONFIGURACIÓN DE PROCESOS
const PROCESS_CONFIG = {
  'DP': { 
    shortName: 'Dirección',
    color: '#2e5244',
    gradient: 'from-[#2e5244] to-[#1a3028]',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop'
  },
  'GS': { 
    shortName: 'Calidad y SST',
    color: '#6dbd96',
    gradient: 'from-[#6dbd96] to-[#4a9c73]',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop'
  },
  'GC': { 
    shortName: 'Clientes',
    color: '#6f7b2c',
    gradient: 'from-[#6f7b2c] to-[#4d541e]',
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop'
  },
  'GP': { 
    shortName: 'Producción',
    color: '#2e5244',
    gradient: 'from-[#2e5244] to-[#1a3028]',
    image: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=400&h=300&fit=crop'
  },
  'GR': { 
    shortName: 'Proveedores',
    color: '#6dbd96',
    gradient: 'from-[#6dbd96] to-[#4a9c73]',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop'
  },
  'GH': { 
    shortName: 'Talento Humano',
    color: '#6f7b2c',
    gradient: 'from-[#6f7b2c] to-[#4d541e]',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=300&fit=crop'
  },
  'GA': { 
    shortName: 'Administrativa',
    color: '#2e5244',
    gradient: 'from-[#2e5244] to-[#1a3028]',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop'
  }
};

const DOC_CATEGORIES = [
  { code: 'FO', label: 'Formatos', emoji: '📋' },
  { code: 'IN', label: 'Instructivos', emoji: '📘' },
  { code: 'PR', label: 'Procedimientos', emoji: '📑' },
  { code: 'GU', label: 'Guías', emoji: '📖' },
  { code: 'MN', label: 'Manuales', emoji: '📚' },
  { code: 'RE', label: 'Registros', emoji: '📝' }
];

// 🔷 Card optimizada
const ProcessCard = ({ 
  process, 
  x,
  y,
  onClick, 
  isHovered, 
  onHover,
  index 
}) => {
  return (
    <motion.div
      className="absolute cursor-pointer group"
      style={{
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%)`,
      }}
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{ 
        opacity: 1, 
        scale: isHovered ? 1.05 : 1,
        x: x,
        y: y,
      }}
      transition={{ 
        duration: 0.6,
        delay: index * 0.1,
        type: 'spring',
        stiffness: 120
      }}
      whileHover={{ 
        scale: 1.1,
        zIndex: 50,
        transition: { duration: 0.3 }
      }}
      onClick={onClick}
      onMouseEnter={() => onHover(process.code)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="relative">
        {/* Glow en hover */}
        <motion.div
          className="absolute inset-0 rounded-lg blur-xl opacity-0 group-hover:opacity-40"
          style={{ backgroundColor: process.color }}
          animate={{
            scale: isHovered ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Card */}
        <div 
          className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 shadow-lg bg-gradient-to-br ${process.gradient}`}
          style={{ 
            borderColor: process.color,
            boxShadow: `0 3px 12px ${process.color}30`
          }}
        >
          {/* Imagen de fondo */}
          <div className="absolute inset-0">
            <img
              src={process.image}
              alt={process.shortName}
              className="w-full h-full object-cover opacity-25 group-hover:opacity-35 transition-opacity duration-300"
            />
            <div 
              className="absolute inset-0 bg-gradient-to-br opacity-75"
              style={{
                background: `linear-gradient(135deg, ${process.color}cc, ${process.color}99)`
              }}
            />
          </div>

          {/* Contenido */}
          <div className="relative h-full flex flex-col items-center justify-center p-1 z-10">
            {/* Badge del código */}
            <motion.div
              className="w-9 h-9 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center mb-1 border border-white/30"
              animate={{
                boxShadow: isHovered 
                  ? [`0 0 8px ${process.color}`, `0 0 16px ${process.color}`, `0 0 8px ${process.color}`]
                  : `0 0 4px ${process.color}`
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-sm font-bold text-white">
                {process.code}
              </span>
            </motion.div>

            {/* Nombre */}
            <h3 className="text-white text-[9px] font-bold text-center leading-tight">
              {process.shortName}
            </h3>
          </div>

          {/* Corner lights */}
          <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-white opacity-40" />
          <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-white opacity-40" />
        </div>
      </div>
    </motion.div>
  );
};

export default function PorArea() {
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [documentToView, setDocumentToView] = useState(null);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);

  const { documents = [], loading } = useDocuments({});
  const { processes = [] } = useProcesses();
  const { downloadDocument, downloading } = useFileDownload();

  const groupedData = useMemo(() => {
    const grouped = {};

    processes.filter(p => p.is_active).forEach(proc => {
      const config = PROCESS_CONFIG[proc.code];
      if (!config) return;

      grouped[proc.code] = {
        id: proc.id,
        code: proc.code,
        shortName: config.shortName,
        color: config.color,
        gradient: config.gradient,
        image: config.image,
        categories: {},
        totalDocs: 0
      };
    });

    documents.forEach(doc => {
      const proc = processes.find(p => p.id === doc.process_id);
      if (!proc || !grouped[proc.code]) return;

      const typeCode = doc.document_type?.code || doc.document_type_code;
      if (!typeCode) return;

      if (!grouped[proc.code].categories[typeCode]) {
        const category = DOC_CATEGORIES.find(c => c.code === typeCode);
        grouped[proc.code].categories[typeCode] = {
          code: typeCode,
          label: category?.label || typeCode,
          emoji: category?.emoji || '📄',
          documents: []
        };
      }

      grouped[proc.code].categories[typeCode].documents.push(doc);
      grouped[proc.code].totalDocs++;
    });

    return grouped;
  }, [documents, processes]);

  const processArray = Object.values(groupedData);
  
  // DISTRIBUCIÓN HORIZONTAL - Elipse en lugar de círculo
  const radiusX = 230; // Más ancho
  const radiusY = 140; // Más bajo
  const angleStep = (2 * Math.PI) / processArray.length;

  const handleViewDocument = (doc) => {
    setDocumentToView(doc);
    setIsViewerModalOpen(true);
  };

  const handleDownload = async (doc) => {
    await downloadDocument(doc);
  };

  const DocumentCard = ({ doc }) => {
    const processData = processArray.find(p => p.id === doc.process_id);
    
    return (
      <motion.div 
        className="group flex items-center gap-2 p-2 rounded-lg border bg-white hover:shadow-md transition-all"
        style={{ borderColor: processData?.color || '#6dbd96' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
      >
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${processData?.color}20` }}
        >
          <FileText className="h-4 w-4" style={{ color: processData?.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span 
              className="text-xs font-mono font-bold"
              style={{ color: processData?.color }}
            >
              {doc.code}
            </span>
            <Badge variant="secondary" className="text-xs py-0 h-4">
              v{doc.version || 1}
            </Badge>
          </div>
          <p className="text-xs font-medium text-gray-900 truncate">
            {doc.name}
          </p>
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDocument(doc)}
            disabled={!doc.file_path}
            className="h-7 w-7 p-0"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(doc)}
            disabled={downloading === doc.id || !doc.file_path}
            className="h-7 w-7 p-0"
          >
            {downloading === doc.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
          </Button>
        </div>
      </motion.div>
    );
  };

  // Vista Principal - COMPACTO Y OPTIMIZADO
  if (!selectedProcess) {
    return (
      <div className="relative w-full h-[480px] overflow-hidden bg-gradient-to-br from-[#f8f9f5] via-white to-[#f0f0e8] flex items-center justify-center">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-[#6dbd96] rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-[#2e5244] rounded-full blur-3xl" />
        </div>

        {/* Contenedor centrado - MÁS ANCHO QUE ALTO */}
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="relative" style={{ width: '500px', height: '340px' }}>
            {/* Centro: SIG + Logo */}
            <motion.div
              className="absolute flex flex-col items-center justify-center"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 20
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3, type: 'spring' }}
            >
              {/* SIG */}
              <motion.h1
                className="text-5xl font-bold tracking-wider mb-2"
                style={{ 
                  color: '#2e5244',
                  textShadow: '0 2px 15px rgba(109, 189, 150, 0.3)'
                }}
                animate={{ 
                  scale: [1, 1.02, 1],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                SIG
              </motion.h1>
              
              {/* Logo */}
              <motion.img
                src="/garanatext.png"
                alt="Garana"
                className="w-28 h-auto opacity-90"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 0.9, y: 0 }}
                transition={{ delay: 0.8 }}
              />
            </motion.div>

            {/* Cards en ELIPSE HORIZONTAL */}
            {processArray.map((process, index) => {
              const angle = index * angleStep - Math.PI / 2;
              const x = Math.cos(angle) * radiusX;
              const y = Math.sin(angle) * radiusY;
              
              return (
                <ProcessCard
                  key={process.code}
                  process={process}
                  x={x}
                  y={y}
                  onClick={() => setSelectedProcess(process.code)}
                  isHovered={hoveredId === process.code}
                  onHover={setHoveredId}
                  index={index}
                />
              );
            })}
          </div>
        </div>

        {loading && (
          <motion.div
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#6dbd96]" />
              <p className="text-xs font-medium text-[#2e5244]">Cargando...</p>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  const processData = groupedData[selectedProcess];
  
  if (!selectedCategory) {
    return (
      <>
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedProcess(null)}
        />

        <motion.div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2" style={{ borderColor: processData.color }}>
            <div
              className="relative h-24 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${processData.color}dd, ${processData.color})` }}
            >
              <div className="text-center relative z-10">
                <h3 className="text-white text-lg font-bold px-4">
                  {processData.shortName}
                </h3>
                <p className="text-white/90 text-sm mt-1">
                  {processData.totalDocs} documentos
                </p>
              </div>

              <motion.button
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedProcess(null)}
              >
                <X size={18} />
              </motion.button>
            </div>

            <div className="p-4 space-y-2">
              {Object.values(processData.categories).map((category, index) => (
                <motion.button
                  key={category.code}
                  className="w-full py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-between px-4 border border-gray-200"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ scale: 1.02, borderColor: processData.color }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCategory(category.code)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.emoji}</span>
                    <span className="font-semibold text-sm">{category.label}</span>
                  </div>
                  <Badge style={{ backgroundColor: processData.color, color: 'white' }}>
                    {category.documents.length}
                  </Badge>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  const categoryData = processData.categories[selectedCategory];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#dedecc] via-[#f0f0e8] to-white p-3">
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="gap-1 h-8"
            style={{ color: processData.color }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600">{processData.shortName}</span>
              <span className="text-gray-400">›</span>
              <span className="text-lg">{categoryData.emoji}</span>
              <span className="font-semibold" style={{ color: processData.color }}>
                {categoryData.label}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {categoryData.documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>

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
    </div>
  );
}