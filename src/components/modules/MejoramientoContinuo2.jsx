import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Filter,
  Eye,
  BarChart3
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

const MOCK_ACCIONES_MEJORA = [
  { id: 1, title: 'Optimizar proceso de corte', priority: 'Alta', status: 'En Progreso', area: 'Producción', responsible: 'Juan Pérez', date: '2026-01-10', progress: 60 },
  { id: 2, title: 'Implementar sistema 5S', priority: 'Media', status: 'Planificado', area: 'Calidad', responsible: 'María García', date: '2026-02-01', progress: 20 },
  { id: 3, title: 'Reducir desperdicios de tela', priority: 'Alta', status: 'En Progreso', area: 'Producción', responsible: 'Carlos López', date: '2026-01-15', progress: 75 },
  { id: 4, title: 'Mejorar tiempos de entrega', priority: 'Crítica', status: 'En Progreso', area: 'Logística', responsible: 'Ana Martínez', date: '2026-01-05', progress: 85 },
];

const MOCK_NO_CONFORMIDADES = [
  { id: 1, description: 'Defecto en costura de producto', type: 'Producto', severity: 'Mayor', status: 'Abierta', date: '2026-01-12' },
  { id: 2, description: 'Incumplimiento plazo de entrega', type: 'Proceso', severity: 'Crítica', status: 'En Análisis', date: '2026-01-10' },
  { id: 3, description: 'Error en documentación técnica', type: 'Documental', severity: 'Menor', status: 'Cerrada', date: '2026-01-08' },
];

const MOCK_AUDITORIAS = [
  { id: 1, type: 'Interna', area: 'Producción', auditor: 'Sistema de Calidad', date: '2026-01-20', status: 'Programada' },
  { id: 2, type: 'Externa', area: 'SST', auditor: 'Ente Certificador', date: '2026-02-15', status: 'Programada' },
  { id: 3, type: 'Interna', area: 'Calidad', auditor: 'Sistema de Calidad', date: '2025-12-10', status: 'Finalizada' },
];

export default function MejoramientoContinuo() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('mejoramientoContinuo', 'write');

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Crítica': return '#d4183d';
      case 'Alta': return '#6f7b2c';
      case 'Media': return '#6dbd96';
      default: return '#dedecc';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completado':
      case 'Cerrada':
      case 'Finalizada':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'En Progreso':
      case 'En Análisis':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 style={{ color: '#2e5244' }}>Mejoramiento Continuo</h2>
          <p className="text-sm mt-1" style={{ color: '#6f7b2c' }}>
            Gestión de acciones de mejora, no conformidades y auditorías
          </p>
        </div>
        {canWrite && (
          <Button style={{ backgroundColor: '#2e5244' }} className="text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Acción
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Acciones Activas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl" style={{ color: '#2e5244' }}>34</p>
              <TrendingUp className="h-8 w-8" style={{ color: '#6dbd96' }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2" style={{ borderColor: '#6f7b2c' }}>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">No Conformidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl" style={{ color: '#2e5244' }}>12</p>
              <AlertTriangle className="h-8 w-8" style={{ color: '#6f7b2c' }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2" style={{ borderColor: '#2e5244' }}>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Auditorías Año</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl" style={{ color: '#2e5244' }}>18</p>
              <BarChart3 className="h-8 w-8" style={{ color: '#2e5244' }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Acciones Cerradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl" style={{ color: '#2e5244' }}>87</p>
              <CheckCircle className="h-8 w-8" style={{ color: '#6dbd96' }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="acciones" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="acciones">Acciones de Mejora</TabsTrigger>
          <TabsTrigger value="noconformidades">No Conformidades</TabsTrigger>
          <TabsTrigger value="auditorias">Auditorías</TabsTrigger>
        </TabsList>

        {/* Acciones de Mejora */}
        <TabsContent value="acciones" className="space-y-4">
          <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle style={{ color: '#2e5244' }}>Acciones de Mejora</CardTitle>
                  <CardDescription>Seguimiento a acciones de mejoramiento</CardDescription>
                </div>
                <Button variant="outline" style={{ borderColor: '#6dbd96' }}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_ACCIONES_MEJORA.map((accion) => (
                <div 
                  key={accion.id}
                  className="p-4 border-2 rounded-lg hover:shadow-md transition-shadow"
                  style={{ borderColor: '#dedecc' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 style={{ color: '#2e5244' }}>{accion.title}</h4>
                        {getStatusIcon(accion.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {accion.responsible} • {accion.area} • {accion.date}
                      </p>
                    </div>
                    <Badge style={{ backgroundColor: getPriorityColor(accion.priority) }} className="text-white">
                      {accion.priority}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: '#6f7b2c' }}>Avance</span>
                        <span style={{ color: '#2e5244' }}>{accion.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${accion.progress}%`, backgroundColor: '#6dbd96' }}
                        />
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* No Conformidades */}
        <TabsContent value="noconformidades">
          <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
            <CardHeader>
              <CardTitle style={{ color: '#2e5244' }}>No Conformidades</CardTitle>
              <CardDescription>Registro y seguimiento de no conformidades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2" style={{ borderColor: '#dedecc' }}>
                      <th className="text-left p-3 text-sm" style={{ color: '#2e5244' }}>Descripción</th>
                      <th className="text-left p-3 text-sm" style={{ color: '#2e5244' }}>Tipo</th>
                      <th className="text-left p-3 text-sm" style={{ color: '#2e5244' }}>Severidad</th>
                      <th className="text-left p-3 text-sm" style={{ color: '#2e5244' }}>Estado</th>
                      <th className="text-left p-3 text-sm" style={{ color: '#2e5244' }}>Fecha</th>
                      <th className="text-right p-3 text-sm" style={{ color: '#2e5244' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_NO_CONFORMIDADES.map((nc) => (
                      <tr key={nc.id} className="border-b hover:bg-gray-50" style={{ borderColor: '#dedecc' }}>
                        <td className="p-3">
                          <span className="text-sm" style={{ color: '#2e5244' }}>{nc.description}</span>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{nc.type}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge style={{ backgroundColor: getPriorityColor(nc.severity) }} className="text-white">
                            {nc.severity}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(nc.status)}
                            <span className="text-sm">{nc.status}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-gray-600">{nc.date}</span>
                        </td>
                        <td className="p-3 text-right">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auditorías */}
        <TabsContent value="auditorias">
          <Card className="border-2" style={{ borderColor: '#6dbd96' }}>
            <CardHeader>
              <CardTitle style={{ color: '#2e5244' }}>Auditorías</CardTitle>
              <CardDescription>Programación y resultados de auditorías</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_AUDITORIAS.map((auditoria) => (
                <div 
                  key={auditoria.id}
                  className="flex items-center justify-between p-4 border-2 rounded-lg"
                  style={{ borderColor: '#dedecc' }}
                >
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: '#6dbd9620' }}
                    >
                      <BarChart3 className="h-6 w-6" style={{ color: '#6dbd96' }} />
                    </div>
                    <div>
                      <h4 style={{ color: '#2e5244' }}>Auditoría {auditoria.type}</h4>
                      <p className="text-sm text-gray-600">
                        {auditoria.area} • {auditoria.auditor} • {auditoria.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge 
                      style={{ 
                        backgroundColor: auditoria.status === 'Finalizada' ? '#6dbd96' : '#6f7b2c' 
                      }} 
                      className="text-white"
                    >
                      {auditoria.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
