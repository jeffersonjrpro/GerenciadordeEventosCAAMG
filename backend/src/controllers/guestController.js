const { body, validationResult } = require('express-validator');
const GuestService = require('../services/guestService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

class GuestController {
  // Validações para criação/atualização de convidado
  static guestValidation = [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('email')
      .optional()
      .custom((value) => {
        if (value === '' || value === null || value === undefined) {
          return true; // Permite valores vazios
        }
        if (!value.includes('@')) {
          throw new Error('Email inválido');
        }
        return true;
      })
      .normalizeEmail()
      .withMessage('Email inválido'),
    body('phone')
      .optional()
      .trim()
      .isLength({ min: 10, max: 15 })
      .withMessage('Telefone deve ter entre 10 e 15 caracteres'),
    body('customFields')
      .optional()
      .isObject()
      .withMessage('Campos personalizados devem ser um objeto')
  ];

  // Validações para RSVP
  static rsvpValidation = [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    body('phone')
      .optional()
      .trim()
      .isLength({ min: 10, max: 15 })
      .withMessage('Telefone deve ter entre 10 e 15 caracteres')
  ];

  // Criar convidado
  static async createGuest(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const { eventId } = req.params;
      const guestData = req.body;

      console.log('Criando convidado:', { eventId, guestData });

      const guest = await GuestService.createGuest(eventId, req.user.id, guestData);

      console.log('Convidado criado com sucesso:', guest);

      res.status(201).json({
        success: true,
        message: 'Convidado adicionado com sucesso',
        data: guest
      });
    } catch (error) {
      console.error('Erro ao criar convidado:', error);
      
      if (error.message.includes('Evento não encontrado') || 
          error.message.includes('Evento está com capacidade máxima')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Buscar convidado por QR Code (público)
  static async getGuestByQRCode(req, res) {
    try {
      const { qrCode } = req.params;
      const guest = await GuestService.getGuestByQRCode(qrCode);

      res.json({
        data: guest
      });
    } catch (error) {
      console.error('Erro ao buscar convidado por QR Code:', error);
      
      if (error.message === 'QR Code inválido') {
        return res.status(404).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Confirmar presença (RSVP)
  static async confirmPresence(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const { qrCode } = req.params;
      const guestData = req.body;

      const guest = await GuestService.confirmPresence(qrCode, guestData);

      res.json({
        message: 'Presença confirmada com sucesso',
        data: guest
      });
    } catch (error) {
      console.error('Erro ao confirmar presença:', error);
      
      if (error.message.includes('QR Code inválido') || 
          error.message.includes('Evento não está ativo') ||
          error.message.includes('Presença já foi confirmada')) {
        return res.status(400).json({
          error: error.message
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Gerar QR Code como imagem
  static async generateQRCode(req, res) {
    try {
      const { qrCode } = req.params;
      const qrCodeImage = await GuestService.generateQRCodeImage(qrCode);

      res.json({
        data: {
          qrCode,
          image: qrCodeImage
        }
      });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // Buscar convidados de um evento com filtros
  static async getGuestsByEvent(req, res) {
    try {
      const { eventId } = req.params;
      const { search, status, presence } = req.query;

      // Verificar se o evento existe e pertence ao usuário
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          userId: req.user.id
        }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento não encontrado'
        });
      }

      // Construir filtros
      const where = {
        eventId: eventId
      };

      // Filtro de busca
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } }
        ];
      }

      // Filtro de status
      if (status === 'confirmed') {
        where.confirmed = true;
      } else if (status === 'pending') {
        where.confirmed = false;
      }

      // Buscar convidados
      const guests = await prisma.guest.findMany({
        where,
        include: {
          checkIns: {
            orderBy: { checkedInAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Filtro de presença (aplicado após a busca)
      let filteredGuests = guests;
      if (presence === 'present') {
        filteredGuests = guests.filter(guest => guest.checkIns.length > 0);
      } else if (presence === 'absent') {
        filteredGuests = guests.filter(guest => guest.checkIns.length === 0);
      }

      res.json({
        success: true,
        data: filteredGuests
      });
    } catch (error) {
      console.error('Erro ao buscar convidados:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Adicionar convidado
  static async addGuest(req, res) {
    try {
      const { eventId } = req.params;
      const { name, email, phone } = req.body;

      // Verificar se o evento existe e pertence ao usuário
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          userId: req.user.id
        }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento não encontrado'
        });
      }

      // Validar dados obrigatórios
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Nome é obrigatório'
        });
      }

      // Gerar QR Code único
      const qrCode = `GUEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Criar convidado
      const guest = await prisma.guest.create({
        data: {
          name,
          email,
          phone,
          qrCode,
          eventId,
          confirmed: false
        },
        include: {
          checkIns: true
        }
      });

      res.status(201).json({
        success: true,
        data: guest
      });
    } catch (error) {
      console.error('Erro ao adicionar convidado:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar convidado
  static async updateGuest(req, res) {
    try {
      const { eventId, guestId } = req.params;
      const { name, email, phone } = req.body;

      // Verificar se o evento existe e pertence ao usuário
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          userId: req.user.id
        }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento não encontrado'
        });
      }

      // Verificar se o convidado existe
      const existingGuest = await prisma.guest.findFirst({
        where: {
          id: guestId,
          eventId: eventId
        }
      });

      if (!existingGuest) {
        return res.status(404).json({
          success: false,
          message: 'Convidado não encontrado'
        });
      }

      // Atualizar convidado
      const guest = await prisma.guest.update({
        where: { id: guestId },
        data: {
          name,
          email,
          phone
        },
        include: {
          checkIns: true
        }
      });

      res.json({
        success: true,
        data: guest
      });
    } catch (error) {
      console.error('Erro ao atualizar convidado:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Deletar convidado
  static async deleteGuest(req, res) {
    try {
      const { eventId, guestId } = req.params;

      // Verificar se o evento existe e pertence ao usuário
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          userId: req.user.id
        }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento não encontrado'
        });
      }

      // Verificar se o convidado existe
      const existingGuest = await prisma.guest.findFirst({
        where: {
          id: guestId,
          eventId: eventId
        }
      });

      if (!existingGuest) {
        return res.status(404).json({
          success: false,
          message: 'Convidado não encontrado'
        });
      }

      // Deletar check-ins primeiro
      await prisma.checkIn.deleteMany({
        where: { guestId: guestId }
      });

      // Deletar convidado
      await prisma.guest.delete({
        where: { id: guestId }
      });

      res.json({
        success: true,
        message: 'Convidado removido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar convidado:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Confirmar presença manualmente
  static async confirmGuest(req, res) {
    try {
      const { eventId, guestId } = req.params;

      // Verificar se o evento existe e pertence ao usuário
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          userId: req.user.id
        }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento não encontrado'
        });
      }

      // Verificar se o convidado existe
      const existingGuest = await prisma.guest.findFirst({
        where: {
          id: guestId,
          eventId: eventId
        }
      });

      if (!existingGuest) {
        return res.status(404).json({
          success: false,
          message: 'Convidado não encontrado'
        });
      }

      // Confirmar presença
      const guest = await prisma.guest.update({
        where: { id: guestId },
        data: {
          confirmed: true,
          confirmedAt: new Date()
        },
        include: {
          checkIns: true
        }
      });

      res.json({
        success: true,
        data: guest
      });
    } catch (error) {
      console.error('Erro ao confirmar convidado:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Importar convidados via CSV
  static async importGuests(req, res) {
    try {
      const { eventId } = req.params;

      // Verificar se o evento existe e pertence ao usuário
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          userId: req.user.id
        }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento não encontrado'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Arquivo CSV é obrigatório'
        });
      }

      const results = [];
      const errors = [];

      // Ler arquivo CSV
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
          // Validar dados obrigatórios
          if (!data.nome || !data.nome.trim()) {
            errors.push(`Linha inválida: nome é obrigatório`);
            return;
          }

          results.push({
            name: data.nome.trim(),
            email: data.email ? data.email.trim() : null,
            phone: data.telefone ? data.telefone.trim() : null
          });
        })
        .on('end', async () => {
          try {
            // Remover arquivo temporário
            fs.unlinkSync(req.file.path);

            if (errors.length > 0) {
              return res.status(400).json({
                success: false,
                message: 'Erro na validação do arquivo',
                errors
              });
            }

            // Inserir convidados no banco
            const createdGuests = [];
            for (const guestData of results) {
              const qrCode = `GUEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              
              const guest = await prisma.guest.create({
                data: {
                  ...guestData,
                  qrCode,
                  eventId,
                  confirmed: false
                }
              });
              
              createdGuests.push(guest);
            }

            res.json({
              success: true,
              data: createdGuests,
              message: `${createdGuests.length} convidados importados com sucesso`
            });
          } catch (error) {
            console.error('Erro ao importar convidados:', error);
            res.status(500).json({
              success: false,
              message: 'Erro interno do servidor'
            });
          }
        })
        .on('error', (error) => {
          console.error('Erro ao ler arquivo CSV:', error);
          res.status(400).json({
            success: false,
            message: 'Erro ao processar arquivo CSV'
          });
        });
    } catch (error) {
      console.error('Erro ao importar convidados:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Exportar convidados para CSV
  static async exportGuests(req, res) {
    try {
      const { eventId } = req.params;
      const { status, presence } = req.query;

      // Verificar se o evento existe e pertence ao usuário
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          userId: req.user.id
        }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento não encontrado'
        });
      }

      // Construir filtros
      const where = {
        eventId: eventId
      };

      // Filtro de status
      if (status === 'confirmed') {
        where.confirmed = true;
      } else if (status === 'pending') {
        where.confirmed = false;
      }

      // Buscar convidados
      const guests = await prisma.guest.findMany({
        where,
        include: {
          checkIns: {
            orderBy: { checkedInAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Filtro de presença
      let filteredGuests = guests;
      if (presence === 'present') {
        filteredGuests = guests.filter(guest => guest.checkIns.length > 0);
      } else if (presence === 'absent') {
        filteredGuests = guests.filter(guest => guest.checkIns.length === 0);
      }

      // Preparar dados para CSV
      const csvData = filteredGuests.map(guest => ({
        nome: guest.name,
        email: guest.email || '',
        telefone: guest.phone || '',
        status: guest.confirmed ? 'Confirmado' : 'Pendente',
        presenca: guest.checkIns.length > 0 ? 'Presente' : 'Ausente',
        data_confirmacao: guest.confirmedAt ? new Date(guest.confirmedAt).toLocaleDateString('pt-BR') : '',
        data_checkin: guest.checkIns.length > 0 ? new Date(guest.checkIns[0].checkedInAt).toLocaleString('pt-BR') : '',
        qr_code: guest.qrCode
      }));

      // Configurar CSV Writer
      const csvWriter = createCsvWriter({
        path: path.join(__dirname, '../../temp', `convidados_${eventId}_${Date.now()}.csv`),
        header: [
          { id: 'nome', title: 'Nome' },
          { id: 'email', title: 'E-mail' },
          { id: 'telefone', title: 'Telefone' },
          { id: 'status', title: 'Status' },
          { id: 'presenca', title: 'Presença' },
          { id: 'data_confirmacao', title: 'Data Confirmação' },
          { id: 'data_checkin', title: 'Data Check-in' },
          { id: 'qr_code', title: 'QR Code' }
        ]
      });

      // Escrever CSV
      await csvWriter.writeRecords(csvData);

      // Enviar arquivo
      const filePath = csvWriter.csvStringifier.path;
      res.download(filePath, `convidados_${event.name}_${new Date().toISOString().split('T')[0]}.csv`, (err) => {
        if (err) {
          console.error('Erro ao enviar arquivo:', err);
        }
        // Remover arquivo temporário
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Erro ao remover arquivo temporário:', unlinkErr);
        });
      });
    } catch (error) {
      console.error('Erro ao exportar convidados:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar convidado específico
  static async getGuestById(req, res) {
    try {
      const { eventId, guestId } = req.params;

      // Verificar se o evento existe e pertence ao usuário
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          userId: req.user.id
        }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento não encontrado'
        });
      }

      // Buscar convidado
      const guest = await prisma.guest.findFirst({
        where: {
          id: guestId,
          eventId: eventId
        },
        include: {
          checkIns: {
            orderBy: { checkedInAt: 'desc' }
          }
        }
      });

      if (!guest) {
        return res.status(404).json({
          success: false,
          message: 'Convidado não encontrado'
        });
      }

      res.json({
        success: true,
        data: guest
      });
    } catch (error) {
      console.error('Erro ao buscar convidado:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Validar RSVP
  static async rsvpValidation(req, res, next) {
    try {
      const { qrCode } = req.params;
      const { confirmed } = req.body;

      if (typeof confirmed !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Confirmação deve ser true ou false'
        });
      }

      const guest = await prisma.guest.findFirst({
        where: { qrCode }
      });

      if (!guest) {
        return res.status(404).json({
          success: false,
          message: 'QR Code inválido'
        });
      }

      req.guest = guest;
      next();
    } catch (error) {
      console.error('Erro na validação RSVP:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Confirmar presença via RSVP
  static async confirmPresence(req, res) {
    try {
      const { confirmed } = req.body;
      const guest = req.guest;

      const updatedGuest = await prisma.guest.update({
        where: { id: guest.id },
        data: {
          confirmed,
          confirmedAt: confirmed ? new Date() : null
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              description: true,
              date: true,
              location: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: updatedGuest,
        message: confirmed ? 'Presença confirmada com sucesso!' : 'Presença cancelada'
      });
    } catch (error) {
      console.error('Erro ao confirmar presença:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Gerar QR Code
  static async generateQRCode(req, res) {
    try {
      const { qrCode } = req.params;

      const guest = await prisma.guest.findFirst({
        where: { qrCode }
      });

      if (!guest) {
        return res.status(404).json({
          success: false,
          message: 'QR Code inválido'
        });
      }

      // Gerar QR Code como imagem
      const qrCodeDataURL = await QRCode.toDataURL(qrCode, {
        width: 300,
        margin: 2
      });

      res.json({
        success: true,
        data: {
          qrCode: qrCodeDataURL,
          guest: {
            name: guest.name,
            eventId: guest.eventId
          }
        }
      });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Inscrição pública
  static async addPublicGuest(req, res) {
    try {
      const { eventId } = req.params;
      const { name, email, phone, confirmed } = req.body;

      // Verificar se o evento existe e é público
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          isPublic: true
        }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento não encontrado ou não está disponível para inscrições públicas'
        });
      }

      // Validar dados obrigatórios
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Nome e e-mail são obrigatórios'
        });
      }

      // Verificar se já existe um convidado com este e-mail para este evento
      const existingGuest = await prisma.guest.findFirst({
        where: {
          eventId: eventId,
          email: email
        }
      });

      if (existingGuest) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma inscrição com este e-mail para este evento'
        });
      }

      // Gerar QR Code único
      const qrCode = `GUEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Criar convidado
      const guest = await prisma.guest.create({
        data: {
          name,
          email,
          phone,
          qrCode,
          eventId,
          confirmed: confirmed === 'true' || confirmed === true,
          confirmedAt: (confirmed === 'true' || confirmed === true) ? new Date() : null
        },
        include: {
          checkIns: true
        }
      });

      res.status(201).json({
        success: true,
        data: guest,
        message: 'Inscrição realizada com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao realizar inscrição pública:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = GuestController; 