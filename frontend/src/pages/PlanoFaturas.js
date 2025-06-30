import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Building,
  Users,
  CalendarDays
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const PlanoFaturas = () => {
  const { user } = useAuth();
  const [plano, setPlano] = useState(null);
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planos, setPlanos] = useState([]);

  useEffect(() => {
    loadPlanoFaturas();
    loadPlanos();
  }, []);

  const loadPlanoFaturas = async () => {
    try {
      setLoading(true);
      
      // Buscar dados da empresa do usuário
      const empresaResponse = await api.get(`/users/empresa`);
      const empresa = empresaResponse.data.data;
      
      if (empresa) {
        // Buscar plano da empresa
        const planoResponse = await api.get(`/users/empresas/${empresa.id}/plano`);
        setPlano(planoResponse.data.data);
        
        // Buscar faturas da empresa
        const faturasResponse = await api.get(`/users/empresas/${empresa.id}/faturas`);
        setFaturas(faturasResponse.data.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar informações do plano e faturas');
    } finally {
      setLoading(false);
    }
  };

  const loadPlanos = async () => {
    try {
      const planosResponse = await api.get('/public/planos');
      setPlanos(planosResponse.data || []);
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PAGO': {
        className: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Pago'
      },
      'PENDENTE': {
        className: 'bg-yellow-100 text-yellow-800',
        icon: <AlertCircle className="h-4 w-4" />,
        text: 'Pendente'
      },
      'VENCIDA': {
        className: 'bg-red-100 text-red-800',
        icon: <XCircle className="h-4 w-4" />,
        text: 'Vencida'
      }
    };

    const config = statusConfig[status] || statusConfig['PENDENTE'];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.icon}
        <span className="ml-1">{config.text}</span>
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handlePagarFatura = async (faturaId) => {
    try {
      const response = await api.post(`/faturas/${faturaId}/pagar`);
      toast.success('Pagamento processado com sucesso!');
      await loadPlanoFaturas(); // Recarregar dados
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      toast.error('Erro ao processar pagamento');
    }
  };

  const handleDownloadFatura = async (faturaId) => {
    try {
      const response = await api.get(`/faturas/${faturaId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fatura-${faturaId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Fatura baixada com sucesso!');
    } catch (err) {
      console.error('Erro ao baixar fatura:', err);
      toast.error('Erro ao baixar fatura');
    }
  };

  const handleEscolherPlano = async (planoId) => {
    try {
      // Buscar dados da empresa do usuário
      const empresaResponse = await api.get(`/users/empresa`);
      const empresa = empresaResponse.data.data;
      if (!empresa) return toast.error('Empresa não encontrada');
      await api.put(`/users/empresas/${empresa.id}/plano`, { planoId });
      toast.success('Plano alterado com sucesso!');
      await loadPlanoFaturas();
    } catch (err) {
      console.error('Erro ao alterar plano:', err);
      toast.error('Erro ao alterar plano');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Plano e Faturas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie seu plano atual e visualize suas faturas
        </p>
      </div>

      {/* Plano Atual */}
      {plano && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Plano Atual
            </h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(plano.preco)}
                </div>
                <p className="text-sm text-gray-500">por mês</p>
                <h4 className="text-lg font-semibold text-gray-900 mt-2">
                  {plano.nome}
                </h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Eventos</span>
                  <span className="text-sm font-medium text-gray-900">
                    {plano.limiteEventos} eventos
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Convidados</span>
                  <span className="text-sm font-medium text-gray-900">
                    {plano.limiteConvidados} por evento
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Usuários</span>
                  <span className="text-sm font-medium text-gray-900">
                    {plano.limiteEmpresas || 'Ilimitado'}
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <button className="btn-outline">
                  Alterar Plano
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Entre em contato para alterar seu plano
                </p>
              </div>
            </div>
            
            {plano.descricao && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Descrição do Plano</h5>
                <p className="text-sm text-gray-600">{plano.descricao}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Faturas */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Histórico de Faturas
          </h3>
        </div>
        <div className="card-body">
          {(faturas?.length ?? 0) === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-2 text-gray-500">Nenhuma fatura encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fatura
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                        <div className="text-sm font-medium text-gray-900">
                          Fatura #{fatura.id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(fatura.criadoEm)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(fatura.valor)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(fatura.vencimento)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(fatura.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDownloadFatura(fatura.id)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                            title="Baixar fatura"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Baixar
                          </button>
                          
                          {fatura.status === 'PENDENTE' && (
                            <button
                              onClick={() => handlePagarFatura(fatura.id)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                              title="Pagar fatura"
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              Pagar
                            </button>
                          )}
                          
                          <button
                            onClick={() => window.open(`/faturas/${fatura.id}/visualizar`, '_blank')}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200"
                            title="Visualizar fatura"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Resumo Financeiro */}
      {faturas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(faturas.filter(f => f.status === 'PAGO').reduce((sum, f) => sum + f.valor, 0))}
              </div>
              <p className="text-sm text-gray-500">Total Pago</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(faturas.filter(f => f.status === 'PENDENTE').reduce((sum, f) => sum + f.valor, 0))}
              </div>
              <p className="text-sm text-gray-500">Total Pendente</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(faturas.filter(f => f.status === 'VENCIDA').reduce((sum, f) => sum + f.valor, 0))}
              </div>
              <p className="text-sm text-gray-500">Total Vencido</p>
            </div>
          </div>
        </div>
      )}

      {/* Listagem de Planos Disponíveis */}
      {planos.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Escolha seu Plano</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planos.map((p) => (
              <div key={p.id} className={`rounded-xl shadow-lg p-6 border-2 ${plano && plano.id === p.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'} flex flex-col items-center transition-all`}>
                <div className="text-3xl font-bold text-blue-600 mb-2">{formatCurrency(p.preco)}</div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{p.nome}</div>
                <div className="text-sm text-gray-500 mb-4 text-center">{p.descricao}</div>
                <ul className="mb-4 w-full text-sm text-gray-700 space-y-1">
                  <li><b>{p.limiteEventos}</b> eventos</li>
                  <li><b>{p.limiteConvidados}</b> convidados por evento</li>
                  <li><b>{p.limiteEmpresas || 'Ilimitado'}</b> usuários</li>
                </ul>
                {plano && plano.id === p.id ? (
                  <span className="inline-block px-4 py-2 rounded bg-blue-600 text-white font-bold">Plano Atual</span>
                ) : (
                  <button onClick={() => handleEscolherPlano(p.id)} className="px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition">Escolher este plano</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanoFaturas; 