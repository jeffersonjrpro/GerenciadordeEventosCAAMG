import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  User
} from 'lucide-react';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [estatisticas, setEstatisticas] = useState({ 
    total: 0, 
    ativos: 0, 
    inativos: 0, 
    concluidos: 0, 
    emAndamento: 0, 
    futuros: 0 
  });

  // Estados para modal de erro de permissão
  const [showPermissionErrorModal, setShowPermissionErrorModal] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const searchTerm = watch('search');
  const statusFilter = watch('status');

  const carregarEstatisticas = useCallback(async () => {
    try {
      // Usar a mesma API que funciona no dashboard
      const response = await api.get('/events/stats');
      const stats = response.data.data;
      
      // Converter para o formato esperado pelos cards
      const estatisticasAtualizadas = {
        total: stats.totalEvents || 0,
        ativos: stats.eventosAtivos || 0,
        emAndamento: stats.eventosEmAndamento || 0,
        concluidos: stats.eventosConcluidos || 0
      };
      
      setEstatisticas(estatisticasAtualizadas);
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
      console.error('❌ Detalhes do erro:', error.response?.data);
      // Fallback para valores zero
      setEstatisticas({
        total: 0,
        ativos: 0,
        emAndamento: 0,
        concluidos: 0
      });
    }
  }, []);

  const fetchEvents = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
      });

      console.log('🔍 fetchEvents - URL completa:', `/events/meus-eventos?${params}`);
      console.log('🔍 fetchEvents - Parâmetros:', Object.fromEntries(params));
      
      const response = await api.get(`/events/meus-eventos?${params}`);
      
      console.log('🔍 fetchEvents - Status da resposta:', response.status);
      console.log('🔍 fetchEvents - Headers da resposta:', response.headers);
      console.log('🔍 fetchEvents - Dados completos da resposta:', response.data);
      console.log('🔍 fetchEvents - Tipo de response.data:', typeof response.data);
      console.log('🔍 fetchEvents - response.data.data existe?', !!response.data.data);
      console.log('🔍 fetchEvents - response.data.data é array?', Array.isArray(response.data.data));
      console.log('🔍 fetchEvents - Quantidade de eventos:', response.data.data?.length || 0);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('🔍 fetchEvents - Primeiro evento:', response.data.data[0]);
        console.log('🔍 fetchEvents - Todos os eventos:');
        response.data.data.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.name} (ID: ${event.id})`);
        });
      }
      
      setEvents(response.data.data || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('❌ Erro ao carregar eventos:', error);
      console.error('❌ Detalhes do erro:', error.response?.data);
      console.error('❌ Status do erro:', error.response?.status);
      console.error('❌ Erro completo:', error);
      setEvents([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchEvents();
    carregarEstatisticas();
  }, [fetchEvents, carregarEstatisticas]);

  useEffect(() => {
    if (searchTerm || statusFilter) {
      const delayDebounceFn = setTimeout(() => {
        fetchEvents();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, statusFilter, fetchEvents]);

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      await api.delete(`/events/${selectedEvent.id}`);
      setShowDeleteModal(false);
      setSelectedEvent(null);
      fetchEvents(pagination.page);
      carregarEstatisticas(); // Recarregar estatísticas após deletar
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      
      // Verificar se é erro de permissão
      if (error.response && error.response.status === 403) {
        const errorData = error.response.data;
        setPermissionError({
          eventName: errorData.eventName || selectedEvent.name,
          eventOwner: errorData.eventOwner,
          message: errorData.message || 'Apenas o criador do evento pode excluí-lo'
        });
        setShowPermissionErrorModal(true);
        setShowDeleteModal(false);
      } else {
        // Outros erros
        alert('Erro ao deletar evento. Tente novamente.');
      }
    }
  };

  const formatDate = (dateString) => {
    // Converter para fuso horário de Brasília
    const date = new Date(dateString);
    const brasiliaTime = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    }).format(date);
    
    return brasiliaTime;
  };

  const getEventStatus = (event) => {
    // Usar fuso horário de Brasília
    const now = new Date();
    const eventDate = new Date(event.date);
    
    // Converter para fuso horário de Brasília
    const brasiliaNow = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    const brasiliaEventDate = new Date(eventDate.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    
    if (!event.isActive) {
      return { status: 'inactive', label: 'Inativo', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    } else if (brasiliaEventDate < brasiliaNow) {
      return { status: 'finished', label: 'Finalizado', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    } else if (brasiliaEventDate.getTime() - brasiliaNow.getTime() < 24 * 60 * 60 * 1000) {
      return { status: 'today', label: 'Hoje', color: 'text-warning-700', bgColor: 'bg-warning-100' };
    } else {
      return { status: 'upcoming', label: 'Próximo', color: 'text-success-700', bgColor: 'bg-success-100' };
    }
  };

  const clearFilters = () => {
    reset();
    fetchEvents(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Eventos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie todos os seus eventos em um só lugar
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/events/create"
            className="btn-primary inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Evento
          </Link>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-600 rounded-xl p-3 md:p-4 text-white shadow flex flex-col justify-between min-h-[80px]">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm md:text-base">Total</span>
            <svg className="w-6 h-6 md:w-8 md:h-8 opacity-60" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="text-2xl md:text-3xl font-bold mt-2">{estatisticas.total}</div>
        </div>
        
        <div className="bg-green-600 rounded-xl p-3 md:p-4 text-white shadow flex flex-col justify-between min-h-[80px]">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm md:text-base">Ativos</span>
            <svg className="w-6 h-6 md:w-8 md:h-8 opacity-60" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 12 10 16 18 8"/>
            </svg>
          </div>
          <div className="text-2xl md:text-3xl font-bold mt-2">{estatisticas.ativos}</div>
        </div>
        
        <div className="bg-yellow-500 rounded-xl p-3 md:p-4 text-white shadow flex flex-col justify-between min-h-[80px]">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm md:text-base">Em Andamento</span>
            <svg className="w-6 h-6 md:w-8 md:h-8 opacity-60" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
          <div className="text-2xl md:text-3xl font-bold mt-2">{estatisticas.emAndamento}</div>
        </div>
        
        <div className="bg-purple-600 rounded-xl p-3 md:p-4 text-white shadow flex flex-col justify-between min-h-[80px]">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm md:text-base">Concluídos</span>
            <svg className="w-6 h-6 md:w-8 md:h-8 opacity-60" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <div className="text-2xl md:text-3xl font-bold mt-2">{estatisticas.concluidos}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar eventos..."
                  className="input pl-10"
                  {...register('search')}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-outline inline-flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </button>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Limpar filtros
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Status</label>
                  <select
                    className="input"
                    {...register('status')}
                  >
                    <option value="all">Todos</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum evento encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando seu primeiro evento.'
                }
              </p>
              <div className="mt-6">
                <Link to="/events/create" className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Evento
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const status = getEventStatus(event);
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {event.name}
                        </h3>
                        <span className={`badge ${status.bgColor} ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {event.location}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {event._count.guests} convidados • {event._count.checkIns} presentes
                        </div>
                      </div>

                      {event.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        to={`/events/${event.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/events/${event.id}/edit`}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-danger-600"
                        title="Deletar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} resultados
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchEvents(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn-outline px-3 py-2 text-sm disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Página {pagination.page} de {pagination.pages}
                </span>
                <button
                  onClick={() => fetchEvents(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="btn-outline px-3 py-2 text-sm disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Confirmar exclusão</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Tem certeza que deseja deletar o evento "{selectedEvent.name}"?
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedEvent(null);
                  }}
                  className="btn-outline"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteEvent}
                  className="btn-danger"
                >
                  Deletar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Erro de Permissão */}
      {showPermissionErrorModal && permissionError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 w-full max-w-md">
            <div className="relative bg-white rounded-lg shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              
              {/* Content */}
              <div className="text-center px-6 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Permissão Negada
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Você não tem permissão para excluir o evento <strong>"{permissionError.eventName}"</strong>.
                </p>
                
                {permissionError.eventOwner && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-xs text-gray-500 mb-2">Apenas o criador do evento pode excluí-lo:</p>
                    <div className="flex items-center justify-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {permissionError.eventOwner.name}
                      </span>
                    </div>
                    {permissionError.eventOwner.email && (
                      <p className="text-xs text-gray-500 mt-1">
                        {permissionError.eventOwner.email}
                      </p>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mb-6">
                  Entre em contato com o criador do evento se precisar que ele seja excluído.
                </p>
                
                {/* Actions */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setShowPermissionErrorModal(false);
                      setPermissionError(null);
                    }}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Entendi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events; 