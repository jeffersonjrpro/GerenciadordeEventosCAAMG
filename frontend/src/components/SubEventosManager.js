import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import QRCodeScanner from './QRCodeScanner';

const SubEventosManager = () => {
  const { eventId } = useParams();
  const [subEventos, setSubEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedSubEvento, setSelectedSubEvento] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    dataHora: '',
    local: '',
    limitePorConvidado: 1
  });

  const carregarSubEventos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/eventos/${eventId}/subeventos`);
      setSubEventos(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar subeventos:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    carregarSubEventos();
  }, [carregarSubEventos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/eventos/${eventId}/subeventos`, formData);
      setFormData({
        nome: '',
        descricao: '',
        dataHora: '',
        local: '',
        limitePorConvidado: 1
      });
      setShowForm(false);
      carregarSubEventos();
    } catch (error) {
      console.error('Erro ao criar subevento:', error);
    }
  };

  const handleDelete = async (subEventoId) => {
    if (window.confirm('Tem certeza que deseja excluir este subevento?')) {
      try {
        await api.delete(`/subeventos/${subEventoId}`);
        carregarSubEventos();
      } catch (error) {
        console.error('Erro ao excluir subevento:', error);
      }
    }
  };

  const handleQRCodeScanned = async (qrCode) => {
    try {
      const response = await api.post(`/subeventos/${selectedSubEvento.id}/validar`, {
        qrCode: qrCode
      });

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
      } else {
        alert(`❌ ${response.data.error}`);
      }

      setShowScanner(false);
      setSelectedSubEvento(null);
      carregarSubEventos(); // Recarregar para atualizar contadores
    } catch (error) {
      console.error('Erro ao validar acesso:', error);
      alert('Erro ao processar QR Code');
    }
  };

  const formatarDataHora = (dataHora) => {
    return new Date(dataHora).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar SubEventos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Criar SubEvento
        </button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Criar Novo SubEvento</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Almoço, Jantar, Workshop"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data e Hora *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.dataHora}
                  onChange={(e) => setFormData({...formData, dataHora: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Local
                </label>
                <input
                  type="text"
                  value={formData.local}
                  onChange={(e) => setFormData({...formData, local: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Salão Principal, Sala A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite por Convidado
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.limitePorConvidado}
                  onChange={(e) => setFormData({...formData, limitePorConvidado: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Descrição opcional do subevento"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Criar SubEvento
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de SubEventos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subEventos.map((subEvento) => (
          <div key={subEvento.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{subEvento.nome}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedSubEvento(subEvento);
                    setShowScanner(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"
                  title="Validar entrada"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(subEvento.id)}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md"
                  title="Excluir"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Data/Hora:</strong> {formatarDataHora(subEvento.dataHora)}</p>
              {subEvento.local && <p><strong>Local:</strong> {subEvento.local}</p>}
              {subEvento.descricao && <p><strong>Descrição:</strong> {subEvento.descricao}</p>}
              <p><strong>Limite:</strong> {subEvento.limitePorConvidado} por convidado</p>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Consumos:</span>
                <span className="text-lg font-bold text-blue-600">
                  {subEvento._count.consumos}
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((subEvento._count.consumos / 100) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {subEventos.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum subevento</h3>
          <p className="mt-1 text-sm text-gray-500">Comece criando seu primeiro subevento.</p>
        </div>
      )}

      {/* Scanner de QR Code */}
      {showScanner && selectedSubEvento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Validar entrada: {selectedSubEvento.nome}
            </h3>
            <QRCodeScanner onScan={handleQRCodeScanned} />
            <button
              onClick={() => {
                setShowScanner(false);
                setSelectedSubEvento(null);
              }}
              className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubEventosManager; 