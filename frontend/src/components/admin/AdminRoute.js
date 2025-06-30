import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export default function AdminRoute({ children }) {
  const { isAuthenticated, loading } = useAdminAuth();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Aguardar um pouco para garantir que a verificação seja feita corretamente
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || !shouldRender) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
} 