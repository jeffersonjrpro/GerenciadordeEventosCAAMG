const { body, validationResult } = require('express-validator');
const GuestService = require('../services/guestService');
const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Função auxiliar para gerar código único simples
async function generateSimpleCode(eventId) {
  // Buscar o evento para pegar o nome
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { name: true }
  });

  if (!event) {
    throw new Error('Evento não encontrado');
  }

  // Pegar as 4 primeiras letras do nome do evento (ou menos se o nome for menor)
  const eventPrefix = event.name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
  
  // Se não tiver 4 letras, completar com X
  const prefix = eventPrefix.padEnd(4, 'X');
  
  // Tentar gerar um código único (máximo 10 tentativas)
  for (let attempt = 0; attempt < 10; attempt++) {
    // Gerar número único
    const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos do timestamp
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const code = `${prefix}${timestamp}${randomSuffix}`;
    
    // Verificar se o código já existe
    const existingGuest = await prisma.guest.findFirst({
      where: { qrCode: code }
    });
    
    if (!existingGuest) {
      return code;
    }
    
    // Aguardar um pouco antes da próxima tentativa
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  throw new Error('Não foi possível gerar um código único após 10 tentativas');
}

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

      // Gerar QR Code como buffer de imagem
      const qrCodeBuffer = await QRCode.toBuffer(qrCode, {
        width: 300,
        margin: 2,
        type: 'image/png'
      });

      // Configurar headers para imagem
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', qrCodeBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 ano
      
      // Enviar a imagem
      res.send(qrCodeBuffer);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar convidados de um evento
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

      // Processar campos personalizados para cada convidado
      const processedGuests = filteredGuests.map(guest => {
        const guestData = { ...guest };
        
        // Processar campos personalizados
        if (guest.customFields) {
          try {
            guestData.customFields = typeof guest.customFields === 'string' 
              ? JSON.parse(guest.customFields) 
              : guest.customFields;
          } catch (error) {
            console.error('Erro ao processar campos personalizados:', error);
            guestData.customFields = {};
          }
        } else {
          guestData.customFields = {};
        }

        return guestData;
      });

      res.json({
        success: true,
        data: {
          guests: processedGuests,
          event: {
            id: event.id,
            name: event.name,
            formConfig: event.formConfig
          }
        }
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
      const qrCode = await generateSimpleCode(eventId);

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
        },
        include: {
          formConfig: true
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

      // Obter campos personalizados do evento
      const customFields = event.formConfig?.fields?.filter(field => 
        field.id !== 'name' && field.id !== 'email' && field.id !== 'phone'
      ) || [];

      // Ler arquivo CSV
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
          // Validar dados obrigatórios
          if (!data.nome || !data.nome.trim()) {
            errors.push(`Linha inválida: nome é obrigatório`);
            return;
          }

          // Preparar dados base
          const guestData = {
            name: data.nome.trim(),
            email: data.email ? data.email.trim() : null,
            phone: data.telefone ? data.telefone.trim() : null
          };

          // Adicionar campos personalizados
          const customFieldsData = {};
          customFields.forEach(field => {
            if (data[field.id] !== undefined) {
              customFieldsData[field.id] = data[field.id].trim();
            }
          });

          // Adicionar campos personalizados se existirem
          if (Object.keys(customFieldsData).length > 0) {
            guestData.customFields = JSON.stringify(customFieldsData);
          }

          results.push(guestData);
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
              const qrCode = await generateSimpleCode(eventId);
              
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

      // Preparar cabeçalhos base
      const baseHeaders = [
        { id: 'nome', title: 'Nome' },
        { id: 'email', title: 'E-mail' },
        { id: 'telefone', title: 'Telefone' },
        { id: 'status', title: 'Status' },
        { id: 'presenca', title: 'Presença' },
        { id: 'data_confirmacao', title: 'Data Confirmação' },
        { id: 'data_checkin', title: 'Data Check-in' },
        { id: 'qr_code', title: 'QR Code' }
      ];

      // Adicionar campos personalizados se existirem
      const customHeaders = [];
      if (event.formConfig && event.formConfig.fields) {
        event.formConfig.fields.forEach(field => {
          if (field.id !== 'name' && field.id !== 'email' && field.id !== 'phone') {
            customHeaders.push({
              id: field.id,
              title: field.label
            });
          }
        });
      }

      const allHeaders = [...baseHeaders, ...customHeaders];

      // Preparar dados para CSV
      const csvData = filteredGuests.map(guest => {
        const baseData = {
          nome: guest.name,
          email: guest.email || '',
          telefone: guest.phone || '',
          status: guest.confirmed ? 'Confirmado' : 'Pendente',
          presenca: guest.checkIns.length > 0 ? 'Presente' : 'Ausente',
          data_confirmacao: guest.confirmedAt ? new Date(guest.confirmedAt).toLocaleDateString('pt-BR') : '',
          data_checkin: guest.checkIns.length > 0 ? new Date(guest.checkIns[0].checkedInAt).toLocaleString('pt-BR') : '',
          qr_code: guest.qrCode
        };

        // Adicionar campos personalizados
        const customData = {};
        if (guest.customFields) {
          try {
            const parsedFields = typeof guest.customFields === 'string' 
              ? JSON.parse(guest.customFields) 
              : guest.customFields;
            
            customHeaders.forEach(header => {
              customData[header.id] = parsedFields[header.id] || '';
            });
          } catch (error) {
            console.error('Erro ao processar campos personalizados:', error);
          }
        }

        return { ...baseData, ...customData };
      });

      // Criar diretório temp se não existir
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Configurar CSV Writer
      const fileName = `convidados_${eventId}_${Date.now()}.csv`;
      const filePath = path.join(tempDir, fileName);
      
      const csvWriter = createCsvWriter({
        path: filePath,
        header: allHeaders
      });

      // Escrever CSV
      await csvWriter.writeRecords(csvData);

      // Enviar arquivo
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

  // Visualizar detalhes do convidado com QR Code
  static async getGuestDetails(req, res) {
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

      // Gerar QR Code como data URL
      const qrCodeDataURL = await QRCode.toDataURL(guest.qrCode, {
        width: 300,
        margin: 2
      });

      // Processar campos personalizados
      let customFields = {};
      if (guest.customFields) {
        try {
          customFields = typeof guest.customFields === 'string' 
            ? JSON.parse(guest.customFields) 
            : guest.customFields;
        } catch (error) {
          console.error('Erro ao processar campos personalizados:', error);
        }
      }

      // Preparar dados de resposta
      const guestDetails = {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        qrCode: guest.qrCode,
        qrCodeImage: qrCodeDataURL,
        confirmed: guest.confirmed,
        confirmedAt: guest.confirmedAt,
        createdAt: guest.createdAt,
        customFields: customFields,
        checkIns: guest.checkIns,
        event: {
          id: event.id,
          name: event.name,
          date: event.date,
          location: event.location,
          formConfig: event.formConfig
        }
      };

      res.json({
        success: true,
        data: guestDetails
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do convidado:', error);
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

  // Inscrição pública
  static async addPublicGuest(req, res) {
    try {
      const { eventId } = req.params;
      const { name, email, phone, confirmed, ...otherFields } = req.body;

      console.log('📝 Dados recebidos na inscrição pública:', req.body);

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

      // Processar campos personalizados
      const customFields = {};
      Object.keys(otherFields).forEach(key => {
        // Ignorar campos padrão do sistema
        if (!['name', 'email', 'phone', 'confirmed'].includes(key)) {
          customFields[key] = otherFields[key];
        }
      });

      console.log('🔧 Campos personalizados processados:', customFields);

      // Gerar QR Code único
      const qrCode = await generateSimpleCode(eventId);

      // Criar convidado
      const guest = await prisma.guest.create({
        data: {
          name,
          email,
          phone: phone || null,
          qrCode,
          eventId,
          customFields: Object.keys(customFields).length > 0 ? customFields : null,
          confirmed: confirmed === 'true' || confirmed === true,
          confirmedAt: (confirmed === 'true' || confirmed === true) ? new Date() : null
        },
        include: {
          checkIns: true
        }
      });

      // Gerar QR Code como data URL para exibição
      const qrCodeDataURL = await QRCode.toDataURL(guest.qrCode, {
        width: 300,
        margin: 2
      });

      console.log('✅ Convidado criado com campos personalizados:', guest);

      // Adicionar qrCodeImage aos dados de resposta
      const guestWithQRCode = {
        ...guest,
        qrCodeImage: qrCodeDataURL
      };

      res.status(201).json({
        success: true,
        data: guestWithQRCode,
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