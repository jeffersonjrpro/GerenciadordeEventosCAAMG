const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

class UserService {
  // Buscar equipe por empresa
  async getEquipeByEmpresaId(empresaId) {
    try {
      const usuarios = await prisma.user.findMany({
        where: {
          empresaId: empresaId
        },
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
          trabalharTodosEventos: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return usuarios;
    } catch (error) {
      console.error('Erro ao buscar equipe:', error);
      throw new Error('Erro ao buscar equipe');
    }
  }

  // Criar usuário da equipe
  async criarUsuarioEquipe(dados) {
    try {
      const { nome, email, telefone, nivel, eventosIds, trabalharTodosEventos, empresaId } = dados;

      // Verificar se o email já existe
      const usuarioExistente = await prisma.user.findFirst({
        where: {
          email: email,
          empresaId: empresaId
        }
      });

      if (usuarioExistente) {
        throw new Error('Email já cadastrado nesta empresa');
      }

      // Gerar senha temporária
      const senhaTemporaria = Math.random().toString(36).slice(-8);
      const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

      // Criar usuário
      const novoUsuario = await prisma.user.create({
        data: {
          name: nome,
          email,
          telefone,
          password: senhaHash,
          nivel,
          ativo: true,
          empresaId,
          eventosIds: eventosIds || [],
          trabalharTodosEventos: trabalharTodosEventos || false
        },
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
          trabalharTodosEventos: true
        }
      });

      // TODO: Enviar email com senha temporária
      console.log(`Senha temporária para ${email}: ${senhaTemporaria}`);

      return novoUsuario;
    } catch (error) {
      console.error('Erro ao criar usuário da equipe:', error);
      throw error;
    }
  }

  // Atualizar usuário da equipe
  async atualizarUsuarioEquipe(userId, dados) {
    try {
      const { nome, email, telefone, nivel, eventosIds, trabalharTodosEventos, empresaId, nomeEmpresa, role } = dados;

      // Verificar se o usuário existe e pertence à empresa
      const usuarioExistente = await prisma.user.findFirst({
        where: {
          id: userId,
          empresaId: empresaId
        }
      });

      if (!usuarioExistente) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se o email já existe (exceto para o próprio usuário)
      if (email !== usuarioExistente.email) {
        const emailExistente = await prisma.user.findFirst({
          where: {
            email: email,
            empresaId: empresaId,
            id: { not: userId }
          }
        });

        if (emailExistente) {
          throw new Error('Email já cadastrado nesta empresa');
        }
      }

      // Atualizar usuário
      const usuarioAtualizado = await prisma.user.update({
        where: {
          id: userId
        },
        data: {
          name: nome,
          email,
          telefone,
          nivel,
          eventosIds: eventosIds || [],
          trabalharTodosEventos: trabalharTodosEventos || false,
          nomeEmpresa,
          ...(role && { role })
        },
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
          nomeEmpresa: true,
          role: true
        }
      });

      return usuarioAtualizado;
    } catch (error) {
      console.error('Erro ao atualizar usuário da equipe:', error);
      throw error;
    }
  }

  // Remover usuário da equipe
  async removerUsuarioEquipe(userId, empresaId) {
    try {
      // Verificar se o usuário existe e pertence à empresa
      const usuario = await prisma.user.findFirst({
        where: {
          id: userId,
          empresaId: empresaId
        }
      });

      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se o usuário é o proprietário da empresa
      if (usuario.nivel === 'PROPRIETARIO') {
        throw new Error('Não é possível remover o proprietário da empresa');
      }

      // Desativar usuário (soft delete)
      await prisma.user.update({
        where: {
          id: userId
        },
        data: {
          ativo: false
        }
      });

      return true;
    } catch (error) {
      console.error('Erro ao remover usuário da equipe:', error);
      throw error;
    }
  }

  // Buscar usuário por ID
  async getUserById(userId) {
    try {
      const usuario = await prisma.user.findUnique({
        where: {
          id: userId
        },
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
          empresaId: true,
          nomeEmpresa: true,
          empresa: {
            select: {
              id: true,
              nome: true,
              emailContato: true,
              status: true,
            }
          },
          empresasCriadas: {
            select: {
              id: true,
              nome: true,
              emailContato: true,
              status: true,
            }
          }
        }
      });

      return usuario;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw new Error('Erro ao buscar usuário');
    }
  }

  // Atualizar perfil do usuário
  async atualizarPerfil(userId, dados) {
    try {
      const { nome, email, telefone, senhaAtual, novaSenha } = dados;

      // Buscar usuário atual
      const usuario = await prisma.user.findUnique({
        where: {
          id: userId
        }
      });

      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar senha atual se for alterar a senha
      if (novaSenha) {
        const senhaValida = await bcrypt.compare(senhaAtual, usuario.password);
        if (!senhaValida) {
          throw new Error('Senha atual incorreta');
        }
      }

      // Verificar se o email já existe (exceto para o próprio usuário)
      if (email !== usuario.email) {
        const emailExistente = await prisma.user.findFirst({
          where: {
            email: email,
            empresaId: usuario.empresaId,
            id: { not: userId }
          }
        });

        if (emailExistente) {
          throw new Error('Email já cadastrado');
        }
      }

      // Preparar dados para atualização
      const dadosAtualizacao = {
        name: nome,
        email,
        telefone
      };

      // Adicionar nova senha se fornecida
      if (novaSenha) {
        dadosAtualizacao.password = await bcrypt.hash(novaSenha, 10);
      }

      // Atualizar usuário
      const usuarioAtualizado = await prisma.user.update({
        where: {
          id: userId
        },
        data: dadosAtualizacao,
        select: {
          id: true,
          name: true,
          email: true,
          telefone: true,
          nivel: true,
          ativo: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return usuarioAtualizado;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }
}

module.exports = new UserService(); 