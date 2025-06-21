const express = require('express');
const router = express.Router();
const EventController = require('../controllers/eventController');

// Rotas públicas
router.get('/events/:eventId', EventController.getPublicEvent);
router.get('/events/:eventId/full', EventController.isEventFull);

module.exports = router; 