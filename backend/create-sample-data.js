const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleData() {
  try {
    console.log('🔄 Criando dados de exemplo...');
    
    // Criar planos
    const planoBasico = await prisma.plano.create({
      data: {
        nome: 'Básico',
        preco: 99.00,
        descricao: 'Ideal para pequenas empresas',
        limiteEventos: 5,
        limiteConvidados: 500,
      },
    });
    
    const planoProfissional = await prisma.plano.create({
      data: {
        nome: 'Profissional',
        preco: 299.00,
        descricao: 'Para empresas em crescimento',
        limiteEventos: 50,
        limiteConvidados: 5000,
      },
    });
    
    const planoEnterprise = await prisma.plano.create({
      data: {
        nome: 'Enterprise',
        preco: 599.00,
        descricao: 'Para grandes empresas',
        limiteEventos: 200,
        limiteConvidados: 20000,
      },
    });
    
    console.log('✅ Planos criados');
    
    // Criar empresas
    const empresa1 = await prisma.empresa.create({
      data: {
        nome: 'Tech Solutions Ltda',
        emailContato: 'contato@techsolutions.com',
        status: 'ATIVA',
        planoId: planoProfissional.id,
      },
    });
    
    const empresa2 = await prisma.empresa.create({
      data: {
        nome: 'Eventos Express',
        emailContato: 'admin@eventosexpress.com',
        status: 'ATIVA',
        planoId: planoBasico.id,
      },
    });
    
    const empresa3 = await prisma.empresa.create({
      data: {
        nome: 'Mega Corp',
        emailContato: 'financeiro@megacorp.com',
        status: 'BLOQUEADA',
        planoId: planoEnterprise.id,
      },
    });
    
    console.log('✅ Empresas criadas');
    
    // Criar faturas
    await prisma.fatura.create({
      data: {
        empresaId: empresa1.id,
        planoId: planoProfissional.id,
        valor: 299.00,
        status: 'PAGO',
        vencimento: new Date('2025-06-15'),
        pagamentoEm: new Date('2025-06-10'),
      },
    });
    
    await prisma.fatura.create({
      data: {
        empresaId: empresa1.id,
        planoId: planoProfissional.id,
        valor: 299.00,
        status: 'PENDENTE',
        vencimento: new Date('2025-07-15'),
      },
    });
    
    await prisma.fatura.create({
      data: {
        empresaId: empresa2.id,
        planoId: planoBasico.id,
        valor: 99.00,
        status: 'PAGO',
        vencimento: new Date('2025-06-20'),
        pagamentoEm: new Date('2025-06-18'),
      },
    });
    
    await prisma.fatura.create({
      data: {
        empresaId: empresa3.id,
        planoId: planoEnterprise.id,
        valor: 599.00,
        status: 'PENDENTE',
        vencimento: new Date('2025-06-10'), // Vencida
      },
    });
    
    console.log('✅ Faturas criadas');
    
    // Criar alguns logs
    await prisma.adminLog.create({
      data: {
        adminId: 'cmc85sddl0000fcdvt5tfk99c', // ID do admin master criado
        acao: 'CRIAR_EMPRESA',
        detalhes: { empresa: 'Tech Solutions Ltda' },
      },
    });
    
    await prisma.adminLog.create({
      data: {
        adminId: 'cmc85sddl0000fcdvt5tfk99c',
        acao: 'BLOQUEAR_EMPRESA',
        detalhes: { empresa: 'Mega Corp' },
      },
    });
    
    console.log('✅ Logs criados');
    
    console.log('🎉 Dados de exemplo criados com sucesso!');
    console.log('📊 Agora você pode testar o painel admin com dados reais');
    
  } catch (error) {
    console.error('❌ Erro ao criar dados de exemplo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData(); 