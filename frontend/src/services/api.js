import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || '/api';
console.log('API Base URL:', baseURL);

const api = axios.create({
  baseURL: baseURL,
  timeout: 10000,
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Token encontrado:', token ? 'Sim' : 'Não');
    console.log('URL da requisição:', config.url);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Se o token expirou, redirecionar para login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 