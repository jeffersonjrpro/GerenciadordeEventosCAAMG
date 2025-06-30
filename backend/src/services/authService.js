const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

class AuthService {
  // Registrar novo usuário
  static async register(userData) {
    const { email, name, password, telefone, nomeEmpresa } = userData;

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('Email já cadastrado');

    // Criptografar senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Verificar se já existe empresa com esse nome
    let empresa = await prisma.empresa.findFirst({ where: { nome: nomeEmpresa } });
    if (!empresa) {
      empresa = await prisma.empresa.create({
        data: {
          nome: nomeEmpresa,
          emailContato: email,
          telefone: telefone,
          status: 'ATIVA',
        }
      });
    }

    // Criar usuário vinculado à empresa
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        telefone,
        nomeEmpresa,
        role: 'ADMIN',
        nivel: 'ADMIN',
        empresaId: empresa.id,
        trabalharTodosEventos: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        telefone: true,
        nomeEmpresa: true,
        role: true,
        nivel: true,
        empresaId: true,
        trabalharTodosEventos: true,
        createdAt: true
      }
    });

    // Gerar token JWT
    const token = this.generateToken(user.id);

    return {
      user,
      token
    };
  }

  // Login de usuário
  static async login(credentials) {
    const { email, password } = credentials;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        nivel: true,
        empresaId: true,
        telefone: true,
        nomeEmpresa: true,
        trabalharTodosEventos: true,
        eventosIds: true,
        ativo: true,
        podeGerenciarDemandas: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Email ou senha inválidos');
    }

    // Atualizar lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Gerar token JWT
    const token = this.generateToken(user.id);

    // Retornar dados do usuário (sem senha)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      nivel: user.nivel,
      empresaId: user.empresaId,
      telefone: user.telefone,
      nomeEmpresa: user.nomeEmpresa,
      trabalharTodosEventos: user.trabalharTodosEventos,
      eventosIds: user.eventosIds,
      ativo: user.ativo,
      podeGerenciarDemandas: user.podeGerenciarDemandas,
      createdAt: user.createdAt,
      lastLoginAt: new Date()
    };

    return {
      user: userData,
      token
    };
  }

  // Gerar token JWT
  static generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token válido por 7 dias
    );
  }

  // Verificar token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  // Atualizar perfil do usuário
  static async updateProfile(userId, updateData) {
    console.log('=== DEBUG AUTH SERVICE UPDATE PROFILE ===');
    console.log('User ID:', userId);
    console.log('Update data:', updateData);
    
    const { name, email, telefone, nomeEmpresa } = updateData;

    // Buscar usuário atual
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    console.log('Current user:', currentUser);

    if (!currentUser) {
      throw new Error('Usuário não encontrado');
    }

    // Preparar dados para atualização
    const updateFields = {};

    if (name) updateFields.name = name;
    if (telefone !== undefined) updateFields.telefone = telefone;
    if (nomeEmpresa !== undefined) updateFields.nomeEmpresa = nomeEmpresa;
    
    if (email && email !== currentUser.email) {
      // Verificar se novo email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new Error('Email já está em uso');
      }
      updateFields.email = email;
    }

    console.log('Update fields:', updateFields);

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateFields,
      select: {
        id: true,
        email: true,
        name: true,
        telefone: true,
        nomeEmpresa: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('Updated user:', updatedUser);

    // Atualizar nome da empresa na tabela empresas, se o usuário for admin e mudou o nome
    if (nomeEmpresa !== undefined && currentUser.empresaId) {
      await prisma.empresa.update({
        where: { id: currentUser.empresaId },
        data: { nome: nomeEmpresa }
      });
    }

    return updatedUser;
  }

  // Alterar senha do usuário
  static async updatePassword(userId, passwordData) {
    const { currentPassword, newPassword } = passwordData;

    // Buscar usuário atual
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
    
    if (!isCurrentPasswordValid) {
      throw new Error('Senha atual incorreta');
    }

    // Criptografar nova senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return true;
  }

  // Buscar usuário por ID
  static async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        telefone: true,
        nomeEmpresa: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  }

  // Listar todos os usuários (apenas para admin)
  static async getAllUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            events: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return users;
  }

  // Deletar usuário (apenas para admin)
  static async deleteUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        events: {
          include: {
            guests: true,
            checkIns: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Deletar usuário (cascade irá deletar eventos, convidados e check-ins)
    await prisma.user.delete({
      where: { id: userId }
    });

    return { message: 'Usuário deletado com sucesso' };
  }
}

module.exports = AuthService; 