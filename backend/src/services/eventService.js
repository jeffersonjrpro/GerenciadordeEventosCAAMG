const { prisma } = require('../config/database');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

class EventService {
  // Criar novo evento
  static async createEvent(userId, eventData) {
    const { name, description, date, location, maxGuests, customFields } = eventData;

    const event = await prisma.event.create({
      data: {
        name,
        description,
        date: new Date(date),
        location,
        maxGuests: maxGuests ? parseInt(maxGuests) : null,
        customFields: customFields || {},
        userId
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

    return event;
  }

  // Buscar evento por ID
  static async getEventById(eventId, userId = null) {
    const where = { id: eventId };
    
    // Se userId fornecido, verificar se o usuário tem acesso ao evento
    if (userId) {
      where.userId = userId;
    }

    const event = await prisma.event.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
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

  // Listar eventos do usuário
  static async getUserEvents(userId, filters = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = filters;
    const skip = (page - 1) * limit;

    const where = {
      userId,
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

    const { name, description, date, location, maxGuests, isActive, isPublic, customFields } = updateData;

    console.log('EventService.updateEvent - Dados para atualização:', {
      name, description, date, location, maxGuests, isActive, isPublic, customFields
    });

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(location && { location }),
        ...(maxGuests !== undefined && { maxGuests: maxGuests ? parseInt(maxGuests) : null }),
        ...(isActive !== undefined && { isActive }),
        ...(isPublic !== undefined && { isPublic }),
        ...(customFields !== undefined && { customFields })
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
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    // Se pausa manual está ativa
    if (event.registrationPaused) {
      return true;
    }

    // Se há data de pausa e ainda não expirou
    if (event.registrationPauseUntil && new Date() < event.registrationPauseUntil) {
      return true;
    }

    return false;
  }
}

module.exports = EventService; 