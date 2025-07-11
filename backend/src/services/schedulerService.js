const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SchedulerService {
  constructor() {
    this.isRunning = false;
  }

  // Iniciar o scheduler
  start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler já está rodando');
      return;
    }

    console.log('🚀 Iniciando scheduler de notificações...');
    this.isRunning = true;

    // Executar a cada minuto
    cron.schedule('* * * * *', async () => {
      try {
        await this.checkAndCreateNotifications();
      } catch (error) {
        console.error('❌ Erro no scheduler:', error);
      }
    });

    console.log('✅ Scheduler iniciado - verificando notificações a cada minuto');
  }

  // Parar o scheduler
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Scheduler não está rodando');
      return;
    }

    console.log('🛑 Parando scheduler...');
    this.isRunning = false;
  }

  // Verificar e criar notificações
  async checkAndCreateNotifications() {
    try {
      const now = new Date();
      console.log(`🔍 Verificando agendamentos para notificação: ${now.toISOString()}`);

      // Buscar agendamentos que precisam de notificação
      const agendamentos = await prisma.agendamento.findMany({
        where: {
          dataInicio: {
            gte: now,
            lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) // Próximas 24 horas
          }
        },
        include: {
          criadoPor: {
            select: {
              id: true,
              empresaId: true
            }
          }
        }
      });

      console.log(`📅 Encontrados ${agendamentos.length} agendamentos para verificar`);

      for (const agendamento of agendamentos) {
        await this.processAgendamento(agendamento, now);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar notificações:', error);
    }
  }

  // Processar um agendamento específico
  async processAgendamento(agendamento, now) {
    try {
      const dataInicio = new Date(agendamento.dataInicio);
      const lembreteDate = new Date(dataInicio.getTime() - agendamento.lembreteMinutosAntes * 60000);
      
      // Verificar se chegou a hora de enviar a notificação
      // A notificação deve ser enviada quando:
      // 1. O tempo atual está entre o lembreteDate e dataInicio
      // 2. Ainda não foi enviada uma notificação para este agendamento
      if (now >= lembreteDate && now < dataInicio) {
        // Verificar se já existe notificação para este agendamento
        const existingNotification = await prisma.notification.findFirst({
          where: {
            tipo: 'LEMBRETE_AGENDAMENTO',
            dados: {
              path: ['agendamentoId'],
              equals: agendamento.id
            }
          }
        });

        if (!existingNotification) {
          console.log(`🔔 Criando notificação para agendamento: ${agendamento.titulo} (ID: ${agendamento.id})`);
          console.log(`⏰ Lembrete configurado para ${agendamento.lembreteMinutosAntes} minutos antes`);
          console.log(`📅 Data do agendamento: ${dataInicio.toLocaleString('pt-BR')}`);
          console.log(`⏰ Hora do lembrete: ${lembreteDate.toLocaleString('pt-BR')}`);
          console.log(`🕐 Hora atual: ${now.toLocaleString('pt-BR')}`);
          
          await this.createNotificationForAgendamento(agendamento);
        } else {
          console.log(`ℹ️ Notificação já existe para agendamento: ${agendamento.titulo} (ID: ${agendamento.id})`);
        }
      } else {
        // Log para debug - mostrar quando o agendamento será processado
        const timeUntilLembrete = lembreteDate.getTime() - now.getTime();
        const minutesUntilLembrete = Math.floor(timeUntilLembrete / (1000 * 60));
        
        if (timeUntilLembrete > 0) {
          console.log(`⏳ Agendamento "${agendamento.titulo}" será notificado em ${minutesUntilLembrete} minutos`);
        } else if (now >= dataInicio) {
          console.log(`✅ Agendamento "${agendamento.titulo}" já passou, não precisa de notificação`);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao processar agendamento ${agendamento.id}:`, error);
    }
  }

  // Criar notificação para um agendamento
  async createNotificationForAgendamento(agendamento) {
    try {
      const dataInicio = new Date(agendamento.dataInicio);
      const dataFim = new Date(agendamento.dataFim);
      
      const mensagem = `📅 **${agendamento.titulo}**\n\n` +
                      `⏰ Início: ${dataInicio.toLocaleString('pt-BR')}\n` +
                      `🏁 Fim: ${dataFim.toLocaleString('pt-BR')}\n` +
                      `📝 ${agendamento.descricao || 'Sem descrição'}\n\n` +
                      `🔔 Lembrete configurado para ${agendamento.lembreteMinutosAntes} minutos antes`;

      if (agendamento.visibilidade === 'EQUIPE') {
        // Notificar todos da equipe
        const equipe = await prisma.user.findMany({ 
          where: { 
            empresaId: agendamento.criadoPor.empresaId, 
            ativo: true 
          } 
        });

        const notifications = await Promise.all(equipe.map(user =>
          prisma.notification.create({
            data: {
              userId: user.id,
              titulo: `Lembrete: ${agendamento.titulo}`,
              mensagem: mensagem,
              tipo: 'LEMBRETE_AGENDAMENTO',
              dados: { 
                agendamentoId: agendamento.id,
                dataInicio: agendamento.dataInicio,
                dataFim: agendamento.dataFim,
                descricao: agendamento.descricao
              },
              lida: false
            }
          })
        ));

        console.log(`✅ ${notifications.length} notificações criadas para equipe`);
      } else {
        // Notificar só o criador
        const notification = await prisma.notification.create({
          data: {
            userId: agendamento.criadoPorId,
            titulo: `Lembrete: ${agendamento.titulo}`,
            mensagem: mensagem,
            tipo: 'LEMBRETE_AGENDAMENTO',
            dados: { 
              agendamentoId: agendamento.id,
              dataInicio: agendamento.dataInicio,
              dataFim: agendamento.dataFim,
              descricao: agendamento.descricao
            },
            lida: false
          }
        });

        console.log(`✅ Notificação criada para criador do agendamento`);
      }
    } catch (error) {
      console.error('❌ Erro ao criar notificação para agendamento:', error);
    }
  }

  // Limpar notificações antigas (mais de 7 dias)
  async cleanupOldNotifications() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const deletedCount = await prisma.notification.deleteMany({
        where: {
          tipo: 'LEMBRETE_AGENDAMENTO',
          criadoEm: {
            lt: sevenDaysAgo
          }
        }
      });

      console.log(`🧹 Limpeza: ${deletedCount.count} notificações antigas removidas`);
    } catch (error) {
      console.error('❌ Erro ao limpar notificações antigas:', error);
    }
  }

  // Método para testar notificações manualmente
  async testNotification(agendamentoId) {
    try {
      const agendamento = await prisma.agendamento.findUnique({
        where: { id: agendamentoId },
        include: {
          criadoPor: {
            select: {
              id: true,
              empresaId: true
            }
          }
        }
      });

      if (!agendamento) {
        throw new Error('Agendamento não encontrado');
      }

      console.log(`🧪 Testando notificação para agendamento: ${agendamento.titulo}`);
      await this.createNotificationForAgendamento(agendamento);
      
      return { success: true, message: 'Notificação de teste criada com sucesso' };
    } catch (error) {
      console.error('❌ Erro ao testar notificação:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = SchedulerService; 