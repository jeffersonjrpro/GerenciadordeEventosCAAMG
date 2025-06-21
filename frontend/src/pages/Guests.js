import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Guests = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [presence, setPresence] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: '', email: '', phone: '' });
  const [importing, setImporting] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [formLink, setFormLink] = useState('');
  const [event, setEvent] = useState(null);
  const [customFields, setCustomFields] = useState([]);

  useEffect(() => {
    console.log('Guests - eventId recebido:', eventId);
    fetchEvent();
    fetchGuests();
  }, [eventId]);

  useEffect(() => {
    if (search || status !== 'all' || presence !== 'all') {
      const delayDebounceFn = setTimeout(() => {
        fetchGuests();
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [search, status, presence]);

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
      const response = await api.get(`/events/${eventId}/guests`, {
        params: { search, status, presence }
      });
      setGuests(response.data.data || []);
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

  async function handleAddGuest(e) {
    e.preventDefault();
    console.log('Tentando adicionar convidado:', newGuest);
    console.log('EventId:', eventId);
    
    // Validação básica
    if (!newGuest.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }
    
    try {
      // Preparar dados do convidado incluindo campos personalizados
      const guestData = {
        name: newGuest.name,
        email: newGuest.email || null,
        phone: newGuest.phone || null,
        customFields: {}
      };

      // Adicionar campos personalizados
      customFields.forEach(field => {
        if (newGuest[field] !== undefined && newGuest[field] !== '') {
          guestData.customFields[field] = newGuest[field];
        }
      });

      // Remover campos personalizados do objeto principal
      const cleanGuestData = {
        name: guestData.name,
        email: guestData.email,
        phone: guestData.phone,
        customFields: guestData.customFields
      };

      console.log('Dados limpos enviados:', cleanGuestData);

      const response = await api.post(`/events/${eventId}/guests`, cleanGuestData);
      console.log('Resposta do servidor:', response.data);
      setGuests([response.data.data, ...guests]);
      setShowAddModal(false);
      setNewGuest({ name: '', email: '', phone: '' });
    } catch (error) {
      console.error('Erro completo:', error);
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      if (error.response && error.response.data && error.response.data.message) {
        alert(`Erro ao adicionar convidado: ${error.response.data.message}`);
      } else if (error.response && error.response.data && error.response.data.details) {
        const errorDetails = error.response.data.details.map(d => d.msg).join(', ');
        alert(`Erro de validação: ${errorDetails}`);
      } else {
        alert('Erro ao adicionar convidado. Verifique os dados e tente novamente.');
      }
    }
  }

  async function handleImportCSV(e) {
    e.preventDefault();
    if (!csvFile) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const response = await api.post(`/events/${eventId}/guests/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setGuests([...response.data.data, ...guests]);
      setCsvFile(null);
      setShowAddModal(false);
    } catch (error) {
      alert('Erro ao importar CSV');
    } finally {
      setImporting(false);
    }
  }

  async function handleExportCSV() {
    setExporting(true);
    try {
      const response = await api.get(`/events/${eventId}/guests/export`, {
        params: { status, presence },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `convidados-${eventId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Erro ao exportar CSV');
    } finally {
      setExporting(false);
    }
  }

  async function handleCopyLink() {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(formLink);
      alert('Link copiado!');
    } catch {
      alert('Erro ao copiar link');
    } finally {
      setCopying(false);
    }
  }

  async function handleConfirm(guestId) {
    try {
      await api.put(`/events/${eventId}/guests/${guestId}/confirm`);
      fetchGuests();
    } catch {
      alert('Erro ao confirmar presença');
    }
  }

  async function handleDelete(guestId) {
    if (!window.confirm('Deseja remover este convidado?')) return;
    try {
      await api.delete(`/events/${eventId}/guests/${guestId}`);
      setGuests(guests.filter(g => g.id !== guestId));
    } catch {
      alert('Erro ao remover convidado');
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Convidados</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Adicionar</button>
          <button onClick={() => {
            console.log('Testando API...');
            api.get(`/events/${eventId}/guests`).then(r => console.log('API OK:', r.data)).catch(e => console.error('API Error:', e));
          }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Testar API</button>
          <label className="px-4 py-2 bg-gray-200 rounded cursor-pointer hover:bg-gray-300">
            Importar CSV
            <input type="file" accept=".csv" className="hidden" onChange={e => setCsvFile(e.target.files[0])} />
          </label>
          <button onClick={handleImportCSV} disabled={!csvFile || importing} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">{importing ? 'Importando...' : 'Enviar CSV'}</button>
          <button onClick={handleExportCSV} disabled={exporting} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">{exporting ? 'Exportando...' : 'Exportar CSV'}</button>
          <button onClick={handleCopyLink} disabled={copying} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">{copying ? 'Copiando...' : 'Copiar link formulário'}</button>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Voltar</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por nome, e-mail ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border rounded w-full md:w-1/3"
        />
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="all">Todos os status</option>
          <option value="confirmed">Confirmados</option>
          <option value="pending">Pendentes</option>
        </select>
        <select
          value={presence}
          onChange={e => setPresence(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="all">Todas as presenças</option>
          <option value="present">Presentes</option>
          <option value="absent">Ausentes</option>
        </select>
      </div>

      {/* Lista de convidados */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : guests.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-4">Nenhum convidado encontrado.</div>
            <button 
              onClick={() => setShowAddModal(true)} 
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Adicionar primeiro convidado
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Presença</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {guests.map(guest => (
                <tr key={guest.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{guest.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{guest.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{guest.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {guest.confirmed ? (
                      <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs">Confirmado</span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs">Pendente</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {guest.checkIns && guest.checkIns.length > 0 ? (
                      <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs">Presente</span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs">Ausente</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                    {!guest.confirmed && (
                      <button onClick={() => handleConfirm(guest.id)} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200">Confirmar</button>
                    )}
                    <button onClick={() => handleDelete(guest.id)} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal adicionar convidado */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAddModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">&times;</button>
            <h2 className="text-xl font-bold mb-4">Adicionar Convidado</h2>
            <form onSubmit={handleAddGuest} className="space-y-4">
              <input
                type="text"
                placeholder="Nome *"
                value={newGuest.name}
                onChange={e => setNewGuest({ ...newGuest, name: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                type="email"
                placeholder="E-mail (opcional)"
                value={newGuest.email}
                onChange={e => setNewGuest({ ...newGuest, email: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Telefone (opcional)"
                value={newGuest.phone}
                onChange={e => setNewGuest({ ...newGuest, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
              
              {/* Campos personalizados */}
              {customFields.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Campos Personalizados</h3>
                  {customFields.map(field => (
                    <input
                      key={field}
                      type="text"
                      placeholder={field}
                      value={newGuest[field] || ''}
                      onChange={e => setNewGuest({ ...newGuest, [field]: e.target.value })}
                      className="w-full px-3 py-2 border rounded mb-2"
                    />
                  ))}
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Guests; 