const { body, validationResult } = require('express-validator');
const EventService = require('../services/eventService');

class EventController {
  // Validações para criação/atualização de evento
  static eventValidation = [
    body('name')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Nome do evento deve ter entre 2 e 200 caracteres'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Descrição deve ter no máximo 1000 caracteres'),
    body('date')
      .isISO8601()
      .withMessage('Data deve ser válida')
      .custom((value) => {
        const eventDate = new Date(value);
        const now = new Date();
        if (eventDate < now) {
          throw new Error('Data do evento não pode ser no passado');
        }
        return true;
      }),
    body('location')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Local deve ter entre 2 e 200 caracteres'),
    body('maxGuests')
      .optional()
      .isInt({ min: 1, max: 10000 })
      .withMessage('Limite de convidados deve ser um número entre 1 e 10000')
  ];

  // Criar evento
  static async createEvent(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const eventData = req.body;
      const event = await EventService.createEvent(req.user.id, eventData);

      res.status(201).json({
        message: 'Evento criado com sucesso',
        data: event
      });
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Buscar evento por ID
  static async getEventById(req, res) {
    try {
      const { eventId } = req.params;
      const event = await EventService.getEventById(eventId, req.user.id);

      res.json({
        data: event
      });
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
      
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

  // Listar eventos do usuário
  static async getUserEvents(req, res) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        status: req.query.status
      };

      const result = await EventService.getUserEvents(req.user.id, filters);

      res.json({
        data: result.events,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Erro ao listar eventos:', error);
      
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Listar todos os eventos (apenas admin)
  static async getAllEvents(req, res) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        status: req.query.status
      };

      const result = await EventService.getAllEvents(filters);

      res.json({
        data: result.events,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Erro ao listar todos os eventos:', error);
      
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar evento
  static async updateEvent(req, res) {
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
      const updateData = req.body;

      const event = await EventService.updateEvent(eventId, req.user.id, updateData);

      res.json({
        message: 'Evento atualizado com sucesso',
        data: event
      });
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      
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

  // Deletar evento
  static async deleteEvent(req, res) {
    try {
      const { eventId } = req.params;
      const result = await EventService.deleteEvent(eventId, req.user.id);

      res.json({
        message: result.message
      });
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      
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

  // Obter estatísticas do evento
  static async getEventStats(req, res) {
    try {
      const { eventId } = req.params;
      const stats = await EventService.getEventStats(eventId, req.user.id);

      res.json({
        data: stats
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas do evento:', error);
      
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

  // Obter estatísticas gerais do usuário
  static async getUserStats(req, res) {
    try {
      const stats = await EventService.getUserStats(req.user.id);

      res.json({
        data: stats
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas do usuário:', error);
      
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Buscar evento público (para RSVP)
  static async getPublicEvent(req, res) {
    try {
      const { eventId } = req.params;
      const event = await EventService.getPublicEvent(eventId);

      res.json({
        data: event
      });
    } catch (error) {
      console.error('Erro ao buscar evento público:', error);
      
      if (error.message === 'Evento não encontrado ou inativo') {
        return res.status(404).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Verificar se evento está cheio
  static async isEventFull(req, res) {
    try {
      const { eventId } = req.params;
      const isFull = await EventService.isEventFull(eventId);

      res.json({
        data: { isFull }
      });
    } catch (error) {
      console.error('Erro ao verificar se evento está cheio:', error);
      
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
}

module.exports = EventController; 