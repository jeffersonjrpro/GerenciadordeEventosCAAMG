const { body, validationResult } = require('express-validator');
const CheckInService = require('../services/checkInService');

class CheckInController {
  // Validações para check-in
  static checkInValidation = [
    body('qrCode')
      .notEmpty()
      .withMessage('QR Code é obrigatório')
  ];

  // Realizar check-in
  static async performCheckIn(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const { qrCode } = req.body;
      const checkIn = await CheckInService.performCheckIn(qrCode, req.user.id);

      res.status(201).json({
        message: 'Check-in realizado com sucesso',
        data: checkIn
      });
    } catch (error) {
      console.error('Erro ao realizar check-in:', error);
      
      if (error.message.includes('QR Code inválido') || 
          error.message.includes('Você não tem permissão') ||
          error.message.includes('Evento não está ativo') ||
          error.message.includes('Check-in já foi realizado') ||
          error.message.includes('Convidado não confirmou presença')) {
        return res.status(400).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Buscar check-in por ID
  static async getCheckInById(req, res) {
    try {
      const { checkInId } = req.params;
      const checkIn = await CheckInService.getCheckInById(checkInId, req.user.id);

      res.json({
        data: checkIn
      });
    } catch (error) {
      console.error('Erro ao buscar check-in:', error);
      
      if (error.message === 'Check-in não encontrado') {
        return res.status(404).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Listar check-ins de um evento
  static async getEventCheckIns(req, res) {
    try {
      const { eventId } = req.params;
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search
      };

      const result = await CheckInService.getEventCheckIns(eventId, req.user.id, filters);

      res.json({
        data: result.checkIns,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Erro ao listar check-ins:', error);
      
      if (error.message === 'Evento não encontrado') {
        return res.status(404).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Cancelar check-in
  static async cancelCheckIn(req, res) {
    try {
      const { checkInId } = req.params;
      const result = await CheckInService.cancelCheckIn(checkInId, req.user.id);

      res.json({
        message: result.message
      });
    } catch (error) {
      console.error('Erro ao cancelar check-in:', error);
      
      if (error.message === 'Check-in não encontrado') {
        return res.status(404).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Obter estatísticas de check-in do evento
  static async getEventCheckInStats(req, res) {
    try {
      const { eventId } = req.params;
      const stats = await CheckInService.getEventCheckInStats(eventId, req.user.id);

      res.json({
        data: stats
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas de check-in:', error);
      
      if (error.message === 'Evento não encontrado') {
        return res.status(404).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Buscar check-in por QR Code (para verificação)
  static async getCheckInByQRCode(req, res) {
    try {
      const { qrCode } = req.params;
      const result = await CheckInService.getCheckInByQRCode(qrCode, req.user.id);

      res.json({
        data: result
      });
    } catch (error) {
      console.error('Erro ao buscar check-in por QR Code:', error);
      
      if (error.message === 'QR Code inválido' || 
          error.message.includes('Você não tem permissão')) {
        return res.status(400).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = CheckInController; 