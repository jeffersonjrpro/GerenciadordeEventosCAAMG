const prisma = require('../../config/database');

exports.listPlanos = async () => {
  return await prisma.plano.findMany({
    include: {
      _count: {
        select: {
          empresas: true,
        },
      },
    },
    orderBy: {
      preco: 'asc',
    },
  });
};

exports.createPlano = async (data) => {
  return await prisma.plano.create({
    data: {
      nome: data.nome,
      preco: parseFloat(data.preco),
      descricao: data.descricao,
      limiteEventos: parseInt(data.limiteEventos),
      limiteConvidados: parseInt(data.limiteConvidados),
      limiteEmpresas: data.limiteEmpresas ? parseInt(data.limiteEmpresas) : null,
    },
  });
};

exports.updatePlano = async (id, data) => {
  return await prisma.plano.update({
    where: { id },
    data: {
      nome: data.nome,
      preco: parseFloat(data.preco),
      descricao: data.descricao,
      limiteEventos: parseInt(data.limiteEventos),
      limiteConvidados: parseInt(data.limiteConvidados),
      limiteEmpresas: data.limiteEmpresas ? parseInt(data.limiteEmpresas) : null,
    },
  });
};

exports.deletePlano = async (id) => {
  // Verificar se há empresas usando este plano
  const empresasComPlano = await prisma.empresa.count({
    where: { planoId: id }
  });

  if (empresasComPlano > 0) {
    throw new Error('Não é possível excluir um plano que está sendo usado por empresas');
  }

  return await prisma.plano.delete({
    where: { id }
  });
}; 