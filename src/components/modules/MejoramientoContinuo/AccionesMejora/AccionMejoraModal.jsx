// src/components/modules/MejoramientoContinuo/AccionesMejora/AccionMejoraModal.jsx
import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input }  from '@/app/components/ui/input';
import { Loader2, X, Save } from 'lucide-react';
import { useAccionesMejora, useProfiles } from '@/hooks/useAccionesMejora';
import { useProcesses } from '@/hooks/useDocuments';

function Section({ title, color = '#2e5244', children }) {
  return (
    <div className="rounded-lg border-2 overflow-hidden" style={{ borderColor: color }}>
      <div className="px-4 py-2 text-white text-xs font-bold uppercase tracking-wider"
        style={{ backgroundColor: color }}>
        {title}
      </div>
      <div className="p-4 space-y-3 bg-white">{children}</div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#2e5244' }}>
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function CheckItem({ label, checked, onChange, disabled }) {
  return (
    <label className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer transition-colors
      ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}
      ${checked ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
      <input type="checkbox" checked={!!checked} onChange={onChange} disabled={disabled}
        className="w-3 h-3" style={{ accentColor: '#2e5244' }} />
      {label}
    </label>
  );
}

const FORM_INICIAL = {
  date: new Date().toISOString().split('T')[0],
  process_id: '', origin_audit: false, origin_satisfaction: false,
  origin_qrs: false, origin_autocontrol: false,
  origin_risk_analysis: false, origin_nonconforming: false,
  finding_description: '', action_correction: false,
  action_corrective: false, action_preventive: false,
  causes: '', action_description: '', expected_results: '',
  resources_budget: '', responsible_id: '', proposed_date: '',
  verification_criteria: '', verification_finding: '',
  verification_date: '', efficacy_date: '',
};

export default function AccionMejoraModal({ isOpen, mode, accion, onClose, onSuccess }) {
  const isView   = mode === 'view';
  const isEdit   = mode === 'edit';
  const isCreate = mode === 'create';

  const { createAccion, updateAccion } = useAccionesMejora();
  const { profiles }       = useProfiles();
  const { processes = [] } = useProcesses() || {};

  const [form,   setForm]   = useState(FORM_INICIAL);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (accion && (isEdit || isView)) {
      setForm({
        date:                  accion.date || '',
        process_id:            accion.process_id || '',
        origin_audit:          !!accion.origin_audit,
        origin_satisfaction:   !!accion.origin_satisfaction,
        origin_qrs:            !!accion.origin_qrs,
        origin_autocontrol:    !!accion.origin_autocontrol,
        origin_risk_analysis:  !!accion.origin_risk_analysis,
        origin_nonconforming:  !!accion.origin_nonconforming,
        finding_description:   accion.finding_description || '',
        action_correction:     !!accion.action_correction,
        action_corrective:     !!accion.action_corrective,
        action_preventive:     !!accion.action_preventive,
        causes:                accion.causes || '',
        action_description:    accion.action_description || '',
        expected_results:      accion.expected_results || '',
        resources_budget:      accion.resources_budget || '',
        responsible_id:        accion.responsible_id || '',
        proposed_date:         accion.proposed_date || '',
        verification_criteria: accion.verification_criteria || '',
        verification_finding:  accion.verification_finding || '',
        verification_date:     accion.verification_date || '',
        efficacy_date:         accion.efficacy_date || '',
      });
    } else {
      setForm(FORM_INICIAL);
    }
    setErrors({});
  }, [accion, mode]);

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.date)                        e.date = 'Obligatorio';
    if (!form.process_id)                  e.process_id = 'Obligatorio';
    if (!form.finding_description?.trim()) e.finding_description = 'Obligatorio';
    if (!form.responsible_id)             e.responsible_id = 'Obligatorio';
    if (!form.proposed_date)              e.proposed_date = 'Obligatorio';
    const hasOrigen = form.origin_audit || form.origin_satisfaction || form.origin_qrs
      || form.origin_autocontrol || form.origin_risk_analysis || form.origin_nonconforming;
    if (!hasOrigen) e.origin = 'Selecciona al menos uno';
    const hasTipo = form.action_correction || form.action_corrective || form.action_preventive;
    if (!hasTipo) e.action_type = 'Selecciona al menos uno';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const result = isCreate
        ? await createAccion(form)
        : await updateAccion(accion.id, form);
      if (result.success) onSuccess();
      else alert('Error: ' + result.error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    // ── Overlay centrado ────────────────────────────────────────────────────
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* ── Modal centrado ─────────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col bg-white rounded-xl shadow-2xl w-full"
        style={{ maxWidth: '860px', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 rounded-t-xl flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #2e5244 0%, #6dbd96 100%)' }}>
          <div>
            <h2 className="text-lg font-bold text-white">
              {isCreate && '➕ Nueva Acción de Mejora'}
              {isEdit   && `✏️ Editar: ${accion?.consecutive}`}
              {isView   && `👁️ Ver: ${accion?.consecutive}`}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#dedecc' }}>
              Formato AM · Mejoramiento Continuo · Garana SIG
            </p>
          </div>
          <button onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body con scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── IDENTIFICACIÓN ── */}
          <Section title="🔍 Identificación" color="#2e5244">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fecha" required>
                <Input type="date" value={form.date} disabled={isView}
                  onChange={e => set('date', e.target.value)}
                  className={errors.date ? 'border-red-400' : ''} />
                {errors.date && <p className="text-red-500 text-xs">{errors.date}</p>}
              </Field>
              <Field label="Proceso" required>
                <select value={form.process_id} disabled={isView}
                  onChange={e => set('process_id', e.target.value)}
                  className={`w-full p-2 border rounded text-sm ${errors.process_id ? 'border-red-400' : 'border-gray-300'}`}>
                  <option value="">Seleccionar...</option>
                  {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errors.process_id && <p className="text-red-500 text-xs">{errors.process_id}</p>}
              </Field>
            </div>

            <Field label="Origen del hallazgo" required>
              <div className="grid grid-cols-3 gap-2">
                <CheckItem label="Auditoría"                  checked={form.origin_audit}         disabled={isView} onChange={() => set('origin_audit',         !form.origin_audit)} />
                <CheckItem label="Satisfacción del cliente"   checked={form.origin_satisfaction}  disabled={isView} onChange={() => set('origin_satisfaction',  !form.origin_satisfaction)} />
                <CheckItem label="QRS"                        checked={form.origin_qrs}           disabled={isView} onChange={() => set('origin_qrs',           !form.origin_qrs)} />
                <CheckItem label="Autocontrol / Gest. cambio" checked={form.origin_autocontrol}   disabled={isView} onChange={() => set('origin_autocontrol',   !form.origin_autocontrol)} />
                <CheckItem label="Análisis de riesgos"        checked={form.origin_risk_analysis} disabled={isView} onChange={() => set('origin_risk_analysis', !form.origin_risk_analysis)} />
                <CheckItem label="Pto no conforme"            checked={form.origin_nonconforming} disabled={isView} onChange={() => set('origin_nonconforming', !form.origin_nonconforming)} />
              </div>
              {errors.origin && <p className="text-red-500 text-xs mt-1">{errors.origin}</p>}
            </Field>

            <Field label="Descripción del hallazgo" required>
              <textarea value={form.finding_description} disabled={isView} rows={3}
                onChange={e => set('finding_description', e.target.value)}
                placeholder="Describa detalladamente el hallazgo..."
                className={`w-full p-3 border rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-300
                  ${errors.finding_description ? 'border-red-400' : 'border-gray-300'}`} />
              {errors.finding_description && <p className="text-red-500 text-xs">{errors.finding_description}</p>}
            </Field>
          </Section>

          {/* ── ANÁLISIS ── */}
          <Section title="🔬 Análisis" color="#6f7b2c">
            <Field label="Tipo de acción" required>
              <div className="grid grid-cols-3 gap-2">
                <CheckItem label="Corrección"        checked={form.action_correction} disabled={isView} onChange={() => set('action_correction', !form.action_correction)} />
                <CheckItem label="Acción Correctiva" checked={form.action_corrective} disabled={isView} onChange={() => set('action_corrective', !form.action_corrective)} />
                <CheckItem label="Acción Preventiva" checked={form.action_preventive} disabled={isView} onChange={() => set('action_preventive', !form.action_preventive)} />
              </div>
              {errors.action_type && <p className="text-red-500 text-xs mt-1">{errors.action_type}</p>}
            </Field>
            <Field label="Causas">
              <textarea value={form.causes} disabled={isView} rows={3}
                onChange={e => set('causes', e.target.value)}
                placeholder="Análisis de causas raíz (5 ¿Por qué?, Ishikawa, etc.)..."
                className="w-full p-3 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300" />
            </Field>
          </Section>

          {/* ── PLAN DE ACCIÓN ── */}
          <Section title="📋 Plan de Acción" color="#1a3a5c">
            <Field label="Descripción de las acciones">
              <textarea value={form.action_description} disabled={isView} rows={3}
                onChange={e => set('action_description', e.target.value)}
                placeholder="Describa las acciones a implementar..."
                className="w-full p-3 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Logros esperados">
                <textarea value={form.expected_results} disabled={isView} rows={2}
                  onChange={e => set('expected_results', e.target.value)}
                  placeholder="Resultados esperados..."
                  className="w-full p-3 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </Field>
              <Field label="Recursos / Presupuesto">
                <textarea value={form.resources_budget} disabled={isView} rows={2}
                  onChange={e => set('resources_budget', e.target.value)}
                  placeholder="Recursos requeridos..."
                  className="w-full p-3 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Responsable" required>
                <select value={form.responsible_id} disabled={isView}
                  onChange={e => set('responsible_id', e.target.value)}
                  className={`w-full p-2 border rounded text-sm ${errors.responsible_id ? 'border-red-400' : 'border-gray-300'}`}>
                  <option value="">Seleccionar responsable...</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                </select>
                {errors.responsible_id && <p className="text-red-500 text-xs">{errors.responsible_id}</p>}
              </Field>
              <Field label="Fecha propuesta de verificación" required>
                <Input type="date" value={form.proposed_date} disabled={isView}
                  onChange={e => set('proposed_date', e.target.value)}
                  className={errors.proposed_date ? 'border-red-400' : ''} />
                {errors.proposed_date && <p className="text-red-500 text-xs">{errors.proposed_date}</p>}
              </Field>
            </div>
          </Section>

          {/* ── VERIFICACIÓN ── */}
          <Section title="✅ Verificación" color="#1a5c3a">
            <Field label="Criterios de verificación">
              <textarea value={form.verification_criteria} disabled={isView} rows={2}
                onChange={e => set('verification_criteria', e.target.value)}
                placeholder="¿Cómo se verificará la efectividad?..."
                className="w-full p-3 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-300" />
            </Field>
            <Field label="Hallazgo de verificación">
              <textarea value={form.verification_finding} disabled={isView} rows={2}
                onChange={e => set('verification_finding', e.target.value)}
                placeholder="Resultado de la verificación realizada..."
                className="w-full p-3 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-300" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fecha verificación">
                <Input type="date" value={form.verification_date} disabled={isView}
                  onChange={e => set('verification_date', e.target.value)} />
              </Field>
              <Field label="Fecha eficacia">
                <Input type="date" value={form.efficacy_date} disabled={isView}
                  onChange={e => set('efficacy_date', e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Info cierre en modo vista */}
          {isView && accion?.closure_approved && (
            <Section title="🔒 Cierre" color="#5c1a1a">
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Decisión</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold
                    ${accion.closure_approved === 'SI' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {accion.closure_approved === 'SI' ? '✅ Cerrada' : '⏳ En seguimiento'}
                  </span>
                </div>
                {accion.closure_reason && (
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Razón del cierre</p>
                    <p className="text-sm">{accion.closure_reason}</p>
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>

        {/* Footer fijo */}
        <div className="flex-shrink-0 px-6 py-4 border-t rounded-b-xl flex justify-end gap-3"
          style={{ backgroundColor: '#f8fafb' }}>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {isView ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!isView && (
            <Button onClick={handleSubmit} disabled={saving}
              style={{ backgroundColor: '#2e5244' }} className="text-white">
              {saving
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</>
                : <><Save className="h-4 w-4 mr-2" />{isCreate ? 'Crear Acción' : 'Guardar Cambios'}</>
              }
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}