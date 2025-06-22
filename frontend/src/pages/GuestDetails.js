import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  QrCode as QrCodeIcon,
  Edit
} from 'lucide-react';

const GuestDetails = () => {
  const { eventId, guestId } = useParams();
  const navigate = useNavigate();
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGuestDetails();
  }, [eventId, guestId]);

  const fetchGuestDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/guests/events/${eventId}/guests/${guestId}/details`);
      setGuest(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar detalhes do convidado:', error);
      setError('Erro ao carregar detalhes do convidado');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = guest.qrCodeImage;
    link.download = `qrcode-${guest.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCustomFieldValue = (fieldId) => {
    if (!guest.customFields || !guest.customFields[fieldId]) return '';
    return guest.customFields[fieldId];
  };

  const getCustomFields = () => {
    if (!guest?.event?.formConfig?.fields) return [];
    return guest.event.formConfig.fields.filter(field => 
      field.id !== 'name' && field.id !== 'email' && field.id !== 'phone'
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="text-center py-12">
        <XCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Erro</h3>
        <p className="mt-1 text-sm text-gray-500">{error || 'Convidado não encontrado'}</p>
        <div className="mt-6">
          <button onClick={() => navigate(`/events/${eventId}/guests`)} className="btn-primary">
            Voltar aos Convidados
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(`/events/${eventId}/guests`)} className="btn-outline inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalhes do Convidado</h1>
            <p className="mt-1 text-sm text-gray-500">
              {guest.event?.name} • {guest.name}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => navigate(`/events/${eventId}/guests/${guestId}/edit`)}
          className="btn-primary inline-flex items-center"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Informações do Convidado */}
        <div className="space-y-6">
          {/* Card Principal */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Informações Pessoais</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-3 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Nome</p>
                  <p className="text-lg text-gray-900">{guest.name}</p>
                </div>
              </div>
              
              {guest.email && (
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-3 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">E-mail</p>
                    <p className="text-lg text-gray-900">{guest.email}</p>
                  </div>
                </div>
              )}
              
              {guest.phone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Telefone</p>
                    <p className="text-lg text-gray-900">{guest.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-3 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Inscrito em</p>
                  <p className="text-lg text-gray-900">{formatDate(guest.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Campos Personalizados */}
          {getCustomFields().length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Informações Adicionais</h2>
              </div>
              <div className="card-body space-y-4">
                {getCustomFields().map(field => (
                  <div key={field.id} className="flex items-center">
                    <div className="h-5 w-5 mr-3 text-primary-600 flex items-center justify-center">
                      <span className="text-xs font-bold">{field.label.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{field.label}</p>
                      <p className="text-lg text-gray-900">{getCustomFieldValue(field.id) || '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status e Presença */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Status e Presença</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-3 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Status de Confirmação</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                    guest.confirmed 
                      ? 'bg-success-100 text-success-800' 
                      : 'bg-warning-100 text-warning-800'
                  }`}>
                    {guest.confirmed ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Confirmado
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Pendente
                      </>
                    )}
                  </span>
                  {guest.confirmedAt && (
                    <p className="text-sm text-gray-500 mt-1">
                      Confirmado em {formatDate(guest.confirmedAt)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-3 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Presença no Evento</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                    guest.checkIns.length > 0 
                      ? 'bg-success-100 text-success-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {guest.checkIns.length > 0 ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Presente
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Ausente
                      </>
                    )}
                  </span>
                  {guest.checkIns.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Check-in realizado em {formatDate(guest.checkIns[0].checkedInAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code e Informações do Evento */}
        <div className="space-y-6">
          {/* QR Code */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">QR Code de Acesso</h2>
            </div>
            <div className="card-body text-center">
              <div className="bg-white border-4 border-gray-200 rounded-2xl p-6 inline-block mb-6">
                <img
                  src={guest.qrCodeImage}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Código: <span className="font-mono font-bold text-lg">{guest.qrCode}</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Apresente este QR Code no momento do check-in do evento
              </p>
              
              <button
                onClick={downloadQRCode}
                className="btn-primary inline-flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar QR Code
              </button>
            </div>
          </div>

          {/* Informações do Evento */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Informações do Evento</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Data e Hora</p>
                  <p className="text-lg text-gray-900">{formatDate(guest.event?.date)}</p>
                </div>
              </div>
              
              {guest.event?.location && (
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-3 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Local</p>
                    <p className="text-lg text-gray-900">{guest.event.location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDetails; 