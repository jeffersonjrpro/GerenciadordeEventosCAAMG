const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const EmailService = require('./emailService');
const prisma = new PrismaClient();

class OrganizerService {
  // Adicionar organizador a um evento
  static async addOrganizer(eventId, userId, role = 'EDITOR') {
    try {
      // Verificar se o usuário já é organizador do evento
      const existingOrganizer = await prisma.eventOrganizer.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId
          }
        }
      });

      if (existingOrganizer) {
        throw new Error('Usuário já é organizador deste evento');
      }

      const organizer = await prisma.eventOrganizer.create({
        data: {
          eventId,
          userId,
          role
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          event: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return organizer;
    } catch (error) {
      throw new Error(`Erro ao adicionar organizador: ${error.message}`);
    }
  }

  // Remover organizador de um evento
  static async removeOrganizer(eventId, userId) {
    try {
      const organizer = await prisma.eventOrganizer.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId
          }
        },
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      });

      if (!organizer) {
        throw new Error('Organizador não encontrado');
      }

      // Verificar se é o último organizador (não permitir remover o último)
      const organizerCount = await prisma.eventOrganizer.count({
        where: { eventId }
      });

      if (organizerCount <= 1) {
        throw new Error('Não é possível remover o último organizador do evento');
      }

      await prisma.eventOrganizer.delete({
        where: {
          eventId_userId: {
            eventId,
            userId
          }
        }
      });

      return organizer;
    } catch (error) {
      throw new Error(`Erro ao remover organizador: ${error.message}`);
    }
  }

  // Atualizar papel do organizador
  static async updateOrganizerRole(eventId, userId, newRole) {
    try {
      const organizer = await prisma.eventOrganizer.update({
        where: {
          eventId_userId: {
            eventId,
            userId
          }
        },
        data: {
          role: newRole
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return organizer;
    } catch (error) {
      throw new Error(`Erro ao atualizar papel do organizador: ${error.message}`);
    }
  }

  // Listar organizadores de um evento
  static async getEventOrganizers(eventId) {
    try {
      const organizers = await prisma.eventOrganizer.findMany({
        where: { eventId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      return organizers;
    } catch (error) {
      throw new Error(`Erro ao buscar organizadores: ${error.message}`);
    }
  }

  // Verificar se usuário é organizador de um evento
  static async isUserOrganizer(eventId, userId) {
    try {
      const organizer = await prisma.eventOrganizer.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId
          }
        }
      });

      return !!organizer;
    } catch (error) {
      return false;
    }
  }

  // Verificar papel do usuário em um evento
  static async getUserRole(eventId, userId) {
    try {
      const organizer = await prisma.eventOrganizer.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId
          }
        }
      });

      return organizer ? organizer.role : null;
    } catch (error) {
      return null;
    }
  }

  // Verificar se usuário tem permissão para uma ação
  static async hasPermission(eventId, userId, requiredRole) {
    try {
      const organizer = await prisma.eventOrganizer.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId
          }
        }
      });

      if (!organizer) {
        return false;
      }

      const roleHierarchy = {
        'OWNER': 3,
        'EDITOR': 2,
        'CHECKIN': 1
      };

      const userRoleLevel = roleHierarchy[organizer.role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      return userRoleLevel >= requiredRoleLevel;
    } catch (error) {
      return false;
    }
  }

  // Enviar convite para organizador
  static async sendOrganizerInvite(eventId, invitedById, email, role = 'EDITOR') {
    try {
      // Verificar se o e-mail já foi convidado
      const existingInvite = await prisma.teamInvite.findFirst({
        where: {
          eventId,
          email,
          status: 'PENDING'
        },
        include: {
          event: {
            select: {
              id: true,
              name: true
            }
          },
          invitedBy: {
            select: {
              name: true
            }
          }
        }
      });

      // Gerar token único
      const token = crypto.randomBytes(32).toString('hex');
      // Definir expiração (48 horas)
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      if (existingInvite) {
        // Atualizar convite existente
        const updatedInvite = await prisma.teamInvite.update({
          where: { id: existingInvite.id },
          data: { token, expiresAt, invitedById, role },
          include: {
            event: {
              select: {
                id: true,
                name: true
              }
            },
            invitedBy: {
              select: {
                name: true
              }
            }
          }
        });
        await EmailService.sendOrganizerInvite(updatedInvite);
        // Retornar flag de reenvio
        return { invite: updatedInvite, resent: true };
      }

      const invite = await prisma.teamInvite.create({
        data: {
          eventId,
          invitedById,
          email,
          token,
          role,
          expiresAt
        },
        include: {
          event: {
            select: {
              id: true,
              name: true
            }
          },
          invitedBy: {
            select: {
              name: true
            }
          }
        }
      });

      // Enviar e-mail
      await EmailService.sendOrganizerInvite(invite);

      return { invite, resent: false };
    } catch (error) {
      throw new Error(`Erro ao enviar convite: ${error.message}`);
    }
  }

  // Validar convite
  static async validateInvite(token) {
    try {
      const invite = await prisma.teamInvite.findUnique({
        where: { token },
        include: {
          event: {
            select: {
              id: true,
              name: true
            }
          },
          invitedBy: {
            select: {
              name: true
            }
          }
        }
      });

      if (!invite) {
        throw new Error('Convite não encontrado');
      }

      if (invite.status !== 'PENDING') {
        throw new Error('Convite já foi utilizado ou expirou');
      }

      if (invite.expiresAt < new Date()) {
        // Marcar como expirado
        await prisma.teamInvite.update({
          where: { id: invite.id },
          data: { status: 'EXPIRED' }
        });
        throw new Error('Convite expirou');
      }

      return invite;
    } catch (error) {
      throw new Error(`Erro ao validar convite: ${error.message}`);
    }
  }

  // Aceitar convite
  static async acceptInvite(token, userId) {
    try {
      const invite = await this.validateInvite(token);

      // Verificar se o usuário já é organizador do evento
      const existingOrganizer = await prisma.eventOrganizer.findUnique({
        where: {
          eventId_userId: {
            eventId: invite.eventId,
            userId
          }
        }
      });

      if (existingOrganizer) {
        throw new Error('Você já é organizador deste evento');
      }

      // Adicionar como organizador
      await prisma.eventOrganizer.create({
        data: {
          eventId: invite.eventId,
          userId,
          role: invite.role
        }
      });

      // Marcar convite como aceito
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' }
      });

      return {
        success: true,
        event: invite.event,
        role: invite.role
      };
    } catch (error) {
      throw new Error(`Erro ao aceitar convite: ${error.message}`);
    }
  }

  // Rejeitar convite
  static async declineInvite(token) {
    try {
      const invite = await this.validateInvite(token);

      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: 'DECLINED' }
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Erro ao rejeitar convite: ${error.message}`);
    }
  }

  // Listar convites pendentes de um evento
  static async getPendingInvites(eventId) {
    try {
      const invites = await prisma.teamInvite.findMany({
        where: {
          eventId,
          status: 'PENDING'
        },
        include: {
          invitedBy: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return invites;
    } catch (error) {
      throw new Error(`Erro ao buscar convites: ${error.message}`);
    }
  }

  // Cancelar convite
  static async cancelInvite(inviteId, userId) {
    try {
      const invite = await prisma.teamInvite.findUnique({
        where: { id: inviteId },
        include: {
          event: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!invite) {
        throw new Error('Convite não encontrado');
      }

      // Verificar se o usuário tem permissão para cancelar o convite
      const hasPermission = await this.hasPermission(invite.eventId, userId, 'EDITOR');
      if (!hasPermission) {
        throw new Error('Sem permissão para cancelar este convite');
      }

      await prisma.teamInvite.delete({
        where: { id: inviteId }
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Erro ao cancelar convite: ${error.message}`);
    }
  }

  // Buscar eventos onde o usuário é organizador
  static async getUserOrganizedEvents(userId) {
    try {
      const events = await prisma.event.findMany({
        where: {
          organizers: {
            some: {
              userId
            }
          }
        },
        include: {
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
        }
      });

      return events;
    } catch (error) {
      throw new Error(`Erro ao buscar eventos organizados: ${error.message}`);
    }
  }
}

module.exports = OrganizerService; 