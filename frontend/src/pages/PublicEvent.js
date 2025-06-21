import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Share2,
  QrCode,
  Mail,
  Phone,
  User
} from 'lucide-react';

const PublicEvent = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [guest, setGuest] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/public/events/${eventId}`);
      setEvent(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar evento:', error);
      setError('Evento não encontrado ou não está disponível publicamente');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async (data) => {
    try {
      setLoading(true);
      await api.post(`/public/events/${eventId}/register`, data);
      setRegistrationSuccess(true);
      reset();
    } catch (error) {
      console.error('Erro ao registrar:', error);
      setError(error.response?.data?.message || 'Erro ao registrar presença');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await api.post(`/public/events/${eventId}/guests/public`, data);
      setGuest(response.data.data);
      setRegistrationSuccess(true);
      reset();
    } catch (error) {
      console.error('Erro ao inscrever:', error);
      setError(error.response?.data?.message || 'Erro ao realizar inscrição. Tente novamente.');
    } finally {
      setSubmitting(false);
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
      return { status: 'inactive', label: 'Evento Inativo', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    } else if (eventDate < now) {
      return { status: 'finished', label: 'Evento Finalizado', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    } else if (eventDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return { status: 'today', label: 'Evento Hoje', color: 'text-warning-700', bgColor: 'bg-warning-100' };
    } else {
      return { status: 'upcoming', label: 'Evento Próximo', color: 'text-success-700', bgColor: 'bg-success-100' };
    }
  };

  const shareEvent = () => {
    if (navigator.share) {
      navigator.share({
        title: event.name,
        text: `Confira o evento: ${event.name}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Aqui você pode adicionar uma notificação de sucesso
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="text-center py-12">
        <XCircle className="mx-auto h-12 w-12 text-danger-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Evento não encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const status = getEventStatus(event);

  if (registrationSuccess && guest) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Inscrição Confirmada!
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Sua inscrição foi realizada com sucesso. Guarde seu QR Code para o check-in no evento.
              </p>
            </div>

            {/* Informações do Evento */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {event.name}
              </h2>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-3" />
                  <span>
                    {new Date(event.date).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-3" />
                    <span>{event.location}</span>
                  </div>
                )}
                {event.time && (
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-3" />
                    <span>{event.time}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Informações do Convidado */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Suas Informações
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <User className="h-5 w-5 mr-3" />
                  <span className="font-medium">{guest.name}</span>
                </div>
                {guest.email && (
                  <div className="flex items-center text-gray-700">
                    <Mail className="h-5 w-5 mr-3" />
                    <span>{guest.email}</span>
                  </div>
                )}
                {guest.phone && (
                  <div className="flex items-center text-gray-700">
                    <Phone className="h-5 w-5 mr-3" />
                    <span>{guest.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Seu QR Code
              </h3>
              <div className="flex justify-center mb-4">
                <img
                  src={`/api/qr-code/${guest.qrCode}`}
                  alt="QR Code"
                  className="border-4 border-gray-200 rounded-lg"
                />
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Código: {guest.qrCode}
              </p>
              <p className="text-sm text-gray-500">
                Apresente este QR Code no momento do check-in do evento.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="btn-outline inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Evento</h1>
              </div>
            </div>
            <button
              onClick={shareEvent}
              className="btn-outline inline-flex items-center"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            {event.imageUrl && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            {/* Event Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{event.name}</h2>
                {status && (
                  <span className={`badge ${status.bgColor} ${status.color}`}>
                    {status.label}
                  </span>
                )}
              </div>

              {event.description && (
                <p className="text-gray-600 mb-6">{event.description}</p>
              )}

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

              {event.capacity && (
                <div className="mt-4 flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Capacidade</p>
                    <p className="text-sm text-gray-500">
                      {event._count.guests} de {event.capacity} vagas preenchidas
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Registration Form */}
            {!registrationSuccess && event.isActive && new Date(event.date) > new Date() && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Confirmar Presença
                </h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="form-label">
                        Nome completo *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="name"
                          type="text"
                          className="input pl-10"
                          placeholder="Seu nome completo"
                          {...register('name', {
                            required: 'Nome é obrigatório',
                            minLength: {
                              value: 2,
                              message: 'Nome deve ter pelo menos 2 caracteres',
                            },
                          })}
                        />
                      </div>
                      {errors.name && (
                        <p className="form-error">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="form-label">
                        Email *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          className="input pl-10"
                          placeholder="seu@email.com"
                          {...register('email', {
                            required: 'Email é obrigatório',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Email inválido',
                            },
                          })}
                        />
                      </div>
                      {errors.email && (
                        <p className="form-error">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="form-label">
                        Telefone
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="phone"
                          type="tel"
                          className="input pl-10"
                          placeholder="(11) 99999-9999"
                          {...register('phone')}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="plusOne" className="form-label">
                        Acompanhante
                      </label>
                      <input
                        id="plusOne"
                        type="text"
                        className="input"
                        placeholder="Nome do acompanhante"
                        {...register('plusOne')}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                      <div className="flex">
                        <XCircle className="h-5 w-5 text-danger-400" />
                        <div className="ml-3">
                          <p className="text-sm text-danger-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary inline-flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {submitting ? 'Enviando...' : 'Confirmar Inscrição'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Registration Success */}
            {registrationSuccess && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-6">
                <div className="text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-success-600" />
                  <h3 className="mt-2 text-lg font-medium text-success-900">
                    Presença Confirmada!
                  </h3>
                  <p className="mt-1 text-sm text-success-700">
                    Sua presença foi confirmada com sucesso. Você receberá um email com mais informações.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => setRegistrationSuccess(false)}
                      className="btn-outline"
                    >
                      Confirmar Outra Pessoa
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Estatísticas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total de Convidados</span>
                  <span className="text-sm font-medium text-gray-900">
                    {event._count.guests}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Confirmados</span>
                  <span className="text-sm font-medium text-gray-900">
                    {event._count.confirmedGuests || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Presentes</span>
                  <span className="text-sm font-medium text-gray-900">
                    {event._count.checkIns}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações</h3>
              <div className="space-y-3">
                {event.category && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Categoria</p>
                    <p className="text-sm text-gray-900 capitalize">{event.category}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Organizador</p>
                  <p className="text-sm text-gray-900">{event.organizer?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Criado em</p>
                  <p className="text-sm text-gray-900">
                    {new Date(event.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code */}
            {event.isActive && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code</h3>
                <div className="text-center">
                  <div className="bg-gray-100 rounded-lg p-4 inline-block">
                    <QrCode className="h-24 w-24 text-gray-400" />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Apresente este QR Code no check-in
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicEvent; 