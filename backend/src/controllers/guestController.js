const { body, validationResult } = require('express-validator');
const GuestService = require('../services/guestService');

class GuestController {
  // Validações para criação/atualização de convidado
  static guestValidation = [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    body('phone')
      .optional()
      .trim()
      .isLength({ min: 10, max: 15 })
      .withMessage('Telefone deve ter entre 10 e 15 caracteres')
  ];

  // Validações para RSVP
  static rsvpValidation = [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    body('phone')
      .optional()
      .trim()
      .isLength({ min: 10, max: 15 })
      .withMessage('Telefone deve ter entre 10 e 15 caracteres')
  ];

  // Criar convidado
  static async createGuest(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const { eventId } = req.params;
      const guestData = req.body;

      const guest = await GuestService.createGuest(eventId, req.user.id, guestData);

      res.status(201).json({
        message: 'Convidado adicionado com sucesso',
        data: guest
      });
    } catch (error) {
      console.error('Erro ao criar convidado:', error);
      
      if (error.message.includes('Evento não encontrado') || 
          error.message.includes('Evento está com capacidade máxima')) {
        return res.status(400).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Buscar convidado por QR Code (público)
  static async getGuestByQRCode(req, res) {
    try {
      const { qrCode } = req.params;
      const guest = await GuestService.getGuestByQRCode(qrCode);

      res.json({
        data: guest
      });
    } catch (error) {
      console.error('Erro ao buscar convidado por QR Code:', error);
      
      if (error.message === 'QR Code inválido') {
        return res.status(404).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Confirmar presença (RSVP)
  static async confirmPresence(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const { qrCode } = req.params;
      const guestData = req.body;

      const guest = await GuestService.confirmPresence(qrCode, guestData);

      res.json({
        message: 'Presença confirmada com sucesso',
        data: guest
      });
    } catch (error) {
      console.error('Erro ao confirmar presença:', error);
      
      if (error.message.includes('QR Code inválido') || 
          error.message.includes('Evento não está ativo') ||
          error.message.includes('Presença já foi confirmada')) {
        return res.status(400).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Gerar QR Code como imagem
  static async generateQRCode(req, res) {
    try {
      const { qrCode } = req.params;
      const qrCodeImage = await GuestService.generateQRCodeImage(qrCode);

      res.json({
        data: {
          qrCode,
          image: qrCodeImage
        }
      });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = GuestController; 