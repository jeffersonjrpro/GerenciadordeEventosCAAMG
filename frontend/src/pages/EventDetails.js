import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import EventTeam from '../components/EventTeam';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  ArrowLeft,
  Share2,
  QrCode,
  Mail,
  Download,
  Eye,
  UserPlus,
  Plus,
  Pause,
  Play,
  BarChart3,
  TrendingUp,
  Users2,
  UserCheck,
  UserX,
  CalendarDays,
  Type,
  Palette
} from 'lucide-react';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [showCustomFieldsModal, setShowCustomFieldsModal] = useState(false);
  const [customFields, setCustomFields] = useState([]);
  const [newField, setNewField] = useState({ name: '', type: 'text', required: false });
  const [pauseUntil, setPauseUntil] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState({ isPaused: false });

  useEffect(() => {
    console.log('EventDetails - eventId recebido:', eventId);
    fetchEventDetails();
    fetchStats();
    fetchRegistrationStatus();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      console.log('Fazendo requisição para:', `/events/${eventId}`);
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data.data);
      if (response.data.data.customFields) {
        setCustomFields(Object.entries(response.data.data.customFields).map(([key, value]) => ({
          name: key,
          type: value.type || 'text',
          required: value.required || false
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar evento:', error);
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(`/events/${eventId}/stats`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const fetchRegistrationStatus = async () => {
    try {
      const response = await api.get(`/events/${eventId}/registration-status`);
      setRegistrationStatus(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar status das inscrições:', error);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await api.delete(`/events/${eventId}`);
      setShowDeleteModal(false);
      navigate('/events');
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
    }
  };

  const handlePauseRegistration = async (e) => {
    e.preventDefault();
    try {
      const data = {};
      if (pauseUntil) {
        data.pauseUntil = pauseUntil;
      }
      
      await api.post(`/events/${eventId}/pause-registration`, data);
      setShowPauseModal(false);
      setPauseUntil('');
      fetchEventDetails();
      fetchRegistrationStatus();
    } catch (error) {
      console.error('Erro ao pausar inscrições:', error);
    }
  };

  const handleResumeRegistration = async () => {
    try {
      await api.post(`/events/${eventId}/resume-registration`);
      fetchEventDetails();
      fetchRegistrationStatus();
    } catch (error) {
      console.error('Erro ao retomar inscrições:', error);
    }
  };

  const handleTogglePublic = async () => {
    try {
      await api.put(`/events/${eventId}`, {
        isPublic: !event.isPublic
      });
      fetchEventDetails();
    } catch (error) {
      console.error('Erro ao alterar visibilidade do evento:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatus = (event) => {
    if (!event) return null;
    
    const now = new Date();
    const eventDate = new Date(event.date);
    
    if (!event.isActive) {
      return { status: 'inactive', label: 'Inativo', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    } else if (eventDate < now) {
      return { status: 'finished', label: 'Finalizado', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    } else if (eventDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return { status: 'today', label: 'Hoje', color: 'text-warning-700', bgColor: 'bg-warning-100' };
    } else {
      return { status: 'upcoming', label: 'Próximo', color: 'text-success-700', bgColor: 'bg-success-100' };
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Aqui você pode adicionar uma notificação de sucesso
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

  const handleAddCustomField = async (e) => {
    e.preventDefault();
    if (!newField.name.trim()) return;

    try {
      const updatedFields = [...customFields, newField];
      const customFieldsObj = {};
      updatedFields.forEach(field => {
        customFieldsObj[field.name] = {
          type: field.type,
          required: field.required
        };
      });

      await api.put(`/events/${eventId}/custom-fields`, {
        customFields: customFieldsObj
      });

      setCustomFields(updatedFields);
      setNewField({ name: '', type: 'text', required: false });
      setShowCustomFieldsModal(false);
      fetchEventDetails(); // Recarregar evento
    } catch (error) {
      console.error('Erro ao adicionar campo personalizado:', error);
      if (error.response && error.response.data) {
        alert(`Erro ao adicionar campo personalizado: ${error.response.data.error || error.response.data.message}`);
      } else {
        alert('Erro ao adicionar campo personalizado');
      }
    }
  };

  const handleRemoveCustomField = async (fieldName) => {
    try {
      const updatedFields = customFields.filter(field => field.name !== fieldName);
      const customFieldsObj = {};
      updatedFields.forEach(field => {
        customFieldsObj[field.name] = {
          type: field.type,
          required: field.required
        };
      });

      await api.put(`/events/${eventId}/custom-fields`, {
        customFields: customFieldsObj
      });

      setCustomFields(updatedFields);
      fetchEventDetails(); // Recarregar evento
    } catch (error) {
      console.error('Erro ao remover campo personalizado:', error);
      if (error.response && error.response.data) {
        alert(`Erro ao remover campo personalizado: ${error.response.data.error || error.response.data.message}`);
      } else {
        alert('Erro ao remover campo personalizado');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Evento não encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">
          O evento que você está procurando não existe ou foi removido.
        </p>
        <div className="mt-6">
          <Link to="/events" className="btn-primary">
            Voltar aos Eventos
          </Link>
        </div>
      </div>
    );
  }

  const status = getEventStatus(event);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/events')}
            className="btn-outline inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
              {status && (
                <span className={`badge ${status.bgColor} ${status.color}`}>
                  {status.label}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Criado em {new Date(event.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowShareModal(true)}
            className="btn-outline inline-flex items-center"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </button>
          <Link
            to={`/events/${eventId}/edit`}
            className="btn-outline inline-flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn-danger inline-flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar
          </button>
        </div>
      </div>

      {/* Estatísticas Modernas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total de Convidados</p>
                <p className="text-3xl font-bold">{stats.stats?.totalGuests || 0}</p>
              </div>
              <Users2 className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Confirmados</p>
                <p className="text-3xl font-bold">{stats.stats?.confirmedGuests || 0}</p>
                <p className="text-green-200 text-sm">
                  {stats.stats?.confirmationRate || 0}% de confirmação
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Presentes</p>
                <p className="text-3xl font-bold">{stats.stats?.checkedInGuests || 0}</p>
                <p className="text-purple-200 text-sm">
                  {stats.stats?.attendanceRate || 0}% de presença
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Pendentes</p>
                <p className="text-3xl font-bold">{stats.stats?.pendingGuests || 0}</p>
                <p className="text-orange-200 text-sm">Aguardando confirmação</p>
              </div>
              <Clock className="h-8 w-8 text-orange-200" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Evento */}
        <div className="lg:col-span-2 space-y-6">
          {/* Imagem do Evento */}
          {event.imageUrl && (
            <div className="card">
              <div className="card-body p-0">
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  className="w-full h-64 object-cover rounded-t-lg"
                />
              </div>
            </div>
          )}

          {/* Detalhes do Evento */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Detalhes do Evento</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Data e Hora</p>
                    <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Local</p>
                    <p className="text-sm text-gray-500">{event.location}</p>
                  </div>
                </div>
              </div>

              {event.description && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Descrição</p>
                  <p className="text-sm text-gray-600">{event.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.maxGuests && (
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Capacidade</p>
                      <p className="text-sm text-gray-500">{event.maxGuests} pessoas</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center">
                  <CalendarDays className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Status</p>
                    <p className="text-sm text-gray-500">
                      {event.isActive ? 'Ativo' : 'Inativo'} • {event.isPublic ? 'Público' : 'Privado'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campos Personalizados */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Campos Personalizados</h3>
                <button
                  onClick={() => setShowCustomFieldsModal(true)}
                  className="btn-primary inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Campo
                </button>
              </div>
            </div>
            <div className="card-body">
              {customFields.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhum campo personalizado definido.
                </p>
              ) : (
                <div className="space-y-3">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{field.name}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({field.type}) {field.required && '(Obrigatório)'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveCustomField(field.name)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Equipe do Evento */}
          <EventTeam eventId={eventId} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Controle de Inscrições */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Controle de Inscrições</h3>
            </div>
            <div className="card-body space-y-3">
              {registrationStatus.isPaused ? (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Pause className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Inscrições pausadas</p>
                  <button
                    onClick={handleResumeRegistration}
                    className="btn-primary w-full inline-flex items-center justify-center"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Retomar Inscrições
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Play className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Inscrições ativas</p>
                  <button
                    onClick={() => setShowPauseModal(true)}
                    className="btn-outline w-full inline-flex items-center justify-center"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar Inscrições
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Ações Rápidas</h3>
            </div>
            <div className="card-body space-y-3">
              <Link
                to={`/events/${eventId}/guests`}
                className="btn-outline w-full inline-flex items-center justify-center"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Gerenciar Convidados
              </Link>
              
              <Link
                to={`/events/${eventId}/checkin`}
                className="btn-primary w-full inline-flex items-center justify-center"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Check-in
              </Link>
              
              <Link
                to={`/events/${eventId}/subeventos`}
                className="btn-outline w-full inline-flex items-center justify-center"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                SubEventos
              </Link>
              
              <Link
                to={`/events/${eventId}/form-builder`}
                className="btn-outline w-full inline-flex items-center justify-center"
              >
                <Type className="h-4 w-4 mr-2" />
                Construtor de Formulário
              </Link>
              
              <Link
                to={`/events/${eventId}/page-editor`}
                className="btn-outline w-full inline-flex items-center justify-center"
              >
                <Palette className="h-4 w-4 mr-2" />
                Editor da Página
              </Link>
              
              <button
                onClick={exportGuests}
                className="btn-outline w-full inline-flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Lista
              </button>
              
              <button
                onClick={() => window.open(`${window.location.origin}/event/${eventId}`, '_blank')}
                className="btn-outline w-full inline-flex items-center justify-center"
                disabled={!event?.isPublic}
                title={!event?.isPublic ? 'Evento deve estar público para visualizar' : 'Abrir página pública do evento'}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Página Pública
              </button>
              
              {event?.customSlug && (
                <button
                  onClick={() => window.open(`${window.location.origin}/e/${event.customSlug}`, '_blank')}
                  className="btn-outline w-full inline-flex items-center justify-center"
                  disabled={!event?.isPublic}
                  title={!event?.isPublic ? 'Evento deve estar público para visualizar' : 'Abrir página pública personalizada'}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver URL Personalizada
                </button>
              )}
              
              <button
                onClick={() => window.open(`${window.location.origin}/event/${eventId}/formulario`, '_blank')}
                className="btn-outline w-full inline-flex items-center justify-center"
                disabled={!event?.isPublic || !event?.isActive}
                title={!event?.isPublic ? 'Evento deve estar público para visualizar' : !event?.isActive ? 'Evento deve estar ativo para visualizar' : 'Abrir formulário de inscrição'}
              >
                <Type className="h-4 w-4 mr-2" />
                Ver Formulário
              </button>
              
              {event?.customSlug && (
                <button
                  onClick={() => window.open(`${window.location.origin}/e/${event.customSlug}/formulario`, '_blank')}
                  className="btn-outline w-full inline-flex items-center justify-center"
                  disabled={!event?.isPublic || !event?.isActive}
                  title={!event?.isPublic ? 'Evento deve estar público para visualizar' : !event?.isActive ? 'Evento deve estar ativo para visualizar' : 'Abrir formulário de inscrição personalizado'}
                >
                  <Type className="h-4 w-4 mr-2" />
                  Ver Formulário Personalizado
                </button>
              )}
            </div>
          </div>

          {/* Status do Evento */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Status</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-center space-x-2">
                {event.isActive ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
                <span className={event.isActive ? 'text-green-600' : 'text-yellow-600'}>
                  {event.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {event.isPublic ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={event.isPublic ? 'text-green-600' : 'text-gray-600'}>
                    {event.isPublic ? 'Público' : 'Privado'}
                  </span>
                </div>
                <button
                  onClick={handleTogglePublic}
                  className={`px-3 py-1 text-xs rounded-full ${
                    event.isPublic 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {event.isPublic ? 'Tornar Privado' : 'Tornar Público'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Confirmar exclusão</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Tem certeza que deseja deletar o evento "{event.name}"?
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
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

      {/* Pause Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center">Pausar Inscrições</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="form-label">Pausar até (opcional)</label>
                  <input
                    type="datetime-local"
                    value={pauseUntil}
                    onChange={(e) => setPauseUntil(e.target.value)}
                    className="input w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deixe em branco para pausar indefinidamente
                  </p>
                </div>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      setShowPauseModal(false);
                      setPauseUntil('');
                    }}
                    className="btn-outline"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handlePauseRegistration}
                    className="btn-primary"
                  >
                    Pausar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center">Compartilhar Evento</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="form-label">Link do Evento</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={`${window.location.origin}/event/${event.id}`}
                      readOnly
                      className="input rounded-r-none"
                    />
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/event/${event.id}`)}
                      className="btn-outline rounded-l-none"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
                <div>
                  <label className="form-label">Link de Inscrição</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={`${window.location.origin}/event/${event.id}/register`}
                      readOnly
                      className="input rounded-r-none"
                    />
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/event/${event.id}/register`)}
                      className="btn-outline rounded-l-none"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="btn-primary"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para adicionar campo personalizado */}
      {showCustomFieldsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              onClick={() => setShowCustomFieldsModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Adicionar Campo Personalizado</h2>
            <form onSubmit={handleAddCustomField} className="space-y-4">
              <input
                type="text"
                placeholder="Nome do campo"
                value={newField.name}
                onChange={e => setNewField({ ...newField, name: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <select
                value={newField.type}
                onChange={e => setNewField({ ...newField, type: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="text">Texto</option>
                <option value="email">E-mail</option>
                <option value="number">Número</option>
                <option value="tel">Telefone</option>
                <option value="date">Data</option>
              </select>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newField.required}
                  onChange={e => setNewField({ ...newField, required: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Campo obrigatório</span>
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomFieldsModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails; 