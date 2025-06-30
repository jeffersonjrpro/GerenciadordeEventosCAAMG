const prisma = require('../../config/database');

exports.listLogs = async () => {
  return await prisma.adminLog.findMany({
    include: {
      admin: {
        select: {
          nome: true,
          email: true,
        },
      },
    },
    orderBy: {
      criadoEm: 'desc',
    },
  });
};

exports.createLog = async (adminId, acao, detalhes = null) => {
  return await prisma.adminLog.create({
    data: {
      adminId,
      acao,
      detalhes,
    },
    include: {
      admin: {
        select: {
          nome: true,
          email: true,
        },
      },
    },
  });
}; 