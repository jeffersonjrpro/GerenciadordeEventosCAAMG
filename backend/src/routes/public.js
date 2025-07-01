const express = require('express');
const router = express.Router();
const EventController = require('../controllers/eventController');
const GuestController = require('../controllers/guestController');
const PlanoController = require('../controllers/admin/planoController');

// Rotas públicas - rotas mais específicas primeiro
router.get('/events/:eventId/preview', EventController.getEventPreview);

// Rotas por slug personalizado (antes das rotas por ID)
router.get('/events/slug/:slug', EventController.getPublicEventBySlug);
router.get('/events/slug/:slug/preview', EventController.getEventForPreviewBySlug);
router.get('/events/slug/:slug/form-config', EventController.getPublicFormConfigBySlug);
router.get('/events/slug/:slug/page-config', EventController.getPublicPageConfigForPreviewBySlug);

// Rotas por ID (mantém compatibilidade)
router.get('/events/:eventId', EventController.getPublicEvent);
router.get('/events/:eventId/form-config', EventController.getPublicFormConfig);
router.get('/events/:eventId/page-config', EventController.getPublicPageConfigForPreview);

// Inscrição pública
router.post('/events/:eventId/guests/public', GuestController.addPublicGuest);
router.post('/events/slug/:slug/guests/public', async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await require('../services/eventService').getPublicEventBySlug(slug);
    req.params.eventId = event.id;
    return GuestController.addPublicGuest(req, res);
  } catch (error) {
    console.error('Erro ao buscar evento por slug para inscrição:', error);
    res.status(404).json({
      success: false,
      message: 'Evento não encontrado'
    });
  }
});

// Buscar convidado por QR Code
router.get('/qr/:qrCode', GuestController.getGuestByQRCode);

// Confirmar presença via RSVP
router.post('/rsvp/:qrCode', GuestController.rsvpValidation, GuestController.confirmPresence);

// Gerar QR Code
router.get('/qr-code/:qrCode', GuestController.generateQRCode);

// Listar planos disponíveis (público)
router.get('/planos', PlanoController.list);

module.exports = router; 