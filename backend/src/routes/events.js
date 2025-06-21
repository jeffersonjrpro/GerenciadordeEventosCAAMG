const express = require('express');
const router = express.Router();
const EventController = require('../controllers/eventController');
const GuestController = require('../controllers/guestController');
const { authenticateToken, requireAdmin, requireOrganizer } = require('../middleware/auth');
const { uploadEventImage, handleUploadError } = require('../middleware/upload');
const multer = require('multer');

// Configurar multer para upload de CSV
const csvUpload = multer({
  dest: 'temp/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV são permitidos!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Rotas públicas (antes da autenticação)
router.get('/:eventId/public', (req, res) => {
  // Redirecionar para a rota pública correta
  res.redirect(`/api/public/events/${req.params.eventId}`);
});

// Rotas protegidas para organizadores
router.use(authenticateToken);
router.use(requireOrganizer);

// CRUD de eventos
router.post('/', uploadEventImage, handleUploadError, EventController.createEventValidation, EventController.createEvent);
router.get('/my-events', EventController.getUserEvents);
router.get('/stats', EventController.getUserStats);
router.get('/:eventId', EventController.getEventById);
router.put('/:eventId', uploadEventImage, handleUploadError, EventController.eventValidation, EventController.updateEvent);
router.put('/:eventId/custom-fields', EventController.customFieldsValidation, EventController.updateEvent);
router.delete('/:eventId', EventController.deleteEvent);
router.get('/:eventId/stats', EventController.getEventStats);

// Controle de inscrições
router.post('/:eventId/pause-registration', EventController.pauseRegistration);
router.post('/:eventId/resume-registration', EventController.resumeRegistration);
router.get('/:eventId/registration-status', EventController.getRegistrationStatus);

// Rotas de convidados
router.get('/:eventId/guests', GuestController.getGuestsByEvent);
router.post('/:eventId/guests', GuestController.guestValidation, GuestController.createGuest);
router.put('/:eventId/guests/:guestId', GuestController.guestValidation, GuestController.updateGuest);
router.delete('/:eventId/guests/:guestId', GuestController.deleteGuest);
router.put('/:eventId/guests/:guestId/confirm', GuestController.confirmGuest);
router.post('/:eventId/guests/import', csvUpload.single('file'), GuestController.importGuests);
router.get('/:eventId/guests/export', GuestController.exportGuests);
router.get('/:eventId/guests/:guestId', GuestController.getGuestById);

// Rotas apenas para admin
router.get('/', requireAdmin, EventController.getAllEvents);

module.exports = router; 