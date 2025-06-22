import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SubEventosManager from '../components/SubEventosManager';
import RelatorioConsumo from '../components/RelatorioConsumo';

const SubEventosPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('gerenciar');

  const handleVoltar = () => {
    navigate(`/events/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleVoltar}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar ao Evento
              </button>
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-800">SubEventos</h1>
            <p className="text-gray-600 mt-2">
              Gerencie subeventos e controle o consumo por QR Code
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('gerenciar')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'gerenciar'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gerenciar SubEventos
            </button>
            <button
              onClick={() => setActiveTab('relatorios')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'relatorios'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Relatórios
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'gerenciar' && <SubEventosManager />}
        {activeTab === 'relatorios' && <RelatorioConsumo />}
      </div>
    </div>
  );
};

export default SubEventosPage; 