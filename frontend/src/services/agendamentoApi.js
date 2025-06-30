import api from './api';

export const getAgendamentos = () => api.get('/agendamentos');
export const createAgendamento = (data) => api.post('/agendamentos', data);
export const updateAgendamento = (id, data) => api.put(`/agendamentos/${id}`, data);
export const deleteAgendamento = (id) => api.delete(`/agendamentos/${id}`);
export const notificarAgendamento = (id) => api.post(`/agendamentos/${id}/notificar`);
export const getNotificacoes = () => api.get('/notifications');
export const marcarNotificacaoLida = (id) => api.post(`/notifications/${id}/lida`); 