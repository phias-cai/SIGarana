import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { FileText, Target, TrendingUp, Shield, BarChart3, Award } from 'lucide-react';
import garanaImage from '../../uno.png';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const { user } = useAuth();

  const stats = [
    { label: 'Documentos Activos', value: '248', icon: FileText, color: '#6dbd96' },
    { label: 'Objetivos Estratégicos', value: '12', icon: Target, color: '#6f7b2c' },
    { label: 'Acciones de Mejora', value: '34', icon: TrendingUp, color: '#2e5244' },
    { label: 'Inspecciones SST', value: '18', icon: Shield, color: '#6dbd96' },
  ];
const testConnection = async () => {
  const { data, error } = await supabase.from('department').select('name').limit(1);
  console.log('Test conexión:', { data, error });
 
};
 
  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-2" style={{ borderColor: '#6dbd96' }}>
        <h2 style={{ color: '#2e5244' }}>Bienvenido, {user?.name}</h2>
        <p className="mt-2" style={{ color: '#6f7b2c' }}>
          Sistema Integrado de Gestión - Garana Art
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-2" style={{ borderColor: stat.color }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs">{stat.label}</CardDescription>
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: stat.color }} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl" style={{ color: stat.color }}>{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* About Garana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2" style={{ borderColor: '#2e5244' }}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Award className="h-6 w-6" style={{ color: '#2e5244' }} />
              <CardTitle style={{ color: '#2e5244' }}>Acerca de Garana Art</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2" style={{ color: '#6f7b2c' }}>Nuestra Misión</h3>
              <p className="text-sm text-gray-700">
                Ofrecemos a las mujeres de hoy prendas que combinan seguridad y comodidad, 
                empoderándolas a través de su estilo. Para nuestros clientes y distribuidores, 
                aseguramos versatilidad, excelencia y oportunidad en la entrega.
              </p>
            </div>
            
            <div>
              <h3 className="mb-2" style={{ color: '#6f7b2c' }}>Nuestros Valores</h3>
              <div className="flex flex-wrap gap-2">
                {['Versatilidad', 'Excelencia', 'Oportunidad', 'Seguridad', 'Comodidad'].map((value, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1 rounded-full text-xs text-white"
                    style={{ backgroundColor: '#6dbd96' }}
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2" style={{ color: '#6f7b2c' }}>Nuestra Trayectoria</h3>
              <p className="text-sm text-gray-700">
                Llevamos 19 años en el mercado nacional de trajes de baño y con experiencia 
                en exportación a Ecuador, Perú y USA.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 overflow-hidden" style={{ borderColor: '#6dbd96' }}>
          <CardHeader>
            <CardTitle style={{ color: '#2e5244' }}>Garana Art</CardTitle>
            <CardDescription>
              "Garantizando el realce natural de su belleza"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <img 
              src={garanaImage} 
              alt="Garana Art Company" 
              className="w-full h-auto rounded-lg"
            />
            <p className="text-xs mt-4 text-gray-600 italic">
              Contamos con nuestra planta de producción donde participan más de 80 
              mujeres cabeza de hogar encargadas de diseñar y producir productos de 
              la más alta calidad, logrando la satisfacción de nuestros clientes finales.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vision and Strategic Planning Placeholder */}
      <Card className="border-2" style={{ borderColor: '#6f7b2c' }}>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6" style={{ color: '#6f7b2c' }} />
            <CardTitle style={{ color: '#2e5244' }}>Planeación Estratégica</CardTitle>
          </div>
          <CardDescription>
            Espacio reservado para visión, misión y objetivos estratégicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#dedecc' }}>
              <h4 className="mb-2" style={{ color: '#2e5244' }}>Visión 2026</h4>
              <p className="text-sm text-gray-700">
                Contenido de visión estratégica aquí...
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#dedecc' }}>
              <h4 className="mb-2" style={{ color: '#2e5244' }}>Objetivos</h4>
              <p className="text-sm text-gray-700">
                Principales objetivos estratégicos...
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#dedecc' }}>
              <h4 className="mb-2" style={{ color: '#2e5244' }}>Indicadores</h4>
              <p className="text-sm text-gray-700">
                KPIs y métricas clave...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
     
    </div>
  );
}
