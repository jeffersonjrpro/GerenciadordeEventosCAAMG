import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import browserNotificationService from '../services/browserNotificationService';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastNotificationId, setLastNotificationId] = useState(null);

  // Buscar notificações e contagem
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const [notificationsRes, countRes] = await Promise.all([
        api.get('/notifications?limit=10'),
        api.get('/notifications/unread-count')
      ]);
      
      const newNotifications = notificationsRes.data.data || [];
      const newCount = countRes.data.data.count || 0;
      
      // Verificar se há novas notificações não lidas
      if (newCount > unreadCount && newNotifications.length > 0) {
        const newestNotification = newNotifications[0];
        
        // Verificar se é uma notificação nova (não processada)
        if (newestNotification.id !== lastNotificationId && !newestNotification.lida) {
          setLastNotificationId(newestNotification.id);
          
          // Mostrar notificação do navegador
          if (browserNotificationService.hasPermission()) {
            if (newestNotification.tipo === 'LEMBRETE_AGENDAMENTO') {
              // Extrair dados do agendamento da notificação
              const agendamentoData = newestNotification.dados;
              if (agendamentoData) {
                browserNotificationService.showAgendamentoNotification({
                  id: agendamentoData.agendamentoId,
                  titulo: newestNotification.titulo.replace('Lembrete: ', ''),
                  dataInicio: agendamentoData.dataInicio,
                  descricao: agendamentoData.descricao || 'Sem descrição'
                });
              }
            } else if (newestNotification.tipo === 'NOVA_DEMANDA') {
              // Mostrar notificação de nova demanda
              const demandaData = newestNotification.dados;
              if (demandaData) {
                browserNotificationService.showDemandaNotification({
                  id: demandaData.demandaId,
                  nomeProjeto: demandaData.nomeProjeto,
                  criadoPor: { name: demandaData.criadoPor },
                  prioridade: demandaData.prioridade,
                  setor: { nome: demandaData.setor }
                });
              }
            } else {
              // Notificação genérica
              browserNotificationService.showGenericNotification(
                newestNotification.titulo,
                newestNotification.mensagem
              );
            }
          }
        }
      }
      
      setNotifications(newNotifications);
      setUnreadCount(newCount);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Marcar como lida
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, lida: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(notif => ({ ...notif, lida: true })));
      setUnreadCount(0);
      toast.success('Todas as notificações marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao marcar notificações como lidas');
    }
  };

  // Deletar notificação
  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      toast.success('Notificação removida');
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      toast.error('Erro ao remover notificação');
    }
  };

  // Formatar data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    if (diffInHours < 48) return 'Ontem';
    return date.toLocaleDateString('pt-BR');
  };

  // Formatar mensagem
  const formatMessage = (message) => {
    return message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  // Solicitar permissão para notificações do navegador
  const requestNotificationPermission = async () => {
    const granted = await browserNotificationService.requestPermission();
    if (granted) {
      toast.success('Notificações do navegador ativadas!');
    } else {
      toast.error('Permissão para notificações negada. Você pode ativar manualmente nas configurações do navegador.');
    }
  };

  // Buscar notificações ao montar componente
  useEffect(() => {
    fetchNotifications();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Verificar permissão de notificações na inicialização
  useEffect(() => {
    if (!browserNotificationService.hasPermission() && browserNotificationService.isNotificationSupported()) {
      // Mostrar botão para solicitar permissão após alguns segundos
      setTimeout(() => {
        if (!browserNotificationService.hasPermission()) {
          toast((t) => (
            <div className="flex items-center gap-2">
              <span>Ativar notificações do navegador?</span>
              <button
                onClick={() => {
                  requestNotificationPermission();
                  toast.dismiss(t.id);
                }}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Ativar
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
              >
                Não
              </button>
            </div>
          ), { duration: 10000 });
        }
      }, 5000);
    }
  }, []);

  return (
    <div className="relative">
      {/* Sino de notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Notificações</h3>
            <div className="flex items-center gap-2">
              {!browserNotificationService.hasPermission() && browserNotificationService.isNotificationSupported() && (
                <button
                  onClick={requestNotificationPermission}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  title="Ativar notificações do navegador"
                >
                  🔔
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Marcar todas como lidas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Lista de notificações */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors duration-150 ${
                      !notification.lida ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-sm font-medium truncate ${
                            !notification.lida ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {notification.titulo}
                          </h4>
                          {!notification.lida && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <p 
                          className="text-sm text-gray-600 mb-2 whitespace-pre-line"
                          dangerouslySetInnerHTML={{ 
                            __html: formatMessage(notification.mensagem) 
                          }}
                        />
                        <p className="text-xs text-gray-400">
                          {formatDate(notification.criadoEm)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        {!notification.lida && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="Marcar como lida"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remover notificação"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  // Aqui você pode implementar navegação para página completa de notificações
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay para fechar ao clicar fora */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell; 