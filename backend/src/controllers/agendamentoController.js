const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  async listar(req, res) {
    try {
      const { id: userId, empresaId, role } = req.user;
      let agendamentos;
      if (role === 'ADMIN') {
        agendamentos = await prisma.agendamento.findMany();
      } else {
        agendamentos = await prisma.agendamento.findMany({
          where: {
            OR: [
              { criadoPorId: userId },
              { equipeId: empresaId, visibilidade: 'EQUIPE' }
            ]
          }
        });
      }
      return res.json(agendamentos);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar agendamentos' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const { id: userId, empresaId, role } = req.user;
      
      const agendamento = await prisma.agendamento.findUnique({
        where: { id },
        include: {
          criadoPor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!agendamento) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      // Verificar permissão
      if (role !== 'ADMIN' && agendamento.criadoPorId !== userId && 
          (agendamento.visibilidade !== 'EQUIPE' || agendamento.equipeId !== empresaId)) {
        return res.status(403).json({ error: 'Sem permissão para visualizar este agendamento' });
      }

      return res.json(agendamento);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar agendamento' });
    }
  },

  async criar(req, res) {
    try {
      const { titulo, descricao, dataInicio, dataFim, categoria, lembreteMinutosAntes, visibilidade, notificarAutomaticamente = true } = req.body;
      const { id: userId, empresaId, role } = req.user;
      
      // Cria o agendamento
      const agendamento = await prisma.agendamento.create({
        data: {
          titulo,
          descricao,
          dataInicio: new Date(dataInicio),
          dataFim: new Date(dataFim),
          categoria,
          lembreteMinutosAntes,
          criadoPorId: userId,
          equipeId: empresaId,
          visibilidade
        }
      });
      
      // As notificações serão criadas automaticamente pelo scheduler no momento correto
      console.log(`✅ Agendamento criado: ${titulo} - Notificações serão enviadas ${lembreteMinutosAntes} minutos antes`);
      
      return res.status(201).json({ 
        agendamento, 
        message: `Agendamento criado com sucesso. Lembrete será enviado ${lembreteMinutosAntes} minutos antes do início.`,
        notificacaoAutomatica: notificarAutomaticamente
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar agendamento' });
    }
  },

  async editar(req, res) {
    try {
      const { id } = req.params;
      const { titulo, descricao, dataInicio, dataFim, categoria, lembreteMinutosAntes, visibilidade } = req.body;
      const { id: userId, empresaId, role } = req.user;
      
      // Busca o agendamento
      const agendamento = await prisma.agendamento.findUnique({ where: { id } });
      if (!agendamento) return res.status(404).json({ error: 'Agendamento não encontrado' });
      if (role !== 'ADMIN' && agendamento.criadoPorId !== userId) {
        return res.status(403).json({ error: 'Sem permissão para editar' });
      }
      
      // Atualiza o agendamento
      const atualizado = await prisma.agendamento.update({
        where: { id },
        data: {
          titulo,
          descricao,
          dataInicio: new Date(dataInicio),
          dataFim: new Date(dataFim),
          categoria,
          lembreteMinutosAntes,
          visibilidade
        }
      });
      
      // Remove notificações antigas relacionadas a este agendamento
      await prisma.notification.deleteMany({
        where: {
          dados: {
            path: ['agendamentoId'],
            equals: id
          }
        }
      });
      
      return res.json(atualizado);
    } catch (error) {
      console.error('Erro ao editar agendamento:', error);
      return res.status(500).json({ error: 'Erro ao editar agendamento' });
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;
      const agendamento = await prisma.agendamento.findUnique({ where: { id } });
      if (!agendamento) return res.status(404).json({ error: 'Agendamento não encontrado' });
      if (role !== 'ADMIN' && agendamento.criadoPorId !== userId) {
        return res.status(403).json({ error: 'Sem permissão para excluir' });
      }
      // Remove notificações
      await prisma.notification.deleteMany({ 
        where: { 
          tipo: 'LEMBRETE_AGENDAMENTO',
          dados: {
            path: ['agendamentoId'],
            equals: id
          }
        } 
      });
      // Remove agendamento
      await prisma.agendamento.delete({ where: { id } });
      return res.json({ message: 'Agendamento e lembretes removidos' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao excluir agendamento' });
    }
  },

  async notificar(req, res) {
    try {
      const { id } = req.params;
      const { id: userId, empresaId, role } = req.user;
      const agendamento = await prisma.agendamento.findUnique({ where: { id } });
      if (!agendamento) return res.status(404).json({ error: 'Agendamento não encontrado' });
      if (role !== 'ADMIN' && agendamento.criadoPorId !== userId) {
        return res.status(403).json({ error: 'Sem permissão para notificar' });
      }
      let notificados = [];
      if (agendamento.visibilidade === 'EQUIPE') {
        const equipe = await prisma.user.findMany({ where: { empresaId, ativo: true } });
        notificados = await Promise.all(equipe.map(u =>
          prisma.notification.create({
            data: {
              userId: u.id,
              titulo: `Lembrete: ${agendamento.titulo}`,
              mensagem: `Lembrete: ${agendamento.titulo} em breve!`,
              tipo: 'LEMBRETE_AGENDAMENTO',
              dados: { agendamentoId: agendamento.id },
              lida: false
            }
          })
        ));
      } else {
        notificados = [await prisma.notification.create({
          data: {
            userId: agendamento.criadoPorId,
            titulo: `Lembrete: ${agendamento.titulo}`,
            mensagem: `Lembrete: ${agendamento.titulo} em breve!`,
            tipo: 'LEMBRETE_AGENDAMENTO',
            dados: { agendamentoId: agendamento.id },
            lida: false
          }
        })];
      }
      // Placeholder para e-mail
      return res.json({ lembretes: notificados, email: 'Envio de e-mail: em desenvolvimento' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao enviar lembrete manual' });
    }
  },
}; 