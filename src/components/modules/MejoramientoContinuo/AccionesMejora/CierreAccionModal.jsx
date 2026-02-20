// src/components/modules/MejoramientoContinuo/AccionesMejora/CierreAccionModal.jsx

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/app/components/ui/dialog';
import { Button }   from '@/app/components/ui/button';
import { Label }    from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { CheckCircle2, Clock, AlertCircle, Loader2, Archive, CalendarClock } from 'lucide-react';

const C = {
  primary:   '#2e5244',
  secondary: '#6f7b2c',
  accent:    '#6dbd96',
  beige:     '#dedecc',
};

export default function CierreAccionModal({ open, onClose, accion, onConfirm }) {
  const [closureType,   setClosureType]   = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  const handleClose = () => {
    if (loading) return;
    setClosureType('');
    setClosureReason('');
    setError('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!closureType) {
      setError('Selecciona cómo se resuelve esta acción.');
      return;
    }
    if (!closureReason.trim() || closureReason.trim().length < 10) {
      setError('Escribe al menos 10 caracteres explicando la razón.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onConfirm(accion.id, {
        closure_type:   closureType,
        closure_reason: closureReason.trim(),
      });
      handleClose();
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getSemaforo = () => {
    if (!accion?.proposed_date) return { label: 'Sin fecha límite', icon: '⚪', cls: 'text-gray-400' };
    const days = Math.ceil((new Date(accion.proposed_date) - new Date()) / 86400000);
    if (days < 0)  return { label: `Vencida hace ${Math.abs(days)} día(s)`, icon: '🔴', cls: 'text-red-600' };
    if (days === 0) return { label: 'Vence hoy',                             icon: '🟡', cls: 'text-amber-600' };
    if (days <= 7) return { label: `Vence en ${days} día(s)`,               icon: '🟡', cls: 'text-amber-600' };
    return           { label: `Vigente · ${days} días restantes`,           icon: '🟢', cls: 'text-green-600' };
  };

  if (!accion) return null;
  const sem = getSemaforo();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {/*
        max-h-[90vh] + overflow-y-auto → scroll cuando el contenido no cabe
        max-w-xl → un poco más ancho para respirar
      */}
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">

        {/* ── Título ────────────────────────────────────────────────────── */}
        <DialogHeader className="pb-2">
          <DialogTitle
            className="flex items-center gap-2 text-lg font-bold"
            style={{ color: C.primary }}
          >
            <Archive className="h-5 w-5 flex-shrink-0" />
            Resolución de Acción de Mejora
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Indica cómo se resuelve esta acción antes de continuar.
          </p>
        </DialogHeader>

        {/* ── Tarjeta resumen de la acción ──────────────────────────────── */}
        <div
          className="rounded-xl p-5 space-y-3 border-2"
          style={{ borderColor: C.beige, backgroundColor: '#f7f7f4' }}
        >
          {/* Consecutivo + semáforo */}
          <div className="flex items-start justify-between gap-3">
            <span
              className="text-base font-bold tracking-wide"
              style={{ color: C.primary }}
            >
              {accion.consecutive || '—'}
            </span>
            <span className={`text-sm font-semibold flex items-center gap-1 ${sem.cls}`}>
              {sem.icon} {sem.label}
            </span>
          </div>

          {/* Hallazgo */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.secondary }}>
              Hallazgo
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {accion.finding_description || 'Sin descripción'}
            </p>
          </div>

          {/* Responsable + fecha */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 border-t" style={{ borderColor: C.beige }}>
            {accion.responsible_name && accion.responsible_name !== '—' && (
              <div>
                <span className="text-xs text-gray-400 block">Responsable</span>
                <span className="text-sm font-medium text-gray-700">{accion.responsible_name}</span>
              </div>
            )}
            {accion.proposed_date && (
              <div>
                <span className="text-xs text-gray-400 block">Fecha propuesta</span>
                <span className="text-sm font-medium text-gray-700">
                  {new Date(accion.proposed_date + 'T00:00:00').toLocaleDateString('es-CO', {
                    day: '2-digit', month: 'long', year: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Pregunta + opciones ───────────────────────────────────────── */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold" style={{ color: C.primary }}>
            ¿Cómo se resuelve esta acción? <span className="text-red-500">*</span>
          </Label>

          {/* Opción A — Se cumplió (SI) */}
          <button
            type="button"
            onClick={() => { setClosureType('completed'); setError(''); }}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-150 ${
              closureType === 'completed'
                ? 'border-green-500 bg-green-50 shadow-sm'
                : 'border-gray-200 hover:border-green-300 hover:bg-green-50/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${
                closureType === 'completed' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <CheckCircle2 className={`h-5 w-5 ${
                  closureType === 'completed' ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${
                  closureType === 'completed' ? 'text-green-700' : 'text-gray-700'
                }`}>
                  ✅ Se cumplió el objetivo — Cerrar (SI)
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  La acción fue implementada con éxito. Se archivará y dejará de aparecer en la tabla.
                </p>
              </div>
            </div>
          </button>

          {/* Opción B — En espera de solución (NO) */}
          <button
            type="button"
            onClick={() => { setClosureType('pending_solution'); setError(''); }}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-150 ${
              closureType === 'pending_solution'
                ? 'border-amber-500 bg-amber-50 shadow-sm'
                : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${
                closureType === 'pending_solution' ? 'bg-amber-100' : 'bg-gray-100'
              }`}>
                <CalendarClock className={`h-5 w-5 ${
                  closureType === 'pending_solution' ? 'text-amber-600' : 'text-gray-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${
                  closureType === 'pending_solution' ? 'text-amber-700' : 'text-gray-700'
                }`}>
                  🕐 En espera de solución — Dejar abierta (NO)
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  La acción <strong>permanece activa</strong>. Se notificará al responsable por correo con
                  la razón y el seguimiento pendiente.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* ── Razón del cierre ──────────────────────────────────────────── */}
        <div className="space-y-2">
          <Label htmlFor="closure_reason" className="text-sm font-semibold" style={{ color: C.primary }}>
            {closureType === 'completed'
              ? 'Describe cómo se implementó la acción'
              : closureType === 'pending_solution'
              ? 'Describe qué está pendiente y el plan de seguimiento'
              : 'Razón'}{' '}
            <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="closure_reason"
            placeholder={
              closureType === 'completed'
                ? 'Ej: Se realizó la capacitación del equipo, se actualizaron los procedimientos y se verificó la eficacia...'
                : closureType === 'pending_solution'
                ? 'Ej: La acción está en proceso, pendiente aprobación de proveedores. Se espera respuesta para la próxima semana...'
                : 'Primero selecciona una opción arriba...'
            }
            value={closureReason}
            onChange={(e) => { setClosureReason(e.target.value); setError(''); }}
            disabled={!closureType || loading}
            rows={4}
            className="resize-none text-sm leading-relaxed"
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Mínimo 10 caracteres</span>
            <span className={`text-xs ${closureReason.length > 450 ? 'text-amber-500' : 'text-gray-400'}`}>
              {closureReason.length}/500
            </span>
          </div>
        </div>

        {/* ── Aviso contextual ──────────────────────────────────────────── */}
        {closureType === 'completed' && (
          <Alert className="border-green-300 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <AlertDescription className="text-green-700 text-sm">
              Esta acción quedará <strong>archivada</strong> y no aparecerá en la tabla principal.
            </AlertDescription>
          </Alert>
        )}

        {closureType === 'pending_solution' && (
          <Alert className="border-amber-300 bg-amber-50">
            <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <AlertDescription className="text-amber-800 text-sm">
              La acción <strong>seguirá visible</strong> en la tabla. Se enviará un correo a{' '}
              <strong>{accion.responsible_name || 'el responsable'}</strong> con el seguimiento.
            </AlertDescription>
          </Alert>
        )}

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="border-2 text-sm px-5"
            style={{ borderColor: C.beige }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !closureType || closureReason.trim().length < 10}
            className="text-sm px-5 text-white"
            style={{
              backgroundColor: closureType === 'completed' ? '#16a34a'
                             : closureType === 'pending_solution' ? '#d97706'
                             : C.primary
            }}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...</>
            ) : closureType === 'completed' ? (
              <><Archive className="h-4 w-4 mr-2" /> Cerrar y archivar</>
            ) : closureType === 'pending_solution' ? (
              <><Clock className="h-4 w-4 mr-2" /> Guardar y notificar</>
            ) : (
              'Confirmar'
            )}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}