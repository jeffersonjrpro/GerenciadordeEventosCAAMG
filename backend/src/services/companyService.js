const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CompanyService {
  // Criar uma nova empresa
  static async createCompany(name) {
    try {
      const company = await prisma.company.create({
        data: {
          name: name.trim()
        }
      });
      return company;
    } catch (error) {
      throw new Error(`Erro ao criar empresa: ${error.message}`);
    }
  }

  // Buscar empresa por ID
  static async getCompanyById(id) {
    try {
      const company = await prisma.company.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          events: {
            include: {
              organizers: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              }
            }
          }
        }
      });
      return company;
    } catch (error) {
      throw new Error(`Erro ao buscar empresa: ${error.message}`);
    }
  }

  // Buscar empresa por nome
  static async getCompanyByName(name) {
    try {
      const company = await prisma.company.findFirst({
        where: { name: name.trim() }
      });
      return company;
    } catch (error) {
      throw new Error(`Erro ao buscar empresa: ${error.message}`);
    }
  }

  // Atualizar empresa
  static async updateCompany(id, data) {
    try {
      const company = await prisma.company.update({
        where: { id },
        data: {
          name: data.name?.trim(),
          updatedAt: new Date()
        }
      });
      return company;
    } catch (error) {
      throw new Error(`Erro ao atualizar empresa: ${error.message}`);
    }
  }

  // Deletar empresa
  static async deleteCompany(id) {
    try {
      await prisma.company.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      throw new Error(`Erro ao deletar empresa: ${error.message}`);
    }
  }

  // Listar todas as empresas
  static async getAllCompanies() {
    try {
      const companies = await prisma.company.findMany({
        include: {
          _count: {
            select: {
              users: true,
              events: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
      return companies;
    } catch (error) {
      throw new Error(`Erro ao listar empresas: ${error.message}`);
    }
  }

  // Adicionar usuário à empresa
  static async addUserToCompany(userId, companyId) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { companyId },
        include: {
          company: true
        }
      });
      return user;
    } catch (error) {
      throw new Error(`Erro ao adicionar usuário à empresa: ${error.message}`);
    }
  }

  // Remover usuário da empresa
  static async removeUserFromCompany(userId) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { companyId: null }
      });
      return user;
    } catch (error) {
      throw new Error(`Erro ao remover usuário da empresa: ${error.message}`);
    }
  }

  // Buscar usuários de uma empresa
  static async getCompanyUsers(companyId) {
    try {
      const users = await prisma.user.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: {
          name: 'asc'
        }
      });
      return users;
    } catch (error) {
      throw new Error(`Erro ao buscar usuários da empresa: ${error.message}`);
    }
  }

  // Buscar eventos de uma empresa
  static async getCompanyEvents(companyId) {
    try {
      const events = await prisma.event.findMany({
        where: { companyId },
        include: {
          organizers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              guests: true,
              checkIns: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });
      return events;
    } catch (error) {
      throw new Error(`Erro ao buscar eventos da empresa: ${error.message}`);
    }
  }
}

module.exports = CompanyService; 