import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import {
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Download,
  Send,
  UserPlus
} from 'lucide-react';

const Guests = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [guests, setGuests] = useState([]);
  const [event, setEvent] = useState(null);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const searchTerm = watch('search');
  const statusFilter = watch('status');

  useEffect(() => {
    fetchEventAndGuests();
  }, [eventId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchGuests();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter]);

  const fetchEventAndGuests = async () => {
    try {
      setLoading(true);
      const [eventResponse, guestsResponse] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/guests`)
      ]);

      setEvent(eventResponse.data.data);
      setGuests(guestsResponse.data.data);
      setPagination(guestsResponse.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuests = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await api.get(`/events/${eventId}/guests?${params}`);
      setGuests(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar convidados:', error);
    }
  };

  const handleDeleteGuest = async () => {
    if (!selectedGuest) return;

    try {
      await api.delete(`/events/${eventId}/guests/${selectedGuest.id}`);
      setShowDeleteModal(false);
      setSelectedGuest(null);
      fetchGuests(pagination.page);
    } catch (error) {
      console.error('Erro ao deletar convidado:', error);
    }
  };

  const handleAddGuest = async (data) => {
    try {
      await api.post(`/events/${eventId}/guests`, data);
      setShowAddModal(false);
      reset();
      fetchGuests();
    } catch (error) {
      console.error('Erro ao adicionar convidado:', error);
    }
  };

  const handleSendInvite = async (guestId) => {
    try {
      await api.post(`/events/${eventId}/guests/${guestId}/send-invite`);
      // Aqui você pode adicionar uma notificação de sucesso
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
    }
  };

  const handleBulkInvite = async () => {
    try {
      const uninvitedGuests = guests.filter(guest => !guest.inviteSent);
      for (const guest of uninvitedGuests) {
        await handleSendInvite(guest.id);
      }
      setShowInviteModal(false);
      fetchGuests();
    } catch (error) {
      console.error('Erro ao enviar convites em massa:', error);
    }
  };

  const exportGuests = async () => {
    try {
      const response = await api.get(`/events/${eventId}/guests/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `convidados-${event.name}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar convidados:', error);
    }
  };

  const getGuestStatus = (guest) => {
    if (guest.checkedIn) {
      return { status: 'checked-in', label: 'Presente', color: 'text-success-700', bgColor: 'bg-success-100' };
    } else if (guest.confirmed) {
      return { status: 'confirmed', label: 'Confirmado', color: 'text-warning-700', bgColor: 'bg-warning-100' };
    } else if (guest.inviteSent) {
      return { status: 'invited', label: 'Convidado', color: 'text-primary-700', bgColor: 'bg-primary-100' };
    } else {
      return { status: 'pending', label: 'Pendente', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    }
  };

  const clearFilters = () => {
    reset();
    fetchGuests(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="btn-outline inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Convidados</h1>
            <p className="mt-1 text-sm text-gray-500">
              {event?.name} • {guests.length} convidados
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-outline inline-flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-outline inline-flex items-center"
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar Convites
          </button>
          <button
            onClick={exportGuests}
            className="btn-outline inline-flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
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
                  placeholder="Buscar convidados..."
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
                    <option value="pending">Pendentes</option>
                    <option value="invited">Convidados</option>
                    <option value="confirmed">Confirmados</option>
                    <option value="checked-in">Presentes</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guests List */}
      <div className="card">
        <div className="card-body">
          {guests.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum convidado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece adicionando convidados ao seu evento.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Convidado
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Convidado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {guests.map((guest) => {
                    const status = getGuestStatus(guest);
                    return (
                      <tr key={guest.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-600">
                                  {guest.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {guest.name}
                              </div>
                              {guest.plusOne && (
                                <div className="text-sm text-gray-500">
                                  + {guest.plusOne}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{guest.email}</div>
                          {guest.phone && (
                            <div className="text-sm text-gray-500">{guest.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge ${status.bgColor} ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {!guest.inviteSent && (
                              <button
                                onClick={() => handleSendInvite(guest.id)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Enviar convite"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/guests/${guest.id}/edit`)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedGuest(guest);
                                setShowDeleteModal(true);
                              }}
                              className="text-gray-400 hover:text-danger-600"
                              title="Deletar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                  onClick={() => fetchGuests(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn-outline px-3 py-2 text-sm disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Página {pagination.page} de {pagination.pages}
                </span>
                <button
                  onClick={() => fetchGuests(pagination.page + 1)}
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

      {/* Add Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center">Adicionar Convidado</h3>
              <form onSubmit={handleSubmit(handleAddGuest)} className="mt-4 space-y-4">
                <div>
                  <label className="form-label">Nome *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Nome completo"
                    {...register('name', { required: 'Nome é obrigatório' })}
                  />
                  {errors.name && (
                    <p className="form-error">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="email@exemplo.com"
                    {...register('email', { 
                      required: 'Email é obrigatório',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido'
                      }
                    })}
                  />
                  {errors.email && (
                    <p className="form-error">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">Telefone</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="(11) 99999-9999"
                    {...register('phone')}
                  />
                </div>
                <div>
                  <label className="form-label">Acompanhante</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Nome do acompanhante"
                    {...register('plusOne')}
                  />
                </div>
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-outline"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedGuest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Confirmar exclusão</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Tem certeza que deseja remover {selectedGuest.name} da lista de convidados?
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedGuest(null);
                  }}
                  className="btn-outline"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteGuest}
                  className="btn-danger"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Enviar Convites</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Enviar convites para todos os convidados que ainda não receberam?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {guests.filter(g => !g.inviteSent).length} convidados receberão o convite.
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="btn-outline"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBulkInvite}
                  className="btn-primary"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Guests; 