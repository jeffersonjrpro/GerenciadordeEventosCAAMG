import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
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
  UserPlus
} from 'lucide-react';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${id}`);
      setEvent(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar evento:', error);
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await api.delete(`/events/${id}`);
      setShowDeleteModal(false);
      navigate('/events');
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
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
      const response = await api.get(`/events/${id}/guests/export`, {
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
            to={`/events/${id}/edit`}
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
                {event.capacity && (
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Capacidade</p>
                      <p className="text-sm text-gray-500">{event.capacity} pessoas</p>
                    </div>
                  </div>
                )}
                {event.category && (
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Categoria</p>
                      <p className="text-sm text-gray-500 capitalize">{event.category}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Estatísticas</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {event._count.guests}
                  </div>
                  <div className="text-sm text-gray-500">Total de Convidados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning-600">
                    {event._count.confirmedGuests || 0}
                  </div>
                  <div className="text-sm text-gray-500">Confirmados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">
                    {event._count.checkIns}
                  </div>
                  <div className="text-sm text-gray-500">Presentes</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ações Rápidas */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Ações Rápidas</h3>
            </div>
            <div className="card-body space-y-3">
              <Link
                to={`/events/${id}/guests`}
                className="btn-outline w-full inline-flex items-center justify-center"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Gerenciar Convidados
              </Link>
              
              <Link
                to={`/events/${id}/checkin`}
                className="btn-primary w-full inline-flex items-center justify-center"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Check-in
              </Link>
              
              <button
                onClick={exportGuests}
                className="btn-outline w-full inline-flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Lista
              </button>
            </div>
          </div>

          {/* Configurações */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Configurações</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Evento Ativo</span>
                <span className={`badge ${event.isActive ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'}`}>
                  {event.isActive ? 'Sim' : 'Não'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Requer Confirmação</span>
                <span className={`badge ${event.requiresConfirmation ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'}`}>
                  {event.requiresConfirmation ? 'Sim' : 'Não'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Permitir Convidados</span>
                <span className={`badge ${event.allowGuests ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'}`}>
                  {event.allowGuests ? 'Sim' : 'Não'}
                </span>
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
    </div>
  );
};

export default EventDetails; 