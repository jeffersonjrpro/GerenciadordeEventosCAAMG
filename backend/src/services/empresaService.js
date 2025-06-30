const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class EmpresaService {
  // Buscar empresa por ID do usuário
  async getEmpresaByUserId(userId) {
    try {
      // Primeiro, buscar o usuário para obter o empresaId
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { empresaId: true }
      });

      if (!user || !user.empresaId) {
        return null;
      }

      // Buscar a empresa pelo empresaId
      const empresa = await prisma.empresa.findUnique({
        where: { id: user.empresaId },
        include: {
          plano: true
        }
      });

      return empresa;
    } catch (error) {
      console.error('Erro ao buscar empresa por usuário:', error);
      throw new Error('Erro ao buscar empresa');
    }
  }

  // Buscar plano por ID da empresa
  async getPlanoByEmpresaId(empresaId) {
    try {
      const empresa = await prisma.empresa.findUnique({
        where: {
          id: empresaId
        },
        include: {
          plano: true
        }
      });

      return empresa?.plano || null;
    } catch (error) {
      console.error('Erro ao buscar plano da empresa:', error);
      throw new Error('Erro ao buscar plano');
    }
  }

  // Buscar empresa por ID
  async getEmpresaById(empresaId) {
    try {
      const empresa = await prisma.empresa.findUnique({
        where: {
          id: empresaId
        },
        include: {
          plano: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              nivel: true,
              ativo: true
            }
          },
          eventos: {
            select: {
              id: true,
              name: true,
              date: true,
              isActive: true
            }
          }
        }
      });

      return empresa;
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
      throw new Error('Erro ao buscar empresa');
    }
  }

  // Listar todas as empresas (para admin)
  async listarEmpresas(filtros = {}) {
    try {
      const where = {};
      
      if (filtros.nome) {
        where.nome = {
          contains: filtros.nome,
          mode: 'insensitive'
        };
      }
      
      if (filtros.status) {
        where.status = filtros.status;
      }
      
      if (filtros.planoId) {
        where.planoId = filtros.planoId;
      }

      const empresas = await prisma.empresa.findMany({
        where,
        include: {
          plano: true,
          _count: {
            select: {
              users: true,
              eventos: true
            }
          }
        },
        orderBy: {
          criadoEm: 'desc'
        }
      });

      return empresas;
    } catch (error) {
      console.error('Erro ao listar empresas:', error);
      throw new Error('Erro ao listar empresas');
    }
  }

  // Criar empresa
  async criarEmpresa(dados) {
    try {
      const { nome, emailContato, telefone, endereco, cidade, estado, cep, planoId } = dados;

      const empresa = await prisma.empresa.create({
        data: {
          nome,
          emailContato,
          telefone,
          endereco,
          cidade,
          estado,
          cep,
          planoId,
          status: 'ATIVA'
        },
        include: {
          plano: true
        }
      });

      return empresa;
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      throw new Error('Erro ao criar empresa');
    }
  }

  // Atualizar empresa
  async atualizarEmpresa(empresaId, dados) {
    try {
      const { nome, emailContato, telefone, endereco, cidade, estado, cep, planoId } = dados;

      const empresa = await prisma.empresa.update({
        where: {
          id: empresaId
        },
        data: {
          nome,
          emailContato,
          telefone,
          endereco,
          cidade,
          estado,
          cep,
          planoId
        },
        include: {
          plano: true
        }
      });

      return empresa;
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      throw new Error('Erro ao atualizar empresa');
    }
  }

  // Bloquear/Desbloquear empresa
  async toggleStatusEmpresa(empresaId) {
    try {
      const empresa = await prisma.empresa.findUnique({
        where: {
          id: empresaId
        }
      });

      if (!empresa) {
        throw new Error('Empresa não encontrada');
      }

      const novoStatus = empresa.status === 'ATIVA' ? 'BLOQUEADA' : 'ATIVA';

      const empresaAtualizada = await prisma.empresa.update({
        where: {
          id: empresaId
        },
        data: {
          status: novoStatus
        },
        include: {
          plano: true
        }
      });

      return empresaAtualizada;
    } catch (error) {
      console.error('Erro ao alterar status da empresa:', error);
      throw error;
    }
  }

  // Excluir empresa
  async excluirEmpresa(empresaId) {
    try {
      // Verificar se a empresa tem usuários ou eventos
      const empresa = await prisma.empresa.findUnique({
        where: {
          id: empresaId
        },
        include: {
          _count: {
            select: {
              users: true,
              eventos: true
            }
          }
        }
      });

      if (!empresa) {
        throw new Error('Empresa não encontrada');
      }

      if (empresa._count.users > 0) {
        throw new Error('Não é possível excluir uma empresa que possui usuários');
      }

      if (empresa._count.eventos > 0) {
        throw new Error('Não é possível excluir uma empresa que possui eventos');
      }

      await prisma.empresa.delete({
        where: {
          id: empresaId
        }
      });

      return true;
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      throw error;
    }
  }
}

module.exports = new EmpresaService(); 