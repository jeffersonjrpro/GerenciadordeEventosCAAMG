const express = require('express');
const router = express.Router();
const {
  criarSubEvento,
  listarSubEventos,
  obterSubEvento,
  atualizarSubEvento,
  excluirSubEvento,
  validarAcesso,
  obterRelatorioConsumo,
  obterEstatisticasEvento
} = require('../controllers/subEventoController');
const { authenticateToken, requireOrganizer } = require('../middleware/auth');
const { isEventEditor } = require('../middleware/organizerAuth');

// Rotas para relatórios (mais específicas primeiro)
router.get('/subeventos/:subEventoId/relatorio', authenticateToken, requireOrganizer, obterRelatorioConsumo);
router.get('/eventos/:eventoId/subeventos/estatisticas', authenticateToken, requireOrganizer, obterEstatisticasEvento);

// Rota para validar acesso ao subevento (check-in)
router.post('/subeventos/:subEventoId/validar', authenticateToken, requireOrganizer, validarAcesso);

// Rotas para gerenciamento de subeventos (apenas organizadores)
router.post('/eventos/:eventoId/subeventos', authenticateToken, requireOrganizer, criarSubEvento);
router.get('/eventos/:eventoId/subeventos', authenticateToken, requireOrganizer, listarSubEventos);
router.get('/subeventos/:subEventoId', authenticateToken, requireOrganizer, obterSubEvento);
router.put('/subeventos/:subEventoId', authenticateToken, requireOrganizer, atualizarSubEvento);
router.delete('/subeventos/:subEventoId', authenticateToken, requireOrganizer, excluirSubEvento);

module.exports = router; 