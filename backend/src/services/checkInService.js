const prisma = require('../config/database');

class CheckInService {
  // Realizar check-in
  static async performCheckIn(qrCode, userId) {
    // Buscar convidado por QR Code
    const guest = await prisma.guest.findUnique({
      where: { qrCode },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            location: true,
            isActive: true,
            userId: true
          } 
        },
        checkIns: true
      }
    });

    if (!guest) {
      throw new Error('QR Code inválido');
    }

    // Verificar se o evento pertence ao usuário
    if (guest.event.userId !== userId) {
      throw new Error('Você não tem permissão para fazer check-in neste evento');
    }

    // Verificar se o evento está ativo
    if (!guest.event.isActive) {
      throw new Error('Evento não está ativo');
    }

    // Verificar se já foi feito check-in
    if (guest.checkIns.length > 0) {
      throw new Error('Check-in já foi realizado para este convidado');
    }

    // Verificar se o convidado confirmou presença
    if (!guest.confirmed) {
      throw new Error('Convidado não confirmou presença');
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
            phone: true
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

    return checkIn;
  }

  // Buscar check-in por ID
  static async getCheckInById(checkInId, userId) {
    const checkIn = await prisma.checkIn.findFirst({
      where: {
        id: checkInId,
        event: {
          userId
        }
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            confirmed: true
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

    if (!checkIn) {
      throw new Error('Check-in não encontrado');
    }

    return checkIn;
  }

  // Listar check-ins de um evento
  static async getEventCheckIns(eventId, userId, filters = {}) {
    // Verificar se o evento pertence ao usuário
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    const { page = 1, limit = 50, search = '' } = filters;
    const skip = (page - 1) * limit;

    const where = {
      eventId,
      ...(search && {
        guest: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
          ]
        }
      })
    };

    const [checkIns, total] = await Promise.all([
      prisma.checkIn.findMany({
        where,
        include: {
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              confirmed: true
            }
          }
        },
        orderBy: {
          checkedInAt: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.checkIn.count({ where })
    ]);

    return {
      checkIns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Cancelar check-in
  static async cancelCheckIn(checkInId, userId) {
    // Verificar se o check-in existe e pertence ao evento do usuário
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        id: checkInId,
        event: {
          userId
        }
      }
    });

    if (!existingCheckIn) {
      throw new Error('Check-in não encontrado');
    }

    // Deletar check-in
    await prisma.checkIn.delete({
      where: { id: checkInId }
    });

    return { message: 'Check-in cancelado com sucesso' };
  }

  // Obter estatísticas de check-in do evento
  static async getEventCheckInStats(eventId, userId) {
    // Verificar se o evento pertence ao usuário
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId
      },
      include: {
        guests: {
          include: {
            checkIns: true
          }
        }
      }
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    const totalGuests = event.guests.length;
    const confirmedGuests = event.guests.filter(guest => guest.confirmed).length;
    const checkedInGuests = event.guests.filter(guest => guest.checkIns.length > 0).length;
    const pendingCheckIns = confirmedGuests - checkedInGuests;

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
        pendingCheckIns,
        checkInRate: confirmedGuests > 0 ? (checkedInGuests / confirmedGuests * 100).toFixed(1) : 0
      }
    };
  }

  // Buscar check-in por QR Code (para verificação)
  static async getCheckInByQRCode(qrCode, userId) {
    const guest = await prisma.guest.findUnique({
      where: { qrCode },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            location: true,
            isActive: true,
            userId: true
          }
        },
        checkIns: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                date: true,
                location: true
              }
            }
          }
        }
      }
    });

    if (!guest) {
      throw new Error('QR Code inválido');
    }

    // Verificar se o evento pertence ao usuário
    if (guest.event.userId !== userId) {
      throw new Error('Você não tem permissão para acessar este evento');
    }

    return {
      guest: {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        confirmed: guest.confirmed
      },
      event: guest.event,
      checkIn: guest.checkIns[0] || null
    };
  }
}

module.exports = CheckInService; 