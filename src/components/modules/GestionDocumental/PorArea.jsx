// src/components/modules/GestionDocumental/PorArea.jsx
// ✅ VERSIÓN FINAL - Logo real Garana + Paleta oficial + Hojas grandes
// 🍃 7 procesos activos de Supabase

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
  ArrowLeft,
  Loader2
} from 'lucide-react';
// Importar logo
import garanaLogo from '/garana1.png'; // Ajusta la ruta según tu proyecto

// 🍃 Hojas flotantes decorativas - MÁS GRANDES
const FloatingLeaf = ({ delay, duration }) => {
  const randomX = Math.random() * 120 - 60;
  const randomRotate = Math.random() * 360;
  
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: '50%', top: '50%' }}
      initial={{ x: 0, y: 0, opacity: 0.7, scale: 0.5, rotate: 0 }}
      animate={{
        x: randomX,
        y: [0, -120, -240, -360],
        opacity: [0.7, 0.6, 0.4, 0],
        scale: [0.5, 0.7, 0.9, 1.1],
        rotate: [0, randomRotate, randomRotate * 2],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    >
      {/* Hoja Monstera estilizada - MÁS GRANDE */}
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        <path
          d="M30 5 C35 10, 40 15, 42 25 C43 32, 40 40, 35 45 C30 50, 25 52, 20 48 C15 44, 12 35, 15 28 C18 20, 23 12, 30 5 Z"
          fill="#6dbd96"
          opacity="0.4"
        />
        <path
          d="M30 15 L30 45 M20 25 L40 25 M22 35 L38 35"
          stroke="#2e5244"
          strokeWidth="1.5"
          opacity="0.3"
        />
      </svg>
    </motion.div>
  );
};

// 🎨 PALETA OFICIAL GARANA
const PROCESS_CONFIG = {
  'DP': { 
    name: 'GESTION DE DIRECCION',
    shortName: 'Dirección',
    color: '#2e5244', // Verde oscuro
    icon: '🎯'
  },
  'GS': { 
    name: 'GESTION DE CALIDAD Y SST',
    shortName: 'Calidad y SST',
    color: '#6dbd96', // Verde agua
    icon: '✅'
  },
  'GC': { 
    name: 'GESTION DE CLIENTES',
    shortName: 'Clientes',
    color: '#6f7b2c', // Verde oliva
    icon: '👥'
  },
  'GP': { 
    name: 'GESTION DE PRODUCCION',
    shortName: 'Producción',
    color: '#2e5244', // Verde oscuro
    icon: '⚙️'
  },
  'GR': { 
    name: 'GESTION DE PROVEEDORES',
    shortName: 'Proveedores',
    color: '#6dbd96', // Verde agua
    icon: '🚚'
  },
  'GH': { 
    name: 'GESTION TALENTO HUMANO',
    shortName: 'Talento Humano',
    color: '#6f7b2c', // Verde oliva
    icon: '🎓'
  },
  'GA': { 
    name: 'GESTION ADMINISTRATIVA Y FINANCIERA',
    shortName: 'Administrativa',
    color: '#2e5244', // Verde oscuro
    icon: '💼'
  }
};

// 📋 Categorías de documentos
const DOC_CATEGORIES = [
  { code: 'FO', label: 'Formatos', emoji: '📋' },
  { code: 'IN', label: 'Instructivos', emoji: '📘' },
  { code: 'PR', label: 'Procedimientos', emoji: '📑' },
  { code: 'GU', label: 'Guías', emoji: '📖' },
  { code: 'MN', label: 'Manuales', emoji: '📚' },
  { code: 'RE', label: 'Registros', emoji: '📝' }
];

