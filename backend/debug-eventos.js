const prisma = require('./src/config/database');

async function debugEventos() {
  try {
    console.log('=== DEBUG EVENTOS E USUÁRIOS ===');
    
    // 1. Verificar todos os usuários
    console.log('\n1. USUÁRIOS NO BANCO:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        empresaId: true,
        codigoEmpresa: true,
        trabalharTodosEventos: true,
        eventosIds: true,
        createdAt: true
      }
    });
    
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}):`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  empresaId: ${user.empresaId}`);
      console.log(`  codigoEmpresa: ${user.codigoEmpresa}`);
      console.log(`  trabalharTodosEventos: ${user.trabalharTodosEventos}`);
      console.log(`  eventosIds: ${JSON.stringify(user.eventosIds)}`);
      console.log(`  Criado em: ${user.createdAt}`);
      console.log('');
    });
    
    // 2. Verificar todas as empresas
    console.log('\n2. EMPRESAS NO BANCO:');
    const empresas = await prisma.empresa.findMany({
      select: {
        id: true,
        nome: true,
        codigo: true,
        ownerId: true,
        criadoEm: true
      }
    });
    
    empresas.forEach(empresa => {
      console.log(`- ${empresa.nome}:`);
      console.log(`  ID: ${empresa.id}`);
      console.log(`  codigo: ${empresa.codigo}`);
      console.log(`  ownerId: ${empresa.ownerId}`);
      console.log(`  Criada em: ${empresa.criadoEm}`);
      console.log('');
    });
    
    // 3. Verificar todos os eventos
    console.log('\n3. EVENTOS NO BANCO:');
    const eventos = await prisma.event.findMany({
      select: {
        id: true,
        name: true,
        date: true,
        isActive: true,
        empresaId: true,
        userId: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (eventos.length === 0) {
      console.log('❌ Nenhum evento encontrado no banco!');
    } else {
      eventos.forEach(evento => {
        console.log(`- ${evento.name}:`);
        console.log(`  ID: ${evento.id}`);
        console.log(`  Data: ${evento.date}`);
        console.log(`  Ativo: ${evento.isActive}`);
        console.log(`  empresaId: ${evento.empresaId}`);
        console.log(`  userId (criador): ${evento.userId}`);
        console.log(`  Criado por: ${evento.user?.name} (${evento.user?.email})`);
        console.log(`  Criado em: ${evento.createdAt}`);
        console.log('');
      });
    }
    
    // 4. Verificar se há inconsistências
    console.log('\n4. VERIFICANDO INCONSISTÊNCIAS:');
    
    for (const evento of eventos) {
      const empresa = empresas.find(e => e.id === evento.empresaId);
      const criador = users.find(u => u.id === evento.userId);
      
      if (!empresa) {
        console.log(`❌ Evento "${evento.name}" tem empresaId="${evento.empresaId}" mas empresa não encontrada!`);
      } else {
        console.log(`✅ Evento "${evento.name}" - Empresa: ${empresa.nome}`);
      }
      
      if (!criador) {
        console.log(`❌ Evento "${evento.name}" tem userId="${evento.userId}" mas usuário não encontrado!`);
      } else {
        console.log(`✅ Evento "${evento.name}" - Criado por: ${criador.name}`);
      }
    }
    
    // 5. Testar endpoint /events/meus-eventos para cada usuário
    console.log('\n5. TESTANDO ENDPOINT /events/meus-eventos:');
    
    for (const user of users) {
      console.log(`\n--- Testando para usuário: ${user.name} (${user.email}) ---`);
      
      if (user.trabalharTodosEventos) {
        console.log(`✅ Usuário tem trabalharTodosEventos = true`);
        console.log(`   Deve ver todos os eventos da empresa ${user.empresaId}`);
      } else {
        console.log(`⚠️  Usuário tem trabalharTodosEventos = false`);
        console.log(`   Só vê eventos do array: ${JSON.stringify(user.eventosIds)}`);
      }
      
      // Contar eventos que o usuário deveria ver
      let eventosVisiveis = [];
      if (user.trabalharTodosEventos) {
        eventosVisiveis = eventos.filter(e => e.empresaId === user.empresaId);
      } else {
        eventosVisiveis = eventos.filter(e => 
          e.empresaId === user.empresaId && 
          user.eventosIds && 
          user.eventosIds.includes(e.id)
        );
      }
      
      console.log(`   Eventos visíveis: ${eventosVisiveis.length}`);
      eventosVisiveis.forEach(e => {
        console.log(`   - ${e.name} (ID: ${e.id})`);
      });
    }
    
  } catch (error) {
    console.error('Erro ao debugar eventos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugEventos(); 