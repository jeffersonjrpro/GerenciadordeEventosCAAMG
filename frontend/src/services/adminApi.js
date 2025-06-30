const API_BASE = '/api/admin';

// Função para obter o token do localStorage
const getAuthToken = () => {
  return localStorage.getItem('adminToken');
};

// Função para fazer requisições autenticadas
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro na requisição');
    }

    return data;
  } catch (error) {
    console.error('Erro na API:', error);
    throw error;
  }
};

// Dashboard
export const getDashboardData = () => apiRequest('/dashboard');

// Empresas
export const getEmpresas = () => apiRequest('/empresas');
export const createEmpresa = (data) => apiRequest('/empresas', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const updateEmpresa = (id, data) => apiRequest(`/empresas/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});
export const deleteEmpresa = (id) => apiRequest(`/empresas/${id}`, {
  method: 'DELETE',
});
export const blockEmpresa = (id) => apiRequest(`/empresas/${id}/bloquear`, {
  method: 'PATCH',
});
export const getEmpresa = (id) => apiRequest(`/empresas/${id}`);

// Planos
export const getPlanos = () => apiRequest('/planos');
export const createPlano = (data) => apiRequest('/planos', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const updatePlano = (id, data) => apiRequest(`/planos/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});
export const deletePlano = (id) => apiRequest(`/planos/${id}`, {
  method: 'DELETE',
});

// Faturas
export const getFaturas = () => apiRequest('/faturas');
export const createFatura = (data) => apiRequest('/faturas', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const markFaturaPaid = (id) => apiRequest(`/faturas/${id}/pagar`, {
  method: 'PATCH',
});

// Nova função para buscar todos os admins do sistema (adminMaster + users nivel ADMIN)
export const getAllAdmins = () => apiRequest('/todos-admins');

// Logs
export const getLogs = () => apiRequest('/logs');

// Eventos (Admin Master - acesso total a todos os eventos)
export const getAllEvents = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/eventos?${queryString}`);
};

export const getEventStats = () => apiRequest('/eventos/stats');

export const getEvent = (eventId) => apiRequest(`/eventos/${eventId}`);

export const updateEvent = (eventId, data) => apiRequest(`/eventos/${eventId}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});

export const deleteEvent = (eventId) => apiRequest(`/eventos/${eventId}`, {
  method: 'DELETE',
});

// Login
export const loginAdmin = (credentials) => apiRequest('/login', {
  method: 'POST',
  body: JSON.stringify(credentials),
});

// Usuários (Admin Master - acesso total a todos os usuários)
export const getUsuarios = () => apiRequest('/usuarios');
export const getUsuario = (id) => apiRequest(`/usuarios/${id}`);
export const updateUsuario = (id, data) => apiRequest(`/usuarios/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});
export const resetUsuarioPassword = (id, newPassword) => apiRequest(`/usuarios/${id}/reset-password`, {
  method: 'PATCH',
  body: JSON.stringify({ newPassword }),
}); 