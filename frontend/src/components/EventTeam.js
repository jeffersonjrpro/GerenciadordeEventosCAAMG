import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Edit, Mail, Clock } from 'lucide-react';
import api from '../services/api';

const EventTeam = ({ eventId }) => {
  const [organizers, setOrganizers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'EDITOR' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTeamData();
  }, [eventId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const [organizersRes, invitesRes] = await Promise.all([
        api.get(`/organizers/events/${eventId}/organizers`),
        api.get(`/organizers/events/${eventId}/invites`)
      ]);

      setOrganizers(organizersRes.data.data);
      setPendingInvites(invitesRes.data.data);
    } catch (error) {
      console.error('Erro ao carregar dados da equipe:', error);
      setError('Erro ao carregar dados da equipe');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/organizers/events/${eventId}/invite`, inviteData);
      setShowInviteModal(false);
      setInviteData({ email: '', role: 'EDITOR' });
      loadTeamData(); // Recarregar dados
      alert('Convite enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      alert(error.response?.data?.message || 'Erro ao enviar convite');
    }
  };

  const handleRemoveOrganizer = async (userId) => {
    if (!window.confirm('Tem certeza que deseja remover este organizador?')) return;

    try {
      await api.delete(`/organizers/events/${eventId}/organizers/${userId}`);
      loadTeamData(); // Recarregar dados
      alert('Organizador removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover organizador:', error);
      alert(error.response?.data?.message || 'Erro ao remover organizador');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.put(`/organizers/events/${eventId}/organizers/${userId}/role`, {
        role: newRole
      });
      loadTeamData(); // Recarregar dados
      alert('Papel atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar papel:', error);
      alert(error.response?.data?.message || 'Erro ao atualizar papel');
    }
  };

  const handleCancelInvite = async (inviteId) => {
    if (!window.confirm('Tem certeza que deseja cancelar este convite?')) return;

    try {
      await api.delete(`/organizers/invites/${inviteId}`);
      loadTeamData(); // Recarregar dados
      alert('Convite cancelado com sucesso!');
    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
      alert(error.response?.data?.message || 'Erro ao cancelar convite');
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

  const getRoleColor = (role) => {
    const colors = {
      'OWNER': 'bg-red-100 text-red-800',
      'EDITOR': 'bg-blue-100 text-blue-800',
      'CHECKIN': 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600 text-center">
          <Users className="mx-auto text-4xl mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="mr-2" />
          Equipe do Evento
        </h3>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <UserPlus className="mr-2" />
          Convidar Organizador
        </button>
      </div>

      {/* Organizadores Atuais */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 mb-3">Organizadores Atuais</h4>
        {organizers.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum organizador encontrado.</p>
        ) : (
          <div className="space-y-3">
            {organizers.map((organizer) => (
              <div
                key={organizer.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {organizer.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{organizer.user.name}</p>
                    <p className="text-sm text-gray-500">{organizer.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(organizer.role)}`}>
                    {getRoleDisplayName(organizer.role)}
                  </span>
                  {organizer.role !== 'OWNER' && (
                    <select
                      value={organizer.role}
                      onChange={(e) => handleUpdateRole(organizer.user.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="EDITOR">Editor</option>
                      <option value="CHECKIN">Check-in</option>
                    </select>
                  )}
                  {organizer.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemoveOrganizer(organizer.user.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remover organizador"
                    >
                      <Trash2 className="text-sm" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Convites Pendentes */}
      {pendingInvites.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
            <Clock className="mr-2" />
            Convites Pendentes
          </h4>
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-center">
                  <Mail className="text-yellow-600 mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">{invite.email}</p>
                    <p className="text-sm text-gray-500">
                      Convidado por: {invite.invitedBy.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Expira em: {new Date(invite.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(invite.role)}`}>
                    {getRoleDisplayName(invite.role)}
                  </span>
                  <button
                    onClick={() => handleCancelInvite(invite.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Cancelar convite"
                  >
                    <Trash2 className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Convite */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Convidar Organizador</h3>
            <form onSubmit={handleSendInvite}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Função
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EDITOR">Editor (Criar, editar, check-in)</option>
                  <option value="CHECKIN">Check-in (Apenas check-in)</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Enviar Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventTeam; 