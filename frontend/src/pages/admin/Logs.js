import React, { useState, useEffect } from 'react';
import { getLogs } from '../../services/adminApi';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getLogs();
      setLogs(data);
    } catch (err) {
      setError('Erro ao carregar logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getActionIcon = (acao) => {
    const icons = {
      'CRIAR_EMPRESA': '🏢',
      'BLOQUEAR_EMPRESA': '🚫',
      'CRIAR_PLANO': '📦',
      'CRIAR_FATURA': '💳',
      'MARCAR_FATURA_PAGA': '✅',
      'CRIAR_ADMIN': '👤',
      'BLOQUEAR_ADMIN': '🔒',
    };
    return icons[acao] || '📝';
  };

  const formatAction = (acao) => {
    const actions = {
      'CRIAR_EMPRESA': 'Criar Empresa',
      'BLOQUEAR_EMPRESA': 'Bloquear Empresa',
      'CRIAR_PLANO': 'Criar Plano',
      'CRIAR_FATURA': 'Criar Fatura',
      'MARCAR_FATURA_PAGA': 'Marcar Fatura como Paga',
      'CRIAR_ADMIN': 'Criar Admin',
      'BLOQUEAR_ADMIN': 'Bloquear Admin',
    };
    return actions[acao] || acao;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Logs de Ações</h1>

      {logs.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Nenhum log encontrado
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalhes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{log.admin?.nome}</div>
                    <div className="text-xs text-gray-500">{log.admin?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getActionIcon(log.acao)}</span>
                      <span className="text-sm text-gray-900">{formatAction(log.acao)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {log.detalhes ? (
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.detalhes, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(log.criadoEm)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 