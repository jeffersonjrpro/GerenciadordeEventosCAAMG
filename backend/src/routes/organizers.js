const express = require('express');
const router = express.Router();
const OrganizerController = require('../controllers/organizerController');
const { authenticateToken } = require('../middleware/auth');

// Rotas de convites (públicas)
router.get('/invite/:token', OrganizerController.validateInvite);
router.post('/invite/:token/decline', OrganizerController.declineInvite);

// Rotas protegidas (requerem autenticação)
router.use(authenticateToken);

// Rotas de organizadores de eventos
router.post('/events/:eventId/invite', OrganizerController.inviteValidation, OrganizerController.sendInvite);
router.get('/events/:eventId/organizers', OrganizerController.getEventOrganizers);
router.delete('/events/:eventId/organizers/:userId', OrganizerController.removeOrganizer);
router.put('/events/:eventId/organizers/:userId/role', OrganizerController.updateOrganizerRole);
router.get('/events/:eventId/invites', OrganizerController.getPendingInvites);
router.delete('/invites/:inviteId', OrganizerController.cancelInvite);
router.get('/my-organized-events', OrganizerController.getUserOrganizedEvents);

// Rotas de convites que requerem autenticação
router.post('/invite/:token/accept', OrganizerController.acceptInvite);

// Rotas de empresas
router.post('/companies', OrganizerController.createCompany);
router.post('/users/:userId/company', OrganizerController.addUserToCompany);
router.get('/companies/:companyId/users', OrganizerController.getCompanyUsers);

module.exports = router; 