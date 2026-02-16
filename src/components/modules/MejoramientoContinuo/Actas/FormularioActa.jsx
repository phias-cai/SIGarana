// src/components/modules/MejoramientoContinuo/Actas/FormularioActa.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { 
  Plus,
  Trash2,
  Save,
  X,
  Calendar,
  MapPin,
  FileText,
  Users,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function FormularioActa({ actaToEdit = null, onCancel, onSave }) {
  const { user } = useAuth();
  
  // Estados del formulario principal
  const [formData, setFormData] = useState({
    title: '', // ✅ Título opcional
    meeting_date: '',
    location: '',
    objective: '',
    agenda: '',
    development: '',
    approved_by: '',
  });

  // Estados para asistentes (tabla dinámica)
  const [attendees, setAttendees] = useState([
    { id: Date.now(), name: '', position: '' }
  ]);

  // Estados para compromisos (tabla dinámica)
  const [commitments, setCommitments] = useState([
    { id: Date.now(), activity: '', responsible_id: '', due_date: '' }
  ]);

  // Estado de validación
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  // Cargar usuarios de Supabase
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setLoadingUsuarios(true);
        const { data, error } = await supabase
          .from('profile')
          .select('id, full_name, role, department_id')
          .eq('is_active', true)
          .order('full_name');
        
        if (error) throw error;
        setUsuarios(data || []);
      } catch (error) {
        console.error('Error cargando usuarios:', error);
        setUsuarios([]);
      } finally {
        setLoadingUsuarios(false);
      }
    };

    fetchUsuarios();
  }, []);

  // Si hay un acta para editar, cargar datos
  useEffect(() => {
    if (actaToEdit) {
      setFormData({
        title: actaToEdit.title || '', // ✅ Cargar título
        meeting_date: actaToEdit.meeting_date || '',
        location: actaToEdit.location || '',
        objective: actaToEdit.objective || '',
        agenda: actaToEdit.agenda || '',
        development: actaToEdit.development || '',
        approved_by: actaToEdit.approved_by || '',
      });
      
      // Cargar asistentes
      if (actaToEdit.attendees && actaToEdit.attendees.length > 0) {
        setAttendees(actaToEdit.attendees.map(a => ({
          id: a.id || Date.now() + Math.random(),
          name: a.name,
          position: a.position
        })));
      }
      
      // Cargar compromisos
      if (actaToEdit.commitments && actaToEdit.commitments.length > 0) {
        setCommitments(actaToEdit.commitments.map(c => ({
          id: c.id || Date.now() + Math.random(),
          activity: c.activity,
          responsible_id: c.responsible_id,
          due_date: c.due_date
        })));
      }
    }
  }, [actaToEdit]);

  // Manejar cambios en campos principales
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // ============================================================================
  // FUNCIONES PARA ASISTENTES
  // ============================================================================

  const addAttendee = () => {
    setAttendees(prev => [
      ...prev,
      { id: Date.now(), name: '', position: '' }
    ]);
  };

  const removeAttendee = (id) => {
    if (attendees.length > 1) {
      setAttendees(prev => prev.filter(a => a.id !== id));
    }
  };

  const updateAttendee = (id, field, value) => {
    setAttendees(prev => prev.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  // ============================================================================
  // FUNCIONES PARA COMPROMISOS
  // ============================================================================

  const addCommitment = () => {
    setCommitments(prev => [
      ...prev,
      { id: Date.now(), activity: '', responsible_id: '', due_date: '' }
    ]);
  };

  const removeCommitment = (id) => {
    if (commitments.length > 1) {
      setCommitments(prev => prev.filter(c => c.id !== id));
    }
  };

  const updateCommitment = (id, field, value) => {
    setCommitments(prev => prev.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  // ============================================================================
  // VALIDACIÓN
  // ============================================================================

  const validateForm = () => {
    const newErrors = {};

    // Campos obligatorios
    if (!formData.meeting_date) newErrors.meeting_date = 'La fecha es obligatoria';
    if (!formData.location) newErrors.location = 'El lugar es obligatorio';
    if (!formData.objective) newErrors.objective = 'El objetivo es obligatorio';
    if (!formData.agenda) newErrors.agenda = 'El orden del día es obligatorio';
    if (!formData.development) newErrors.development = 'El desarrollo es obligatorio';

    // Validar que haya al menos un asistente con datos
    const validAttendees = attendees.filter(a => a.name.trim() && a.position.trim());
    if (validAttendees.length === 0) {
      newErrors.attendees = 'Debe haber al menos un asistente';
    }

    // Validar compromisos (si hay alguno, debe estar completo)
    const incompleteCommitments = commitments.filter(c => 
      (c.activity.trim() || c.responsible_id || c.due_date) &&
      (!c.activity.trim() || !c.responsible_id || !c.due_date)
    );
    if (incompleteCommitments.length > 0) {
      newErrors.commitments = 'Complete todos los campos de los compromisos o elimine las filas vacías';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================================
  // GUARDAR
  // ============================================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Filtrar solo asistentes con datos
      const validAttendees = attendees
        .filter(a => a.name.trim() && a.position.trim())
        .map((a, index) => ({
          name: a.name.trim(),
          position: a.position.trim(),
          order_index: index + 1
        }));

      // Filtrar solo compromisos completos
      const validCommitments = commitments
        .filter(c => c.activity.trim() && c.responsible_id && c.due_date)
        .map((c, index) => ({
          activity: c.activity.trim(),
          responsible_id: c.responsible_id,
          due_date: c.due_date,
          order_index: index + 1
        }));

      // ✅ Limpiar approved_by: convertir string vacío a null
      const actaData = {
        ...formData,
        approved_by: formData.approved_by || null, // ✅ "" → null
        attendees: validAttendees,
        commitments: validCommitments,
      };

      // Llamar callback para guardar
      await onSave(actaData);
      
    } catch (error) {
      console.error('Error al guardar acta:', error);
      alert('❌ Error: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold" style={{ color: '#2e5244' }}>
            {actaToEdit ? 'Editar Acta' : 'Nueva Acta de Reunión'}
          </h3>
          <p className="text-sm mt-1" style={{ color: '#6f7b2c' }}>
            {actaToEdit ? `Consecutivo: ${actaToEdit.consecutive}` : 'El consecutivo se generará automáticamente'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            style={{ backgroundColor: '#2e5244' }}
            className="text-white"
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Guardando...' : 'Guardar Acta'}
          </Button>
        </div>
      </div>

      {/* ========================================================================
          SECCIÓN 1: INFORMACIÓN GENERAL
      ======================================================================== */}
      <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: '#2e5244' }}>
            <FileText className="h-5 w-5" />
            Información General
          </CardTitle>
          <CardDescription>
            Datos básicos de la reunión
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fila 1: Fecha y Lugar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="meeting_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                1. Fecha de reunión *
              </Label>
              <Input
                id="meeting_date"
                type="date"
                value={formData.meeting_date}
                onChange={(e) => handleInputChange('meeting_date', e.target.value)}
                className={errors.meeting_date ? 'border-red-500' : ''}
              />
              {errors.meeting_date && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.meeting_date}
                </p>
              )}
            </div>

            {/* Lugar */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                2. Lugar *
              </Label>
              <Input
                id="location"
                type="text"
                placeholder="Ej: Sala de Juntas Principal"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className={errors.location ? 'border-red-500' : ''}
              />
              {errors.location && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.location}
                </p>
              )}
            </div>
          </div>

          {/* ✅ NUEVO: Título opcional */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Título del acta (opcional)
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Ej: Revisión trimestral de indicadores"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">
              Título descriptivo para identificar el acta fácilmente (máximo 200 caracteres)
            </p>
          </div>

          {/* Objetivo */}
          <div className="space-y-2">
            <Label htmlFor="objective">
              3. Objetivo *
            </Label>
            <Textarea
              id="objective"
              rows={2}
              placeholder="Objetivo de la reunión..."
              value={formData.objective}
              onChange={(e) => handleInputChange('objective', e.target.value)}
              className={errors.objective ? 'border-red-500' : ''}
            />
            {errors.objective && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.objective}
              </p>
            )}
          </div>

          {/* Orden del día */}
          <div className="space-y-2">
            <Label htmlFor="agenda">
              4. Orden del día *
            </Label>
            <Textarea
              id="agenda"
              rows={4}
              placeholder="1. Tema 1&#10;2. Tema 2&#10;3. Tema 3..."
              value={formData.agenda}
              onChange={(e) => handleInputChange('agenda', e.target.value)}
              className={errors.agenda ? 'border-red-500' : ''}
            />
            {errors.agenda && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.agenda}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================
          SECCIÓN 2: ASISTENTES
      ======================================================================== */}
      <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2" style={{ color: '#2e5244' }}>
                <Users className="h-5 w-5" />
                5. Asistentes
              </CardTitle>
              <CardDescription>
                Personas que participaron en la reunión
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={addAttendee}
              style={{ backgroundColor: '#6dbd96' }}
              className="text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nombre *</TableHead>
                  <TableHead>Cargo *</TableHead>
                  <TableHead className="w-20 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendees.map((attendee, index) => (
                  <TableRow key={attendee.id}>
                    <TableCell className="text-center text-sm text-gray-500">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Nombre completo"
                        value={attendee.name}
                        onChange={(e) => updateAttendee(attendee.id, 'name', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Cargo o posición"
                        value={attendee.position}
                        onChange={(e) => updateAttendee(attendee.id, 'position', e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeAttendee(attendee.id)}
                        disabled={attendees.length === 1}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {errors.attendees && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-2">
              <AlertCircle className="h-3 w-3" />
              {errors.attendees}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================
          SECCIÓN 3: DESARROLLO
      ======================================================================== */}
      <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
        <CardHeader>
          <CardTitle style={{ color: '#2e5244' }}>
            6. Desarrollo *
          </CardTitle>
          <CardDescription>
            Descripción detallada de lo tratado en la reunión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={10}
            placeholder="Describa detalladamente lo que se discutió en la reunión, acuerdos alcanzados, puntos de vista, etc."
            value={formData.development}
            onChange={(e) => handleInputChange('development', e.target.value)}
            className={errors.development ? 'border-red-500' : ''}
          />
          {errors.development && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-2">
              <AlertCircle className="h-3 w-3" />
              {errors.development}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            {formData.development.length} caracteres
          </p>
        </CardContent>
      </Card>

      {/* ========================================================================
          SECCIÓN 4: COMPROMISOS
      ======================================================================== */}
      <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2" style={{ color: '#2e5244' }}>
                <CheckSquare className="h-5 w-5" />
                7. Compromisos
              </CardTitle>
              <CardDescription>
                Actividades y responsables derivados de la reunión
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={addCommitment}
              style={{ backgroundColor: '#6dbd96' }}
              className="text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-1/2">Actividad</TableHead>
                  <TableHead className="w-1/4">Responsable</TableHead>
                  <TableHead className="w-32">Fecha</TableHead>
                  <TableHead className="w-20 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commitments.map((commitment, index) => (
                  <TableRow key={commitment.id}>
                    <TableCell className="text-center text-sm text-gray-500">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Textarea
                        rows={2}
                        placeholder="Descripción de la actividad..."
                        value={commitment.activity}
                        onChange={(e) => updateCommitment(commitment.id, 'activity', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={commitment.responsible_id}
                        onValueChange={(value) => updateCommitment(commitment.id, 'responsible_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingUsuarios ? "Cargando..." : "Seleccionar..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {usuarios.map(usuario => (
                            <SelectItem key={usuario.id} value={usuario.id}>
                              {usuario.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={commitment.due_date}
                        onChange={(e) => updateCommitment(commitment.id, 'due_date', e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCommitment(commitment.id)}
                        disabled={commitments.length === 1}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {errors.commitments && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-2">
              <AlertCircle className="h-3 w-3" />
              {errors.commitments}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================
          SECCIÓN 5: APROBACIÓN
      ======================================================================== */}
      <Card className="border-2" style={{ borderColor: '#dedecc' }}>
        <CardHeader>
          <CardTitle style={{ color: '#2e5244' }}>
            Aprobación
          </CardTitle>
          <CardDescription>
            Opcional: Seleccionar quién aprueba el acta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="approved_by">
              Aprobado por
            </Label>
            <Select
              value={formData.approved_by}
              onValueChange={(value) => handleInputChange('approved_by', value)}
            >
              <SelectTrigger id="approved_by">
                <SelectValue placeholder={loadingUsuarios ? "Cargando usuarios..." : "Seleccionar usuario..."} />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map(usuario => (
                  <SelectItem key={usuario.id} value={usuario.id}>
                    {usuario.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Si no se selecciona, el acta quedará en estado "Borrador"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botones finales */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          style={{ backgroundColor: '#2e5244' }}
          className="text-white"
          disabled={isSubmitting}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Guardando...' : (actaToEdit ? 'Actualizar Acta' : 'Guardar Acta')}
        </Button>
      </div>
    </form>
  );
}