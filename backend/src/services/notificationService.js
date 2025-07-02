const prisma = require('../config/database');

class NotificationService {
  // Criar notificação de nova demanda
  static async createDemandaNotification(demanda, responsaveis) {
    try {
      console.log('🔔 Criando notificações para nova demanda:', demanda.id);
      
      // Preparar dados da notificação
      const notificationData = {
        titulo: `Nova Demanda: ${demanda.nomeProjeto}`,
        mensagem: this.formatDemandaMessage(demanda),
        tipo: 'NOVA_DEMANDA',
        dados: {
          demandaId: demanda.id,
          solicitacao: demanda.solicitacao,
          nomeProjeto: demanda.nomeProjeto,
          prioridade: demanda.prioridade,
          setor: demanda.setor?.nome,
          criadoPor: demanda.criadoPor?.name || demanda.criadoPor?.nome
        },
        criadoEm: new Date()
      };

      // Criar notificações para cada responsável
      const notifications = [];
      for (const responsavel of responsaveis) {
        const notification = await prisma.notification.create({
          data: {
            userId: responsavel.id,
            titulo: notificationData.titulo,
            mensagem: notificationData.mensagem,
            tipo: notificationData.tipo,
            dados: notificationData.dados,
            lida: false
          }
        });
        notifications.push(notification);
      }

      console.log(`✅ ${notifications.length} notificações criadas para a demanda ${demanda.id}`);
      return notifications;
    } catch (error) {
      console.error('❌ Erro ao criar notificações:', error);
      throw error;
    }
  }

  // Formatar mensagem da demanda
  static formatDemandaMessage(demanda) {
    const prioridadeEmoji = {
      'ALTA': '🔴',
      'MEDIA': '🟡', 
      'BAIXA': '🟢'
    };

    const setor = demanda.setor?.nome || 'Não definido';
    const prioridade = prioridadeEmoji[demanda.prioridade] || '⚪';
    const dataEntrega = demanda.dataEntrega ? new Date(demanda.dataEntrega).toLocaleDateString('pt-BR') : 'Não definida';
    
    return `Uma nova demanda foi criada para você!\n\n` +
           `📋 **${demanda.nomeProjeto}**\n` +
           `🔢 Solicitação: ${demanda.solicitacao}\n` +
           `🏢 Setor: ${setor}\n` +
           `${prioridade} Prioridade: ${demanda.prioridade}\n` +
           `📅 Entrega: ${dataEntrega}\n` +
           `👤 Solicitante: ${demanda.solicitante}\n\n` +
           `Clique para ver os detalhes completos.`;
  }

  // Buscar notificações do usuário
  static async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { criadoEm: 'desc' },
          skip,
          take: limit
        }),
        prisma.notification.count({
          where: { userId }
        })
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Erro ao buscar notificações:', error);
      throw error;
    }
  }

  // Marcar notificação como lida
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId: userId
        },
        data: { lida: true }
      });
      return notification;
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  // Marcar todas as notificações como lidas
  static async markAllAsRead(userId) {
    try {
      await prisma.notification.updateMany({
        where: { 
          userId,
          lida: false
        },
        data: { lida: true }
      });
    } catch (error) {
      console.error('❌ Erro ao marcar todas as notificações como lidas:', error);
      throw error;
    }
  }

  // Contar notificações não lidas
  static async getUnreadCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          lida: false
        }
      });
      return count;
    } catch (error) {
      console.error('❌ Erro ao contar notificações não lidas:', error);
      throw error;
    }
  }

  // Deletar notificação
  static async deleteNotification(notificationId, userId) {
    try {
      await prisma.notification.delete({
        where: {
          id: notificationId,
          userId: userId
        }
      });
    } catch (error) {
      console.error('❌ Erro ao deletar notificação:', error);
      throw error;
    }
  }
}

module.exports = NotificationService; 