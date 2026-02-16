// src/components/modules/MejoramientoContinuo/Actas/VistaActa.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { 
  X,
  Download,
  Calendar,
  MapPin,
  FileText,
  Users,
  CheckSquare,
  Loader2,
  Trash2,
  Archive
} from 'lucide-react';
import { useActas } from '@/hooks/useActas';
import { supabase } from '@/lib/supabase';

export default function VistaActa({ actaId, isOpen, onClose, onDeleted }) {
  const { fetchActaById, deleteActa } = useActas();
  const [acta, setActa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState({});
  const [deleting, setDeleting] = useState(false);

  // Cargar acta completa
  useEffect(() => {
    if (isOpen && actaId) {
      loadActa();
    }
  }, [isOpen, actaId]);

  const loadActa = async () => {
    try {
      setLoading(true);
      const data = await fetchActaById(actaId);
      setActa(data);
      
      // ✅ Cargar nombres de usuarios (compromisos + creador + aprobador)
      const usersMap = {};
      
      // Usuarios de compromisos
      if (data?.commitments && data.commitments.length > 0) {
        const userIds = [...new Set(data.commitments.map(c => c.responsible_id))];
        
        for (const userId of userIds) {
          const { data: userData } = await supabase
            .from('profile')
            .select('full_name')
            .eq('id', userId)
            .single();
          
          if (userData) {
            usersMap[userId] = userData.full_name;
          }
        }
      }
      
      // ✅ Usuario creador
      if (data?.created_by) {
        const { data: creatorData } = await supabase
          .from('profile')
          .select('full_name')
          .eq('id', data.created_by)
          .single();
        
        if (creatorData) {
          usersMap[data.created_by] = creatorData.full_name;
        }
      }
      
      // ✅ Usuario aprobador
      if (data?.approved_by) {
        const { data: approverData } = await supabase
          .from('profile')
          .select('full_name')
          .eq('id', data.approved_by)
          .single();
        
        if (approverData) {
          usersMap[data.approved_by] = approverData.full_name;
        }
      }
      
      setUsuarios(usersMap);
      
    } catch (error) {
      console.error('Error cargando acta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de archivar esta acta?')) return;
    
    try {
      setDeleting(true);
      await deleteActa(actaId);
      alert('✅ Acta archivada correctamente');
      if (onDeleted) onDeleted();
      onClose();
    } catch (error) {
      console.error('Error archivando acta:', error);
      alert('❌ Error al archivar: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadWord = async () => {
    if (!acta) return;
    
    try {
      setDeleting(true);
      
      // ✅ Preparar datos COMPLETOS para la plantilla
      const templateData = {
        consecutive: acta.consecutive,
        title: acta.title || '',
        meeting_date: acta.meeting_date,
        location: acta.location,
        objective: acta.objective,
        agenda: acta.agenda,
        development: acta.development,
        attendees: acta.attendees || [],
        commitments: (acta.commitments || []).map(c => ({
          activity: c.activity,
          responsible_name: usuarios[c.responsible_id] || 'Sin asignar',
          due_date: c.due_date
        })),
        created_by_name: usuarios[acta.created_by] || 'Sin asignar',
        approved_by_name: usuarios[acta.approved_by] || '',
      };
      
      // ✅ Llamar a la Edge Function de Supabase (NO localhost)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-document`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_code: 'RE-DP-03',
            data: templateData
          })
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al generar documento');
      }
      
      // Descargar el archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${acta.consecutive}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Documento descargado');
      
    } catch (error) {
      console.error('Error descargando documento:', error);
      alert('❌ Error al generar documento: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { label: 'Borrador', color: '#6f7b2c', bg: '#6f7b2c20' },
      approved: { label: 'Aprobada', color: '#6dbd96', bg: '#6dbd9620' },
      archived: { label: 'Archivada', color: '#999', bg: '#99999920' }
    };
    
    const { label, color, bg } = config[status] || config.draft;
    
    return (
      <Badge style={{ backgroundColor: bg, color: color }}>
        {label}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-none h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl flex items-center gap-3" style={{ color: '#2e5244' }}>
                <FileText className="h-6 w-6" />
                {loading ? 'Cargando...' : acta?.consecutive || 'Acta de Reunión'}
              </DialogTitle>
              {!loading && acta && (
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(acta.status)}
                  <span className="text-sm text-gray-500">
                    Creada: {new Date(acta.created_at).toLocaleDateString('es-CO')}
                  </span>
                </div>
              )}
            </div>
            
            {acta && !loading && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleDownloadWord}
                  disabled={deleting}
                  style={{ backgroundColor: '#2e5244' }}
                  className="text-white"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Word
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleting || acta.status === 'archived'}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Archive className="h-4 w-4 mr-2" />
                  )}
                  Archivar
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#2e5244' }} />
            <span className="ml-3 text-gray-600">Cargando acta...</span>
          </div>
        ) : acta ? (
          <div className="space-y-6 py-4">
            
            {/* SECCIÓN 1: Información General */}
            <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#2e5244' }}>
                  <FileText className="h-5 w-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de reunión</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {new Date(acta.meeting_date).toLocaleDateString('es-CO', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Lugar</label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{acta.location}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Objetivo</label>
                  <p className="mt-1 text-gray-900">{acta.objective}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Orden del día</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{acta.agenda}</p>
                </div>
              </CardContent>
            </Card>

            {/* SECCIÓN 2: Asistentes */}
            <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#2e5244' }}>
                  <Users className="h-5 w-5" />
                  Asistentes ({acta.attendees?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {acta.attendees && acta.attendees.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Cargo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {acta.attendees.map((attendee, index) => (
                          <TableRow key={attendee.id || index}>
                            <TableCell className="text-center font-medium text-gray-500">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">{attendee.name}</TableCell>
                            <TableCell>{attendee.position}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay asistentes registrados
                  </p>
                )}
              </CardContent>
            </Card>

            {/* SECCIÓN 3: Desarrollo */}
            <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#2e5244' }}>
                  <FileText className="h-5 w-5" />
                  Desarrollo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-900 whitespace-pre-wrap">{acta.development}</p>
                </div>
              </CardContent>
            </Card>

            {/* SECCIÓN 4: Compromisos */}
            <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#2e5244' }}>
                  <CheckSquare className="h-5 w-5" />
                  Compromisos ({acta.commitments?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {acta.commitments && acta.commitments.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Actividad</TableHead>
                          <TableHead>Responsable</TableHead>
                          <TableHead>Fecha límite</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {acta.commitments.map((commitment, index) => {
                          const dueDate = new Date(commitment.due_date);
                          const today = new Date();
                          const isOverdue = dueDate < today && commitment.status !== 'completed';
                          
                          return (
                            <TableRow key={commitment.id || index}>
                              <TableCell className="text-center font-medium text-gray-500">
                                {index + 1}
                              </TableCell>
                              <TableCell>{commitment.activity}</TableCell>
                              <TableCell>
                                {usuarios[commitment.responsible_id] || 'Cargando...'}
                              </TableCell>
                              <TableCell>
                                <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                  {dueDate.toLocaleDateString('es-CO')}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={commitment.status === 'completed' ? 'default' : isOverdue ? 'destructive' : 'secondary'}
                                >
                                  {commitment.status === 'completed' ? 'Completado' : 
                                   isOverdue ? 'Vencido' : 'Pendiente'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay compromisos registrados
                  </p>
                )}
              </CardContent>
            </Card>

          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No se pudo cargar el acta</p>
          </div>
        )}

        {/* Footer con botones */}
        {acta && !loading && (
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              Última actualización: {new Date(acta.updated_at).toLocaleString('es-CO')}
            </div>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}