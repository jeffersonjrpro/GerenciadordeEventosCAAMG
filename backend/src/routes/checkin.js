const express = require('express');
const router = express.Router();
const CheckInController = require('../controllers/checkInController');
const { authenticateToken, requireOrganizer } = require('../middleware/auth');

// Rotas protegidas para organizadores
router.use(authenticateToken);
router.use(requireOrganizer);

// Check-in
router.post('/', CheckInController.checkInValidation, CheckInController.performCheckIn);
router.get('/qr/:qrCode', CheckInController.getCheckInByQRCode);
router.get('/:checkInId', CheckInController.getCheckInById);
router.delete('/:checkInId', CheckInController.cancelCheckIn);

// Check-ins por evento
router.get('/event/:eventId', CheckInController.getEventCheckIns);
router.get('/event/:eventId/stats', CheckInController.getEventCheckInStats);

module.exports = router; 