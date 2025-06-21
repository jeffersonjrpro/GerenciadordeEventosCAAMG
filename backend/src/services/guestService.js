const { prisma } = require('../config/database');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const EmailService = require('./emailService');

class GuestService {
  // Criar convidado
  static async createGuest(eventId, userId, guestData) {
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

    // Verificar se o evento está cheio
    if (event.maxGuests) {
      const guestCount = await prisma.guest.count({
        where: { eventId }
      });

      if (guestCount >= event.maxGuests) {
        throw new Error('Evento está com capacidade máxima');
      }
    }

    const { name, email, phone } = guestData;

    // Gerar QR Code único
    const qrCodeData = `${eventId}-${uuidv4()}`;

    const guest = await prisma.guest.create({
      data: {
        name,
        email,
        phone,
        qrCode: qrCodeData,
        eventId
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            location: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    return guest;
  }

  // Criar múltiplos convidados
  static async createMultipleGuests(eventId, userId, guestsData) {
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

    // Verificar se há espaço suficiente
    if (event.maxGuests) {
      const currentGuestCount = await prisma.guest.count({
        where: { eventId }
      });

      if (currentGuestCount + guestsData.length > event.maxGuests) {
        throw new Error('Não há espaço suficiente para todos os convidados');
      }
    }

    const guests = [];

    for (const guestData of guestsData) {
      const { name, email, phone } = guestData;
      const qrCodeData = `${eventId}-${uuidv4()}`;

      const guest = await prisma.guest.create({
        data: {
          name,
          email,
          phone,
          qrCode: qrCodeData,
          eventId
        }
      });

      guests.push(guest);
    }

    return guests;
  }

  // Buscar convidado por ID
  static async getGuestById(guestId, eventId, userId) {
    const guest = await prisma.guest.findFirst({
      where: {
        id: guestId,
        eventId,
        event: {
          userId
        }
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            location: true
          }
        },
        checkIns: true
      }
    });

    if (!guest) {
      throw new Error('Convidado não encontrado');
    }

    return guest;
  }

  // Listar convidados de um evento
  static async getEventGuests(eventId, userId, filters = {}) {
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

    const { page = 1, limit = 50, search = '', status = 'all' } = filters;
    const skip = (page - 1) * limit;

    const where = {
      eventId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(status === 'confirmed' && { confirmed: true }),
      ...(status === 'pending' && { confirmed: false }),
      ...(status === 'checked-in' && {
        checkIns: {
          some: {}
        }
      })
    };

    const [guests, total] = await Promise.all([
      prisma.guest.findMany({
        where,
        include: {
          checkIns: {
            select: {
              id: true,
              checkedInAt: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.guest.count({ where })
    ]);

    return {
      guests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Atualizar convidado
  static async updateGuest(guestId, eventId, userId, updateData) {
    // Verificar se o convidado existe e pertence ao evento do usuário
    const existingGuest = await prisma.guest.findFirst({
      where: {
        id: guestId,
        eventId,
        event: {
          userId
        }
      }
    });

    if (!existingGuest) {
      throw new Error('Convidado não encontrado');
    }

    const { name, email, phone } = updateData;

    const guest = await prisma.guest.update({
      where: { id: guestId },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone })
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            location: true
          }
        },
        checkIns: true
      }
    });

    return guest;
  }

  // Deletar convidado
  static async deleteGuest(guestId, eventId, userId) {
    // Verificar se o convidado existe e pertence ao evento do usuário
    const existingGuest = await prisma.guest.findFirst({
      where: {
        id: guestId,
        eventId,
        event: {
          userId
        }
      }
    });

    if (!existingGuest) {
      throw new Error('Convidado não encontrado');
    }

    // Deletar convidado (cascade irá deletar check-ins)
    await prisma.guest.delete({
      where: { id: guestId }
    });

    return { message: 'Convidado deletado com sucesso' };
  }

  // Buscar convidado por QR Code
  static async getGuestByQRCode(qrCode) {
    const guest = await prisma.guest.findUnique({
      where: { qrCode },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            location: true,
            isActive: true
          }
        },
        checkIns: true
      }
    });

    if (!guest) {
      throw new Error('QR Code inválido');
    }

    return guest;
  }

