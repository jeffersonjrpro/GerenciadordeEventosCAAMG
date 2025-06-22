const OrganizerService = require('../services/organizerService');

// Middleware para verificar se o usuário é organizador de um evento
const isEventOrganizer = (requiredRole = 'CHECKIN') => {
  return async (req, res, next) => {
    try {
      const eventId = req.params.eventId;
      const userId = req.user.id;

      if (!eventId) {
        return res.status(400).json({
          error: 'ID do evento é obrigatório'
        });
      }

      const hasPermission = await OrganizerService.hasPermission(eventId, userId, requiredRole);
      
      if (!hasPermission) {
        return res.status(403).json({
          error: `Sem permissão. Requer papel: ${requiredRole}`
        });
      }

      next();
    } catch (error) {
      console.error('Erro no middleware de permissão:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  };
};

// Middleware para verificar se o usuário é dono do evento
const isEventOwner = isEventOrganizer('OWNER');

// Middleware para verificar se o usuário é editor do evento
const isEventEditor = isEventOrganizer('EDITOR');

// Middleware para verificar se o usuário pode fazer check-in
const canCheckIn = isEventOrganizer('CHECKIN');

module.exports = {
  isEventOrganizer,
  isEventOwner,
  isEventEditor,
  canCheckIn
}; 