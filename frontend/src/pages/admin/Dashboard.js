import React, { useState, useEffect } from 'react';
import { getDashboardData } from '../../services/adminApi';
import { 
  BuildingOffice2Icon, 
  UsersIcon, 
  CalendarDaysIcon, 
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardData = await getDashboardData();
      setData(dashboardData);
    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAGO': return 'text-green-600 bg-green-100';
      case 'PENDENTE': return 'text-yellow-600 bg-yellow-100';
      case 'VENCIDA': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
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

  if (!data) return null;

  const metricCards = [
    {
      title: 'Total de Empresas',
      value: data.totalEmpresas,
      icon: BuildingOffice2Icon,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Usuários Ativos',
      value: data.totalUsuarios,
      icon: UsersIcon,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total de Eventos',
      value: data.totalEventos,
      icon: CalendarDaysIcon,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Receita Total',
      value: formatCurrency(data.receitaTotal),
      icon: CurrencyDollarIcon,
      color: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Convidados',
      value: data.totalConvidados,
      icon: UsersIcon,
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Check-ins',
      value: data.totalCheckIns,
      icon: CheckCircleIcon,
      color: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ];

  const statusCards = [
    {
      title: 'Empresas Ativas',
      value: data.empresasAtivas,
      total: data.totalEmpresas,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: CheckCircleIcon
    },
    {
      title: 'Empresas Bloqueadas',
      value: data.empresasBloqueadas,
      total: data.totalEmpresas,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      icon: ExclamationTriangleIcon
    },
    {
      title: 'Eventos Ativos',
      value: data.eventosAtivos,
      total: data.totalEventos,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: EyeIcon
    },
    {
      title: 'Eventos Públicos',
      value: data.eventosPublicos,
      total: data.totalEventos,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      icon: GlobeAltIcon
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Administrativo
        </h1>
        <p className="text-gray-600">
          Visão geral do sistema e métricas de performance
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {metricCards.map((card, index) => (
          <div key={index} className={`${card.bgColor} rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status e Crescimento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Status Cards */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Status do Sistema</h2>
          <div className="space-y-4">
            {statusCards.map((card, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`${card.bgColor} p-2 rounded-lg`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{card.title}</p>
                    <p className="text-xs text-gray-500">
                      {card.value} de {card.total} ({Math.round((card.value / card.total) * 100)}%)
                    </p>
                  </div>
                </div>
                <div className={`text-lg font-bold ${card.color}`}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Receita */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Receita</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Receita do Mês</p>
                  <p className="text-xs text-gray-500">Janeiro 2025</p>
                </div>
              </div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(data.receitaMes)}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <ChartBarIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Receita do Ano</p>
                  <p className="text-xs text-gray-500">2025</p>
                </div>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(data.receitaAno)}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Faturas Pendentes</p>
                  <p className="text-xs text-gray-500">Aguardando pagamento</p>
                </div>
              </div>
              <div className="text-lg font-bold text-yellow-600">
                {data.faturasPendentes}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Crescimento */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Crescimento Mensal (Últimos 12 meses)</h2>
        <div className="h-64 flex items-end justify-between space-x-2">
          {data.crescimentoMensal.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t"
                   style={{ height: `${Math.max((item.empresas / Math.max(...data.crescimentoMensal.map(d => d.empresas))) * 200, 20)}px` }}>
              </div>
              <div className="text-xs text-gray-600 mt-2 text-center">
                {item.mes}
              </div>
              <div className="text-xs font-semibold text-blue-600">{item.empresas}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 text-center mt-4">
          Número de empresas cadastradas por mês
        </p>
      </div>

      {/* Listas Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Empresas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Empresas</h2>
          <div className="space-y-3">
            {data.topEmpresas.map((empresa, index) => (
              <div key={empresa.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{empresa.nome}</p>
                    <p className="text-xs text-gray-500">{empresa._count.eventos} eventos</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  empresa.status === 'ATIVA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {empresa.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Eventos Recentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Eventos Recentes</h2>
          <div className="space-y-3">
            {data.eventosRecentes.map((evento) => (
              <div key={evento.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">{evento.name}</p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    evento.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {evento.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{evento.location}</p>
                <p className="text-xs text-gray-500 mb-2">{formatDate(evento.date)}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{evento._count.guests} convidados</span>
                  <span>{evento._count.checkIns} check-ins</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Faturas Recentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Faturas Recentes</h2>
          <div className="space-y-3">
            {data.faturasRecentes.map((fatura) => (
              <div key={fatura.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">{fatura.empresa?.nome}</p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(fatura.status)}`}>
                    {fatura.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{fatura.plano?.nome}</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(fatura.valor)}</p>
                <p className="text-xs text-gray-500">
                  Vencimento: {formatDate(fatura.vencimento)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 