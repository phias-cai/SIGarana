import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Upload, X, FileText, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export default function FormularioCreacion({ 
  documentTypes = [], 
  processes = [], 
  onSuccess 
}) {
  const { user } = useAuth();
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    // Información Básica
    code: '',
    name: '',
    objective: '',
    scope: '',
    document_type_id: '',
    process_id: '',
    
    // Ubicación y Almacenamiento
    storage_location: '',
    file_type_magnetic: true,
    file_type_physical: false,
    
    // Retención
    retention_central: '',
    retention_management: false,
    
    // Disposición Final
    disposition_total_conservation: false,
    disposition_selection: false,
    disposition_elimination: false,
    
    // ⭐ CONTROL DE CAMBIOS - EDITABLES (Datos Históricos)
    version: '1',  // Por defecto 1, pero el usuario puede cambiarlo
    change_date: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    change_reason: '', // Usuario puede ingresar motivo histórico
  });
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [codeError, setCodeError] = useState('');

  // Validación de código
  const validateCode = (code) => {
    const pattern = /^[A-Z]{2}-[A-Z]{2,3}-\d{2}$/;
    if (!code) {
      setCodeError('');
      return false;
    }
    if (!pattern.test(code)) {
      setCodeError('Formato inválido. Use: XX-YY-## (ej: PR-GC-01)');
      return false;
    }
    setCodeError('');
    return true;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'code') {
      const upperValue = value.toUpperCase();
      setFormData(prev => ({ ...prev, [name]: upperValue }));
      validateCode(upperValue);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('El archivo no puede superar 10MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validaciones
      if (!validateCode(formData.code)) {
        throw new Error('Código de documento inválido');
      }

      if (!formData.name || !formData.document_type_id || !formData.process_id) {
        throw new Error('Complete los campos obligatorios');
      }

      if (!file) {
        throw new Error('Debe seleccionar un archivo');
      }

      const version = parseInt(formData.version);
      if (isNaN(version) || version < 1) {
        throw new Error('La versión debe ser un número mayor o igual a 1');
      }

      // Subir archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${formData.code}_v${version}.${fileExt}`;
      const filePath = `${formData.document_type_id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message.includes('already exists')) {
          throw new Error('Ya existe un documento con este código y versión');
        }
        throw uploadError;
      }

      // Crear documento
      const { data: document, error: dbError } = await supabase
        .from('document')
        .insert({
          code: formData.code,
          name: formData.name,
          objective: formData.objective || null,
          scope: formData.scope || null,
          document_type_id: formData.document_type_id,
          process_id: formData.process_id,
          file_path: uploadData.path,
          version: version,
          status: 'published',
          
          // Ubicación y almacenamiento
          storage_location: formData.storage_location || null,
          file_type_magnetic: formData.file_type_magnetic,
          file_type_physical: formData.file_type_physical,
          
          // Retención
          retention_central: formData.retention_central ? parseInt(formData.retention_central) : null,
          retention_management: formData.retention_management,
          
          // Disposición
          disposition_total_conservation: formData.disposition_total_conservation,
          disposition_selection: formData.disposition_selection,
          disposition_elimination: formData.disposition_elimination,
          
          // ⭐ Control de cambios (datos históricos)
          change_date: formData.change_date || null,
          change_reason: formData.change_reason || null,
          
          created_by: user?.id,
          updated_by: user?.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Crear versión inicial
      const { error: versionError } = await supabase
        .from('document_version')
        .insert({
          document_id: document.id,
          version_number: version,
          file_path: uploadData.path,
          changes: formData.change_reason || `Versión ${version} - Documento centralizado`,
          change_reason: formData.change_reason || null,
          created_by: user?.id
        });

      if (versionError) throw versionError;

      setSuccess(true);
      
      setTimeout(() => {
        setFormData({
          code: '',
          name: '',
          objective: '',
          scope: '',
          document_type_id: '',
          process_id: '',
          storage_location: '',
          file_type_magnetic: true,
          file_type_physical: false,
          retention_central: '',
          retention_management: false,
          disposition_total_conservation: false,
          disposition_selection: false,
          disposition_elimination: false,
          version: '1',
          change_date: new Date().toISOString().split('T')[0],
          change_reason: '',
        });
        setFile(null);
        setSuccess(false);
        if (onSuccess) onSuccess();
      }, 2000);

    } catch (err) {
      console.error('Error al crear documento:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mensajes */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ¡Documento creado exitosamente!
          </AlertDescription>
        </Alert>
      )}

      {/* Información Básica */}
      <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
        <CardHeader>
          <CardTitle style={{ color: '#2e5244' }}>Información Básica</CardTitle>
          <CardDescription>Datos principales del documento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="code">
              Código del Documento <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Ej: PR-GC-01"
              required
              className={codeError ? 'border-red-500' : ''}
            />
            {codeError ? (
              <p className="text-sm text-red-500 mt-1">{codeError}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Formato: XX-YY-## (2 letras tipo - 2-3 letras proceso - 2 números)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="name">
              Nombre del Documento <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Procedimiento de Satisfacción del Cliente"
              required
            />
          </div>

          <div>
            <Label htmlFor="document_type_id">
              Tipo de Documento <span className="text-red-500">*</span>
            </Label>
            <select
              id="document_type_id"
              name="document_type_id"
              value={formData.document_type_id}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            >
              <option value="">Seleccione un tipo</option>
              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.code} - {type.name}
                </option>
              ))}
            </select>
            {documentTypes.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {documentTypes.length} tipos disponibles
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="process_id">
              Proceso <span className="text-red-500">*</span>
            </Label>
            <select
              id="process_id"
              name="process_id"
              value={formData.process_id}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            >
              <option value="">Seleccione un proceso</option>
              {processes.map((process) => (
                <option key={process.id} value={process.id}>
                  {process.name}
                </option>
              ))}
            </select>
            {processes.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {processes.length} procesos disponibles
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="objective">Objetivo</Label>
            <Textarea
              id="objective"
              name="objective"
              value={formData.objective}
              onChange={handleChange}
              rows={3}
              placeholder="Describa el objetivo del documento"
            />
          </div>

          <div>
            <Label htmlFor="scope">Alcance</Label>
            <Textarea
              id="scope"
              name="scope"
              value={formData.scope}
              onChange={handleChange}
              rows={3}
              placeholder="Describa el alcance del documento"
            />
          </div>
        </CardContent>
      </Card>

      {/* Archivo */}
      <Card className="border-2" style={{ borderColor: '#6f7b2c' }}>
        <CardHeader>
          <CardTitle style={{ color: '#2e5244' }}>Archivo del Documento</CardTitle>
          <CardDescription>Seleccione el archivo PDF, Word o Excel</CardDescription>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center"
                 style={{ borderColor: '#dedecc' }}>
              <Upload className="mx-auto h-12 w-12 mb-4" style={{ color: '#6dbd96' }} />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:underline">Click para seleccionar archivo</span>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                />
              </Label>
              <p className="text-xs text-gray-500 mt-2">
                Formatos: PDF, Word, Excel (máx. 10MB)
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border-2 rounded-lg"
                 style={{ borderColor: '#6dbd96' }}>
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8" style={{ color: '#6dbd96' }} />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ⭐ CONTROL DE CAMBIOS - AHORA EDITABLES */}
      <Card className="border-2 bg-yellow-50" style={{ borderColor: '#6dbd96' }}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-yellow-600" />
            <CardTitle style={{ color: '#2e5244' }}>Control de Cambios</CardTitle>
          </div>
          <CardDescription>
            ⭐ Ingrese los datos históricos del documento (si aplica)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-yellow-200 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              <strong>Importante:</strong> Si el documento ya existe físicamente y tiene un historial 
              (versión 2, 3, etc.), ingrese aquí los datos históricos. Si es un documento completamente 
              nuevo, deje versión 1.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="version">
              Versión Actual del Documento <span className="text-red-500">*</span>
            </Label>
            <Input
              id="version"
              name="version"
              type="number"
              min="1"
              value={formData.version}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Si el documento ya existe, ingrese la versión actual (ej: 3). Si es nuevo, deje 1.
            </p>
          </div>
          
          <div>
            <Label htmlFor="change_date">
              Fecha del Último Cambio
            </Label>
            <Input
              id="change_date"
              name="change_date"
              type="date"
              value={formData.change_date}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              Fecha del último cambio registrado (puede ser histórica)
            </p>
          </div>
          
          <div>
            <Label htmlFor="change_reason">
              Motivo del Último Cambio
            </Label>
            <Textarea
              id="change_reason"
              name="change_reason"
              value={formData.change_reason}
              onChange={handleChange}
              rows={3}
              placeholder="Ej: Actualización según ISO 9001:2015, Corrección de formato, etc."
            />
            <p className="text-xs text-gray-500 mt-1">
              Describa el motivo del cambio más reciente (si aplica)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Ubicación y Almacenamiento */}
      <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
        <CardHeader>
          <CardTitle style={{ color: '#2e5244' }}>Ubicación y Almacenamiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="storage_location">Ubicación</Label>
            <Input
              id="storage_location"
              name="storage_location"
              value={formData.storage_location}
              onChange={handleChange}
              placeholder="Ej: Pc Gerente, Archivo Central, Carpeta Compartida"
            />
          </div>

          <div className="space-y-3">
            <Label>Tipo de Archivo</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="file_type_magnetic"
                checked={formData.file_type_magnetic}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, file_type_magnetic: checked }))
                }
              />
              <Label htmlFor="file_type_magnetic" className="font-normal cursor-pointer">
                Magnético (Digital)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="file_type_physical"
                checked={formData.file_type_physical}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, file_type_physical: checked }))
                }
              />
              <Label htmlFor="file_type_physical" className="font-normal cursor-pointer">
                Físico (Papel)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Retención */}
      <Card className="border-2" style={{ borderColor: '#6f7b2c' }}>
        <CardHeader>
          <CardTitle style={{ color: '#2e5244' }}>Tiempo de Retención</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="retention_central">Retención Central (años)</Label>
            <Input
              id="retention_central"
              name="retention_central"
              type="number"
              min="0"
              value={formData.retention_central}
              onChange={handleChange}
              placeholder="Ej: 5"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="retention_management"
              checked={formData.retention_management}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, retention_management: checked }))
              }
            />
            <Label htmlFor="retention_management" className="font-normal cursor-pointer">
              Retención en Gestión
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Disposición Final */}
      <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
        <CardHeader>
          <CardTitle style={{ color: '#2e5244' }}>Disposición Final</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="disposition_total_conservation"
              checked={formData.disposition_total_conservation}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, disposition_total_conservation: checked }))
              }
            />
            <Label htmlFor="disposition_total_conservation" className="font-normal cursor-pointer">
              Conservación Total
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="disposition_selection"
              checked={formData.disposition_selection}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, disposition_selection: checked }))
              }
            />
            <Label htmlFor="disposition_selection" className="font-normal cursor-pointer">
              Selección
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="disposition_elimination"
              checked={formData.disposition_elimination}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, disposition_elimination: checked }))
              }
            />
            <Label htmlFor="disposition_elimination" className="font-normal cursor-pointer">
              Eliminación
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Botones */}
      <div className="flex justify-end space-x-3">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => {
            if (onSuccess) onSuccess();
          }}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || !!codeError || !file}
          style={{ backgroundColor: '#2e5244' }}
          className="text-white"
        >
          {loading ? 'Creando...' : 'Crear Documento'}
        </Button>
      </div>
    </form>
  );
}