const prisma = require('../../config/database');

exports.getDashboardOverview = async () => {
  try {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const inicioAno = new Date();
    inicioAno.setMonth(0, 1);
    inicioAno.setHours(0, 0, 0, 0);

    // Dados principais
    const [
      totalEmpresas,
      totalUsuarios,
      totalEventos,
      totalFaturas,
      eventosNoMes,
      eventosNoAno,
      faturasPendentes,
      faturasPagas,
      faturasVencidas,
      empresasBloqueadas,
      empresasAtivas,
      receitaMes,
      receitaAno,
      receitaTotal,
      totalConvidados,
      totalCheckIns,
      eventosAtivos,
      eventosPublicos
    ] = await Promise.all([
      // Empresas
      prisma.empresa.count(),
      prisma.user.count(),
      prisma.event.count(),
      prisma.fatura.count(),
      
      // Eventos por período
      prisma.event.count({
        where: { createdAt: { gte: inicioMes } }
      }),
      prisma.event.count({
        where: { createdAt: { gte: inicioAno } }
      }),
      
      // Faturas por status
      prisma.fatura.count({ where: { status: 'PENDENTE' } }),
      prisma.fatura.count({ where: { status: 'PAGO' } }),
      prisma.fatura.count({
        where: {
          status: 'PENDENTE',
          vencimento: { lt: new Date() }
        }
      }),
      
      // Status das empresas
      prisma.empresa.count({ where: { status: 'BLOQUEADA' } }),
      prisma.empresa.count({ where: { status: 'ATIVA' } }),
      
      // Receita
      prisma.fatura.aggregate({
        where: {
          status: 'PAGO',
          pagamentoEm: { gte: inicioMes }
        },
        _sum: { valor: true }
      }),
      prisma.fatura.aggregate({
        where: {
          status: 'PAGO',
          pagamentoEm: { gte: inicioAno }
        },
        _sum: { valor: true }
      }),
      prisma.fatura.aggregate({
        where: { status: 'PAGO' },
        _sum: { valor: true }
      }),
      
      // Convidados e check-ins
      prisma.guest.count(),
      prisma.checkIn.count(),
      
      // Status dos eventos
      prisma.event.count({ where: { isActive: true } }),
      prisma.event.count({ where: { isPublic: true } })
    ]);

    // Crescimento mensal (últimos 12 meses)
    const crescimentoMensal = [];
    for (let i = 11; i >= 0; i--) {
      const data = new Date();
      data.setMonth(data.getMonth() - i);
      const inicioMesGraf = new Date(data.getFullYear(), data.getMonth(), 1);
      const fimMesGraf = new Date(data.getFullYear(), data.getMonth() + 1, 0);
      
      const [empresas, eventos, receita] = await Promise.all([
        prisma.empresa.count({
          where: {
            criadoEm: { gte: inicioMesGraf, lte: fimMesGraf }
          }
        }),
        prisma.event.count({
          where: {
            createdAt: { gte: inicioMesGraf, lte: fimMesGraf }
          }
        }),
        prisma.fatura.aggregate({
          where: {
            status: 'PAGO',
            pagamentoEm: { gte: inicioMesGraf, lte: fimMesGraf }
          },
          _sum: { valor: true }
        })
      ]);
      
      crescimentoMensal.push({
        mes: data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        empresas: empresas,
        eventos: eventos,
        receita: receita._sum.valor || 0
      });
    }

    // Top 5 empresas por eventos
    const topEmpresas = await prisma.empresa.findMany({
      select: {
        id: true,
        nome: true,
        emailContato: true,
        status: true,
        _count: {
          select: {
            eventos: true,
            usuarios: true
          }
        }
      },
      orderBy: {
        eventos: { _count: 'desc' }
      },
      take: 5
    });

    // Eventos recentes
    const eventosRecentes = await prisma.event.findMany({
      select: {
        id: true,
        name: true,
        date: true,
        location: true,
        isActive: true,
        empresa: {
          select: {
            nome: true
          }
        },
        _count: {
          select: {
            guests: true,
            checkIns: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Faturas recentes
    const faturasRecentes = await prisma.fatura.findMany({
      select: {
        id: true,
        valor: true,
        status: true,
        vencimento: true,
        pagamentoEm: true,
        empresa: {
          select: {
            nome: true
          }
        },
        plano: {
          select: {
            nome: true
          }
        }
      },
      orderBy: { criadoEm: 'desc' },
      take: 5
    });

    return {
      // Métricas principais
      totalEmpresas,
      totalUsuarios,
      totalEventos,
      totalFaturas,
      
      // Crescimento
      eventosNoMes,
      eventosNoAno,
      
      // Status
      faturasPendentes,
      faturasPagas,
      faturasVencidas,
      empresasBloqueadas,
      empresasAtivas,
      eventosAtivos,
      eventosPublicos,
      
      // Receita
      receitaMes: receitaMes._sum.valor || 0,
      receitaAno: receitaAno._sum.valor || 0,
      receitaTotal: receitaTotal._sum.valor || 0,
      
      // Engajamento
      totalConvidados,
      totalCheckIns,
      
      // Gráficos
      crescimentoMensal,
      
      // Listas
      topEmpresas,
      eventosRecentes,
      faturasRecentes
    };
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    throw error;
  }
}; 