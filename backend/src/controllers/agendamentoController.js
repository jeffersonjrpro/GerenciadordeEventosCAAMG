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
  async criar(req, res) {
    try {
      const { titulo, descricao, dataInicio, dataFim, categoria, lembreteMinutosAntes, visibilidade } = req.body;
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
      // Agendar lembrete in-app
      const lembreteDate = new Date(new Date(dataInicio).getTime() - lembreteMinutosAntes * 60000);
      // Para simplificação, já cria a notificação se a data for futura
      let notificados = [];
      if (visibilidade === 'EQUIPE') {
        // Notifica todos da equipe
        const equipe = await prisma.user.findMany({ where: { empresaId, ativo: true } });
        notificados = await Promise.all(equipe.map(u =>
          prisma.notification.create({
            data: {
              userId: u.id,
              agendamentoId: agendamento.id,
              mensagem: `Lembrete: ${titulo} em breve!`,
              lida: false
            }
          })
        ));
      } else {
        // Notifica só o criador
        notificados = [await prisma.notification.create({
          data: {
            userId: userId,
            agendamentoId: agendamento.id,
            mensagem: `Lembrete: ${titulo} em breve!`,
            lida: false
          }
        })];
      }
      // Placeholder para e-mail
      // TODO: Agendar envio de e-mail (em desenvolvimento)
      return res.status(201).json({ agendamento, lembretes: notificados, email: 'Envio de e-mail: em desenvolvimento' });
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
      // Remove notificações antigas
      await prisma.notification.deleteMany({ where: { agendamentoId: id } });
      // Cria novas notificações
      let notificados = [];
      if (visibilidade === 'EQUIPE') {
        const equipe = await prisma.user.findMany({ where: { empresaId, ativo: true } });
        notificados = await Promise.all(equipe.map(u =>
          prisma.notification.create({
            data: {
              userId: u.id,
              agendamentoId: atualizado.id,
              mensagem: `Lembrete: ${titulo} em breve!`,
              lida: false
            }
          })
        ));
      } else {
        notificados = [await prisma.notification.create({
          data: {
            userId: userId,
            agendamentoId: atualizado.id,
            mensagem: `Lembrete: ${titulo} em breve!`,
            lida: false
          }
        })];
      }
      // Placeholder para e-mail
      return res.json({ agendamento: atualizado, lembretes: notificados, email: 'Envio de e-mail: em desenvolvimento' });
    } catch (error) {
      console.error(error);
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
      await prisma.notification.deleteMany({ where: { agendamentoId: id } });
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
              agendamentoId: agendamento.id,
              mensagem: `Lembrete manual: ${agendamento.titulo} em breve!`,
              lida: false
            }
          })
        ));
      } else {
        notificados = [await prisma.notification.create({
          data: {
            userId: agendamento.criadoPorId,
            agendamentoId: agendamento.id,
            mensagem: `Lembrete manual: ${agendamento.titulo} em breve!`,
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