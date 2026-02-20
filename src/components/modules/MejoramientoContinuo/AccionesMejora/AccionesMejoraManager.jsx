// src/components/modules/MejoramientoContinuo/AccionesMejora/AccionesMejoraManager.jsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input }  from '@/app/components/ui/input';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import {
  Plus, Search, RefreshCw, Filter, Loader2,
  AlertTriangle, ChevronLeft, Edit, Trash2, Eye, Archive, CheckCircle2
} from 'lucide-react';
import { useAccionesMejora, getTrafficLight } from '@/hooks/useAccionesMejora';
import { useProcesses } from '@/hooks/useDocuments';
import { useAuth } from '@/context/AuthContext';
import AccionMejoraModal  from './AccionMejoraModal';
import CierreAccionModal  from './CierreAccionModal';

// ─── Colores Excel ────────────────────────────────────────────────────────────
const XL = {
  identificacion: '#FFD966',
  analisis:       '#9DC3E6',
  plan:           '#2E75B6',
  verificacion:   '#70AD47',
  subOrigen:      '#BDD7EE',
  subAccion:      '#BDD7EE',
  subFecha:       '#C6EFCE',
  subCierre:      '#C6EFCE',
  colBg:          '#DEEAF1',
  border:         '#A6B8C2',
  rowOdd:         '#FFFFFF',
  rowEven:        '#F2F9F5',
  rowHover:       '#EBF5FB',
  rowOverdue:     '#FEF2F2',
  accBg:          '#EDF7ED',
};

// ─── Componentes de tabla ─────────────────────────────────────────────────────
const HHead = ({ children, bg, colSpan = 1, rowSpan = 1, textColor = '#1F2937', small = false }) => (
  <th colSpan={colSpan} rowSpan={rowSpan} style={{
    backgroundColor: bg,
    border: `1px solid ${XL.border}`,
    textAlign: 'center', verticalAlign: 'middle',
    padding: small ? '2px 2px' : '3px 4px',
    fontSize: small ? 8 : 9, fontWeight: 700,
    textTransform: 'uppercase', color: textColor, whiteSpace: 'nowrap',
  }}>
    {children}
  </th>
);

const VHead = ({ children, rowSpan = 1, colSpan = 1, w = 26 }) => {
  const lines = typeof children === 'string' ? children.split('|') : [children];
  return (
    <th rowSpan={rowSpan} colSpan={colSpan} style={{
      backgroundColor: XL.colBg,
      border: `1px solid ${XL.border}`,
      padding: 0, width: w, minWidth: w, maxWidth: w,
    }}>
      <div style={{ display:'flex', justifyContent:'center', alignItems:'flex-end', height:90, paddingBottom:4 }}>
        <div style={{
          writingMode:'vertical-rl', transform:'rotate(180deg)',
          fontSize:8, fontWeight:600, textTransform:'uppercase',
          color:'#1F2937', textAlign:'center', lineHeight:1.3,
          display:'flex', flexDirection:'column', alignItems:'center', gap:0,
        }}>
          {lines.map((line, i) => <span key={i} style={{ whiteSpace:'nowrap', display:'block' }}>{line}</span>)}
        </div>
      </div>
    </th>
  );
};

const Cell = ({ children, center, bold, color, maxW, bg }) => (
  <td style={{
    border: `1px solid ${XL.border}`, padding: '2px 3px', fontSize: 9,
    textAlign: center ? 'center' : 'left', fontWeight: bold ? 600 : 400,
    color: color || '#1F2937', maxWidth: maxW, verticalAlign: 'middle',
    backgroundColor: bg, wordBreak: 'break-word', overflowWrap: 'break-word',
  }}>
    {children}
  </td>
);

const Fecha = ({ v }) => {
  if (!v) return <span style={{ color: '#C0C0C0' }}>-</span>;
  return new Date(v + 'T00:00:00').toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: '2-digit'
  });
};

const Tick = ({ v }) =>
  v ? <span style={{ color: '#2e5244', fontSize: 11, fontWeight: 700 }}>✓</span>
    : <span style={{ color: '#E0E0E0' }}>-</span>;

const Clamp = ({ v, muted }) => (
  <div style={{
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
    overflow: 'hidden', color: muted ? '#6B7280' : '#1F2937',
    fontSize: 9, wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal',
  }} title={v || ''}>
    {v || '-'}
  </div>
);