  // Confirmar presença (RSVP)
  static async confirmPresence(qrCode, guestData) {
    const guest = await prisma.guest.findUnique({
      where: { qrCode },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            location: true,
            isActive: true
          }
        }
      }
    });

    if (!guest) {
      throw new Error('QR Code inválido');
    }

    if (!guest.event.isActive) {
      throw new Error('Evento não está ativo');
    }

    if (guest.confirmed) {
      throw new Error('Presença já foi confirmada');
    }

    const { name, email, phone } = guestData;

    const updatedGuest = await prisma.guest.update({
      where: { id: guest.id },
      data: {
        name: name || guest.name,
        email: email || guest.email,
        phone: phone || guest.phone,
        confirmed: true
      },
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
    });

    return updatedGuest;
  }

  // Gerar QR Code como imagem
  static async generateQRCodeImage(qrCodeData) {
    try {
      const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return qrCodeImage;
    } catch (error) {
      throw new Error('Erro ao gerar QR Code');
    }
  }

  // Enviar convite por email
  static async sendInvite(guestId, eventId, userId) {
    const guest = await this.getGuestById(guestId, eventId, userId);

    if (!guest.email) {
      throw new Error('Convidado não possui email cadastrado');
    }

    if (guest.confirmed) {
      throw new Error('Convidado já confirmou presença');
    }

    const inviteLink = `${process.env.FRONTEND_URL}/rsvp/${guest.qrCode}`;
    const qrCodeImage = await this.generateQRCodeImage(guest.qrCode);

    const emailData = {
      to: guest.email,
      subject: `Convite para ${guest.event.name}`,
      template: 'invite',
      data: {
        guestName: guest.name,
        eventName: guest.event.name,
        eventDate: guest.event.date,
        eventLocation: guest.event.location,
        inviteLink,
        qrCodeImage
      }
    };

    await EmailService.sendEmail(emailData);

    return { message: 'Convite enviado com sucesso' };
  }

  // Enviar convites em lote
  static async sendBulkInvites(eventId, userId, guestIds = []) {
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

    const where = {
      eventId,
      confirmed: false,
      email: {
        not: null
      }
    };

    if (guestIds.length > 0) {
      where.id = {
        in: guestIds
      };
    }

    const guests = await prisma.guest.findMany({
      where,
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
    });

    if (guests.length === 0) {
      throw new Error('Nenhum convidado encontrado para enviar convite');
    }

    const results = [];

    for (const guest of guests) {
      try {
        const inviteLink = `${process.env.FRONTEND_URL}/rsvp/${guest.qrCode}`;
        const qrCodeImage = await this.generateQRCodeImage(guest.qrCode);

        const emailData = {
          to: guest.email,
          subject: `Convite para ${guest.event.name}`,
          template: 'invite',
          data: {
            guestName: guest.name,
            eventName: guest.event.name,
            eventDate: guest.event.date,
            eventLocation: guest.event.location,
            inviteLink,
            qrCodeImage
          }
        };

        await EmailService.sendEmail(emailData);
        results.push({ guestId: guest.id, status: 'success' });
      } catch (error) {
        results.push({ guestId: guest.id, status: 'error', error: error.message });
      }
    }

    return {
      message: 'Processamento de convites concluído',
      results
    };
  }

  // Exportar lista de convidados
  static async exportGuests(eventId, userId, format = 'csv') {
    const guests = await prisma.guest.findMany({
      where: {
        eventId,
        event: {
          userId
        }
      },
      include: {
        event: {
          select: {
            name: true,
            date: true,
            location: true
          }
        },
        checkIns: {
          select: {
            checkedInAt: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    if (guests.length === 0) {
      throw new Error('Nenhum convidado encontrado');
    }

    const event = guests[0].event;

    if (format === 'csv') {
      const csvData = [
        ['Nome', 'Email', 'Telefone', 'Confirmado', 'Check-in', 'Data Check-in'],
        ...guests.map(guest => [
          guest.name,
          guest.email || '',
          guest.phone || '',
          guest.confirmed ? 'Sim' : 'Não',
          guest.checkIns.length > 0 ? 'Sim' : 'Não',
          guest.checkIns.length > 0 ? guest.checkIns[0].checkedInAt.toLocaleString('pt-BR') : ''
        ])
      ];

      return {
        filename: `convidados_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`,
        data: csvData.map(row => row.join(',')).join('\n'),
        contentType: 'text/csv'
      };
    }

    throw new Error('Formato de exportação não suportado');
  }
}

module.exports = GuestService; 