const adminService = require('../../services/admin/adminService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    const admin = await adminService.loginAdmin(email, senha);
    if (!admin) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: 'Erro no login' });
  }
};

exports.list = async (req, res) => {
  try {
    const admins = await adminService.listAdmins();
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar admins' });
  }
};

exports.create = async (req, res) => {
  try {
    const admin = await adminService.createAdmin(req.body);
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar admin' });
  }
};

exports.update = async (req, res) => {
  try {
    const admin = await adminService.updateAdmin(req.params.id, req.body);
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar admin' });
  }
};

exports.block = async (req, res) => {
  try {
    const admin = await adminService.blockAdmin(req.params.id);
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao bloquear admin' });
  }
};

exports.listAllAdmins = async (req, res) => {
  try {
    const adminMasters = await prisma.adminMaster.findMany({
      select: { id: true, nome: true, email: true, nivel: true, ativo: true, criadoEm: true },
      orderBy: { criadoEm: 'desc' },
    });

    const adminsUsers = await prisma.user.findMany({
      where: { nivel: 'ADMIN' },
      select: { id: true, name: true, email: true, nivel: true, ativo: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      adminMasters,
      adminsUsers,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar todos os admins' });
  }
}; 