const { body, validationResult } = require('express-validator');
const OrganizerService = require('../services/organizerService');
const CompanyService = require('../services/companyService');

class OrganizerController {
  // Validações para convite de organizador
  static inviteValidation = [
    body('email')
      .isEmail()
      .withMessage('E-mail deve ser válido')
      .normalizeEmail(),
    body('role')
      .optional()
      .isIn(['OWNER', 'EDITOR', 'CHECKIN'])
      .withMessage('Papel deve ser OWNER, EDITOR ou CHECKIN')
  ];

  // Enviar convite para organizador
  static async sendInvite(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const { eventId } = req.params;
      const { email, role = 'EDITOR' } = req.body;
      const userId = req.user.id;

      // Verificar se o usuário tem permissão para convidar
      const hasPermission = await OrganizerService.hasPermission(eventId, userId, 'EDITOR');
      if (!hasPermission) {
        return res.status(403).json({
          error: 'Sem permissão para convidar organizadores'
        });
      }

      const { invite, resent } = await OrganizerService.sendOrganizerInvite(eventId, userId, email, role);

      res.status(201).json({
        message: resent
          ? 'Já existe um convite pendente para este e-mail. O convite foi reenviado!'
          : 'Convite enviado com sucesso',
        data: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          expiresAt: invite.expiresAt
        },
        resent
      });
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Listar organizadores de um evento
  static async getEventOrganizers(req, res) {
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

      const organizers = await OrganizerService.getEventOrganizers(eventId);

      res.json({
        data: organizers
      });
    } catch (error) {
      console.error('Erro ao buscar organizadores:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Remover organizador de um evento
  static async removeOrganizer(req, res) {
    try {
      const { eventId, userId: organizerUserId } = req.params;
      const userId = req.user.id;

      // Verificar se o usuário tem permissão para remover organizadores
      const hasPermission = await OrganizerService.hasPermission(eventId, userId, 'EDITOR');
      if (!hasPermission) {
        return res.status(403).json({
          error: 'Sem permissão para remover organizadores'
        });
      }

      // Não permitir que o usuário se remova se for o último organizador
      const userRole = await OrganizerService.getUserRole(eventId, userId);
      if (userRole === 'OWNER' && userId === organizerUserId) {
        return res.status(400).json({
          error: 'Não é possível remover o dono do evento'
        });
      }

      const removedOrganizer = await OrganizerService.removeOrganizer(eventId, organizerUserId);

      res.json({
        message: 'Organizador removido com sucesso',
        data: removedOrganizer
      });
    } catch (error) {
      console.error('Erro ao remover organizador:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Atualizar papel do organizador
  static async updateOrganizerRole(req, res) {
    try {
      const { eventId, userId: organizerUserId } = req.params;
      const { role } = req.body;
      const userId = req.user.id;

      // Verificar se o usuário tem permissão para atualizar papéis
      const hasPermission = await OrganizerService.hasPermission(eventId, userId, 'EDITOR');
      if (!hasPermission) {
        return res.status(403).json({
          error: 'Sem permissão para atualizar papéis'
        });
      }

      const updatedOrganizer = await OrganizerService.updateOrganizerRole(eventId, organizerUserId, role);

      res.json({
        message: 'Papel atualizado com sucesso',
        data: updatedOrganizer
      });
    } catch (error) {
      console.error('Erro ao atualizar papel:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Validar convite
  static async validateInvite(req, res) {
    try {
      const { token } = req.params;

      const invite = await OrganizerService.validateInvite(token);

      res.json({
        data: {
          event: invite.event,
          invitedBy: invite.invitedBy,
          role: invite.role,
          email: invite.email,
          expiresAt: invite.expiresAt
        }
      });
    } catch (error) {
      console.error('Erro ao validar convite:', error);
      res.status(400).json({
        error: 'Convite inválido',
        message: error.message
      });
    }
  }

  // Aceitar convite
  static async acceptInvite(req, res) {
    try {
      const { token } = req.params;
      const userId = req.user.id;

      const result = await OrganizerService.acceptInvite(token, userId);

      res.json({
        message: 'Convite aceito com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Rejeitar convite
  static async declineInvite(req, res) {
    try {
      const { token } = req.params;

      await OrganizerService.declineInvite(token);

      res.json({
        message: 'Convite rejeitado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao rejeitar convite:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Listar convites pendentes de um evento
  static async getPendingInvites(req, res) {
    try {
      const { eventId } = req.params;
      const userId = req.user.id;

      // Verificar se o usuário tem permissão para ver convites
      const hasPermission = await OrganizerService.hasPermission(eventId, userId, 'EDITOR');
      if (!hasPermission) {
        return res.status(403).json({
          error: 'Sem permissão para ver convites'
        });
      }

      const invites = await OrganizerService.getPendingInvites(eventId);

      res.json({
        data: invites
      });
    } catch (error) {
      console.error('Erro ao buscar convites:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Cancelar convite
  static async cancelInvite(req, res) {
    try {
      const { inviteId } = req.params;
      const userId = req.user.id;

      await OrganizerService.cancelInvite(inviteId, userId);

      res.json({
        message: 'Convite cancelado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Buscar eventos onde o usuário é organizador
  static async getUserOrganizedEvents(req, res) {
    try {
      const userId = req.user.id;

      const events = await OrganizerService.getUserOrganizedEvents(userId);

      res.json({
        data: events
      });
    } catch (error) {
      console.error('Erro ao buscar eventos organizados:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Criar empresa
  static async createCompany(req, res) {
    try {
      const { name } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          error: 'Nome da empresa é obrigatório'
        });
      }

      // Verificar se já existe uma empresa com este nome
      const existingCompany = await CompanyService.getCompanyByName(name);
      if (existingCompany) {
        return res.status(400).json({
          error: 'Já existe uma empresa com este nome'
        });
      }

      const company = await CompanyService.createCompany(name);

      res.status(201).json({
        message: 'Empresa criada com sucesso',
        data: company
      });
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Adicionar usuário à empresa
  static async addUserToCompany(req, res) {
    try {
      const { userId } = req.params;
      const { companyId } = req.body;
      const currentUserId = req.user.id;

      // Verificar se o usuário atual tem permissão (admin ou dono da empresa)
      // Por simplicidade, vamos permitir que qualquer usuário faça isso por enquanto
      // Em produção, você implementaria verificações de permissão mais rigorosas

      const user = await CompanyService.addUserToCompany(userId, companyId);

      res.json({
        message: 'Usuário adicionado à empresa com sucesso',
        data: user
      });
    } catch (error) {
      console.error('Erro ao adicionar usuário à empresa:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Buscar usuários de uma empresa
  static async getCompanyUsers(req, res) {
    try {
      const { companyId } = req.params;
      const userId = req.user.id;

      // Verificar se o usuário pertence à empresa
      // Implementar verificação de permissão conforme necessário

      const users = await CompanyService.getCompanyUsers(companyId);

      res.json({
        data: users
      });
    } catch (error) {
      console.error('Erro ao buscar usuários da empresa:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
}

module.exports = OrganizerController; 