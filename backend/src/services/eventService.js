const { prisma } = require('../config/database');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const OrganizerService = require('./organizerService');

class EventService {
  // Criar novo evento
  static async createEvent(userId, eventData) {
    const { name, description, date, location, maxGuests, customFields, companyId } = eventData;

    const event = await prisma.event.create({
      data: {
        name,
        description,
        date: new Date(date),
        location,
        maxGuests: maxGuests ? parseInt(maxGuests) : null,
        customFields: customFields || {},
        isPublic: true,
        userId,
        companyId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        organizers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            guests: true,
            checkIns: true
          }
        }
      }
    });

    // Adicionar o criador como organizador OWNER
    await OrganizerService.addOrganizer(event.id, userId, 'OWNER');

    return event;
  }

  // Buscar evento por ID
  static async getEventById(eventId, userId = null) {
    const where = { id: eventId };
    
    // Se userId fornecido, verificar se o usuário tem acesso ao evento
    if (userId) {
      // Verificar se é o criador ou organizador do evento
      const isCreator = await prisma.event.findFirst({
        where: { id: eventId, userId }
      });
      
      const isOrganizer = await OrganizerService.isUserOrganizer(eventId, userId);
      
      if (!isCreator && !isOrganizer) {
        throw new Error('Sem permissão para acessar este evento');
      }
    }

    const event = await prisma.event.findFirst({
      where: { id: eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        organizers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        guests: {
          include: {
            checkIns: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        checkIns: {
          include: {
            guest: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            checkedInAt: 'desc'
          }
        },
        _count: {
          select: {
            guests: true,
            checkIns: true
          }
        }
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    return event;
  }

  // Listar eventos do usuário (incluindo onde é organizador)
  static async getUserEvents(userId, filters = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = filters;
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { userId }, // Eventos criados pelo usuário
        { organizers: { some: { userId } } } // Eventos onde é organizador
      ],
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(status === 'active' && { isActive: true }),
      ...(status === 'inactive' && { isActive: false })
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          organizers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              guests: true,
              checkIns: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.event.count({ where })
    ]);

    return {
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Listar eventos da empresa
  static async getCompanyEvents(companyId, filters = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = filters;
    const skip = (page - 1) * limit;

    const where = {
      companyId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(status === 'active' && { isActive: true }),
      ...(status === 'inactive' && { isActive: false })
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          organizers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              guests: true,
              checkIns: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.event.count({ where })
    ]);

    return {
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Listar todos os eventos (apenas admin)
  static async getAllEvents(filters = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = filters;
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(status === 'active' && { isActive: true }),
      ...(status === 'inactive' && { isActive: false })
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              guests: true,
              checkIns: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.event.count({ where })
    ]);

    return {
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Atualizar evento
  static async updateEvent(eventId, userId, updateData) {
    console.log('EventService.updateEvent - Iniciando atualização');
    console.log('EventService.updateEvent - eventId:', eventId);
    console.log('EventService.updateEvent - userId:', userId);
    console.log('EventService.updateEvent - updateData:', updateData);
    
    // Verificar se o evento existe e pertence ao usuário
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId
      }
    });

    if (!existingEvent) {
      console.log('EventService.updateEvent - Evento não encontrado');
      throw new Error('Evento não encontrado');
    }

    console.log('EventService.updateEvent - Evento encontrado:', existingEvent.id);

    const { name, description, date, location, maxGuests, isActive, isPublic, customFields, imageUrl } = updateData;

    console.log('EventService.updateEvent - Dados para atualização:', {
      name, description, date, location, maxGuests, isActive, isPublic, customFields, imageUrl
    });

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(name && { name: name || null }),
        ...(description !== undefined && { description: description || null }),
        ...(date && { date: date ? new Date(date) : null }),
        ...(location && { location: location || null }),
        ...(maxGuests !== undefined && { maxGuests: maxGuests && maxGuests !== '' ? parseInt(maxGuests) : null }),
        ...(isActive !== undefined && { isActive: isActive === 'true' || isActive === true }),
        ...(isPublic !== undefined && { isPublic: isPublic === 'true' || isPublic === true }),
        ...(customFields !== undefined && { customFields }),
        ...(imageUrl && { imageUrl: imageUrl || null })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            guests: true,
            checkIns: true
          }
        }
      }
    });

    console.log('EventService.updateEvent - Evento atualizado com sucesso');
    return event;
  }

  // Deletar evento
  static async deleteEvent(eventId, userId) {
    // Verificar se o evento existe e pertence ao usuário
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId
      },
      include: {
        guests: true,
        checkIns: true
      }
    });

    if (!existingEvent) {
      throw new Error('Evento não encontrado');
    }

    // Deletar evento (cascade irá deletar convidados e check-ins)
    await prisma.event.delete({
      where: { id: eventId }
    });

    return { message: 'Evento deletado com sucesso' };
  }

  // Obter estatísticas do evento
  static async getEventStats(eventId, userId) {
    const event = await this.getEventById(eventId, userId);

    const totalGuests = event.guests.length;
    const confirmedGuests = event.guests.filter(guest => guest.confirmed).length;
    const checkedInGuests = event.checkIns.length;
    const pendingGuests = totalGuests - confirmedGuests;
    const absentGuests = confirmedGuests - checkedInGuests;

    return {
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        location: event.location
      },
      stats: {
        totalGuests,
        confirmedGuests,
        checkedInGuests,
        pendingGuests,
        absentGuests,
        confirmationRate: totalGuests > 0 ? (confirmedGuests / totalGuests * 100).toFixed(1) : 0,
        attendanceRate: confirmedGuests > 0 ? (checkedInGuests / confirmedGuests * 100).toFixed(1) : 0
      }
    };
  }

  // Obter estatísticas gerais do usuário
  static async getUserStats(userId) {
    const [events, totalGuests, totalConfirmed, totalCheckedIn] = await Promise.all([
      prisma.event.count({ where: { userId } }),
      prisma.guest.count({
        where: {
          event: { userId }
        }
      }),
      prisma.guest.count({
        where: {
          event: { userId },
          confirmed: true
        }
      }),
      prisma.checkIn.count({
        where: {
          event: { userId }
        }
      })
    ]);

    return {
      totalEvents: events,
      totalGuests,
      totalConfirmed,
      totalCheckedIn,
      averageConfirmationRate: totalGuests > 0 ? (totalConfirmed / totalGuests * 100).toFixed(1) : 0,
      averageAttendanceRate: totalConfirmed > 0 ? (totalCheckedIn / totalConfirmed * 100).toFixed(1) : 0
    };
  }

  // Buscar evento público (para RSVP)
  static async getPublicEvent(eventId) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        isActive: true,
        isPublic: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        date: true,
        location: true,
        maxGuests: true,
        isPublic: true,
        isActive: true,
        customFields: true,
        formConfig: true,
        publicPageConfig: true,
        imageUrl: true,
        user: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            guests: true
          }
        }
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado ou não está disponível publicamente');
    }

    return event;
  }

  // Obter evento para preview (sem restrições de isActive e isPublic)
  static async getEventForPreview(eventId) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId
      },
      select: {
        id: true,
        name: true,
        description: true,
        date: true,
        location: true,
        maxGuests: true,
        isPublic: true,
        isActive: true,
        customFields: true,
        formConfig: true,
        publicPageConfig: true,
        imageUrl: true,
        user: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            guests: true
          }
        }
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    return event;
  }

  // Verificar se evento está cheio
  static async isEventFull(eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            guests: true
          }
        }
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    if (!event.maxGuests) {
      return false; // Sem limite de convidados
    }

    return event._count.guests >= event.maxGuests;
  }

  // Pausar inscrições manualmente
  static async pauseRegistration(eventId, userId, pauseUntil = null) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    const updateData = {
      registrationPaused: true
    };

    if (pauseUntil) {
      updateData.registrationPauseUntil = new Date(pauseUntil);
    }

    return await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            guests: true,
            checkIns: true
          }
        }
      }
    });
  }

  // Retomar inscrições
  static async resumeRegistration(eventId, userId) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    return await prisma.event.update({
      where: { id: eventId },
      data: {
        registrationPaused: false,
        registrationPauseUntil: null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            guests: true,
            checkIns: true
          }
        }
      }
    });
  }

  // Verificar se inscrições estão pausadas
  static async isRegistrationPaused(eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        registrationPaused: true,
        registrationPauseUntil: true
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    // Se pausado manualmente, retorna true
    if (event.registrationPaused) {
      return true;
    }

    // Se tem data de pausa e ainda não passou, retorna true
    if (event.registrationPauseUntil && event.registrationPauseUntil > new Date()) {
      return true;
    }

    return false;
  }

  // Obter configuração do formulário
  static async getFormConfig(eventId, userId) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId
      },
      select: {
        id: true,
        formConfig: true,
        customFields: true
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    // Se não tem configuração, criar uma padrão
    if (!event.formConfig) {
      const defaultConfig = {
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Nome Completo',
            required: true,
            placeholder: 'Digite seu nome completo',
            order: 1
          },
          {
            id: 'email',
            type: 'email',
            label: 'E-mail',
            required: true,
            placeholder: 'Digite seu e-mail',
            order: 2
          },
          {
            id: 'phone',
            type: 'tel',
            label: 'Telefone',
            required: false,
            placeholder: 'Digite seu telefone',
            order: 3
          }
        ],
        settings: {
          title: 'Inscrição no Evento',
          description: 'Preencha os dados abaixo para se inscrever',
          submitButtonText: 'Confirmar Inscrição',
          successMessage: 'Inscrição realizada com sucesso!',
          showProgressBar: true,
          allowMultipleSubmissions: false
        }
      };

      return defaultConfig;
    }

    return event.formConfig;
  }

  // Obter configuração do formulário público (sem autenticação)
  static async getPublicFormConfig(eventId) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        isActive: true,
        isPublic: true
      },
      select: {
        id: true,
        formConfig: true,
        customFields: true
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    // Se não tem configuração, criar uma padrão
    if (!event.formConfig) {
      const defaultConfig = {
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Nome Completo',
            required: true,
            placeholder: 'Digite seu nome completo',
            order: 1
          },
          {
            id: 'email',
            type: 'email',
            label: 'E-mail',
            required: true,
            placeholder: 'Digite seu e-mail',
            order: 2
          },
          {
            id: 'phone',
            type: 'tel',
            label: 'Telefone',
            required: false,
            placeholder: 'Digite seu telefone',
            order: 3
          }
        ],
        settings: {
          title: 'Inscrição no Evento',
          description: 'Preencha os dados abaixo para se inscrever',
          submitButtonText: 'Confirmar Inscrição',
          successMessage: 'Inscrição realizada com sucesso!',
          showProgressBar: true,
          allowMultipleSubmissions: false
        }
      };

      return defaultConfig;
    }

    return event.formConfig;
  }

  // Obter configuração do formulário para preview (sem restrições)
  static async getPublicFormConfigForPreview(eventId) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId
      },
      select: {
        id: true,
        formConfig: true,
        customFields: true
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    // Se não tem configuração, criar uma padrão
    if (!event.formConfig) {
      const defaultConfig = {
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Nome Completo',
            required: true,
            placeholder: 'Digite seu nome completo',
            order: 1
          },
          {
            id: 'email',
            type: 'email',
            label: 'E-mail',
            required: true,
            placeholder: 'Digite seu e-mail',
            order: 2
          },
          {
            id: 'phone',
            type: 'tel',
            label: 'Telefone',
            required: false,
            placeholder: 'Digite seu telefone',
            order: 3
          }
        ],
        settings: {
          title: 'Inscrição no Evento',
          description: 'Preencha os dados abaixo para se inscrever',
          submitButtonText: 'Confirmar Inscrição',
          successMessage: 'Inscrição realizada com sucesso!',
          showProgressBar: true,
          allowMultipleSubmissions: false
        }
      };

      return defaultConfig;
    }

    return event.formConfig;
  }

  // Obter configuração da página pública para preview (sem restrições)
  static async getPublicPageConfigForPreview(eventId) {
    console.log('🔍 getPublicPageConfigForPreview - eventId:', eventId);
    
    const event = await prisma.event.findFirst({
      where: {
        id: eventId
      },
      select: {
        id: true,
        name: true,
        description: true,
        date: true,
        location: true,
        imageUrl: true,
        publicPageConfig: true
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    console.log('✅ getPublicPageConfigForPreview - evento encontrado:', {
      id: event.id,
      name: event.name,
      imageUrl: event.imageUrl,
      hasPublicPageConfig: !!event.publicPageConfig
    });

    // Se não tem configuração, criar uma padrão
    if (!event.publicPageConfig) {
      console.log('📝 getPublicPageConfigForPreview - criando configuração padrão');
      const defaultConfig = {
        layout: 'modern',
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937'
        },
        header: {
          title: event.name,
          subtitle: event.description || 'Um evento incrível está chegando!',
          showImage: true,
          imageUrl: event.imageUrl
        },
        content: {
          showDate: true,
          showLocation: true,
          showDescription: true,
          showOrganizer: true,
          customText: ''
        },
        registration: {
          showForm: true,
          buttonText: 'Inscrever-se',
          formTitle: 'Faça sua inscrição',
          formDescription: 'Preencha os dados abaixo para participar do evento'
        },
        footer: {
          showSocialLinks: false,
          customText: '© 2024 Sistema de Eventos'
        }
      };

      console.log('✅ getPublicPageConfigForPreview - configuração padrão criada:', defaultConfig);
      return defaultConfig;
    }

    console.log('✅ getPublicPageConfigForPreview - retornando configuração existente:', event.publicPageConfig);
    return event.publicPageConfig;
  }

  // Atualizar configuração do formulário
  static async updateFormConfig(eventId, userId, config) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { formConfig: config }
    });

    return updatedEvent.formConfig;
  }

  // Obter configuração da página pública
  static async getPublicPageConfig(eventId, userId) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId
      },
      select: {
        id: true,
        name: true,
        description: true,
        date: true,
        location: true,
        imageUrl: true,
        publicPageConfig: true
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    // Se não tem configuração, criar uma padrão
    if (!event.publicPageConfig) {
      const defaultConfig = {
        layout: 'modern',
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937'
        },
        header: {
          title: event.name,
          subtitle: event.description || 'Um evento incrível está chegando!',
          showImage: true,
          imageUrl: event.imageUrl
        },
        content: {
          showDate: true,
          showLocation: true,
          showDescription: true,
          showOrganizer: true,
          customText: ''
        },
        registration: {
          showForm: true,
          buttonText: 'Inscrever-se',
          formTitle: 'Faça sua inscrição',
          formDescription: 'Preencha os dados abaixo para participar do evento'
        },
        footer: {
          showSocialLinks: false,
          customText: '© 2024 Sistema de Eventos'
        }
      };

      // Salvar configuração padrão
      await prisma.event.update({
        where: { id: eventId },
        data: { publicPageConfig: defaultConfig }
      });

      return defaultConfig;
    }

    return event.publicPageConfig;
  }

  // Atualizar configuração da página pública
  static async updatePublicPageConfig(eventId, userId, config) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { publicPageConfig: config }
    });

    return updatedEvent.publicPageConfig;
  }
}

module.exports = EventService; 