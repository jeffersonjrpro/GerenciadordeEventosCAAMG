const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const agendamentoController = require('../controllers/agendamentoController');

router.get('/', authenticateToken, agendamentoController.listar);
router.post('/', authenticateToken, agendamentoController.criar);
router.put('/:id', authenticateToken, agendamentoController.editar);
router.delete('/:id', authenticateToken, agendamentoController.excluir);
router.post('/:id/notificar', authenticateToken, agendamentoController.notificar);

module.exports = router; 