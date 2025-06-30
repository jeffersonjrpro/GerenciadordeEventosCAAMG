const { body, validationResult } = require('express-validator');
const EventService = require('../services/eventService');
const OrganizerService = require('../services/organizerService');
const prisma = require('../config/database');

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
      .custom((value) => {
        if (value === undefined || value === null || value === '') {
          return true;
        }
        if (typeof value === 'boolean') {
          return true;
        }
        if (value === 'true' || value === 'false') {
          return true;
        }
        throw new Error('isPublic deve ser um valor booleano');
      })
      .withMessage('isPublic deve ser um valor booleano'),
    body('isActive')
      .optional()
      .custom((value) => {
        if (value === undefined || value === null || value === '') {
          return true;
        }
        if (typeof value === 'boolean') {
          return true;
        }
        if (value === 'true' || value === 'false') {
          return true;
        }
        throw new Error('isActive deve ser um valor booleano');
      })
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

      // Buscar apenas eventos do usuário logado (criador ou organizador)
      const result = await EventService.getUserEvents(req.user.id, filters);

      res.json({
        data: result.events,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Erro ao listar eventos do usuário:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar evento
  static async updateEvent(req, res) {
    try {
      console.log('🔍 UpdateEvent - Iniciando atualização');
      console.log('🔍 UpdateEvent - Dados recebidos:', req.body);
      console.log('🔍 UpdateEvent - Parâmetros:', req.params);
      console.log('🔍 UpdateEvent - Arquivo recebido:', req.file);
      console.log('🔍 UpdateEvent - Headers:', req.headers);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ UpdateEvent - Erros de validação:', errors.array());
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const { eventId } = req.params;
      const updateData = req.body;
      const userId = req.user.id;
      
      // Verificar se o usuário tem permissão para editar o evento
      const hasPermission = await OrganizerService.hasPermission(eventId, userId, 'EDITOR');
      if (!hasPermission) {
        return res.status(403).json({
          error: 'Sem permissão para editar este evento'
        });
      }
      
      if (req.file) {
        updateData.imageUrl = `/uploads/events/${req.file.filename}`;
        console.log('✅ UpdateEvent - Nova imagem:', updateData.imageUrl);
      }

      console.log('🔍 UpdateEvent - Dados para atualização:', updateData);
      
      const event = await EventService.updateEvent(eventId, userId, updateData);

      console.log('✅ UpdateEvent - Evento atualizado com sucesso');
      res.json({
        message: 'Evento atualizado com sucesso',
        data: event
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar evento:', error);
      console.error('❌ Stack trace:', error.stack);
      
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
      const userId = req.user.id;

      // Verificar se o usuário tem permissão para deletar o evento (apenas OWNER)
      const hasPermission = await OrganizerService.hasPermission(eventId, userId, 'OWNER');
      if (!hasPermission) {
        return res.status(403).json({
          error: 'Sem permissão para deletar este evento'
        });
      }

      const result = await EventService.deleteEvent(eventId, userId);

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
      const userId = req.user.id;

      // Verificar se o usuário tem acesso ao evento
      const isOrganizer = await OrganizerService.isUserOrganizer(eventId, userId);
      if (!isOrganizer) {
        return res.status(403).json({
          error: 'Sem permissão para acessar este evento'
        });
      }

      const stats = await EventService.getEventStats(eventId, userId);

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

  // Buscar estatísticas de eventos do usuário
  static async getEventStatistics(req, res) {
    try {
      console.log('=== DEBUG ESTATISTICAS ===');
      console.log('req.user:', req.user);
      console.log('user.id:', req.user.id);
      console.log('user.empresaId:', req.user.empresaId);
      
      const stats = await EventService.getEventStatistics(req.user.id, req.user.empresaId);

      console.log('Estatísticas calculadas:', stats);
      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de eventos:', error);
      console.error('Stack trace:', error.stack);
      
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

  // Buscar evento para preview (sem restrições)
  static async getEventPreview(req, res) {
    try {
      const { eventId } = req.params;
      console.log('🔍 getEventPreview - eventId:', eventId);

      const event = await EventService.getEventForPreview(eventId);
      console.log('✅ getEventPreview - evento retornado:', JSON.stringify(event, null, 2));

      if (!event) {
        console.log('❌ getEventPreview - evento não encontrado');
        return res.status(404).json({
          success: false,
          message: 'Evento não encontrado'
        });
      }

      console.log('✅ getEventPreview - enviando resposta de sucesso');
      res.json({
        success: true,
        data: event
      });
    } catch (error) {
      console.error('❌ Erro ao buscar evento para preview:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar configuração do formulário público
  static async getPublicFormConfig(req, res) {
    try {
      const { eventId } = req.params;
      console.log('🔍 getPublicFormConfig - eventId:', eventId);

      const config = await EventService.getPublicFormConfig(eventId);
      console.log('✅ getPublicFormConfig - config retornado:', JSON.stringify(config, null, 2));

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('❌ Erro ao buscar configuração do formulário público:', error);
      
      if (error.message === 'Evento não encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar configuração do formulário para preview (sem restrições)
  static async getPublicFormConfigForPreview(req, res) {
    try {
      const { eventId } = req.params;
      console.log('🔍 getPublicFormConfigForPreview - eventId:', eventId);

      const config = await EventService.getPublicFormConfigForPreview(eventId);
      console.log('✅ getPublicFormConfigForPreview - config retornado:', JSON.stringify(config, null, 2));

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('❌ Erro ao buscar configuração do formulário para preview:', error);
      
      if (error.message === 'Evento não encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar configuração da página pública para preview (sem restrições)
  static async getPublicPageConfigForPreview(req, res) {
    try {
      const { eventId } = req.params;
      console.log('🔍 getPublicPageConfigForPreview - eventId:', eventId);

      const config = await EventService.getPublicPageConfigForPreview(eventId);
      console.log('✅ getPublicPageConfigForPreview - config retornado:', JSON.stringify(config, null, 2));

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('❌ Erro ao buscar configuração da página pública para preview:', error);
      
      if (error.message === 'Evento não encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

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

  // Upload de imagem do evento
  static async uploadEventImage(req, res) {
    try {
      const { eventId } = req.params;

      if (!req.file) {
        return res.status(400).json({
          error: 'Nenhuma imagem foi enviada'
        });
      }

      const imageUrl = `/uploads/events/${req.file.filename}`;
      
      // Atualizar o evento com a nova imagem
      const updatedEvent = await EventService.updateEvent(eventId, req.user.id, { imageUrl });

      res.json({
        message: 'Imagem do evento atualizada com sucesso',
        data: {
          imageUrl: updatedEvent.imageUrl
        }
      });
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      
      if (error.message === 'Evento não encontrado') {
        return res.status(404).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Remover imagem do evento
  static async removeEventImage(req, res) {
    try {
      const { eventId } = req.params;

      // Atualizar o evento removendo a imagem
      const updatedEvent = await EventService.updateEvent(eventId, req.user.id, { imageUrl: null });

      res.json({
        message: 'Imagem do evento removida com sucesso',
        data: {
          imageUrl: null
        }
      });
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      
      if (error.message === 'Evento não encontrado') {
        return res.status(404).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Realizar check-in em evento específico
  static async performEventCheckIn(req, res) {
    try {
      const { eventId } = req.params;
      const { guestId } = req.body; // Pode ser ID ou código QR
      
      // Se guestId é um código (contém letras), buscar por qrCode
      // Se é um ID (só números), buscar por ID
      const isQRCode = /[A-Za-z]/.test(guestId);
      
      let guest;
      if (isQRCode) {
        guest = await prisma.guest.findFirst({
          where: {
            qrCode: guestId,
            eventId: eventId
          },
          include: {
            event: true,
            checkIns: true
          }
        });
      } else {
        guest = await prisma.guest.findFirst({
          where: {
            id: guestId,
            eventId: eventId
          },
          include: {
            event: true,
            checkIns: true
          }
        });
      }

      if (!guest) {
        return res.status(400).json({
          message: 'Convidado não encontrado para este evento'
        });
      }

      // Verificar se o evento pertence ao usuário
      if (guest.event.userId !== req.user.id) {
        return res.status(403).json({
          message: 'Você não tem permissão para fazer check-in neste evento'
        });
      }

      // Verificar se o evento está ativo
      if (!guest.event.isActive) {
        return res.status(400).json({
          message: 'Evento não está ativo'
        });
      }

      // Verificar se já foi feito check-in
      if (guest.checkIns.length > 0) {
        return res.status(400).json({
          message: 'Check-in já foi realizado para este convidado'
        });
      }

      // Verificar se o convidado confirmou presença
      if (!guest.confirmed) {
        return res.status(400).json({
          message: 'Convidado não confirmou presença'
        });
      }

      // Realizar check-in
      const checkIn = await prisma.checkIn.create({
        data: {
          eventId: guest.event.id,
          guestId: guest.id
        },
        include: {
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              qrCode: true
            }
          },
          event: {
            select: {
              id: true,
              name: true,
              date: true,
              location: true
            }
          }
        }
      });

      res.status(201).json({
        message: 'Check-in realizado com sucesso',
        data: {
          ...checkIn,
          checkedInAt: checkIn.checkedInAt
        }
      });
    } catch (error) {
      console.error('Erro ao realizar check-in:', error);
      
      res.status(500).json({
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = EventController; 