const express = require('express');
const router = express.Router();
const EventController = require('../controllers/eventController');
const { authenticateToken, requireAdmin, requireOrganizer } = require('../middleware/auth');

// Rotas protegidas para organizadores
router.use(authenticateToken);
router.use(requireOrganizer);

// CRUD de eventos
router.post('/', EventController.eventValidation, EventController.createEvent);
router.get('/my-events', EventController.getUserEvents);
router.get('/stats', EventController.getUserStats);
router.get('/:eventId', EventController.getEventById);
router.put('/:eventId', EventController.eventValidation, EventController.updateEvent);
router.delete('/:eventId', EventController.deleteEvent);
router.get('/:eventId/stats', EventController.getEventStats);

// Rotas apenas para admin
router.get('/', requireAdmin, EventController.getAllEvents);

module.exports = router; 