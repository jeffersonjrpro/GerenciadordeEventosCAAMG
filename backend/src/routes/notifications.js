const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.get('/', authenticateToken, notificationController.listar);
router.post('/:id/lida', authenticateToken, notificationController.marcarComoLida);

module.exports = router; 