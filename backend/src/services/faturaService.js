const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class FaturaService {
  // Buscar faturas por empresa
  async getFaturasByEmpresaId(empresaId) {
    try {
      const faturas = await prisma.fatura.findMany({
        where: {
          empresaId: empresaId
        },
        orderBy: {
          criadoEm: 'desc'
        }
      });

      return faturas;
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
      throw new Error('Erro ao buscar faturas');
    }
  }

  // Buscar fatura por ID
  async getFaturaById(faturaId) {
    try {
      const fatura = await prisma.fatura.findUnique({
        where: {
          id: faturaId
        },
        include: {
          empresa: {
            include: {
              plano: true
            }
          }
        }
      });

      return fatura;
    } catch (error) {
      console.error('Erro ao buscar fatura:', error);
      throw new Error('Erro ao buscar fatura');
    }
  }

  // Criar nova fatura
  async criarFatura(dados) {
    try {
      const { empresaId, valor, vencimento, descricao } = dados;

      const fatura = await prisma.fatura.create({
        data: {
          empresaId,
          valor,
          vencimento: new Date(vencimento),
          descricao,
          status: 'PENDENTE'
        }
      });

      return fatura;
    } catch (error) {
      console.error('Erro ao criar fatura:', error);
      throw new Error('Erro ao criar fatura');
    }
  }

  // Marcar fatura como paga
  async marcarComoPaga(faturaId) {
    try {
      const fatura = await prisma.fatura.update({
        where: {
          id: faturaId
        },
        data: {
          status: 'PAGO',
          dataPagamento: new Date()
        }
      });

      return fatura;
    } catch (error) {
      console.error('Erro ao marcar fatura como paga:', error);
      throw new Error('Erro ao processar pagamento');
    }
  }

  // Gerar fatura mensal
  async gerarFaturaMensal(empresaId, mes, ano) {
    try {
      // Buscar empresa e plano
      const empresa = await prisma.empresa.findUnique({
        where: {
          id: empresaId
        },
        include: {
          plano: true
        }
      });

      if (!empresa || !empresa.plano) {
        throw new Error('Empresa ou plano não encontrado');
      }

      // Verificar se já existe fatura para este mês
      const faturaExistente = await prisma.fatura.findFirst({
        where: {
          empresaId,
          vencimento: {
            gte: new Date(ano, mes - 1, 1),
            lt: new Date(ano, mes, 1)
          }
        }
      });

      if (faturaExistente) {
        throw new Error('Fatura para este mês já existe');
      }

      // Criar fatura
      const vencimento = new Date(ano, mes - 1, 15); // Vencimento no dia 15
      const fatura = await this.criarFatura({
        empresaId,
        valor: empresa.plano.preco,
        vencimento,
        descricao: `Fatura mensal - ${mes}/${ano} - Plano ${empresa.plano.nome}`
      });

      return fatura;
    } catch (error) {
      console.error('Erro ao gerar fatura mensal:', error);
      throw error;
    }
  }

  // Buscar estatísticas de faturas
  async getEstatisticasFaturas(empresaId) {
    try {
      const faturas = await prisma.fatura.findMany({
        where: {
          empresaId: empresaId
        }
      });

      const estatisticas = {
        total: faturas.length,
        pagas: faturas.filter(f => f.status === 'PAGO').length,
        pendentes: faturas.filter(f => f.status === 'PENDENTE').length,
        vencidas: faturas.filter(f => f.status === 'VENCIDA').length,
        valorTotal: faturas.reduce((sum, f) => sum + f.valor, 0),
        valorPago: faturas.filter(f => f.status === 'PAGO').reduce((sum, f) => sum + f.valor, 0),
        valorPendente: faturas.filter(f => f.status === 'PENDENTE').reduce((sum, f) => sum + f.valor, 0),
        valorVencido: faturas.filter(f => f.status === 'VENCIDA').reduce((sum, f) => sum + f.valor, 0)
      };

      return estatisticas;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de faturas:', error);
      throw new Error('Erro ao buscar estatísticas');
    }
  }

  // Verificar faturas vencidas
  async verificarFaturasVencidas() {
    try {
      const hoje = new Date();
      
      const faturasVencidas = await prisma.fatura.findMany({
        where: {
          status: 'PENDENTE',
          vencimento: {
            lt: hoje
          }
        }
      });

      // Marcar faturas como vencidas
      for (const fatura of faturasVencidas) {
        await prisma.fatura.update({
          where: {
            id: fatura.id
          },
          data: {
            status: 'VENCIDA'
          }
        });
      }

      return faturasVencidas.length;
    } catch (error) {
      console.error('Erro ao verificar faturas vencidas:', error);
      throw new Error('Erro ao verificar faturas vencidas');
    }
  }
}

module.exports = new FaturaService(); 