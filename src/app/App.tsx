import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Login from '@/components/Login';
import Layout from '@/components/Layout';
import Home from '@/components/modules/Home';
import GestionDocumental from '@/components/modules/GestionDocumental';
import PlaneacionEstrategica from '@/components/modules/PlaneacionEstrategica';
import MejoramientoContinuo from '@/components/modules/MejoramientoContinuo';
import SegBienestar from '@/components/modules/SegBienestar';
import GestionUsuarios from '@/components/modules/GestionUsuarios';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentModule, setCurrentModule] = useState('home');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#dedecc' }}>
        <div className="text-center">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse"
            style={{ backgroundColor: '#2e5244' }}
          >
            <span className="text-white text-2xl">SIG</span>
          </div>
          <p style={{ color: '#2e5244' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderModule = () => {
    switch (currentModule) {
      case 'home':
        return <Home />;
      case 'gestionDocumental':
        return <GestionDocumental />;
      case 'planeacionEstrategica':
        return <PlaneacionEstrategica />;
      case 'mejoramientoContinuo':
        return <MejoramientoContinuo />;
      case 'segBienestar':
        return <SegBienestar />;
      case 'usuarios':
        return <GestionUsuarios />;
      default:
        return <Home />;
    }
  };

  return (
    <Layout currentModule={currentModule} onModuleChange={setCurrentModule}>
      {renderModule()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
