const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const { authenticateToken } = require('../middleware/auth');
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

// Rotas públicas (para RSVP)
router.get('/qr/:qrCode', guestController.getGuestByQRCode);
router.post('/rsvp/:qrCode', guestController.rsvpValidation, guestController.confirmPresence);
router.get('/qr-code/:qrCode', guestController.generateQRCode);

// Rotas protegidas por autenticação
router.use(authenticateToken);

// Buscar convidados de um evento com filtros
router.get('/events/:eventId/guests', guestController.getGuestsByEvent);

// Adicionar convidado
router.post('/events/:eventId/guests', guestController.addGuest);

// Atualizar convidado
router.put('/events/:eventId/guests/:guestId', guestController.updateGuest);

// Deletar convidado
router.delete('/events/:eventId/guests/:guestId', guestController.deleteGuest);

// Confirmar presença manualmente
router.put('/events/:eventId/guests/:guestId/confirm', guestController.confirmGuest);

// Importar convidados via CSV
router.post('/events/:eventId/guests/import', csvUpload.single('file'), guestController.importGuests);

// Exportar convidados para CSV
router.get('/events/:eventId/guests/export', guestController.exportGuests);

// Buscar convidado específico
router.get('/events/:eventId/guests/:guestId', guestController.getGuestById);

module.exports = router; 