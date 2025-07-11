const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  async listar(req, res) {
    try {
      const { id: userId } = req.user;
      const notificacoes = await prisma.notification.findMany({
        where: { userId },
        orderBy: { criadoEm: 'desc' }
      });
      return res.json(notificacoes);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar notificações' });
    }
  },
  async marcarComoLida(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const notification = await prisma.notification.findUnique({ where: { id } });
      if (!notification || notification.userId !== userId) {
        return res.status(404).json({ error: 'Notificação não encontrada' });
      }
      await prisma.notification.update({ where: { id }, data: { lida: true } });
      return res.json({ message: 'Notificação marcada como lida' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
    }
  }
}; 