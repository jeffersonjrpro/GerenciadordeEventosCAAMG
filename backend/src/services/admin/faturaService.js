const prisma = require('../../config/database');

exports.listFaturas = async () => {
  return await prisma.fatura.findMany({
    include: {
      empresa: {
        select: {
          nome: true,
          emailContato: true,
        },
      },
      plano: {
        select: {
          nome: true,
        },
      },
    },
    orderBy: {
      criadoEm: 'desc',
    },
  });
};

exports.createFatura = async (data) => {
  return await prisma.fatura.create({
    data: {
      empresaId: data.empresaId,
      planoId: data.planoId,
      valor: parseFloat(data.valor),
      status: data.status || 'PENDENTE',
      vencimento: new Date(data.vencimento),
    },
    include: {
      empresa: {
        select: {
          nome: true,
          emailContato: true,
        },
      },
      plano: {
        select: {
          nome: true,
        },
      },
    },
  });
};

exports.markFaturaPaid = async (id) => {
  return await prisma.fatura.update({
    where: { id },
    data: {
      status: 'PAGO',
      pagamentoEm: new Date(),
    },
    include: {
      empresa: {
        select: {
          nome: true,
          emailContato: true,
        },
      },
      plano: {
        select: {
          nome: true,
        },
      },
    },
  });
}; 