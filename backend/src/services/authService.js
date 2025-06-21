const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

class AuthService {
  // Registrar novo usuário
  static async register(userData) {
    const { email, name, password } = userData;

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Criptografar senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'ORGANIZER' // Por padrão, novos usuários são organizadores
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
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
      where: { email }
    });

    if (!user) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Email ou senha inválidos');
    }

    // Gerar token JWT
    const token = this.generateToken(user.id);

    // Retornar dados do usuário (sem senha)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
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
    const { name, email, currentPassword, newPassword } = updateData;

    // Buscar usuário atual
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      throw new Error('Usuário não encontrado');
    }

    // Preparar dados para atualização
    const updateFields = {};

    if (name) updateFields.name = name;
    
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

    // Se quiser alterar senha
    if (newPassword) {
      if (!currentPassword) {
        throw new Error('Senha atual é necessária para alterar a senha');
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      
      if (!isCurrentPasswordValid) {
        throw new Error('Senha atual incorreta');
      }

      // Criptografar nova senha
      const saltRounds = 12;
      updateFields.password = await bcrypt.hash(newPassword, saltRounds);
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateFields,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return updatedUser;
  }

  // Buscar usuário por ID
  static async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
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