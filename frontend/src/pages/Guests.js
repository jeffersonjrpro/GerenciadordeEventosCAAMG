import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  QrCode,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const Guests = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [presenceFilter, setPresenceFilter] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [event, setEvent] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [formLink, setFormLink] = useState('');
  
  // Estados para modal de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    console.log('Guests - eventId recebido:', eventId);
    fetchEvent();
    fetchGuests();
  }, [eventId]);

  useEffect(() => {
    if (searchTerm || statusFilter !== '' || presenceFilter !== '') {
      const delayDebounceFn = setTimeout(() => {
        fetchGuests();
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, statusFilter, presenceFilter]);

  useEffect(() => {
    setFormLink(`${window.location.origin}/event/${eventId}/formulario`);
  }, [eventId]);

  async function fetchEvent() {
    try {
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data.data);
      // Extrair campos personalizados do evento
      if (response.data.data.customFields) {
        setCustomFields(Object.keys(response.data.data.customFields));
      }
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
    }
  }

  async function fetchGuests() {
    setLoading(true);
    try {
      const response = await api.get(`/guests/events/${eventId}/guests`, {
        params: { search: searchTerm, status: statusFilter, presence: presenceFilter }
      });
      setGuests(response.data.data.guests);
      setEvent(response.data.data.event);
    } catch (error) {
      console.error('Erro ao buscar convidados:', error);
      // Só mostra erro se for um erro de rede/conexão, não quando não há dados
      if (error.response && error.response.status >= 500) {
        alert('Erro de conexão. Tente novamente.');
      } else if (error.response && error.response.status === 404) {
        setGuests([]);
      } else if (!error.response) {
        alert('Erro de conexão. Verifique sua internet.');
      } else {
        setGuests([]);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (presenceFilter) params.append('presence', presenceFilter);

      const response = await api.get(`/guests/events/${eventId}/guests/export?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `convidados_${event?.name || 'evento'}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar arquivo');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      alert('Selecione um arquivo CSV');
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', importFile);

      await api.post(`/guests/events/${eventId}/guests/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setShowImportModal(false);
      setImportFile(null);
      fetchGuests();
      alert('Convidados importados com sucesso!');
    } catch (error) {
      console.error('Erro ao importar:', error);
      alert('Erro ao importar arquivo');
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteGuest = (guest) => {
    setGuestToDelete(guest);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!guestToDelete) return;

    try {
      setDeleting(true);
      await api.delete(`/guests/events/${eventId}/guests/${guestToDelete.id}`);
      
      // Remover o convidado da lista local
      setGuests(guests.filter(g => g.id !== guestToDelete.id));
      
      setShowDeleteModal(false);
      setGuestToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar convidado:', error);
      alert('Erro ao deletar convidado');
    } finally {
      setDeleting(false);
    }
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

  const getCustomFieldValue = (guest, fieldId) => {
    if (!guest.customFields || !guest.customFields[fieldId]) return '';
    return guest.customFields[fieldId];
  };

  const getCustomFields = () => {
    if (!event?.formConfig?.fields) return [];
    return event.formConfig.fields.filter(field => 
      field.id !== 'name' && field.id !== 'email' && field.id !== 'phone'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(`/events/${eventId}`)} className="btn-outline inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Convidados</h1>
            <p className="mt-1 text-sm text-gray-500">
              {event?.name} • {guests.length} convidado(s)
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button onClick={() => setShowImportModal(true)} className="btn-outline inline-flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </button>
          <button onClick={handleExport} className="btn-outline inline-flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button onClick={() => navigate(`/events/${eventId}/guests/add`)} className="btn-primary inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                  placeholder="Nome, e-mail ou telefone"
                />
              </div>
            </div>
            
            <div>
              <label className="form-label">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="">Todos</option>
                <option value="confirmed">Confirmados</option>
                <option value="pending">Pendentes</option>
              </select>
            </div>
            
            <div>
              <label className="form-label">Presença</label>
              <select
                value={presenceFilter}
                onChange={(e) => setPresenceFilter(e.target.value)}
                className="input"
              >
                <option value="">Todos</option>
                <option value="present">Presentes</option>
                <option value="absent">Ausentes</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="card-body p-0">
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
                  {getCustomFields().map(field => (
                    <th key={field.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Presença
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {guests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{guest.name}</div>
                          <div className="text-sm text-gray-500">
                            Inscrito em {formatDate(guest.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {guest.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1 text-gray-400" />
                            {guest.email}
                          </div>
                        )}
                        {guest.phone && (
                          <div className="flex items-center mt-1">
                            <Phone className="h-4 w-4 mr-1 text-gray-400" />
                            {guest.phone}
                          </div>
                        )}
                      </div>
                    </td>

                    {getCustomFields().map(field => (
                      <td key={field.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getCustomFieldValue(guest, field.id)}
                      </td>
                    ))}
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {guest.qrCode}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/events/${eventId}/guests/${guest.id}/details`)}
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </button>
                        <button
                          onClick={() => navigate(`/events/${eventId}/guests/${guest.id}/edit`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteGuest(guest)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Importar Convidados</h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Arquivo CSV</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    className="input"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  <p>O arquivo deve conter as colunas:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>nome (obrigatório)</li>
                    <li>email</li>
                    <li>telefone</li>
                    {getCustomFields().map(field => (
                      <li key={field.id}>{field.id} ({field.label})</li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="btn-outline"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || !importFile}
                    className="btn-primary"
                  >
                    {importing ? 'Importando...' : 'Importar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 w-full max-w-md">
            <div className="relative bg-white rounded-lg shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              
              {/* Content */}
              <div className="text-center px-6 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirmar Exclusão
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Tem certeza que deseja excluir o convidado <strong>"{guestToDelete?.name}"</strong>?
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  Esta ação não pode ser desfeita e removerá permanentemente todos os dados do convidado.
                </p>
                
                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {deleting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Excluindo...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </div>
                    )}
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

export default Guests; 