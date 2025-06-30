const { body, validationResult } = require('express-validator');
const EventService = require('../services/eventService');

class EventController {
  // Validações para criação de evento (campos obrigatórios)
  static createEventValidation = [
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
      .notEmpty()
      .withMessage('Data é obrigatória')
      .custom((value) => {
        const eventDate = new Date(value);
        if (isNaN(eventDate.getTime())) {
          throw new Error('Data deve ser válida');
        }
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        if (eventDate < oneHourAgo) {
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
      .custom((value) => {
        if (value === '' || value === null || value === undefined) {
          return true;
        }
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 1 || numValue > 10000) {
          throw new Error('Limite de convidados deve ser um número entre 1 e 10000');
        }
        return true;
      })
      .withMessage('Limite de convidados deve ser um número entre 1 e 10000'),
    body('customFields')
      .optional()
      .isObject()
      .withMessage('Campos personalizados devem ser um objeto')
  ];

  // Validações para criação/atualização de evento
  static eventValidation = [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Nome do evento deve ter entre 2 e 200 caracteres'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Descrição deve ter no máximo 1000 caracteres'),
    body('date')
      .optional()
      .custom((value) => {
        if (value === undefined || value === null || value === '') {
          return true;
        }
        const eventDate = new Date(value);
        if (isNaN(eventDate.getTime())) {
          throw new Error('Data deve ser válida');
        }
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        if (eventDate < oneHourAgo) {
          throw new Error('Data do evento não pode ser no passado');
        }
        return true;
      }),
    body('location')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Local deve ter entre 2 e 200 caracteres'),
    body('maxGuests')
      .optional()
      .custom((value) => {
        if (value === '' || value === null || value === undefined) {
          return true;
        }
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 1 || numValue > 10000) {
          throw new Error('Limite de convidados deve ser um número entre 1 e 10000');
        }
        return true;
      })
      .withMessage('Limite de convidados deve ser um número entre 1 e 10000'),
    body('customFields')
      .optional()
      .isObject()
      .withMessage('Campos personalizados devem ser um objeto'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic deve ser um valor booleano'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive deve ser um valor booleano')
  ];

  // Validação específica para campos personalizados
  static customFieldsValidation = [
    body('customFields')
      .isObject()
      .withMessage('Campos personalizados devem ser um objeto')
      .custom((value) => {
        if (!value || typeof value !== 'object') {
          throw new Error('Campos personalizados devem ser um objeto válido');
        }
        
        for (const [fieldName, fieldConfig] of Object.entries(value)) {
          if (typeof fieldName !== 'string' || fieldName.trim().length === 0) {
            throw new Error('Nome do campo personalizado deve ser uma string válida');
          }
          
          if (typeof fieldConfig !== 'object' || !fieldConfig.type) {
            throw new Error(`Configuração inválida para o campo "${fieldName}"`);
          }
          
          const validTypes = ['text', 'email', 'number', 'tel', 'date'];
          if (!validTypes.includes(fieldConfig.type)) {
            throw new Error(`Tipo inválido para o campo "${fieldName}". Tipos válidos: ${validTypes.join(', ')}`);
          }
        }
        
        return true;
      })
  ];

