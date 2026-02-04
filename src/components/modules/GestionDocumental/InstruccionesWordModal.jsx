// =====================================================
// InstruccionesWordModal.jsx
// Modal que muestra instrucciones después de descargar Word
// =====================================================

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function InstruccionesWordModal({ 
  open, 
  onClose, 
  code, 
  version, 
  name 
}) {
  const [copied, setCopied] = useState(null);

  // Formatear datos
  const today = new Date();
  const formattedDate = today.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const versionFormatted = String(version).padStart(2, '0');

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            📝 Plantilla Word Descargada
          </DialogTitle>
          <DialogDescription>
            Completa el encabezado con estos valores
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alerta principal */}
          <Alert className="bg-blue-50 border-blue-300">
            <AlertDescription className="text-blue-900">
              <strong>⚠️ IMPORTANTE:</strong> La plantilla incluye el logo INDECON, 
              pero debes completar manualmente el encabezado del documento.
            </AlertDescription>
          </Alert>

          {/* Tabla de valores */}
          <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
            <h3 className="font-bold text-lg mb-3 text-green-900">
              ✅ Valores para el Encabezado:
            </h3>
            
            <div className="space-y-3">
              {/* CODIGO */}
              <div className="flex items-center justify-between bg-white p-3 rounded border">
                <div>
                  <span className="font-semibold text-gray-700">CODIGO:</span>
                  <code className="ml-3 text-xl font-mono text-green-700">{code}</code>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(code, 'code')}
                >
                  {copied === 'code' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* VERSION */}
              <div className="flex items-center justify-between bg-white p-3 rounded border">
                <div>
                  <span className="font-semibold text-gray-700">VERSION:</span>
                  <code className="ml-3 text-xl font-mono text-green-700">{versionFormatted}</code>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(versionFormatted, 'version')}
                >
                  {copied === 'version' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* FECHA */}
              <div className="flex items-center justify-between bg-white p-3 rounded border">
                <div>
                  <span className="font-semibold text-gray-700">FECHA:</span>
                  <code className="ml-3 text-xl font-mono text-green-700">{formattedDate}</code>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(formattedDate, 'date')}
                >
                  {copied === 'date' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* PAGINA */}
              <div className="flex items-center justify-between bg-white p-3 rounded border">
                <div>
                  <span className="font-semibold text-gray-700">PAGINA:</span>
                  <code className="ml-3 text-xl font-mono text-green-700">1 de 1</code>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard('1 de 1', 'page')}
                >
                  {copied === 'page' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Pasos */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-bold text-lg mb-3">📋 Pasos a seguir:</h3>
            <ol className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>Abre el archivo <strong>{code}_Plantilla_v{versionFormatted}.docx</strong> que se descargó</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>Haz <strong>doble clic en el ENCABEZADO</strong> (parte superior del documento con el logo)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>Copia y pega los valores de arriba en las celdas correspondientes (puedes usar los botones 📋)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">4.</span>
                <span>Completa el <strong>CONTENIDO</strong> del documento: <em>{name}</em></span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">5.</span>
                <span>Guarda el documento y <strong>súbelo aquí</strong> en el formulario</span>
              </li>
            </ol>
          </div>

          {/* Nota final */}
          <Alert>
            <AlertDescription className="text-sm">
              💡 <strong>Tip:</strong> Los valores ya están copiados en tu portapapeles. 
              Solo haz clic en los botones de copiar 📋 para copiar cada valor individualmente.
            </AlertDescription>
          </Alert>

          {/* Botón cerrar */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={onClose}
              style={{ backgroundColor: '#6dbd96' }}
              className="text-white"
            >
              ✅ Entendido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}