export default function PorArea() {
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [documentToView, setDocumentToView] = useState(null);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);

  const { documents = [], loading } = useDocuments({});
  const { processes = [] } = useProcesses();
  const { downloadDocument, downloading } = useFileDownload();

  // 🔄 Agrupar documentos por proceso y categoría
  const groupedData = useMemo(() => {
    const grouped = {};

    // Inicializar con procesos activos
    processes.filter(p => p.is_active).forEach(proc => {
      const config = PROCESS_CONFIG[proc.code];
      if (!config) return;

      grouped[proc.code] = {
        id: proc.id,
        code: proc.code,
        name: config.name,
        shortName: config.shortName,
        color: config.color,
        icon: config.icon,
        categories: {},
        totalDocs: 0
      };
    });

    // Distribuir documentos
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
  const radius = 300; // Aumentado para mejor distribución
  const angleStep = (2 * Math.PI) / processArray.length;

  // 🎯 Handlers
  const handleViewDocument = (doc) => {
    setDocumentToView(doc);
    setIsViewerModalOpen(true);
  };

  const handleDownload = async (doc) => {
    await downloadDocument(doc);
  };

  // 🎨 Renderizar documento
  const DocumentCard = ({ doc }) => {
    const processData = processArray.find(p => p.id === doc.process_id);
    
    return (
      <motion.div 
        className="group flex items-center gap-3 p-4 rounded-xl border-2 bg-white hover:shadow-xl transition-all"
        style={{ borderColor: processData?.color || '#6dbd96' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, x: 5 }}
      >
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${processData?.color}20` }}
        >
          <FileText className="h-6 w-6" style={{ color: processData?.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="text-xs font-mono font-bold"
              style={{ color: processData?.color }}
            >
              {doc.code}
            </span>
            <Badge variant="secondary" className="text-xs">
              v{doc.version || 1}
            </Badge>
          </div>
          <p className="text-sm font-medium text-gray-900 truncate">
            {doc.name}
          </p>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewDocument(doc)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDownload(doc)}
            disabled={downloading === doc.id}
            className="h-8 w-8 p-0"
          >
            {downloading === doc.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </motion.div>
    );
  };

  // 🎨 Vista: Hub Central
  if (!selectedProcess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#dedecc] via-[#f0f0e8] to-white p-8 overflow-hidden">
        <div className="relative w-full max-w-5xl aspect-square flex items-center justify-center">
          {/* Hojas flotantes de fondo - MÁS HOJAS Y MÁS GRANDES */}
          {Array.from({ length: 25 }).map((_, i) => (
            <FloatingLeaf key={i} delay={i * 0.5} duration={6 + Math.random() * 4} />
          ))}

          {/* Centro - LOGO REAL GARANA */}
          <motion.div
            className="absolute z-10 w-72 h-72 rounded-full bg-white shadow-2xl flex flex-col items-center justify-center overflow-hidden border-4"
            style={{ borderColor: '#6dbd96' }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, type: 'spring', bounce: 0.4 }}
          >
            {/* Efecto de brillo rotando */}
            <motion.div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'radial-gradient(circle at 50% 50%, #6dbd96 0%, transparent 70%)'
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
            
            {/* LOGO REAL */}
            <motion.img
              src={garanaLogo}
              alt="Garana Art Logo"
              className="w-56 h-56 object-contain relative z-10"
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            
            {/* Texto debajo del logo */}
            <motion.p 
              className="text-sm font-medium relative z-10 mt-2"
              style={{ color: '#6f7b2c' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Sistema de Gestión
            </motion.p>
            
            {/* Partículas de hojas saliendo */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 8;
              return (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute w-4 h-4 rounded-full"
                  style={{ 
                    backgroundColor: '#6dbd96',
                    left: '50%',
                    top: '50%'
                  }}
                  animate={{
                    x: [0, Math.cos(angle) * 50],
                    y: [0, Math.sin(angle) * 50],
                    scale: [0, 1, 0],
                    opacity: [0, 0.7, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    delay: i * 0.25,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              );
            })}
          </motion.div>

          {/* Procesos en círculo - Forma de hoja MÁS GRANDES */}
          {processArray.map((proc, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            const labelDistance = radius + 90;
            const labelX = Math.cos(angle) * labelDistance;
            const labelY = Math.sin(angle) * labelDistance;

            return (
              <div key={proc.code}>
                <motion.div
                  className="absolute cursor-pointer"
                  style={{ left: '50%', top: '50%' }}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0, rotate: 0 }}
                  animate={{
                    scale: hoveredId === proc.code ? 1.2 : 1,
                    x: x - 70,
                    y: y - 70,
                    opacity: 1,
                    rotate: hoveredId === proc.code ? angle * (180 / Math.PI) + 25 : angle * (180 / Math.PI),
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: index * 0.15,
                  }}
                  whileHover={{ 
                    scale: 1.25,
                    rotate: angle * (180 / Math.PI) + 35,
                    transition: { duration: 0.3 }
                  }}
                  onHoverStart={() => setHoveredId(proc.code)}
                  onHoverEnd={() => setHoveredId(null)}
                  onClick={() => setSelectedProcess(proc.code)}
                >
                  {/* Forma de hoja - MÁS GRANDE (140x140) */}
                  <motion.div
                    className="relative w-36 h-36 overflow-hidden shadow-2xl border-4 border-white"
                    style={{ borderRadius: '50% 0 50% 50%' }}
                    animate={{
                      boxShadow: hoveredId === proc.code
                        ? `0 25px 50px ${proc.color}99`
                        : '0 15px 30px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {/* Fondo de color sólido */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${proc.color}dd, ${proc.color})`,
                      }}
                    />
                    
                    {/* Emoji central MÁS GRANDE */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl drop-shadow-2xl">
                        {proc.icon}
                      </span>
                    </div>

                    {/* Badge de documentos */}
                    {proc.totalDocs > 0 && (
                      <div 
                        className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full text-white text-sm font-bold shadow-xl"
                        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                      >
                        {proc.totalDocs}
                      </div>
                    )}

                    {/* Venas de hoja decorativas */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                      <div 
                        className="absolute top-1/2 left-1/2 w-full h-0.5 bg-white"
                        style={{
                          transform: 'translate(-50%, -50%) rotate(-45deg)',
                        }}
                      />
                      <div 
                        className="absolute top-1/3 left-1/2 w-2/3 h-0.5 bg-white"
                        style={{
                          transform: 'translate(-50%, -50%) rotate(-45deg)',
                        }}
                      />
                      <div 
                        className="absolute top-2/3 left-1/2 w-2/3 h-0.5 bg-white"
                        style={{
                          transform: 'translate(-50%, -50%) rotate(-45deg)',
                        }}
                      />
                    </div>
                  </motion.div>

                  {/* Efecto de pulso */}
                  <AnimatePresence>
                    {hoveredId === proc.code && (
                      <>
                        <motion.div
                          className="absolute inset-0 border-3"
                          style={{ 
                            borderColor: proc.color,
                            borderRadius: '50% 0 50% 50%',
                          }}
                          initial={{ scale: 1, opacity: 0.8 }}
                          animate={{ scale: 1.4, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        />
                        {/* Mini hojas cayendo */}
                        {Array.from({ length: 4 }).map((_, i) => (
                          <motion.div
                            key={`mini-leaf-${i}`}
                            className="absolute w-5 h-5"
                            style={{
                              backgroundColor: proc.color,
                              borderRadius: '50% 0 50% 50%',
                              left: '50%',
                              top: '50%',
                              opacity: 0.6
                            }}
                            initial={{ scale: 0, x: 0, y: 0 }}
                            animate={{
                              x: (Math.random() - 0.5) * 80,
                              y: [0, 50, 100],
                              scale: [0, 1, 0.3],
                              opacity: [0.8, 0.5, 0],
                              rotate: [0, 180, 360],
                            }}
                            transition={{
                              duration: 2,
                              delay: i * 0.15,
                              repeat: Infinity,
                            }}
                          />
                        ))}
                      </>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                {/* Etiqueta del proceso */}
                <motion.div
                  className="absolute cursor-pointer"
                  style={{ left: '50%', top: '50%' }}
                  initial={{ opacity: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: 1,
                    x: labelX - 70,
                    y: labelY - 18,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 20,
                    delay: index * 0.15 + 0.4,
                  }}
                  onClick={() => setSelectedProcess(proc.code)}
                >
                  <motion.div
                    className="px-5 py-2.5 rounded-xl shadow-xl border-2 border-white"
                    style={{ backgroundColor: proc.color }}
                    whileHover={{ scale: 1.08, y: -3 }}
                    animate={{ scale: hoveredId === proc.code ? 1.12 : 1 }}
                  >
                    <span className="text-white whitespace-nowrap drop-shadow-lg font-semibold text-sm">
                      {proc.shortName}
                    </span>
                  </motion.div>
                </motion.div>
              </div>
            );
          })}

          {/* Líneas conectoras - como ramas */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {processArray.map((_, index) => {
              const angle = index * angleStep - Math.PI / 2;
              const x1 = '50%';
              const y1 = '50%';
              const x2 = `calc(50% + ${Math.cos(angle) * radius}px)`;
              const y2 = `calc(50% + ${Math.sin(angle) * radius}px)`;
              const cx = `calc(50% + ${Math.cos(angle) * (radius / 2.5)}px)`;
              const cy = `calc(50% + ${Math.sin(angle) * (radius / 3)}px)`;

              return (
                <motion.path
                  key={index}
                  d={`M ${x1} ${y1} Q ${cx} ${cy}, ${x2} ${y2}`}
                  stroke="url(#gradient-branch)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.35 }}
                  transition={{ duration: 1.8, delay: index * 0.15 }}
                />
              );
            })}
            <defs>
              <linearGradient id="gradient-branch" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6f7b2c" />
                <stop offset="50%" stopColor="#2e5244" />
                <stop offset="100%" stopColor="#6dbd96" />
              </linearGradient>
            </defs>
          </svg>

          {/* Instrucción */}
          <motion.div 
            className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
          >
            <p className="text-sm font-medium" style={{ color: '#2e5244' }}>
              Selecciona un proceso para ver documentos
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // 🎨 Vista: Modal de Categorías
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
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div
              className="relative h-36 flex items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${processData.color}dd, ${processData.color})`,
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={`header-leaf-${i}`}
                  className="absolute w-20 h-20 bg-white/10"
                  style={{
                    borderRadius: '50% 0 50% 50%',
                    left: `${15 * i}%`,
                  }}
                  animate={{
                    y: [-30, 120],
                    rotate: [0, 200],
                    opacity: [0.4, 0],
                  }}
                  transition={{
                    duration: 3.5,
                    delay: i * 0.35,
                    repeat: Infinity,
                  }}
                />
              ))}
              
              <div className="text-center relative z-10">
                <div className="text-5xl mb-3">{processData.icon}</div>
                <h3 className="text-white text-xl font-bold px-4">
                  {processData.shortName}
                </h3>
                <p className="text-white/90 text-sm mt-1">
                  {processData.totalDocs} documentos disponibles
                </p>
              </div>

              <motion.button
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedProcess(null)}
              >
                <X size={22} />
              </motion.button>
            </div>

            <div className="p-6 space-y-3">
              {Object.values(processData.categories).map((category, index) => (
                <motion.button
                  key={category.code}
                  className="w-full py-4 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 transition-all relative overflow-hidden flex items-center justify-between px-5 border border-gray-200"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ scale: 1.02, x: 5, borderColor: processData.color }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCategory(category.code)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{category.emoji}</span>
                    <span className="font-semibold">{category.label}</span>
                  </div>
                  <Badge 
                    className="font-bold"
                    style={{ backgroundColor: processData.color, color: 'white' }}
                  >
                    {category.documents.length}
                  </Badge>
                  
                  <motion.div
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5"
                    style={{ 
                      backgroundColor: `${processData.color}25`,
                      borderRadius: '50% 0 50% 50%'
                    }}
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', delay: index * 0.25 }}
                  />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // 🎨 Vista: Lista de Documentos
  const categoryData = processData.categories[selectedCategory];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#dedecc] via-[#f0f0e8] to-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedCategory(null)}
            className="gap-2"
            style={{ color: processData.color }}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-600">{processData.shortName}</span>
              <span className="text-gray-400">›</span>
              <span className="text-2xl">{categoryData.emoji}</span>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: processData.color }}>
              {categoryData.label}
            </h2>
            <p className="text-sm text-gray-600">
              {categoryData.documents.length} {categoryData.documents.length === 1 ? 'documento' : 'documentos'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
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