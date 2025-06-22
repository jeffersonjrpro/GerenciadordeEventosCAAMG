const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SubEventoService {
  // Criar um novo subevento
  async criarSubEvento(eventoId, dados) {
    try {
      // Verificar se o evento existe
      const evento = await prisma.event.findUnique({
        where: { id: eventoId }
      });
      
      if (!evento) {
        return { success: false, error: 'Evento não encontrado' };
      }
      
      const subEvento = await prisma.subEvento.create({
        data: {
          nome: dados.nome,
          descricao: dados.descricao,
          dataHora: new Date(dados.dataHora),
          local: dados.local,
          limitePorConvidado: dados.limitePorConvidado || 1,
          eventoId: eventoId
        },
        include: {
          evento: true
        }
      });

      return { success: true, data: subEvento };
    } catch (error) {
      console.error('Erro ao criar subevento:', error);
      return { success: false, error: error.message };
    }
  }

  // Listar todos os subeventos de um evento
  async listarSubEventos(eventoId) {
    try {
      const subEventos = await prisma.subEvento.findMany({
        where: {
          eventoId: eventoId
        },
        include: {
          consumos: {
            include: {
              convidado: {
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
              consumos: true
            }
          }
        },
        orderBy: {
          dataHora: 'asc'
        }
      });

      return { success: true, data: subEventos };
    } catch (error) {
      console.error('Erro ao listar subeventos:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter um subevento específico
  async obterSubEvento(subEventoId) {
    try {
      const subEvento = await prisma.subEvento.findUnique({
        where: {
          id: subEventoId
        },
        include: {
          evento: true,
          consumos: {
            include: {
              convidado: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!subEvento) {
        return { success: false, error: 'Subevento não encontrado' };
      }

      return { success: true, data: subEvento };
    } catch (error) {
      console.error('Erro ao obter subevento:', error);
      return { success: false, error: error.message };
    }
  }

  // Atualizar um subevento
  async atualizarSubEvento(subEventoId, dados) {
    try {
      const subEvento = await prisma.subEvento.update({
        where: {
          id: subEventoId
        },
        data: {
          nome: dados.nome,
          descricao: dados.descricao,
          dataHora: dados.dataHora ? new Date(dados.dataHora) : undefined,
          local: dados.local,
          limitePorConvidado: dados.limitePorConvidado
        },
        include: {
          evento: true
        }
      });

      return { success: true, data: subEvento };
    } catch (error) {
      console.error('Erro ao atualizar subevento:', error);
      return { success: false, error: error.message };
    }
  }

  // Excluir um subevento
  async excluirSubEvento(subEventoId) {
    try {
      await prisma.subEvento.delete({
        where: {
          id: subEventoId
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir subevento:', error);
      return { success: false, error: error.message };
    }
  }

  // Validar acesso ao subevento (registrar consumo)
  async validarAcesso(subEventoId, qrCode) {
    try {
      // Buscar o convidado pelo QR Code
      const convidado = await prisma.guest.findUnique({
        where: {
          qrCode: qrCode
        },
        include: {
          evento: true
        }
      });

      if (!convidado) {
        return { 
          success: false, 
          error: 'QR Code inválido',
          status: 'INVALID_QR'
        };
      }

      // Buscar o subevento
      const subEvento = await prisma.subEvento.findUnique({
        where: {
          id: subEventoId
        },
        include: {
          evento: true
        }
      });

      if (!subEvento) {
        return { 
          success: false, 
          error: 'Subevento não encontrado',
          status: 'SUBEVENT_NOT_FOUND'
        };
      }

      // Verificar se o convidado pertence ao evento do subevento
      if (convidado.eventoId !== subEvento.eventoId) {
        return { 
          success: false, 
          error: 'Convidado não pertence a este evento',
          status: 'GUEST_NOT_IN_EVENT'
        };
      }

      // Verificar se já existe um consumo para este convidado neste subevento
      const consumoExistente = await prisma.consumo.findUnique({
        where: {
          convidadoId_subEventoId: {
            convidadoId: convidado.id,
            subEventoId: subEventoId
          }
        }
      });

      if (consumoExistente) {
        return { 
          success: false, 
          error: `Limite atingido. Este convidado já consumiu ${subEvento.limitePorConvidado}/${subEvento.limitePorConvidado} ${subEvento.nome}`,
          status: 'LIMIT_REACHED',
          data: {
            convidado: convidado,
            subEvento: subEvento,
            consumoExistente: consumoExistente
          }
        };
      }

      // Registrar o consumo
      const consumo = await prisma.consumo.create({
        data: {
          convidadoId: convidado.id,
          subEventoId: subEventoId
        },
        include: {
          convidado: true,
          subEvento: true
        }
      });

      return { 
        success: true, 
        message: `Acesso permitido! ${convidado.name} consumiu ${subEvento.nome}`,
        status: 'ACCESS_GRANTED',
        data: {
          convidado: convidado,
          subEvento: subEvento,
          consumo: consumo
        }
      };

    } catch (error) {
      console.error('Erro ao validar acesso:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter relatório de consumo de um subevento
  async obterRelatorioConsumo(subEventoId) {
    try {
      const subEvento = await prisma.subEvento.findUnique({
        where: {
          id: subEventoId
        },
        include: {
          evento: true,
          consumos: {
            include: {
              convidado: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: {
              timestamp: 'desc'
            }
          }
        }
      });

      if (!subEvento) {
        return { success: false, error: 'Subevento não encontrado' };
      }

      // Buscar todos os convidados do evento que ainda não consumiram
      const convidadosSemConsumo = await prisma.guest.findMany({
        where: {
          eventId: subEvento.eventoId,
          id: {
            notIn: subEvento.consumos.map(c => c.convidadoId)
          }
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      });

      const relatorio = {
        subEvento: subEvento,
        totalConsumos: subEvento.consumos.length,
        limitePorConvidado: subEvento.limitePorConvidado,
        convidadosComConsumo: subEvento.consumos,
        convidadosSemConsumo: convidadosSemConsumo,
        totalConvidadosEvento: subEvento.consumos.length + convidadosSemConsumo.length
      };

      return { success: true, data: relatorio };
    } catch (error) {
      console.error('Erro ao obter relatório:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter estatísticas de todos os subeventos de um evento
  async obterEstatisticasEvento(eventoId) {
    try {
      const subEventos = await prisma.subEvento.findMany({
        where: {
          eventoId: eventoId
        },
        include: {
          consumos: {
            include: {
              convidado: {
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
              consumos: true
            }
          }
        }
      });

      const estatisticas = subEventos.map(subEvento => ({
        id: subEvento.id,
        nome: subEvento.nome,
        dataHora: subEvento.dataHora,
        local: subEvento.local,
        limitePorConvidado: subEvento.limitePorConvidado,
        totalConsumos: subEvento._count.consumos,
        consumos: subEvento.consumos
      }));

      return { success: true, data: estatisticas };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SubEventoService(); 