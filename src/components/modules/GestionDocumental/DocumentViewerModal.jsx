import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

/**
 * Modal para visualizar documentos (Word, Excel, PDF)
 * Usa Google Docs Viewer para Word/Excel y visor nativo para PDF
 */
const DocumentViewerModal = ({ document, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signedUrl, setSignedUrl] = useState(null);

  useEffect(() => {
    if (isOpen && document?.file_path) {
      loadDocument();
    }

    // Cleanup al cerrar
    return () => {
      setSignedUrl(null);
      setError(null);
      setLoading(true);
    };
  }, [isOpen, document]);

  // Cargar URL firmada del documento
  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📄 Cargando documento:', document.file_path);

      // Obtener URL firmada (válida por 1 hora)
      const { data, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_path, 3600);

      if (urlError) throw urlError;

      console.log('✅ URL firmada obtenida:', data.signedUrl);
      setSignedUrl(data.signedUrl);

    } catch (err) {
      console.error('❌ Error cargando documento:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Descargar el archivo
  const handleDownload = async () => {
    try {
      console.log('📥 Descargando archivo:', document.file_path);

      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      // Crear URL temporal para descargar
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name || document.file_path.split('/').pop();
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ Archivo descargado');
    } catch (error) {
      console.error('❌ Error descargando archivo:', error);
      alert('Error al descargar el archivo: ' + error.message);
    }
  };

  // Detectar tipo de archivo
  const getFileType = () => {
    if (!document?.file_path) return 'unknown';
    
    const extension = document.file_path.split('.').pop().toLowerCase();
    
    if (extension === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(extension)) return 'word';
    if (['xls', 'xlsx'].includes(extension)) return 'excel';
    if (['ppt', 'pptx'].includes(extension)) return 'powerpoint';
    
    return 'unknown';
  };

  // Obtener URL del visor según tipo
  const getViewerUrl = () => {
    if (!signedUrl) return null;

    const fileType = getFileType();
    
    // PDF: visor nativo del navegador
    if (fileType === 'pdf') {
      return signedUrl;
    }
    
    // Word, Excel, PowerPoint: Google Docs Viewer
    if (['word', 'excel', 'powerpoint'].includes(fileType)) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}&embedded=true`;
    }
    
    return null;
  };

  if (!isOpen || !document) return null;

  const fileType = getFileType();
  const viewerUrl = getViewerUrl();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: '#dedecc' }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="h-5 w-5 flex-shrink-0" style={{ color: '#6dbd96' }} />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold truncate" style={{ color: '#2e5244' }}>
                {document.name}
              </h2>
              <p className="text-sm text-gray-600 truncate">
                {document.code} • v{String(document.version).padStart(2, '0')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Botón Descargar */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#6f7b2c', color: '#6f7b2c' }}
              title="Descargar archivo"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Descargar</span>
            </button>

            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
              title="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
              <p className="text-gray-600">Cargando documento...</p>
            </div>
          )}

          {error && (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium mb-2">Error al cargar el documento</p>
              <p className="text-gray-600 text-sm mb-4">{error}</p>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: '#6dbd96' }}
              >
                <Download className="h-4 w-4" />
                Descargar Documento
              </button>
            </div>
          )}

          {!loading && !error && viewerUrl && (
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
              title={`Visor de ${document.name}`}
              onError={() => {
                console.error('Error cargando iframe');
                setError('No se pudo cargar el visor. Intenta descargar el archivo.');
              }}
            />
          )}

          {!loading && !error && !viewerUrl && (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium mb-2">
                No se puede visualizar este tipo de archivo
              </p>
              <p className="text-gray-500 text-sm mb-4">
                Tipo: {fileType}
              </p>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: '#6dbd96' }}
              >
                <Download className="h-4 w-4" />
                Descargar Archivo
              </button>
            </div>
          )}
        </div>

        {/* Footer con información */}
        {!loading && !error && (
          <div className="p-3 border-t bg-gray-50" style={{ borderColor: '#dedecc' }}>
            <p className="text-xs text-gray-500 text-center">
              {fileType === 'pdf' && '📄 Visualizando PDF'}
              {['word', 'excel', 'powerpoint'].includes(fileType) && '📊 Visualizando con Google Docs Viewer'}
              {fileType === 'unknown' && '📎 Archivo descargable'}
              {' • '}
              Si no se visualiza correctamente, usa el botón "Descargar"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewerModal;