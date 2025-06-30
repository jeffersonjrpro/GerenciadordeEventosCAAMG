import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth deve ser usado dentro de um AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há dados de admin no localStorage
    const token = localStorage.getItem('adminToken');
    const storedAdminData = localStorage.getItem('adminData');
    
    if (token && storedAdminData) {
      try {
        const parsedData = JSON.parse(storedAdminData);
        setAdminData(parsedData);
      } catch (error) {
        console.error('Erro ao parsear dados do admin:', error);
        // Limpar dados inválidos sem chamar logout
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        setAdminData(null);
      }
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminData', JSON.stringify(data));
    setAdminData(data);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdminData(null);
  };

  const isAuthenticated = () => {
    const token = localStorage.getItem('adminToken');
    const storedAdminData = localStorage.getItem('adminData');
    
    if (!token || !storedAdminData) {
      return false;
    }
    
    try {
      const parsedData = JSON.parse(storedAdminData);
      return !!parsedData && !!parsedData.token;
    } catch (error) {
      console.error('Erro ao verificar autenticação admin:', error);
      return false;
    }
  };

  const value = {
    adminData,
    login,
    logout,
    isAuthenticated,
    loading
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}; 