import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, X, Users, Calendar, MapPin } from 'lucide-react';
import api from '../services/api';

const InviteAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    validateInvite();
  }, [token]);

  const validateInvite = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/organizers/invite/${token}`);
      setInvite(response.data.data);
    } catch (error) {
      console.error('Erro ao validar convite:', error);
      setError(error.response?.data?.message || 'Convite inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setAccepting(true);
      await api.post(`/organizers/invite/${token}/accept`);
      alert('Convite aceito com sucesso! Você agora é organizador deste evento.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      alert(error.response?.data?.message || 'Erro ao aceitar convite');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    try {
      setDeclining(true);
      await api.post(`/organizers/invite/${token}/decline`);
      alert('Convite rejeitado.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao rejeitar convite:', error);
      alert(error.response?.data?.message || 'Erro ao rejeitar convite');
    } finally {
      setDeclining(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roles = {
      'OWNER': 'Dono',
      'EDITOR': 'Editor',
      'CHECKIN': 'Check-in'
    };
    return roles[role] || role;
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      'OWNER': 'Controle total sobre o evento',
      'EDITOR': 'Pode criar, editar e fazer check-in',
      'CHECKIN': 'Apenas pode fazer check-in de convidados'
    };
    return descriptions[role] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <X className="mx-auto text-6xl mb-4" />
            <h2 className="text-xl font-semibold mb-2">Convite Inválido</h2>
            <p className="text-gray-600">{error}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-green-600 text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Convite para Organizar Evento
          </h1>
          <p className="text-gray-600">
            Você foi convidado para participar da organização de um evento
          </p>
        </div>

        {invite && (
          <div className="space-y-6">
            {/* Informações do Evento */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="mr-2" />
                Informações do Evento
              </h3>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  {invite.event.name}
                </p>
                <p className="text-sm text-gray-600 flex items-center">
                  <MapPin className="mr-1" />
                  Local do evento
                </p>
              </div>
            </div>

            {/* Informações do Convite */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Detalhes do Convite</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Convidado por:</span> {invite.invitedBy.name}
                </p>
                <p>
                  <span className="font-medium">E-mail:</span> {invite.email}
                </p>
                <p>
                  <span className="font-medium">Função:</span>{' '}
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {getRoleDisplayName(invite.role)}
                  </span>
                </p>
                <p className="text-gray-600 text-xs">
                  {getRoleDescription(invite.role)}
                </p>
                <p className="text-gray-500 text-xs">
                  Expira em: {new Date(invite.expiresAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-3">
              <button
                onClick={handleAccept}
                disabled={accepting || declining}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 px-4 rounded-lg flex items-center justify-center"
              >
                {accepting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Check className="mr-2" />
                    Aceitar Convite
                  </>
                )}
              </button>

              <button
                onClick={handleDecline}
                disabled={accepting || declining}
                className="w-full bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg flex items-center justify-center"
              >
                {declining ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                ) : (
                  <>
                    <X className="mr-2" />
                    Rejeitar Convite
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteAccept; 