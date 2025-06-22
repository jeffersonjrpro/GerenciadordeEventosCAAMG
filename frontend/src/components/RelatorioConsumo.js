import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const RelatorioConsumo = () => {
  const { eventId } = useParams();
  const [estatisticas, setEstatisticas] = useState([]);
  const [relatorioDetalhado, setRelatorioDetalhado] = useState(null);
  const [selectedSubEvento, setSelectedSubEvento] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarEstatisticas();
  }, [eventId]);

  const carregarEstatisticas = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/eventos/${eventId}/subeventos/estatisticas`);
      setEstatisticas(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarRelatorioDetalhado = async (subEventoId) => {
    try {
      console.log('Chamando API para relatório:', `/subeventos/${subEventoId}/relatorio`);
      const response = await api.get(`/subeventos/${subEventoId}/relatorio`);
      setRelatorioDetalhado(response.data.data);
      setSelectedSubEvento('consumo');
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      console.error('URL chamada:', `/subeventos/${subEventoId}/relatorio`);
      console.error('Resposta do erro:', error.response);
    }
  };

  const formatarDataHora = (dataHora) => {
    return new Date(dataHora).toLocaleString('pt-BR');
  };

  const exportarParaCSV = (dados, nomeArquivo) => {
    const headers = ['Nome', 'Email', 'Data/Hora do Consumo'];
    const csvContent = [
      headers.join(','),
      ...dados.map(item => [
        `"${item.convidado.name}"`,
        `"${item.convidado.email || ''}"`,
        `"${formatarDataHora(item.timestamp)}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${nomeArquivo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Relatório de Consumo - SubEventos</h1>

      {/* Visão Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {estatisticas.map((subEvento) => (
          <div key={subEvento.id} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{subEvento.nome}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Data:</strong> {formatarDataHora(subEvento.dataHora)}</p>
              {subEvento.local && <p><strong>Local:</strong> {subEvento.local}</p>}
              <p><strong>Limite:</strong> {subEvento.limitePorConvidado} por convidado</p>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Consumos:</span>
                <span className="text-lg font-bold text-blue-600">
                  {subEvento.totalConsumos}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((subEvento.totalConsumos / 100) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <button
              onClick={() => carregarRelatorioDetalhado(subEvento.id)}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Ver Detalhes
            </button>
          </div>
        ))}
      </div>

      {/* Relatório Detalhado */}
      {relatorioDetalhado && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Relatório Detalhado: {relatorioDetalhado.subEvento.nome}
            </h2>
            <button
              onClick={() => exportarParaCSV(
                relatorioDetalhado.convidadosComConsumo,
                `relatorio_${relatorioDetalhado.subEvento.nome}_${new Date().toISOString().split('T')[0]}`
              )}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar CSV
            </button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">Total de Consumos</h3>
              <p className="text-2xl font-bold text-blue-600">{relatorioDetalhado.totalConsumos}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">Convidados com Consumo</h3>
              <p className="text-2xl font-bold text-green-600">{relatorioDetalhado.convidadosComConsumo.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800">Convidados sem Consumo</h3>
              <p className="text-2xl font-bold text-yellow-600">{relatorioDetalhado.convidadosSemConsumo.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800">Total de Convidados</h3>
              <p className="text-2xl font-bold text-gray-600">{relatorioDetalhado.totalConvidadosEvento}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedSubEvento('consumo')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedSubEvento === 'consumo'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Com Consumo ({relatorioDetalhado.convidadosComConsumo.length})
              </button>
              <button
                onClick={() => setSelectedSubEvento('sem-consumo')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedSubEvento === 'sem-consumo'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sem Consumo ({relatorioDetalhado.convidadosSemConsumo.length})
              </button>
            </nav>
          </div>

          {/* Lista de Convidados */}
          <div className="overflow-x-auto">
            {selectedSubEvento === 'consumo' && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora do Consumo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {relatorioDetalhado.convidadosComConsumo.map((consumo) => (
                    <tr key={consumo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {consumo.convidado.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {consumo.convidado.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatarDataHora(consumo.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedSubEvento === 'sem-consumo' && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {relatorioDetalhado.convidadosSemConsumo.map((convidado) => (
                    <tr key={convidado.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {convidado.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {convidado.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pendente
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <button
            onClick={() => {
              setRelatorioDetalhado(null);
              setSelectedSubEvento(null);
            }}
            className="mt-6 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            Voltar
          </button>
        </div>
      )}
    </div>
  );
};

export default RelatorioConsumo; 