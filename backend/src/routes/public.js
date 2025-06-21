const express = require('express');
const router = express.Router();
const EventController = require('../controllers/eventController');
const GuestController = require('../controllers/guestController');

// Rotas públicas
router.get('/events/:eventId', EventController.getPublicEvent);
router.get('/events/:eventId/full', EventController.isEventFull);

// Inscrição pública
router.post('/events/:eventId/guests/public', GuestController.addPublicGuest);

// Buscar convidado por QR Code
router.get('/qr/:qrCode', GuestController.getGuestByQRCode);

// Confirmar presença via RSVP
router.post('/rsvp/:qrCode', GuestController.rsvpValidation, GuestController.confirmPresence);

// Gerar QR Code
router.get('/qr-code/:qrCode', GuestController.generateQRCode);

module.exports = router; 