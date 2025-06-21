const express = require('express');
const router = express.Router();
const GuestController = require('../controllers/guestController');
const { authenticateToken, requireOrganizer } = require('../middleware/auth');

// Rotas públicas (para RSVP)
router.get('/qr/:qrCode', GuestController.getGuestByQRCode);
router.post('/rsvp/:qrCode', GuestController.rsvpValidation, GuestController.confirmPresence);
router.get('/qr-code/:qrCode', GuestController.generateQRCode);

// Rotas protegidas para organizadores
router.use(authenticateToken);
router.use(requireOrganizer);

// CRUD de convidados
router.post('/events/:eventId/guests', GuestController.guestValidation, GuestController.createGuest);

module.exports = router; 