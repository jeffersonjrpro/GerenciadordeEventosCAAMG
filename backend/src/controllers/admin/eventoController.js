const prisma = require('../../config/database');

// Listar todos os eventos do sistema (com informações da empresa)
exports.listAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', empresaId = '' } = req.query;
    const offset = (page - 1) * limit;

    // Construir filtros
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (empresaId) {
      where.empresaId = empresaId;
    }

    // Buscar eventos com informações da empresa e criador
    const events = await prisma.event.findMany({
      where,
      include: {
        empresa: {
          select: {
            id: true,
            nome: true,
            emailContato: true,
            status: true
          }
        },
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
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: parseInt(limit)
    });

    // Contar total de eventos
    const total = await prisma.event.count({ where });

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar evento específico
exports.getEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        empresa: {
          select: {
            id: true,
            nome: true,
            emailContato: true,
            status: true
          }
        },
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
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar evento
exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updateData = req.body;

    // Verificar se evento existe
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    // Atualizar evento
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        empresa: {
          select: {
            id: true,
            nome: true,
            emailContato: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({ 
      message: 'Evento atualizado com sucesso',
      event: updatedEvent 
    });
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir evento
exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verificar se evento existe
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            guests: true,
            checkIns: true
          }
        }
      }
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    // Excluir evento (cascade irá excluir convidados, check-ins, etc.)
    await prisma.event.delete({
      where: { id: eventId }
    });

    res.json({ 
      message: 'Evento excluído com sucesso',
      deletedEvent: {
        id: existingEvent.id,
        name: existingEvent.name,
        guestsCount: existingEvent._count.guests,
        checkInsCount: existingEvent._count.checkIns
      }
    });
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Estatísticas de eventos
exports.getEventStats = async (req, res) => {
  try {
    const [
      totalEvents,
      activeEvents,
      publicEvents,
      eventsThisMonth,
      eventsByStatus
    ] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { isActive: true } }),
      prisma.event.count({ where: { isPublic: true } }),
      prisma.event.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.event.groupBy({
        by: ['isActive'],
        _count: true
      })
    ]);

    res.json({
      totalEvents,
      activeEvents,
      publicEvents,
      eventsThisMonth,
      eventsByStatus
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}; 