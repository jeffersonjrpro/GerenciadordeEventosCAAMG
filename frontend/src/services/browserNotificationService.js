class BrowserNotificationService {
  constructor() {
    this.permission = 'default';
    this.isSupported = 'Notification' in window;
    this.init();
  }

  // Inicializar o serviço
  init() {
    if (!this.isSupported) {
      console.warn('❌ Notificações do navegador não são suportadas neste dispositivo');
      return;
    }

    this.permission = Notification.permission;
    console.log('🔔 Serviço de notificações do navegador inicializado');
  }

  // Solicitar permissão para notificações
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('❌ Notificações do navegador não são suportadas');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        console.log('✅ Permissão para notificações concedida');
        return true;
      } else {
        console.warn('❌ Permissão para notificações negada');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      return false;
    }
  }

  // Verificar se tem permissão
  hasPermission() {
    return this.isSupported && this.permission === 'granted';
  }

  // Mostrar notificação
  showNotification(title, options = {}) {
    if (!this.hasPermission()) {
      console.warn('❌ Sem permissão para mostrar notificações');
      return null;
    }

    try {
      const defaultOptions = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false,
        silent: false,
        tag: 'agendamento-notification',
        ...options
      };

      const notification = new Notification(title, defaultOptions);

      // Adicionar event listeners
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Se tem URL, navegar para ela
        if (options.url) {
          window.location.href = options.url;
        }
      };

      notification.onclose = () => {
        console.log('🔔 Notificação fechada');
      };

      return notification;
    } catch (error) {
      console.error('❌ Erro ao mostrar notificação:', error);
      return null;
    }
  }

  // Mostrar notificação de agendamento
  showAgendamentoNotification(agendamento) {
    const title = `🔔 Lembrete: ${agendamento.titulo}`;
    const options = {
      body: `⏰ Início: ${new Date(agendamento.dataInicio).toLocaleString('pt-BR')}\n📝 ${agendamento.descricao || 'Sem descrição'}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `agendamento-${agendamento.id}`,
      requireInteraction: false,
      silent: false,
      data: {
        agendamentoId: agendamento.id,
        type: 'agendamento'
      }
    };

    return this.showNotification(title, options);
  }

  // Mostrar notificação de nova demanda
  showDemandaNotification(demanda) {
    const title = `📋 Nova Demanda: ${demanda.nomeProjeto}`;
    const options = {
      body: `👤 Solicitante: ${demanda.criadoPor?.name || 'N/A'}\n📊 Prioridade: ${demanda.prioridade}\n🏢 Setor: ${demanda.setor?.nome || 'N/A'}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `demanda-${demanda.id}`,
      requireInteraction: false,
      silent: false,
      data: {
        demandaId: demanda.id,
        type: 'demanda'
      }
    };

    return this.showNotification(title, options);
  }

  // Mostrar notificação genérica
  showGenericNotification(title, message, options = {}) {
    const defaultOptions = {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'generic-notification',
      requireInteraction: false,
      silent: false,
      ...options
    };

    return this.showNotification(title, defaultOptions);
  }

  // Fechar todas as notificações
  closeAllNotifications() {
    if (this.isSupported) {
      // Fechar notificações por tag
      const tags = ['agendamento-notification', 'demanda-notification', 'generic-notification'];
      tags.forEach(tag => {
        // As notificações são fechadas automaticamente pelo navegador
        console.log(`🔔 Tentando fechar notificações com tag: ${tag}`);
      });
    }
  }

  // Verificar se o navegador suporta notificações
  isNotificationSupported() {
    return this.isSupported;
  }

  // Obter status da permissão
  getPermissionStatus() {
    return this.permission;
  }
}

// Criar instância singleton
const browserNotificationService = new BrowserNotificationService();

export default browserNotificationService; 