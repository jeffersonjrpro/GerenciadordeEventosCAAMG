const prisma = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.loginAdmin = async (email, senha) => {
  const admin = await prisma.adminMaster.findUnique({
    where: { email, ativo: true },
  });
  
  if (!admin || !(await bcrypt.compare(senha, admin.senha))) {
    return null;
  }
  
  const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
  
  return {
    id: admin.id,
    nome: admin.nome,
    email: admin.email,
    nivel: admin.nivel,
    token,
  };
};

exports.listAdmins = async () => {
  return await prisma.adminMaster.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      nivel: true,
      ativo: true,
      criadoEm: true,
    },
    orderBy: { criadoEm: 'desc' },
  });
};

exports.createAdmin = async (data) => {
  const senhaHash = await bcrypt.hash(data.senha, 10);
  
  return await prisma.adminMaster.create({
    data: {
      nome: data.nome,
      email: data.email,
      senha: senhaHash,
      nivel: data.nivel || 'SUPORTE',
    },
    select: {
      id: true,
      nome: true,
      email: true,
      nivel: true,
      ativo: true,
      criadoEm: true,
    },
  });
};

exports.updateAdmin = async (id, data) => {
  const updateData = { ...data };
  if (data.senha) {
    updateData.senha = await bcrypt.hash(data.senha, 10);
  }
  
  return await prisma.adminMaster.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      nome: true,
      email: true,
      nivel: true,
      ativo: true,
      criadoEm: true,
    },
  });
};

exports.blockAdmin = async (id) => {
  return await prisma.adminMaster.update({
    where: { id },
    data: { ativo: false },
    select: {
      id: true,
      nome: true,
      email: true,
      nivel: true,
      ativo: true,
      criadoEm: true,
    },
  });
}; 