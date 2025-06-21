import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  Eye,
  QrCode
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, eventsResponse] = await Promise.all([
          api.get('/events/stats'),
          api.get('/events/my-events?limit=5')
        ]);

        setStats(statsResponse.data.data);
        setRecentEvents(eventsResponse.data.data);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    
    if (eventDate < now) {
      return { status: 'finished', label: 'Finalizado', color: 'text-gray-500' };
    } else if (eventDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return { status: 'today', label: 'Hoje', color: 'text-warning-600' };
    } else {
      return { status: 'upcoming', label: 'Próximo', color: 'text-success-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {user?.name}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Bem-vindo ao seu painel de controle de eventos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/events/create"
            className="btn-primary inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Evento
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total de Eventos</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalEvents}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total de Convidados</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalGuests}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Confirmados</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalConfirmed}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Presentes</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalCheckedIn}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Taxa de Confirmação</h3>
            </div>
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Média Geral</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.averageConfirmationRate}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${stats.averageConfirmationRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Taxa de Presença</h3>
            </div>
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Média Geral</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.averageAttendanceRate}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-success-600 h-2 rounded-full"
                        style={{ width: `${stats.averageAttendanceRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Eventos Recentes</h3>
            <Link
              to="/events"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Ver todos
            </Link>
          </div>
        </div>
        <div className="card-body">
          {recentEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum evento</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece criando seu primeiro evento.
              </p>
              <div className="mt-6">
                <Link to="/events/create" className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Evento
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEvents.map((event) => {
                const status = getEventStatus(event);
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900">
                          {event.name}
                        </h4>
                        <span className={`ml-2 text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(event.date)}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {event.location}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {event._count.guests} convidados
                        </div>
                        <div className="text-sm text-gray-500">
                          {event._count.checkIns} presentes
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Link
                          to={`/events/${event.id}`}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/events/${event.id}/checkin`}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="Check-in"
                        >
                          <QrCode className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Ações Rápidas</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/events/create"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Criar Evento</p>
                <p className="text-xs text-gray-500">Novo evento</p>
              </div>
            </Link>

            <Link
              to="/events"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="h-6 w-6 text-success-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Gerenciar Eventos</p>
                <p className="text-xs text-gray-500">Ver todos os eventos</p>
              </div>
            </Link>

            <Link
              to="/guests"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-6 w-6 text-warning-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Convidados</p>
                <p className="text-xs text-gray-500">Gerenciar lista</p>
              </div>
            </Link>

            <Link
              to="/checkin"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <QrCode className="h-6 w-6 text-success-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Check-in</p>
                <p className="text-xs text-gray-500">Ler QR Code</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 