  // Criar evento
  static async createEvent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Erros de validação:', errors.array());
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array(),
          receivedData: req.body
        });
      }

      const eventData = req.body;
      console.log('Dados recebidos:', eventData);
      
      if (req.file) {
        eventData.imageUrl = `/uploads/events/${req.file.filename}`;
      }

      const event = await EventService.createEvent(req.user.id, eventData);

      res.status(201).json({
        message: 'Evento criado com sucesso',
        id: event.id,
        data: event
      });
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
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
      console.log('UpdateEvent - Dados recebidos:', req.body);
      console.log('UpdateEvent - Parâmetros:', req.params);
      console.log('UpdateEvent - Arquivo recebido:', req.file);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('UpdateEvent - Erros de validação:', errors.array());
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const { eventId } = req.params;
      const updateData = req.body;
      
      if (req.file) {
        updateData.imageUrl = `/uploads/events/${req.file.filename}`;
        console.log('UpdateEvent - Nova imagem:', updateData.imageUrl);
      }

      console.log('UpdateEvent - Dados para atualização:', updateData);
      const event = await EventService.updateEvent(eventId, req.user.id, updateData);

      res.json({
        message: 'Evento atualizado com sucesso',
        data: event
      });
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      console.error('Stack trace:', error.stack);
      
      if (error.message === 'Evento não encontrado') {
        return res.status(404).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Algo deu errado'
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

  // Buscar evento público
  static async getPublicEvent(req, res) {
    try {
      const { eventId } = req.params;
      console.log('🔍 getPublicEvent - eventId:', eventId);

      const event = await EventService.getPublicEvent(eventId);
      console.log('✅ getPublicEvent - evento retornado:', JSON.stringify(event, null, 2));

      if (!event) {
        console.log('❌ getPublicEvent - evento não encontrado');
        return res.status(404).json({
          success: false,
          message: 'Evento não encontrado'
        });
      }

      console.log('✅ getPublicEvent - enviando resposta de sucesso');
      res.json({
        success: true,
        data: event
      });
    } catch (error) {
      console.error('❌ Erro ao buscar evento público:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
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

  // Pausar inscrições
  static async pauseRegistration(req, res) {
    try {
      const { eventId } = req.params;
      const { pauseUntil } = req.body;

      const event = await EventService.pauseRegistration(eventId, req.user.id, pauseUntil);

      res.json({
        message: 'Inscrições pausadas com sucesso',
        data: event
      });
    } catch (error) {
      console.error('Erro ao pausar inscrições:', error);
      
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

  // Retomar inscrições
  static async resumeRegistration(req, res) {
    try {
      const { eventId } = req.params;

      const event = await EventService.resumeRegistration(eventId, req.user.id);

      res.json({
        message: 'Inscrições retomadas com sucesso',
        data: event
      });
    } catch (error) {
      console.error('Erro ao retomar inscrições:', error);
      
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

  // Verificar status das inscrições
  static async getRegistrationStatus(req, res) {
    try {
      const { eventId } = req.params;

      const isPaused = await EventService.isRegistrationPaused(eventId);

      res.json({
        data: { isPaused }
      });
    } catch (error) {
      console.error('Erro ao verificar status das inscrições:', error);
      
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

  // Obter configuração do formulário
  static async getFormConfig(req, res) {
    try {
      const { eventId } = req.params;
      const config = await EventService.getFormConfig(eventId, req.user.id);

      res.json({
        data: config
      });
    } catch (error) {
      console.error('Erro ao buscar configuração do formulário:', error);
      
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

  // Atualizar configuração do formulário
  static async updateFormConfig(req, res) {
    try {
      const { eventId } = req.params;
      const config = req.body;

      const updatedConfig = await EventService.updateFormConfig(eventId, req.user.id, config);

      res.json({
        message: 'Configuração do formulário atualizada com sucesso',
        data: updatedConfig
      });
    } catch (error) {
      console.error('Erro ao atualizar configuração do formulário:', error);
      
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

  // Obter configuração da página pública
  static async getPublicPageConfig(req, res) {
    try {
      const { eventId } = req.params;
      const config = await EventService.getPublicPageConfig(eventId, req.user.id);

      res.json({
        data: config
      });
    } catch (error) {
      console.error('Erro ao buscar configuração da página pública:', error);
      
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

  // Atualizar configuração da página pública
  static async updatePublicPageConfig(req, res) {
    try {
      const { eventId } = req.params;
      const config = req.body;

      const updatedConfig = await EventService.updatePublicPageConfig(eventId, req.user.id, config);

      res.json({
        message: 'Configuração da página pública atualizada com sucesso',
        data: updatedConfig
      });
    } catch (error) {
      console.error('Erro ao atualizar configuração da página pública:', error);
      
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