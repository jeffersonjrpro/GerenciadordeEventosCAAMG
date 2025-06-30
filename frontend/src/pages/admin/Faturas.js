import React, { useState, useEffect } from 'react';
import { getFaturas, markFaturaPaid } from '../../services/adminApi';

export default function Faturas() {
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFaturas();
  }, []);

  const loadFaturas = async () => {
    try {
      setLoading(true);
      const data = await getFaturas();
      setFaturas(data);
    } catch (err) {
      setError('Erro ao carregar faturas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (id) => {
    if (!window.confirm('Tem certeza que deseja marcar esta fatura como paga?')) {
      return;
    }

    try {
      await markFaturaPaid(id);
      await loadFaturas(); // Recarregar lista
    } catch (err) {
      alert('Erro ao marcar fatura como paga');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status, vencimento) => {
    const isVencida = status === 'PENDENTE' && new Date(vencimento) < new Date();
    
    if (status === 'PAGO') {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">✅ Pago</span>;
    } else if (isVencida) {
      return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">⚠️ Vencida</span>;
    } else {
      return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">⏳ Pendente</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando faturas...</div>
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Faturas</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Nova Fatura
        </button>
      </div>

      {faturas.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Nenhuma fatura encontrada
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {faturas.map((fatura) => (
                <tr key={fatura.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{fatura.empresa?.nome}</div>
                    <div className="text-xs text-gray-500">{fatura.empresa?.emailContato}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fatura.plano?.nome || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      R$ {fatura.valor.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(fatura.status, fatura.vencimento)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(fatura.vencimento)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fatura.pagamentoEm ? formatDate(fatura.pagamentoEm) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {fatura.status === 'PENDENTE' && (
                      <button 
                        onClick={() => handleMarkPaid(fatura.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Marcar como paga
                      </button>
                    )}
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