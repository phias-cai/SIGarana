// src/components/modules/MejoramientoContinuo/AccionesMejora/CierreAccionModal.jsx

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import {
  CheckCircle2, CalendarClock, AlertCircle,
  Loader2, Archive, Mail, User, Calendar
} from 'lucide-react';

const C = { primary: '#2e5244', secondary: '#6f7b2c', accent: '#6dbd96', beige: '#dedecc' };

export default function CierreAccionModal({ open, onClose, accion, onConfirm }) {
  const [closureType, setClosureType] = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (loading) return;
    setClosureType(''); setClosureReason(''); setError('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!closureType) { setError('Selecciona cómo se resuelve esta acción.'); return; }
    if (closureReason.trim().length < 10) { setError('Escribe al menos 10 caracteres.'); return; }
    setError(''); setLoading(true);
    try {
      await onConfirm(accion.id, { closure_type: closureType, closure_reason: closureReason.trim() });
      handleClose();
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getSem = () => {
    if (!accion?.proposed_date) return { label: 'Sin fecha límite', dot: 'bg-gray-400', text: 'text-gray-500' };
    const d = Math.ceil((new Date(accion.proposed_date) - new Date()) / 86400000);
    if (d < 0) return { label: `Vencida hace ${Math.abs(d)} día(s)`, dot: 'bg-red-500', text: 'text-red-600' };
    if (d === 0) return { label: 'Vence hoy', dot: 'bg-amber-400', text: 'text-amber-600' };
    if (d <= 7) return { label: `Vence en ${d} día(s)`, dot: 'bg-amber-400', text: 'text-amber-600' };
    return { label: `${d} días restantes`, dot: 'bg-green-500', text: 'text-green-600' };
  };

  if (!accion) return null;
  const sem = getSem();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-0">

        {/* ══ HEADER con fondo verde ═══════════════════════════════════════ */}
        <div className="px-6 py-5 rounded-t-lg" style={{ backgroundColor: C.primary }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Archive className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Resolución de Acción
              </h2>
              <p className="text-sm text-white/70 mt-0.5">
                Indica cómo se cierra o continúa esta acción
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* ══ TARJETA INFO DE LA ACCIÓN ════════════════════════════════ */}
          <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: C.beige }}>

            {/* Encabezado de la tarjeta */}
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: '#f0f5f3', borderBottom: `2px solid ${C.beige}` }}>
              <span className="text-base font-bold tracking-wide" style={{ color: C.primary }}>
                {accion.consecutive || '—'}
              </span>
              <div className={`flex items-center gap-1.5 text-sm font-semibold ${sem.text}`}>
                <div className={`h-2.5 w-2.5 rounded-full ${sem.dot}`} />
                {sem.label}
              </div>
            </div>

            {/* Hallazgo — campo más importante, bien visible */}
            <div className="px-4 pt-4 pb-3">
              <p className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: C.secondary }}>
                📋 Hallazgo
              </p>
              <p className="text-sm text-gray-800 leading-relaxed font-medium">
                {accion.finding_description
                  ? accion.finding_description
                  : <span className="italic text-gray-400">Sin descripción registrada</span>
                }
              </p>
            </div>

            {/* Metadata: responsable + fecha */}
            <div className="px-4 py-3 grid grid-cols-2 gap-3 border-t"
              style={{ backgroundColor: '#fafaf8', borderColor: C.beige }}>
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: C.accent }} />
                <div>
                  <p className="text-xs text-gray-400 leading-none mb-0.5">Responsable</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {accion.responsible_name && accion.responsible_name !== '—'
                      ? accion.responsible_name
                      : <span className="italic text-gray-400">Sin asignar</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: C.accent }} />
                <div>
                  <p className="text-xs text-gray-400 leading-none mb-0.5">Fecha propuesta</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {accion.proposed_date
                      ? new Date(accion.proposed_date + 'T00:00:00').toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })
                      : <span className="italic text-gray-400">Sin fecha</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ══ SELECCIÓN DE TIPO ════════════════════════════════════════ */}
          <div className="space-y-3">
            <p className="text-sm font-bold" style={{ color: C.primary }}>
              ¿Cómo se resuelve esta acción? <span className="text-red-500">*</span>
            </p>

            {/* Opción SI — Cerrar definitivamente */}
            <button type="button"
              onClick={() => { setClosureType('completed'); setError(''); }}
              className="w-full text-left rounded-xl border-2 p-4 transition-all duration-150 focus:outline-none"
              style={{
                borderColor: closureType === 'completed' ? '#16a34a' : '#e5e7eb',
                backgroundColor: closureType === 'completed' ? '#f0fdf4' : '#ffffff',
                boxShadow: closureType === 'completed' ? '0 0 0 3px #bbf7d0' : 'none',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: closureType === 'completed' ? '#dcfce7' : '#f3f4f6' }}>
                  <CheckCircle2 className="h-5 w-5"
                    style={{ color: closureType === 'completed' ? '#16a34a' : '#9ca3af' }} />
                </div>
                <div>
                  <p className="font-bold text-sm"
                    style={{ color: closureType === 'completed' ? '#15803d' : '#374151' }}>
                    ✅ Se cumplió el objetivo — <span className="underline">Cerrar (SI)</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    La acción fue implementada con éxito.{' '}
                    <strong>Se archivará y dejará de aparecer</strong> en la tabla.
                    Se notificará al responsable y a gerencia.
                  </p>
                </div>
              </div>
            </button>

            {/* Opción NO — En espera */}
            <button type="button"
              onClick={() => { setClosureType('pending_solution'); setError(''); }}
              className="w-full text-left rounded-xl border-2 p-4 transition-all duration-150 focus:outline-none"
              style={{
                borderColor: closureType === 'pending_solution' ? '#d97706' : '#e5e7eb',
                backgroundColor: closureType === 'pending_solution' ? '#fffbeb' : '#ffffff',
                boxShadow: closureType === 'pending_solution' ? '0 0 0 3px #fde68a' : 'none',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: closureType === 'pending_solution' ? '#fef3c7' : '#f3f4f6' }}>
                  <CalendarClock className="h-5 w-5"
                    style={{ color: closureType === 'pending_solution' ? '#d97706' : '#9ca3af' }} />
                </div>
                <div>
                  <p className="font-bold text-sm"
                    style={{ color: closureType === 'pending_solution' ? '#b45309' : '#374151' }}>
                    🕐 En espera de solución — <span className="underline">Dejar abierta (NO)</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    La acción <strong>permanece activa</strong> en la tabla.
                    Se enviará un correo al responsable y a gerencia con el seguimiento pendiente.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* ══ RAZÓN ═════════════════════════════════════════════════ */}
          {closureType && (
            <div className="space-y-2">
              <label className="text-sm font-bold block" style={{ color: C.primary }}>
                {closureType === 'completed'
                  ? '¿Cómo se implementó la acción? *'
                  : '¿Qué está pendiente y cuál es el plan? *'}
              </label>
              <Textarea
                placeholder={
                  closureType === 'completed'
                    ? 'Ej: Se realizó la capacitación, se actualizaron los procedimientos y se verificó su eficacia...'
                    : 'Ej: Pendiente aprobación de proveedores. Se espera respuesta la próxima semana para continuar...'
                }
                value={closureReason}
                onChange={(e) => { setClosureReason(e.target.value); setError(''); }}
                disabled={loading}
                rows={4}
                className="resize-none text-sm leading-relaxed"
                maxLength={500}
              />
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Mínimo 10 caracteres</span>
                <span className={`text-xs ${closureReason.length > 450 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {closureReason.length}/500
                </span>
              </div>
            </div>
          )}

          {/* ══ AVISO EMAIL ═══════════════════════════════════════════ */}
          {closureType && (
            <Alert className="border-blue-200 bg-blue-50">
              <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <AlertDescription className="text-blue-800 text-sm">
                {closureType === 'completed' ? (
                  <>Se enviará un correo de <strong>cierre definitivo</strong> a{' '}
                    <strong>{accion.responsible_name || 'el responsable'}</strong> y a <strong>gerencia</strong>.</>
                ) : (
                  <>Se enviará un correo de <strong>seguimiento pendiente</strong> a{' '}
                    <strong>{accion.responsible_name || 'el responsable'}</strong> y a <strong>gerencia</strong>.</>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* ══ ERROR ═════════════════════════════════════════════════ */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
        <div className="px-6 py-4 border-t flex justify-end gap-3"
          style={{ borderColor: C.beige, backgroundColor: '#fafaf8' }}>
          <Button variant="outline" onClick={handleClose} disabled={loading}
            className="border-2 px-5" style={{ borderColor: C.beige }}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !closureType || closureReason.trim().length < 10}
            className="px-6 text-white font-semibold"
            style={{
              backgroundColor:
                !closureType ? C.primary :
                  closureType === 'completed' ? '#16a34a' : '#d97706'
            }}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Procesando...</>
            ) : closureType === 'completed' ? (
              <><Archive className="h-4 w-4 mr-2" />Cerrar y archivar</>
            ) : closureType === 'pending_solution' ? (
              <><Mail className="h-4 w-4 mr-2" />Guardar y notificar</>
            ) : (
              'Confirmar'
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}