function Semaforo({ proposedDate, isClosed }) {
  const { color, label } = getTrafficLight(proposedDate, isClosed);
  const map = { red: '#EF4444', yellow: '#F59E0B', green: '#22C55E', gray: '#9CA3AF' };
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div title={label} style={{
        width: 11, height: 11, borderRadius: '50%',
        backgroundColor: map[color],
        boxShadow: `0 0 3px ${map[color]}`,
        border: '1px solid rgba(0,0,0,0.12)',
      }} />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AccionesMejoraManager({ onBack }) {
  const { user, profile } = useAuth();
  const role       = profile?.role;
  const canManage  = ['admin', 'gerencia'].includes(role);

  // ── Estado de modales ────────────────────────────────────────────────────
  const [modalOpen,      setModalOpen]      = useState(false);
  const [modalMode,      setModalMode]      = useState('create');
  const [selected,       setSelected]       = useState(null);
  const [cierreOpen,     setCierreOpen]     = useState(false);
  const [accionACerrar,  setAccionACerrar]  = useState(null);

  // ── Estado de UI ─────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState('');
  const [showFilters,  setShowFilters]  = useState(false);
  const [fStatus,      setFStatus]      = useState('');
  const [actionMsg,    setActionMsg]    = useState(null); // { type: 'success'|'error', text }

  const { acciones, loading, error, fetchAcciones, deleteAccion, closeAccion } = useAccionesMejora();
  const { processes = [] } = useProcesses() || {};

  // ── Filas filtradas ───────────────────────────────────────────────────────
  const rows = acciones.filter(a =>
    (!search  || a.consecutive?.toLowerCase().includes(search.toLowerCase())
              || a.finding_description?.toLowerCase().includes(search.toLowerCase()))
    && (!fStatus || a.status === fStatus)
  );

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total: acciones.length,
    open:  acciones.filter(a => a.status === 'open').length,
    prog:  acciones.filter(a => a.status === 'in_progress').length,
    over:  acciones.filter(a => !a.is_closed && a.proposed_date
             && new Date(a.proposed_date + 'T00:00:00') < new Date()).length,
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const procName = (id) => processes.find(p => p.id === id)?.name || '-';

  const showMsg = (type, text) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const openModal = (mode, a = null) => { setModalMode(mode); setSelected(a); setModalOpen(true); };

  // ── Abrir modal de cierre (SI o NO) ──────────────────────────────────────
  // Ambos botones (SI y NO) abren el mismo modal — la diferencia es que
  // "NO" no cierra definitivamente sino que registra un cierre pendiente
  const openCierre = (a) => {
    setAccionACerrar({
      ...a,
      responsible_name: a.responsible_name || a.responsible?.full_name || '—',
    });
    setCierreOpen(true);
  };

  // ── Confirmar cierre desde el modal ──────────────────────────────────────
  const handleConfirmCierre = async (accionId, payload) => {
    await closeAccion(accionId, payload); // lanza error si falla → modal lo muestra
    showMsg('success', `✅ Acción archivada correctamente.`);
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const handleDelete = async (a) => {
    if (!window.confirm(`¿Eliminar ${a.consecutive}?`)) return;
    const r = await deleteAccion(a.id);
    if (r.success) {
      showMsg('success', `🗑️ Acción ${a.consecutive} eliminada.`);
    } else {
      showMsg('error', `Error al eliminar: ${r.error}`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 px-2">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#2e5244' }}>Acciones de Mejora</h2>
          <p className="text-sm" style={{ color: '#6f7b2c' }}>
            Seguimiento de acciones correctivas, preventivas y de corrección
          </p>
        </div>
      </div>

      {/* ── Mensaje de acción (reemplaza alert) ────────────────────────── */}
      {actionMsg && (
        <Alert
          variant={actionMsg.type === 'error' ? 'destructive' : 'default'}
          className={actionMsg.type === 'success' ? 'border-green-400 bg-green-50' : ''}
        >
          {actionMsg.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 text-green-600" />
            : <AlertTriangle className="h-4 w-4" />
          }
          <AlertDescription className={actionMsg.type === 'success' ? 'text-green-700' : ''}>
            {actionMsg.text}
          </AlertDescription>
        </Alert>
      )}

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total',       v: stats.total, color: '#6dbd96' },
          { label: 'Abiertas',    v: stats.open,  color: '#22c55e' },
          { label: 'En Progreso', v: stats.prog,  color: '#f59e0b' },
          { label: 'Vencidas',    v: stats.over,  color: '#ef4444' },
        ].map(s => (
          <Card key={s.label} className="border-2" style={{ borderColor: s.color }}>
            <CardContent className="p-4">
              <p className="text-xs text-gray-600 mb-1">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabla ───────────────────────────────────────────────────────── */}
      <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle style={{ color: '#2e5244' }}>Registro de Acciones de Mejora</CardTitle>
              <CardDescription>Formato AM · Gestión SIG · Garana Art</CardDescription>
            </div>
            <Button size="sm" onClick={() => openModal('create')}
              style={{ backgroundColor: '#2e5244' }} className="text-white">
              <Plus className="h-4 w-4 mr-1" />Nueva Acción
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">

          {/* Búsqueda + Filtros */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar consecutivo o descripción..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="pl-10 text-sm" />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={fetchAcciones}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg border">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Estado</label>
                <select value={fStatus} onChange={e => setFStatus(e.target.value)}
                  className="w-full p-2 border rounded text-sm">
                  <option value="">Todos</option>
                  <option value="open">Abierta</option>
                  <option value="in_progress">En Progreso</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" size="sm"
                  onClick={() => { setFStatus(''); setSearch(''); }}>
                  Limpiar
                </Button>
              </div>
            </div>
          )}

          {/* Tabla Excel */}
          <div className="border rounded-lg" style={{ overflowX: 'auto' }}>
            <div style={{ fontSize: '85%', zoom: '0.62', minWidth: 'fit-content' }}>
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#6dbd96' }} />
                  <span className="ml-3 text-gray-600">Cargando acciones...</span>
                </div>
              ) : error ? (
                <div className="text-center p-8">
                  <Alert variant="destructive" className="max-w-sm mx-auto">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              ) : rows.length === 0 ? (
                <div className="text-center p-12 text-gray-400">
                  <Archive className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No hay acciones de mejora registradas</p>
                  <p className="text-sm mt-1">Crea la primera usando "Nueva Acción"</p>
                </div>
              ) : (
                <table style={{ borderCollapse:'collapse', width:'100%', tableLayout:'fixed' }}>
                  <colgroup>
                    <col style={{ width: 56 }} />
                    <col style={{ width: 70 }} />
                    <col style={{ width: 52 }} />
                    <col style={{ width: 90 }} />
                    <col style={{ width: 26 }} />
                    <col style={{ width: 26 }} />
                    <col style={{ width: 26 }} />
                    <col style={{ width: 26 }} />
                    <col style={{ width: 26 }} />
                    <col style={{ width: 26 }} />
                    <col style={{ width: 130 }} />
                    <col style={{ width: 26 }} />
                    <col style={{ width: 26 }} />
                    <col style={{ width: 26 }} />
                    <col style={{ width: 100 }} />
                    <col style={{ width: 120 }} />
                    <col style={{ width: 90 }} />
                    <col style={{ width: 75 }} />
                    <col style={{ width: 80 }} />
                    <col style={{ width: 52 }} />
                    <col style={{ width: 100 }} />
                    <col style={{ width: 100 }} />
                    <col style={{ width: 50 }} />
                    <col style={{ width: 50 }} />
                    <col style={{ width: 30 }} />
                    <col style={{ width: 30 }} />
                    <col style={{ width: 30 }} />
                    <col style={{ width: 80 }} />
                  </colgroup>

                  <thead>
                    {/* ═══ FILA 1: SECCIONES ═══ */}
                    <tr>
                      <HHead bg="#E2EFDA" rowSpan={3}>ACC.</HHead>
                      <HHead bg={XL.identificacion} colSpan={10}>IDENTIFICACIÓN</HHead>
                      <HHead bg={XL.analisis}       colSpan={4}>ANÁLISIS</HHead>
                      <HHead bg={XL.plan}           colSpan={5} textColor="#FFFFFF">PLAN DE ACCIÓN</HHead>
                      <HHead bg={XL.verificacion}   colSpan={8} textColor="#FFFFFF">VERIFICACIÓN</HHead>
                    </tr>

                    {/* ═══ FILA 2: SUB-SECCIONES ═══ */}
                    <tr>
                      <VHead rowSpan={2} w={70}>Consecutivo</VHead>
                      <VHead rowSpan={2} w={52}>Fecha</VHead>
                      <VHead rowSpan={2} w={90}>Proceso</VHead>
                      <HHead bg={XL.subOrigen} colSpan={6} small>ORIGEN</HHead>
                      <VHead rowSpan={2} w={130}>Descripción|del Hallazgo</VHead>
                      <HHead bg={XL.subAccion} colSpan={3} small>ACCIÓN</HHead>
                      <VHead rowSpan={2} w={100}>Causas</VHead>
                      <VHead rowSpan={2} w={120}>Descripción|de las Acciones</VHead>
                      <VHead rowSpan={2} w={90}>Logros|Esperados</VHead>
                      <VHead rowSpan={2} w={75}>Recursos /|Presupuesto</VHead>
                      <VHead rowSpan={2} w={80}>Responsable</VHead>
                      <VHead rowSpan={2} w={52}>Fecha|Propuesta</VHead>
                      <VHead rowSpan={2} w={100}>Criterios de|Verificación</VHead>
                      <VHead rowSpan={2} w={100}>Hallazgo de|Verificación</VHead>
                      <HHead bg={XL.subFecha}  colSpan={2} small>FECHA</HHead>
                      <VHead rowSpan={2} w={30}>Estado</VHead>
                      <HHead bg={XL.subCierre} colSpan={2} small>CIERRE</HHead>
                      <VHead rowSpan={2} w={80}>Auditor</VHead>
                    </tr>

                    {/* ═══ FILA 3: COLUMNAS DETALLE ═══ */}
                    <tr>
                      <VHead w={26}>Auditoría</VHead>
                      <VHead w={26}>QRS</VHead>
                      <VHead w={26}>Satisfacción</VHead>
                      <VHead w={26}>Autocontrol /|Gest. cambio</VHead>
                      <VHead w={26}>Análisis de|riesgos</VHead>
                      <VHead w={26}>Pto no conforme</VHead>
                      <VHead w={26}>Corrección</VHead>
                      <VHead w={26}>Correctiva</VHead>
                      <VHead w={26}>Preventiva</VHead>
                      <VHead w={50}>Verificación</VHead>
                      <VHead w={50}>Eficacia</VHead>
                      <VHead w={30}>SI</VHead>
                      <VHead w={30}>NO</VHead>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((a, idx) => {
                      const light     = getTrafficLight(a.proposed_date, a.is_closed);
                      const isOverdue = light.color === 'red' && !a.is_closed;
                      const bg        = isOverdue ? XL.rowOverdue
                                      : idx % 2 === 0 ? XL.rowOdd : XL.rowEven;
                      return (
                        <tr key={a.id}
                          style={{ backgroundColor: bg }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = XL.rowHover}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = bg}
                        >
                          {/* ACC */}
                          <td style={{
                            border:`1px solid ${XL.border}`, padding:'2px 2px',
                            textAlign:'center', verticalAlign:'middle',
                            backgroundColor: XL.accBg,
                          }}>
                            <div style={{ display:'flex', gap:2, justifyContent:'center' }}>
                              <button onClick={() => openModal('view', a)} title="Ver"
                                style={{ background:'none', border:'none', cursor:'pointer', padding:1, borderRadius:3 }}>
                                <Eye style={{ width:12, height:12, color:'#3B82F6' }} />
                              </button>
                              {(canManage || a.created_by === user?.id) && !a.is_closed && (
                                <button onClick={() => openModal('edit', a)} title="Editar"
                                  style={{ background:'none', border:'none', cursor:'pointer', padding:1, borderRadius:3 }}>
                                  <Edit style={{ width:12, height:12, color:'#6B7280' }} />
                                </button>
                              )}
                              {canManage && (
                                <button onClick={() => handleDelete(a)} title="Eliminar"
                                  style={{ background:'none', border:'none', cursor:'pointer', padding:1, borderRadius:3 }}>
                                  <Trash2 style={{ width:12, height:12, color:'#EF4444' }} />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* IDENTIFICACIÓN */}
                          <Cell center bold color="#2e5244">{a.consecutive}</Cell>
                          <Cell center><Fecha v={a.date} /></Cell>
                          <Cell>
                            <span style={{
                              background:'#6dbd9618', color:'#2e5244',
                              padding:'1px 4px', borderRadius:3, fontSize:8,
                              whiteSpace:'nowrap', overflow:'hidden',
                              display:'block', textOverflow:'ellipsis',
                            }}>
                              {procName(a.process_id)}
                            </span>
                          </Cell>
                          <Cell center><Tick v={a.origin_audit} /></Cell>
                          <Cell center><Tick v={a.origin_qrs} /></Cell>
                          <Cell center><Tick v={a.origin_satisfaction} /></Cell>
                          <Cell center><Tick v={a.origin_autocontrol} /></Cell>
                          <Cell center><Tick v={a.origin_risk_analysis} /></Cell>
                          <Cell center><Tick v={a.origin_nonconforming} /></Cell>
                          <Cell><Clamp v={a.finding_description} /></Cell>

                          {/* ANÁLISIS */}
                          <Cell center><Tick v={a.action_correction} /></Cell>
                          <Cell center><Tick v={a.action_corrective} /></Cell>
                          <Cell center><Tick v={a.action_preventive} /></Cell>
                          <Cell><Clamp v={a.causes} muted /></Cell>

                          {/* PLAN */}
                          <Cell><Clamp v={a.action_description} /></Cell>
                          <Cell><Clamp v={a.expected_results} muted /></Cell>
                          <Cell><Clamp v={a.resources_budget} muted /></Cell>
                          <Cell bold>{a.responsible?.full_name || a.responsible_name || '-'}</Cell>
                          <Cell center><Fecha v={a.proposed_date} /></Cell>

                          {/* VERIFICACIÓN */}
                          <Cell><Clamp v={a.verification_criteria} muted /></Cell>
                          <Cell><Clamp v={a.verification_finding} muted /></Cell>
                          <Cell center><Fecha v={a.verification_date} /></Cell>
                          <Cell center><Fecha v={a.efficacy_date} /></Cell>
                          <Cell center>
                            <Semaforo proposedDate={a.proposed_date} isClosed={a.is_closed} />
                          </Cell>

                          {/* ── CIERRE SI ── */}
                          <td style={{
                            border:`1px solid ${XL.border}`, textAlign:'center',
                            verticalAlign:'middle', padding:'2px',
                          }}>
                            {canManage && !a.is_closed ? (
                              // Botón SI → abre CierreAccionModal
                              <button
                                onClick={() => openCierre(a)}
                                title="Cerrar acción"
                                style={{
                                  backgroundColor:'#22c55e', color:'white', border:'none',
                                  borderRadius:3, padding:'1px 4px', fontSize:8,
                                  fontWeight:700, cursor:'pointer',
                                }}
                              >
                                SI
                              </button>
                            ) : (
                              <span style={{
                                fontSize:9, fontWeight:700,
                                color: a.closure_approved === 'SI' ? '#22c55e' : '#D1D5DB',
                              }}>
                                {a.closure_approved === 'SI' ? '✓' : '-'}
                              </span>
                            )}
                          </td>

                          {/* ── CIERRE NO ── */}
                          <td style={{
                            border:`1px solid ${XL.border}`, textAlign:'center',
                            verticalAlign:'middle', padding:'2px',
                          }}>
                            {canManage && !a.is_closed ? (
                              // Botón NO → también abre CierreAccionModal
                              // El usuario elige dentro del modal "pending_solution"
                              <button
                                onClick={() => openCierre(a)}
                                title="Cerrar con seguimiento pendiente"
                                style={{
                                  backgroundColor:'#9CA3AF', color:'white', border:'none',
                                  borderRadius:3, padding:'1px 4px', fontSize:8,
                                  fontWeight:700, cursor:'pointer',
                                }}
                              >
                                NO
                              </button>
                            ) : (
                              <span style={{
                                fontSize:9, fontWeight:700,
                                color: a.closure_approved === 'NO' ? '#6B7280' : '#D1D5DB',
                              }}>
                                {a.closure_approved === 'NO' ? '✓' : '-'}
                              </span>
                            )}
                          </td>

                          <Cell>{a.auditor?.full_name || '-'}</Cell>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {!loading && rows.length > 0 && (
            <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>
              {rows.length} acción(es) activa(s)
            </p>
          )}

        </CardContent>
      </Card>

      {/* ── Modal crear / editar / ver ───────────────────────────────────── */}
      {modalOpen && (
        <AccionMejoraModal
          isOpen={modalOpen}
          mode={modalMode}
          accion={selected}
          onClose={() => { setModalOpen(false); setSelected(null); }}
          onSuccess={() => { setModalOpen(false); setSelected(null); fetchAcciones(); }}
        />
      )}

      {/* ── Modal de cierre ──────────────────────────────────────────────── */}
      <CierreAccionModal
        open={cierreOpen}
        accion={accionACerrar}
        onClose={() => { setCierreOpen(false); setAccionACerrar(null); }}
        onConfirm={handleConfirmCierre}
      />

    </div>
  );
}