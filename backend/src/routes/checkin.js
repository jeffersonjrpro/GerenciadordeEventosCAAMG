const express = require('express');
const router = express.Router();
const CheckInController = require('../controllers/checkInController');
const { authenticateToken, requireOrganizer } = require('../middleware/auth');
const { canCheckIn } = require('../middleware/organizerAuth');

// Rotas protegidas para organizadores
router.use(authenticateToken);
router.use(requireOrganizer);

// Check-in
router.post('/', canCheckIn, CheckInController.checkInValidation, CheckInController.performCheckIn);
router.get('/qr/:qrCode', canCheckIn, CheckInController.getCheckInByQRCode);
router.get('/:checkInId', canCheckIn, CheckInController.getCheckInById);
router.delete('/:checkInId', canCheckIn, CheckInController.cancelCheckIn);

// Check-ins por evento
router.get('/event/:eventId', canCheckIn, CheckInController.getEventCheckIns);
router.get('/event/:eventId/stats', canCheckIn, CheckInController.getEventCheckInStats);

module.exports = router; 