const express = require('express');
const router = express.Router();
const EventController = require('../controllers/eventController');
const GuestController = require('../controllers/guestController');

// Rotas públicas - rotas mais específicas primeiro
router.get('/events/:eventId/preview', EventController.getEventPreview);
router.get('/events/:eventId/form-config/preview', EventController.getPublicFormConfigForPreview);
router.get('/events/:eventId/public-page-config/preview', EventController.getPublicPageConfigForPreview);
router.get('/events/:eventId/form-config', EventController.getPublicFormConfig);
router.get('/events/:eventId/full', EventController.isEventFull);
router.get('/events/:eventId', EventController.getPublicEvent);

// Inscrição pública
router.post('/events/:eventId/guests/public', GuestController.addPublicGuest);

// Buscar convidado por QR Code
router.get('/qr/:qrCode', GuestController.getGuestByQRCode);

// Confirmar presença via RSVP
router.post('/rsvp/:qrCode', GuestController.rsvpValidation, GuestController.confirmPresence);

// Gerar QR Code
router.get('/qr-code/:qrCode', GuestController.generateQRCode);

module.exports = router; 