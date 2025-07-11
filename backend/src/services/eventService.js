const prisma = require('../config/database');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const OrganizerService = require('./organizerService');

class EventService {
  // Gerar slug personalizado baseado no nome do evento
  static generateCustomSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim('-'); // Remove hífens no início e fim
  }

  // Verificar se um slug já existe
  static async isSlugAvailable(slug, excludeEventId = null) {
    const where = { customSlug: slug };
    if (excludeEventId) {
      where.id = { not: excludeEventId };
    }
    
    const existingEvent = await prisma.event.findFirst({ where });
    return !existingEvent;
  }

  // Gerar slug único
  static async generateUniqueSlug(name, excludeEventId = null) {
    let baseSlug = this.generateCustomSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (!(await this.isSlugAvailable(slug, excludeEventId))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // Criar novo evento
  static async createEvent(userId, eventData) {
    const { name, description, date, location, maxGuests, customFields, customSlug } = eventData;

    // Buscar o usuário para pegar o empresaId
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Gerar slug se não foi fornecido
    let finalSlug = customSlug;
    if (!finalSlug) {
      finalSlug = await this.generateUniqueSlug(name);
    } else {
      // Verificar se o slug fornecido está disponível
      if (!(await this.isSlugAvailable(finalSlug))) {
        throw new Error('URL personalizada já está em uso');
      }
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        date: new Date(date),
        location,
        maxGuests: maxGuests ? parseInt(maxGuests) : null,
        customFields: customFields || {},
        customSlug: finalSlug,
        isPublic: true,
        userId, // sempre o usuário logado
        empresaId: user.empresaId // sempre a empresa do usuário logado
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

    // Adicionar o ADMIN da empresa como OWNER, se não for o próprio usuário
    const admin = await prisma.user.findFirst({ where: { empresaId: user.empresaId, role: 'ADMIN' } });
    if (admin && admin.id !== userId) {
      await OrganizerService.addOrganizer(event.id, admin.id, 'OWNER');
    }

    return event;
  }

  // Buscar evento por ID
  static async getEventById(eventId, userId = null) {
    console.log('🔍 getEventById - Iniciando com eventId:', eventId, 'userId:', userId);
    
    // Se userId fornecido, verificar se o usuário tem acesso ao evento
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      console.log('🔍 getEventById - Usuário encontrado:', {
        id: user.id,
        name: user.name,
        role: user.role,
        nivel: user.nivel,
        empresaId: user.empresaId
      });
      
      // Todos os usuários (ADMIN, ORGANIZER, CHECKIN) podem ver todos os eventos da empresa
      if (user.empresaId) {
        // Verificar se o evento pertence à empresa do usuário
        const event = await prisma.event.findFirst({ 
          where: { 
            id: eventId, 
            empresaId: user.empresaId 
          } 
        });
        if (!event) {
          console.log('❌ getEventById - Evento não encontrado ou não pertence à empresa');
          throw new Error('Sem permissão para acessar este evento');
        }
        console.log('✅ getEventById - Evento encontrado e usuário tem permissão');
      } else {
        // Se não tem empresaId, verificar se é criador do evento
        const event = await prisma.event.findFirst({ 
          where: { 
            id: eventId, 
            userId 
          } 
        });
        if (!event) {
          console.log('❌ getEventById - Evento não encontrado ou usuário não é criador');
          throw new Error('Sem permissão para acessar este evento');
        }
        console.log('✅ getEventById - Evento encontrado e usuário é criador');
      }
    }

    console.log('🔍 getEventById - Buscando evento completo...');
    const event = await prisma.event.findFirst({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        description: true,
        date: true,
        location: true,
        maxGuests: true,
        isActive: true,
        isPublic: true,
        customFields: true,
        imageUrl: true,
        customSlug: true,
        userId: true,
        empresaId: true,
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
      console.log('❌ getEventById - Evento não encontrado');
      throw new Error('Evento não encontrado');
    }

    console.log('✅ getEventById - Evento retornado com sucesso:', event.name);
    return event;
  }

  // Listar eventos do usuário (incluindo onde é organizador)
  static async getUserEvents(userId, filters = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = filters;
    const skip = (page - 1) * limit;

    // Buscar usuário para pegar o empresaId
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // Todos os usuários da mesma empresa podem ver todos os eventos da empresa
    let where = {};

    if (user.empresaId) {
        where.empresaId = user.empresaId;
      } else {
      where.userId = userId;
    }

    // Filtros adicionais
    if (search) {
      const searchCondition = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } }
        ]
      };
      where = { ...where, ...searchCondition };
    }
    if (status === 'active') {
      where.isActive = true;
    }
    if (status === 'inactive') {
      where.isActive = false;
    }

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
    
    // Buscar usuário para verificar permissões
    const user = await prisma.user.findUnique({ where: { id: userId } });
    console.log('EventService.updateEvent - Usuário:', {
      id: user.id,
      name: user.name,
      role: user.role,
      nivel: user.nivel,
      empresaId: user.empresaId
    });
    
    // Verificar se o evento existe e usuário tem permissão
    let existingEvent;
    if (user.empresaId) {
      // Todos os usuários da empresa podem editar eventos da empresa
      existingEvent = await prisma.event.findFirst({
        where: {
          id: eventId,
          empresaId: user.empresaId
        }
      });
    } else {
      // Se não tem empresaId, verificar se é criador do evento
      existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId
      }
    });
    }

    if (!existingEvent) {
      console.log('EventService.updateEvent - Evento não encontrado ou sem permissão');
      throw new Error('Evento não encontrado');
    }

    console.log('EventService.updateEvent - Evento encontrado:', existingEvent.id);

    const { name, description, date, location, maxGuests, isActive, isPublic, customFields, imageUrl, customSlug } = updateData;

    console.log('EventService.updateEvent - Dados para atualização:', {
      name, description, date, location, maxGuests, isActive, isPublic, customFields, imageUrl, customSlug
    });

    // Validar customSlug se foi fornecido
    let finalSlug = existingEvent.customSlug;
    console.log('🔍 updateEvent - customSlug recebido:', customSlug);
    console.log('🔍 updateEvent - existingEvent.customSlug:', existingEvent.customSlug);
    
    if (customSlug !== undefined) {
      // Se customSlug foi enviado (mesmo que vazio), processar
      if (customSlug && customSlug.trim()) {
        // Se tem valor, verificar se está disponível
        console.log('🔍 updateEvent - customSlug tem valor, verificando disponibilidade');
        if (!(await this.isSlugAvailable(customSlug.trim(), eventId))) {
        throw new Error('URL personalizada já está em uso');
      }
        finalSlug = customSlug.trim();
        console.log('🔍 updateEvent - finalSlug definido como:', finalSlug);
      } else {
        // Se está vazio, gerar slug automático baseado no nome
        console.log('🔍 updateEvent - customSlug vazio, gerando slug automático');
        if (name) {
          finalSlug = await this.generateUniqueSlug(name, eventId);
          console.log('🔍 updateEvent - slug automático gerado:', finalSlug);
        } else {
          // Se não tem nome, manter o slug atual
          finalSlug = existingEvent.customSlug;
          console.log('🔍 updateEvent - mantendo slug atual:', finalSlug);
        }
      }
    }
    
    console.log('🔍 updateEvent - finalSlug final:', finalSlug);

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
        ...(imageUrl && { imageUrl: imageUrl || null }),
        ...(finalSlug !== existingEvent.customSlug && { customSlug: finalSlug })
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
    console.log('EventService.deleteEvent - Iniciando exclusão');
    console.log('EventService.deleteEvent - eventId:', eventId);
    console.log('EventService.deleteEvent - userId:', userId);
    
    // Buscar usuário para verificar permissões
    const user = await prisma.user.findUnique({ where: { id: userId } });
    console.log('EventService.deleteEvent - Usuário:', {
      id: user.id,
      name: user.name,
      role: user.role,
      nivel: user.nivel,
      empresaId: user.empresaId
    });
    
    // Verificar se o evento existe e usuário tem permissão
    let existingEvent;
    if (user.empresaId) {
      // Todos os usuários da empresa podem deletar eventos da empresa
      existingEvent = await prisma.event.findFirst({
        where: {
          id: eventId,
          empresaId: user.empresaId
        },
        include: {
          guests: true,
          checkIns: true
        }
      });
    } else {
      // Se não tem empresaId, verificar se é criador do evento
      existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId
      },
      include: {
        guests: true,
        checkIns: true
      }
    });
    }

    if (!existingEvent) {
      console.log('EventService.deleteEvent - Evento não encontrado ou sem permissão');
      throw new Error('Evento não encontrado');
    }

    console.log('EventService.deleteEvent - Evento encontrado, deletando...');

    // Deletar evento (cascade irá deletar convidados e check-ins)
    await prisma.event.delete({
      where: { id: eventId }
    });

    console.log('EventService.deleteEvent - Evento deletado com sucesso');
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
    // Buscar usuário para pegar o empresaId
    const user = await prisma.user.findUnique({ where: { id: userId } });
    let where = {};

    // Todos os usuários da mesma empresa podem ver todos os eventos da empresa
    if (user.empresaId) {
      where.empresaId = user.empresaId;
    } else {
      where.userId = userId;
    }

    const now = new Date();
    
    const [events, totalGuests, totalConfirmed, totalCheckedIn, eventosAtivos, eventosEmAndamento, eventosConcluidos] = await Promise.all([
      prisma.event.count({ where }),
      prisma.guest.count({
        where: {
          event: where
        }
      }),
      prisma.guest.count({
        where: {
          event: where,
          confirmed: true
        }
      }),
      prisma.checkIn.count({
        where: {
          event: where
        }
      }),
      // Eventos ativos
      prisma.event.count({ 
        where: { ...where, isActive: true } 
      }),
      // Eventos em andamento (hoje)
      prisma.event.count({ 
        where: { 
          ...where, 
          isActive: true,
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          }
        } 
      }),
      // Eventos concluídos (data passou e ativos)
      prisma.event.count({ 
        where: { 
          ...where, 
          isActive: true,
          date: { lt: now }
        } 
      })
    ]);

    return {
      totalEvents: events,
      eventosAtivos,
      eventosEmAndamento,
      eventosConcluidos,
      totalGuests,
      totalConfirmed,
      totalCheckedIn,
      averageConfirmationRate: totalGuests > 0 ? (totalConfirmed / totalGuests * 100).toFixed(1) : 0,
      averageAttendanceRate: totalConfirmed > 0 ? (totalCheckedIn / totalConfirmed * 100).toFixed(1) : 0
    };
  }

  // Buscar estatísticas de eventos para dashboard
  static async getEventStatistics(userId, empresaId) {
    try {
      // Buscar usuário para verificar permissões
      const user = await prisma.user.findUnique({ where: { id: userId } });
      let where = {};

      // Todos os usuários da mesma empresa podem ver todos os eventos da empresa
      if (user.empresaId) {
        where.empresaId = user.empresaId;
        } else {
        where.userId = userId;
      }

      const now = new Date();
      
      const [
        total,
        ativos,
        inativos,
        concluidos,
        emAndamento,
        futuros
      ] = await Promise.all([
        // Total de eventos
        prisma.event.count({ where }),
        
        // Eventos ativos
        prisma.event.count({ 
          where: { ...where, isActive: true } 
        }),
        
        // Eventos inativos
        prisma.event.count({ 
          where: { ...where, isActive: false } 
        }),
        
        // Eventos concluídos (data passou e ativos)
        prisma.event.count({ 
          where: { 
            ...where, 
            isActive: true,
            date: { lt: now }
          } 
        }),
        
        // Eventos em andamento (hoje)
        prisma.event.count({ 
          where: { 
            ...where, 
            isActive: true,
            date: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
            }
          } 
        }),
        
        // Eventos futuros
        prisma.event.count({ 
          where: { 
            ...where, 
            isActive: true,
            date: { gt: now }
          } 
        })
      ]);

      return {
        total,
        ativos,
        inativos,
        concluidos,
        emAndamento,
        futuros
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de eventos:', error);
      throw error;
    }
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
        customSlug: true,
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
        customSlug: true,
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
    console.log('🔍 getFormConfig - eventId:', eventId, 'userId:', userId);
    
    // Primeiro, verificar se o usuário tem acesso ao evento
    const user = await prisma.user.findUnique({ where: { id: userId } });
    console.log('🔍 getFormConfig - user:', user);
    
    let event;
    
    if (user.role === 'ORGANIZER') {
      console.log('🔍 getFormConfig - user é ORGANIZER');
      if (user.trabalharTodosEventos) {
        console.log('🔍 getFormConfig - trabalharTodosEventos = true, empresaId:', user.empresaId);
        // Permite se o evento for da mesma empresa
        event = await prisma.event.findFirst({ 
          where: { 
            id: eventId, 
            empresaId: user.empresaId 
          },
          select: {
            id: true,
            formConfig: true,
            customFields: true
          }
        });
      } else if (user.eventosIds && user.eventosIds.includes(eventId)) {
        console.log('🔍 getFormConfig - evento na lista eventosIds');
        // Permite se o evento está na lista de eventosIds
        event = await prisma.event.findFirst({ 
          where: { id: eventId },
          select: {
            id: true,
            formConfig: true,
            customFields: true
          }
        });
      } else {
        console.log('❌ getFormConfig - sem permissão para ORGANIZER');
        throw new Error('Sem permissão para acessar este evento');
      }
    } else {
      console.log('🔍 getFormConfig - user não é ORGANIZER, verificando criador/organizador');
      // Checagem padrão: criador ou organizador relacional
      const isCreator = await prisma.event.findFirst({ 
        where: { id: eventId, userId },
        select: {
          id: true,
          formConfig: true,
          customFields: true
        }
      });
      
      if (isCreator) {
        console.log('✅ getFormConfig - user é criador do evento');
        event = isCreator;
      } else {
        console.log('🔍 getFormConfig - verificando se é organizador');
        // Verificar se é organizador
        const isOrganizer = await OrganizerService.isUserOrganizer(eventId, userId);
        if (isOrganizer) {
          console.log('✅ getFormConfig - user é organizador do evento');
          event = await prisma.event.findFirst({ 
            where: { id: eventId },
            select: {
              id: true,
              formConfig: true,
              customFields: true
            }
          });
        } else {
          console.log('❌ getFormConfig - sem permissão');
          throw new Error('Sem permissão para acessar este evento');
        }
      }
    }

    if (!event) {
      console.log('❌ getFormConfig - evento não encontrado');
      throw new Error('Evento não encontrado');
    }

    console.log('✅ getFormConfig - evento encontrado, formConfig:', event.formConfig);

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

      // Salvar a configuração padrão no banco de dados
      await prisma.event.update({
        where: { id: eventId },
        data: { formConfig: defaultConfig }
      });

      return defaultConfig;
    }

    console.log('✅ getFormConfig - retornando configuração existente');
    return event.formConfig;
  }

  // Obter configuração do formulário público (sem autenticação)
  static async getPublicFormConfig(eventId) {
    console.log('🔍 getPublicFormConfig - eventId:', eventId);
    
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
      console.log('❌ getPublicFormConfig - evento não encontrado ou não está disponível publicamente');
      throw new Error('Evento não encontrado ou não está disponível publicamente');
    }

    console.log('✅ getPublicFormConfig - evento encontrado, formConfig:', event.formConfig);

    // Se não tem configuração, criar uma padrão
    if (!event.formConfig) {
      console.log('🔍 getPublicFormConfig - criando configuração padrão');
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

      // Salvar a configuração padrão no banco de dados
      console.log('🔍 getPublicFormConfig - salvando configuração padrão no banco');
      await prisma.event.update({
        where: { id: eventId },
        data: { formConfig: defaultConfig }
      });

      return defaultConfig;
    }

    console.log('✅ getPublicFormConfig - retornando configuração existente');
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

      // Salvar a configuração padrão no banco de dados
      await prisma.event.update({
        where: { id: eventId },
        data: { formConfig: defaultConfig }
      });

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
        publicPageConfig: true,
        palestrantes: {
          where: { ativo: true },
          orderBy: { ordem: 'asc' },
          select: {
            id: true,
            nome: true,
            cargo: true,
            descricao: true,
            imagem: true,
            ordem: true,
            ativo: true
          }
        }
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    // Se não tem configuração, criar uma padrão
    if (!event.publicPageConfig) {
      const defaultConfig = {
        tema: 'modern',
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937',
          buttonColor: '#3B82F6'
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
          formDescription: 'Preencha os dados abaixo para participar do evento',
          cardTitle: 'Ingressos'
        },
        footer: {
          showSocialLinks: false,
          customText: '© 2024 Sistema de Eventos'
        },
        palestrantes: event.palestrantes || []
      };

      return defaultConfig;
    }

    console.log('✅ getPublicPageConfigForPreview - retornando configuração existente:', event.publicPageConfig);
    
    // Garantir que palestrantes seja sempre um array
    if (event.publicPageConfig.palestrantes && !Array.isArray(event.publicPageConfig.palestrantes)) {
      console.log('🔍 getPublicPageConfigForPreview - convertendo palestrantes de objeto para array');
      // Se palestrantes é um objeto, converter para array
      const palestrantesArray = Object.values(event.publicPageConfig.palestrantes);
      event.publicPageConfig.palestrantes = palestrantesArray;
    }
    
    // Sempre carregar palestrantes do banco de dados para garantir que estão atualizados
    event.publicPageConfig.palestrantes = event.palestrantes || [];
    
    return event.publicPageConfig;
  }

  // Atualizar configuração do formulário
  static async updateFormConfig(eventId, userId, config) {
    console.log('🔍 updateFormConfig - eventId:', eventId, 'userId:', userId);
    console.log('🔍 updateFormConfig - config recebido:', JSON.stringify(config, null, 2));
    
    // Primeiro, verificar se o usuário tem acesso ao evento
    const user = await prisma.user.findUnique({ where: { id: userId } });
    console.log('🔍 updateFormConfig - user:', user);
    
    let event;
    
    if (user.role === 'ORGANIZER') {
      console.log('🔍 updateFormConfig - user é ORGANIZER');
      if (user.trabalharTodosEventos) {
        console.log('🔍 updateFormConfig - trabalharTodosEventos = true, empresaId:', user.empresaId);
        // Permite se o evento for da mesma empresa
        event = await prisma.event.findFirst({ 
          where: { 
            id: eventId, 
            empresaId: user.empresaId 
          }
        });
      } else if (user.eventosIds && user.eventosIds.includes(eventId)) {
        console.log('🔍 updateFormConfig - evento na lista eventosIds');
        // Permite se o evento está na lista de eventosIds
        event = await prisma.event.findFirst({ 
          where: { id: eventId }
        });
      } else {
        console.log('❌ updateFormConfig - sem permissão para ORGANIZER');
        throw new Error('Sem permissão para acessar este evento');
      }
    } else {
      console.log('🔍 updateFormConfig - user não é ORGANIZER, verificando criador/organizador');
      // Checagem padrão: criador ou organizador relacional
      const isCreator = await prisma.event.findFirst({ 
        where: { id: eventId, userId }
      });
      
      if (isCreator) {
        console.log('✅ updateFormConfig - user é criador do evento');
        event = isCreator;
      } else {
        console.log('🔍 updateFormConfig - verificando se é organizador');
        // Verificar se é organizador
        const isOrganizer = await OrganizerService.isUserOrganizer(eventId, userId);
        if (isOrganizer) {
          console.log('✅ updateFormConfig - user é organizador do evento');
          event = await prisma.event.findFirst({ 
            where: { id: eventId }
          });
        } else {
          console.log('❌ updateFormConfig - sem permissão');
          throw new Error('Sem permissão para acessar este evento');
        }
      }
    }

    if (!event) {
      console.log('❌ updateFormConfig - evento não encontrado');
      throw new Error('Evento não encontrado');
    }

    console.log('✅ updateFormConfig - evento encontrado, fazendo update');
    console.log('🔍 updateFormConfig - config.fields length:', config.fields?.length);

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { formConfig: config }
    });

    console.log('✅ updateFormConfig - evento atualizado, formConfig salvo:', JSON.stringify(updatedEvent.formConfig, null, 2));

    return updatedEvent.formConfig;
  }

  // Obter configuração da página pública
  static async getPublicPageConfig(eventId, userId) {
    console.log('🔍 getPublicPageConfig - Iniciando busca');
    console.log('🔍 getPublicPageConfig - eventId:', eventId);
    console.log('🔍 getPublicPageConfig - userId:', userId);
    
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
        publicPageConfig: true,
        palestrantes: {
          where: { ativo: true },
          orderBy: { ordem: 'asc' },
          select: {
            id: true,
            nome: true,
            cargo: true,
            descricao: true,
            imagem: true,
            ordem: true,
            ativo: true
          }
        }
      }
    });

    if (!event) {
      console.log('❌ getPublicPageConfig - evento não encontrado');
      throw new Error('Evento não encontrado');
    }

    console.log('✅ getPublicPageConfig - evento encontrado');
    console.log('🔍 getPublicPageConfig - event.publicPageConfig existe?', !!event.publicPageConfig);
    console.log('🔍 getPublicPageConfig - palestrantes encontrados:', event.palestrantes?.length || 0);

    // Se não tem configuração, criar uma padrão
    if (!event.publicPageConfig) {
      console.log('🔍 getPublicPageConfig - criando configuração padrão');
      const defaultConfig = {
        tema: 'modern',
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937',
          buttonColor: '#3B82F6'
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
        },
        palestrantes: event.palestrantes || []
      };

      console.log('🔍 getPublicPageConfig - defaultConfig.tema:', defaultConfig.tema);
      console.log('🔍 getPublicPageConfig - palestrantes incluídos:', event.palestrantes?.length || 0);

      // Salvar configuração padrão
      await prisma.event.update({
        where: { id: eventId },
        data: { publicPageConfig: defaultConfig }
      });

      console.log('✅ getPublicPageConfig - configuração padrão salva');
      return defaultConfig;
    }

    console.log('✅ getPublicPageConfig - retornando configuração existente');
    console.log('🔍 getPublicPageConfig - event.publicPageConfig.tema:', event.publicPageConfig.tema);
    
    // Garantir que palestrantes seja sempre um array
    if (event.publicPageConfig.palestrantes && !Array.isArray(event.publicPageConfig.palestrantes)) {
      console.log('🔍 getPublicPageConfig - convertendo palestrantes de objeto para array');
      // Se palestrantes é um objeto, converter para array
      const palestrantesArray = Object.values(event.publicPageConfig.palestrantes);
      event.publicPageConfig.palestrantes = palestrantesArray;
    }
    
    // Sempre carregar palestrantes do banco de dados para garantir que estão atualizados
    event.publicPageConfig.palestrantes = event.palestrantes || [];

    return event.publicPageConfig;
  }

  // Atualizar configuração da página pública
  static async updatePublicPageConfig(eventId, userId, config) {
    console.log('🔍 updatePublicPageConfig - Iniciando atualização');
    console.log('🔍 updatePublicPageConfig - eventId:', eventId);
    console.log('🔍 updatePublicPageConfig - userId:', userId);
    console.log('🔍 updatePublicPageConfig - config.layout:', config.layout);
    console.log('🔍 updatePublicPageConfig - config completo:', JSON.stringify(config, null, 2));
    
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId
      }
    });

    if (!event) {
      console.log('❌ updatePublicPageConfig - evento não encontrado');
      throw new Error('Evento não encontrado');
    }

    console.log('✅ updatePublicPageConfig - evento encontrado, fazendo update');

    // Garantir que palestrantes seja sempre um array
    if (config.palestrantes && !Array.isArray(config.palestrantes)) {
      console.log('🔍 updatePublicPageConfig - convertendo palestrantes de objeto para array');
      // Se palestrantes é um objeto, converter para array
      const palestrantesArray = Object.values(config.palestrantes);
      config.palestrantes = palestrantesArray;
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { publicPageConfig: config }
    });

    console.log('✅ updatePublicPageConfig - evento atualizado');
    console.log('✅ updatePublicPageConfig - publicPageConfig salvo:', JSON.stringify(updatedEvent.publicPageConfig, null, 2));

    return updatedEvent.publicPageConfig;
  }

  // Buscar evento público por slug
  static async getPublicEventBySlug(slug) {
    const event = await prisma.event.findFirst({
      where: {
        customSlug: slug,
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
        customSlug: true,
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

  // Obter evento para preview por slug (sem restrições de isActive e isPublic)
  static async getEventForPreviewBySlug(slug) {
    const event = await prisma.event.findFirst({
      where: {
        customSlug: slug
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
        customSlug: true,
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
}

module.exports = EventService; 