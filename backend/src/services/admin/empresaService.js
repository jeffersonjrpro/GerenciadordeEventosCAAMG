const prisma = require('../../config/database');

exports.listEmpresas = async (userId, isMaster = false) => {
  const where = isMaster ? {} : { createdById: userId };
  return await prisma.empresa.findMany({
    where,
    include: {
      plano: {
        select: {
          nome: true,
          preco: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          usuarios: true,
          eventos: true,
        },
      },
    },
    orderBy: {
      criadoEm: 'desc',
    },
  });
};

// Função utilitária para gerar código único
function generateEmpresaCodigo() {
  return Math.random().toString(36).substring(2, 10);
}

exports.createEmpresa = async (data, userId, isMaster = false) => {
  return await prisma.empresa.create({
    data: {
      nome: data.nome,
      emailContato: data.emailContato,
      telefone: data.telefone,
      endereco: data.endereco,
      cidade: data.cidade,
      estado: data.estado,
      cep: data.cep,
      status: data.status || 'ATIVA',
      planoId: data.planoId,
      createdById: isMaster ? data.createdById : userId,
      ownerId: isMaster ? data.createdById : userId, // Definir o criador como proprietário
      codigo: generateEmpresaCodigo(), // Gera código único
    },
    include: {
      plano: {
        select: {
          nome: true,
          preco: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

exports.updateEmpresa = async (id, data) => {
  return await prisma.empresa.update({
    where: { id },
    data: {
      nome: data.nome,
      emailContato: data.emailContato,
      telefone: data.telefone,
      endereco: data.endereco,
      cidade: data.cidade,
      estado: data.estado,
      cep: data.cep,
      status: data.status,
      planoId: data.planoId,
    },
    include: {
      plano: {
        select: {
          nome: true,
          preco: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

exports.blockEmpresa = async (id) => {
  // Primeiro, buscar a empresa atual para verificar o status
  const empresaAtual = await prisma.empresa.findUnique({
    where: { id },
    select: { status: true }
  });

  if (!empresaAtual) {
    throw new Error('Empresa não encontrada');
  }

  // Alternar o status
  const novoStatus = empresaAtual.status === 'ATIVA' ? 'BLOQUEADA' : 'ATIVA';

  return await prisma.empresa.update({
    where: { id },
    data: { status: novoStatus },
    include: {
      plano: {
        select: {
          nome: true,
          preco: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

exports.getEmpresa = async (id) => {
  return await prisma.empresa.findUnique({
    where: { id },
    include: {
      plano: {
        select: {
          nome: true,
          preco: true,
          limiteEventos: true,
          limiteConvidados: true,
        },
      },
      usuarios: {
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
        },
      },
      eventos: {
        select: {
          id: true,
          name: true,
          date: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      faturas: {
        select: {
          id: true,
          valor: true,
          status: true,
          vencimento: true,
          pagamentoEm: true,
        },
        orderBy: {
          criadoEm: 'desc',
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

exports.deleteEmpresa = async (id) => {
  // Verificar se há usuários ou eventos associados
  const empresa = await prisma.empresa.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          usuarios: true,
          eventos: true,
        },
      },
    },
  });

  if (!empresa) {
    throw new Error('Empresa não encontrada');
  }

  if (empresa._count.usuarios > 0 || empresa._count.eventos > 0) {
    throw new Error('Não é possível excluir uma empresa que possui usuários ou eventos associados');
  }

  return await prisma.empresa.delete({
    where: { id }
  });
};

exports.getEmpresaByCodigo = async (codigo) => {
  // Busca a empresa diretamente pelo campo 'codigo'
  return await prisma.empresa.findUnique({
    where: { codigo },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}; 