const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const agendamentoController = require('../controllers/agendamentoController');
const SchedulerService = require('../services/schedulerService');

// Instanciar o scheduler
const scheduler = new SchedulerService();

// Rotas de agendamentos
router.get('/', authenticateToken, agendamentoController.listar);
router.post('/', authenticateToken, agendamentoController.criar);
router.get('/:id', authenticateToken, agendamentoController.buscarPorId);
router.put('/:id', authenticateToken, agendamentoController.editar);
router.delete('/:id', authenticateToken, agendamentoController.excluir);
router.post('/:id/notificar', authenticateToken, agendamentoController.notificar);

// Rota para testar notificações manualmente
router.post('/:id/testar-notificacao', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await scheduler.testNotification(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erro ao testar notificação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router; 