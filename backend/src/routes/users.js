const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const usuarioController = require('../controllers/admin/usuarioController');
const adminAuth = require('../middleware/adminAuth');
const empresaController = require('../controllers/admin/empresaController');
const prisma = require('../config/database');

// Rotas de usuários (placeholder)
router.get('/', (req, res) => {
  res.json({ message: 'Rotas de usuários em desenvolvimento' });
});

// Rota para buscar dados da empresa do usuário
router.get('/empresa', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.empresaId) {
      return res.status(403).json({ error: 'Usuário não pertence a uma empresa' });
    }
    // Buscar empresa pelo ID
    const empresa = await prisma.empresa.findUnique({
      where: { id: user.empresaId }
    });
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    res.json({ data: empresa });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar empresa' });
  }
});

// Rota para buscar plano da empresa
router.get('/empresas/:empresaId/plano', authenticateToken, async (req, res) => {
  try {
    const { empresaId } = req.params;
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      include: { plano: true }
    });
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    res.json({ data: empresa.plano || null });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar plano da empresa' });
  }
});

// Rota para buscar faturas da empresa
router.get('/empresas/:empresaId/faturas', authenticateToken, async (req, res) => {
  try {
    const { empresaId } = req.params;
    const user = req.user;
    
    // Verificar se o usuário tem acesso à empresa
    if (!user || user.empresaId !== empresaId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const faturas = await prisma.fatura.findMany({
      where: { empresaId },
      orderBy: { criadoEm: 'desc' }
    });
    
    res.json({ data: faturas });
  } catch (err) {
    console.error('Erro ao buscar faturas:', err);
    res.status(500).json({ error: 'Erro ao buscar faturas da empresa' });
  }
});

// Rotas para gerenciamento de equipe
// Listar membros da equipe da empresa do usuário autenticado
router.get('/equipe', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.empresaId) {
      return res.status(403).json({ error: 'Usuário não pertence a uma empresa' });
    }
    // Apenas admins e proprietários podem ver a equipe
    if (!['ADMIN', 'PROPRIETARIO'].includes(user.nivel) && !user.podeGerenciarDemandas) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const equipe = await prisma.user.findMany({
      where: { empresaId: user.empresaId },
      select: {
        id: true,
        name: true,
        email: true,
        telefone: true,
        nivel: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
        eventosIds: true,
        trabalharTodosEventos: true,
        fotoPerfil: true,
        endereco: true,
        cpf: true,
        dataNascimento: true,
        pix: true,
        trabalhou: true,
        diasTrabalhados: true,
        eventosTrabalhados: true,
        pagamentos: true,
        foiPago: true,
        podeGerenciarDemandas: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(equipe);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar equipe' });
  }
});

// Cadastrar novo membro na equipe
router.post('/equipe', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.empresaId) {
      return res.status(403).json({ error: 'Usuário não pertence a uma empresa' });
    }
    if (!['ADMIN', 'PROPRIETARIO'].includes(user.nivel)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const { nome, email, telefone, nivel, eventosIds, trabalharTodosEventos, fotoPerfil, endereco, cpf, dataNascimento, pix, trabalhou, diasTrabalhados, eventosTrabalhados, pagamentos, foiPago, podeGerenciarDemandas } = req.body;
    // Verifica se já existe usuário com esse email na empresa
    const existente = await prisma.user.findFirst({ where: { email, empresaId: user.empresaId } });
    if (existente) {
      return res.status(400).json({ error: 'Já existe um usuário com este e-mail nesta empresa.' });
    }
    const senhaTemporaria = Math.random().toString(36).slice(-8);
    const bcrypt = require('bcryptjs');
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);
    // Garante que eventosIds seja sempre array de strings
    const eventosIdsArray = Array.isArray(eventosIds)
      ? eventosIds
      : (typeof eventosIds === 'string' && eventosIds ? [eventosIds] : []);
    const novoUsuario = await prisma.user.create({
      data: {
        name: nome,
        email,
        telefone,
        nivel: nivel || 'CHECKIN',
        ativo: true,
        empresaId: user.empresaId,
        password: senhaHash,
        eventosIds: eventosIdsArray,
        trabalharTodosEventos: trabalharTodosEventos || false,
        fotoPerfil,
        endereco,
        cpf,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        pix,
        trabalhou,
        diasTrabalhados,
        eventosTrabalhados,
        pagamentos,
        foiPago: foiPago ?? false,
        podeGerenciarDemandas: podeGerenciarDemandas === true || podeGerenciarDemandas === 'true'
      },
      select: {
        id: true,
        name: true,
        email: true,
        telefone: true,
        nivel: true,
        ativo: true,
        eventosIds: true,
        trabalharTodosEventos: true,
        fotoPerfil: true,
        endereco: true,
        cpf: true,
        dataNascimento: true,
        pix: true,
        trabalhou: true,
        diasTrabalhados: true,
        eventosTrabalhados: true,
        pagamentos: true,
        foiPago: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    // TODO: Enviar e-mail com senha temporária
    res.json({ ...novoUsuario, senhaTemporaria });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar usuário da equipe' });
  }
});

// Editar membro da equipe
router.put('/equipe/:userId', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.empresaId) {
      return res.status(403).json({ error: 'Usuário não pertence a uma empresa' });
    }
    if (!['ADMIN', 'PROPRIETARIO'].includes(user.nivel)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const membro = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!membro || membro.empresaId !== user.empresaId) {
      return res.status(404).json({ error: 'Usuário da equipe não encontrado' });
    }
    const { nome, email, telefone, nivel, ativo, eventosIds, trabalharTodosEventos, fotoPerfil, endereco, cpf, dataNascimento, pix, trabalhou, diasTrabalhados, eventosTrabalhados, pagamentos, foiPago, podeGerenciarDemandas } = req.body;
    // Não permitir alterar email para um já existente na empresa
    if (email && email !== membro.email) {
      const emailExistente = await prisma.user.findFirst({ where: { email, empresaId: user.empresaId, id: { not: membro.id } } });
      if (emailExistente) {
        return res.status(400).json({ error: 'Já existe um usuário com este e-mail nesta empresa.' });
      }
    }
    // Garante que eventosIds seja sempre array de strings
    const eventosIdsArray = Array.isArray(eventosIds)
      ? eventosIds
      : (typeof eventosIds === 'string' && eventosIds ? [eventosIds] : []);
    const atualizado = await prisma.user.update({
      where: { id: membro.id },
      data: {
        name: nome,
        email,
        telefone,
        nivel,
        ativo,
        eventosIds: eventosIdsArray,
        trabalharTodosEventos: trabalharTodosEventos || false,
        fotoPerfil,
        endereco,
        cpf,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        pix,
        trabalhou,
        diasTrabalhados,
        eventosTrabalhados,
        pagamentos,
        foiPago: foiPago ?? false,
        podeGerenciarDemandas: podeGerenciarDemandas === true || podeGerenciarDemandas === 'true'
      },
      select: {
        id: true,
        name: true,
        email: true,
        telefone: true,
        nivel: true,
        ativo: true,
        eventosIds: true,
        trabalharTodosEventos: true,
        fotoPerfil: true,
        endereco: true,
        cpf: true,
        dataNascimento: true,
        pix: true,
        trabalhou: true,
        diasTrabalhados: true,
        eventosTrabalhados: true,
        pagamentos: true,
        foiPago: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    res.json(atualizado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar usuário da equipe' });
  }
});

// Remover membro da equipe
router.delete('/equipe/:userId', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.empresaId) {
      return res.status(403).json({ error: 'Usuário não pertence a uma empresa' });
    }
    if (!['ADMIN', 'PROPRIETARIO'].includes(user.nivel)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const membro = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!membro || membro.empresaId !== user.empresaId) {
      return res.status(404).json({ error: 'Usuário da equipe não encontrado' });
    }
    // Não permitir remover o próprio admin
    if (membro.id === user.id) {
      return res.status(400).json({ error: 'Você não pode remover a si mesmo.' });
    }
    await prisma.user.delete({ where: { id: membro.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover usuário da equipe' });
  }
});

// Rotas de gerenciamento de usuários (acesso master)
router.get('/', authenticateToken, adminAuth, usuarioController.list);
router.post('/', authenticateToken, adminAuth, usuarioController.create);
router.get('/:userId', authenticateToken, adminAuth, usuarioController.get);
router.put('/:userId', authenticateToken, adminAuth, usuarioController.update);
router.patch('/:userId/block', authenticateToken, adminAuth, usuarioController.block);
router.delete('/:userId', authenticateToken, adminAuth, usuarioController.delete);

// Empresas do usuário comum
router.get('/empresas', authenticateToken, empresaController.list);
router.post('/empresas', authenticateToken, empresaController.create);

// Atualizar o plano da empresa
router.put('/empresas/:empresaId/plano', authenticateToken, async (req, res) => {
  try {
    const { empresaId } = req.params;
    const { planoId } = req.body;
    const user = req.user;

    // Verifica se o usuário é admin da empresa
    if (!user || user.empresaId !== empresaId || !['ADMIN', 'PROPRIETARIO'].includes(user.nivel)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Verifica se o plano existe
    const plano = await prisma.plano.findUnique({ where: { id: planoId } });
    if (!plano) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    // Atualiza o plano da empresa
    const empresaAtualizada = await prisma.empresa.update({
      where: { id: empresaId },
      data: { planoId }
    });

    res.json({ data: empresaAtualizada });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar plano da empresa' });
  }
});

// Listar membros da equipe da empresa
router.get('/empresas/:empresaId/equipe', authenticateToken, async (req, res) => {
  const { empresaId } = req.params;
  const equipe = await prisma.user.findMany({
    where: { empresaId },
    select: {
      id: true,
      name: true,
      nome: true,
      email: true,
      nivel: true,
      podeGerenciarDemandas: true
    }
  });
  res.json(equipe);
});

module.exports = router; 